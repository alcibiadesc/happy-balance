#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import crypto from 'crypto';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get workspace information
function getWorkspaceInfo() {
  try {
    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8' }).trim();
    const isWorktree = gitDir.includes('.git/worktrees/');

    if (isWorktree) {
      const worktreeName = gitDir.split('/worktrees/')[1]?.split('/')[0] || 'unknown';
      return { id: worktreeName, isWorktree: true };
    }

    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    return { id: branch || 'main', isWorktree: false };
  } catch {
    return { id: 'main', isWorktree: false };
  }
}

// Check if port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

// Find available port
async function findAvailablePort(startPort, maxRetries = 50) {
  for (let i = 0; i < maxRetries; i++) {
    const port = startPort + i;
    const inUse = await isPortInUse(port);
    if (!inUse) return port;
  }
  throw new Error(`Could not find available port starting from ${startPort}`);
}

// Generate ports based on workspace
async function generatePorts(workspaceInfo) {
  if (!workspaceInfo.isWorktree) {
    // For main repository, use standard ports
    return {
      dbPort: 5432,
      backendPort: 3000,
      frontendPort: 5173,
      useStandardDb: true
    };
  }

  // For worktrees, generate unique ports based on workspace ID
  const hash = crypto.createHash('md5').update(workspaceInfo.id).digest('hex');
  const baseOffset = parseInt(hash.substring(0, 4), 16) % 1000;

  return {
    dbPort: await findAvailablePort(5432 + baseOffset),
    backendPort: await findAvailablePort(3000 + baseOffset),
    frontendPort: await findAvailablePort(5173 + baseOffset),
    useStandardDb: false
  };
}

// Kill processes on specific ports
function killPort(port) {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      execSync(`netstat -ano | findstr :${port} | findstr LISTENING | awk '{print $5}' | xargs taskkill /PID /F 2>nul`, { stdio: 'ignore' });
    }
  } catch {
    // Port might not be in use, ignore
  }
}

// Update environment files
function updateEnvironmentFiles(workspaceInfo, ports) {
  // Backend .env
  const backendEnvPath = resolve(rootDir, 'backend', '.env');
  const dbName = ports.useStandardDb ? 'happy_balance' : `happy_balance_${workspaceInfo.id.replace(/-/g, '_')}`;
  const backendEnvContent = `DATABASE_URL="postgresql://postgres:postgres@localhost:${ports.dbPort}/${dbName}"
PORT=${ports.backendPort}
NODE_ENV=development
CORS_ORIGIN="http://localhost:${ports.frontendPort}"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"
`;
  writeFileSync(backendEnvPath, backendEnvContent);

  // Frontend .env.local
  const frontendEnvPath = resolve(rootDir, '.env.local');
  const frontendEnvContent = `VITE_API_URL=http://localhost:${ports.backendPort}/api
VITE_PORT=${ports.frontendPort}
`;
  writeFileSync(frontendEnvPath, frontendEnvContent);

  // Update vite config to use the port
  const viteConfigPath = resolve(rootDir, 'vite.config.ts');
  if (existsSync(viteConfigPath)) {
    let viteConfig = execSync(`cat "${viteConfigPath}"`, { encoding: 'utf-8' });

    // Update port in vite config
    viteConfig = viteConfig.replace(/port:\s*\d+/, `port: ${ports.frontendPort}`);
    writeFileSync(viteConfigPath, viteConfig);
  }
}

// Check if Docker is available
function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Setup database
async function setupDatabaseContainer(workspaceInfo, ports) {
  if (!isDockerAvailable()) {
    log('⚠️  Docker not running. Please start Docker or use local PostgreSQL.', 'yellow');
    log('💡 To start Docker on Mac: open -a Docker', 'cyan');
    return false;
  }

  if (ports.useStandardDb) {
    log('🐳 Setting up development database...', 'cyan');

    try {
      // Check if container already exists
      const existingContainer = execSync('docker ps -a --filter "name=happy-balance-db-dev" --format "{{.Names}}"', { encoding: 'utf-8' }).trim();

      if (existingContainer) {
        log('🔄 Starting existing database container...', 'cyan');
        execSync('docker start happy-balance-db-dev', { stdio: 'ignore' });
      } else {
        execSync('docker-compose -f docker-compose.dev.yml up -d', {
          stdio: 'pipe',
          cwd: rootDir
        });
      }

      // Wait for database to be ready
      log('⏳ Waiting for database to be ready...', 'yellow');
      await waitForDatabase(ports.dbPort, 'happy_balance');

      return true;
    } catch (error) {
      log(`❌ Failed to start database: ${error.message}`, 'red');
      return false;
    }
  } else {
    // For worktrees, create unique Docker container
    log(`🐳 Setting up database for worktree: ${workspaceInfo.id}...`, 'cyan');

    const dbName = `happy_balance_${workspaceInfo.id.replace(/-/g, '_')}`;
    const containerName = `expense-tracker-db-${workspaceInfo.id}`;

    const dockerComposeContent = `version: '3.8'
services:
  postgres-${workspaceInfo.id}:
    image: postgres:17-alpine
    container_name: ${containerName}
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${dbName}
    ports:
      - "${ports.dbPort}:5432"
    volumes:
      - postgres_data_${workspaceInfo.id}:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ${dbName}"]
      interval: 2s
      timeout: 3s
      retries: 5
      start_period: 10s

volumes:
  postgres_data_${workspaceInfo.id}:
    external: false
`;

    const dockerComposeFile = resolve(rootDir, `.docker-compose.${workspaceInfo.id}.yml`);
    writeFileSync(dockerComposeFile, dockerComposeContent);

    try {
      // Check if container already exists
      const existingContainer = execSync(`docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`, { encoding: 'utf-8' }).trim();

      if (existingContainer) {
        log('🔄 Starting existing worktree database container...', 'cyan');
        execSync(`docker start ${containerName}`, { stdio: 'ignore' });
      } else {
        execSync(`docker-compose -f "${dockerComposeFile}" up -d`, {
          stdio: 'pipe',
          cwd: rootDir
        });
      }

      // Wait for database to be ready
      log('⏳ Waiting for database to be ready...', 'yellow');
      await waitForDatabase(ports.dbPort, dbName);

      return true;
    } catch (error) {
      log(`❌ Failed to start database: ${error.message}`, 'red');
      return false;
    }
  }
}

// Wait for database to be ready
async function waitForDatabase(port, dbName, maxRetries = 15) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync(`pg_isready -h localhost -p ${port} -d ${dbName} -U postgres`, { stdio: 'ignore' });
      log('✅ Database is ready!', 'green');
      return true;
    } catch {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  console.log('');
  return false;
}

// Setup database schema (faster than migrations for development)
async function setupDatabase() {
  log('🔄 Setting up database schema...', 'cyan');

  try {
    // Generate Prisma client
    execSync('npx prisma generate', {
      stdio: 'pipe',
      cwd: resolve(rootDir, 'backend')
    });

    // Use db:push for fast development setup (no migration files needed)
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'pipe', 
      cwd: resolve(rootDir, 'backend')
    });
    
    log('✅ Database schema synchronized', 'green');

    // Run seed if available
    try {
      execSync('npx prisma db seed', {
        stdio: 'pipe',
        cwd: resolve(rootDir, 'backend')
      });
      log('✅ Database seeded with initial data', 'green');
    } catch {
      log('⚠️  No seed data found, continuing...', 'yellow');
    }

    return true;
  } catch (error) {
    log(`❌ Database setup failed: ${error.message}`, 'red');
    return false;
  }
}

// Check if dependencies are installed
function checkDependencies() {
  const checks = [
    { path: resolve(rootDir, 'node_modules'), name: 'root' },
    { path: resolve(rootDir, 'backend', 'node_modules'), name: 'backend' },
    { path: resolve(rootDir, 'backend', 'node_modules', '.prisma'), name: 'Prisma client' }
  ];

  for (const check of checks) {
    if (!existsSync(check.path)) {
      log(`❌ Missing: ${check.name} dependencies`, 'red');
      return false;
    }
  }

  return true;
}

// Install dependencies if needed
async function ensureDependencies() {
  if (checkDependencies()) {
    log('✅ All dependencies are installed', 'green');
    return true;
  }

  log('📦 Installing dependencies...', 'yellow');

  try {
    // Use setup-worktree script if available
    if (existsSync(resolve(rootDir, 'scripts', 'setup-worktree.js'))) {
      execSync('node scripts/setup-worktree.js', {
        stdio: 'inherit',
        cwd: rootDir
      });
    } else {
      // Fallback to manual installation
      log('📦 Installing root dependencies...', 'cyan');
      execSync('pnpm install', {
        stdio: 'inherit',
        cwd: rootDir
      });

      log('📦 Installing backend dependencies...', 'cyan');
      execSync('pnpm install', {
        stdio: 'inherit',
        cwd: resolve(rootDir, 'backend')
      });
    }

    return true;
  } catch (error) {
    log(`❌ Failed to install dependencies: ${error.message}`, 'red');
    return false;
  }
}

// Start development servers with better process management
async function startServers(ports) {
  log('\n🎯 Starting development servers...', 'green');

  const processes = [];

  // Start backend
  log('🚀 Starting backend server...', 'cyan');
  const backendProcess = spawn('pnpm', ['dev'], {
    cwd: resolve(rootDir, 'backend'),
    env: { ...process.env, FORCE_COLOR: '1' },
    shell: true
  });

  processes.push({ process: backendProcess, name: 'Backend' });

  // Forward backend output
  backendProcess.stdout.on('data', (data) => {
    process.stdout.write(`${colors.blue}[Backend]${colors.reset} ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[Backend]${colors.reset} ${data}`);
  });

  // Wait for backend to be ready
  await waitForServer(ports.backendPort, 'Backend');

  // Start frontend
  log('🚀 Starting frontend server...', 'cyan');
  const frontendProcess = spawn('vite', ['dev', '--host', '0.0.0.0', '--port', ports.frontendPort.toString()], {
    cwd: rootDir,
    env: { ...process.env, FORCE_COLOR: '1' },
    shell: true
  });

  processes.push({ process: frontendProcess, name: 'Frontend' });

  // Forward frontend output
  frontendProcess.stdout.on('data', (data) => {
    process.stdout.write(`${colors.magenta}[Frontend]${colors.reset} ${data}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[Frontend]${colors.reset} ${data}`);
  });

  // Wait just 3 seconds for frontend to start, then show URLs
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Show success message with URLs immediately
  showUrls(ports);

  // Also show a simple reminder every 30 seconds
  setInterval(() => {
    console.log('');
    log('   📱 Frontend: ' + colors.green + `http://localhost:${ports.frontendPort}` + colors.reset, 'bright');
    log('   🔧 API: ' + colors.blue + `http://localhost:${ports.backendPort}/api` + colors.reset, 'bright');
  }, 30000);

  // Handle cleanup
  const cleanup = async () => {
    log('\n🛑 Shutting down development servers...', 'yellow');

    for (const { process, name } of processes) {
      log(`  Stopping ${name}...`, 'gray');
      process.kill('SIGTERM');
    }

    // Give processes time to cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Force kill if still running
    for (const { process } of processes) {
      try {
        process.kill('SIGKILL');
      } catch {}
    }

    log('👋 Goodbye!', 'green');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Keep the process running
  await new Promise(() => {});
}

// Wait for server to be ready
async function waitForServer(port, name, maxRetries = 30) {
  log(`⏳ Waiting for ${name} on port ${port}...`, 'yellow');

  for (let i = 0; i < maxRetries; i++) {
    const inUse = await isPortInUse(port);
    if (inUse) {
      console.log(''); // Clear line
      log(`✅ ${name} is ready!`, 'green');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('');
  log(`⚠️  ${name} took too long to start`, 'yellow');
  return false;
}

// Show URLs with improved formatting
function showUrls(ports) {
  const separator = '━'.repeat(70);

  console.log('');
  console.log('');
  log(separator, 'cyan');
  log('   🎉 DEVELOPMENT ENVIRONMENT IS READY!', 'bright');
  log(separator, 'cyan');

  console.log('');
  log('   📱 FRONTEND APPLICATION:', 'bright');
  log(`   ${colors.green}➜ http://localhost:${ports.frontendPort}${colors.reset}`, 'bright');
  console.log('');

  log('   🔧 BACKEND API:', 'bright');
  log(`   ${colors.blue}➜ http://localhost:${ports.backendPort}/api${colors.reset}`, 'bright');
  console.log('');

  log('   🗄️  DATABASE:', 'bright');
  log(`   ${colors.yellow}➜ postgresql://localhost:${ports.dbPort}/happy_balance${colors.reset}`, 'bright');
  console.log('');

  log(separator, 'cyan');
  console.log('');

  log(`   ${colors.bright}👆 Click the Frontend URL to open the app!${colors.reset}`, 'green');
  console.log('');

  log('   📚 Additional endpoints:', 'dim');
  log(`      • Health: http://localhost:${ports.backendPort}/health`, 'gray');
  log(`      • Docs:   http://localhost:${ports.backendPort}/api-docs`, 'gray');
  console.log('');

  log('   🔥 Hot reload is enabled - Edit files and see changes instantly!', 'green');
  console.log('');
  log(separator, 'cyan');
  console.log('');
}

// Main function
async function main() {
  console.clear();

  const separator = '='.repeat(50);
  log(separator, 'bright');
  log('🚀 Expense Tracker Development Environment', 'bright');
  log(separator, 'bright');
  console.log('');

  // Get workspace info
  const workspaceInfo = getWorkspaceInfo();
  const workspaceType = workspaceInfo.isWorktree ? 'worktree' : 'main repository';
  log(`📁 Workspace: ${colors.bright}${workspaceInfo.id}${colors.reset} (${workspaceType})`, 'blue');
  console.log('');

  // Ensure dependencies
  log('🔍 Checking dependencies...', 'cyan');
  const depsOk = await ensureDependencies();
  if (!depsOk) {
    log('❌ Failed to setup dependencies', 'red');
    log('💡 Try running: pnpm install', 'yellow');
    process.exit(1);
  }
  console.log('');

  // Generate ports
  log('🔌 Configuring ports...', 'cyan');
  const ports = await generatePorts(workspaceInfo);
  log(`  Database:  ${ports.dbPort}`, 'gray');
  log(`  Backend:   ${ports.backendPort}`, 'gray');
  log(`  Frontend:  ${ports.frontendPort}`, 'gray');
  console.log('');

  // Clean up existing processes
  log('🧹 Cleaning up existing processes...', 'yellow');
  killPort(ports.backendPort);
  killPort(ports.frontendPort);
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('');

  // Update environment files
  log('📝 Updating environment files...', 'cyan');
  updateEnvironmentFiles(workspaceInfo, ports);
  log('  ✅ Backend .env updated', 'gray');
  log('  ✅ Frontend .env.local updated', 'gray');
  console.log('');

  // Setup database container
  const dbOk = await setupDatabaseContainer(workspaceInfo, ports);
  if (dbOk) {
    await setupDatabase();
  } else {
    log('⚠️  Database not available, backend may fail to start', 'yellow');
    log('💡 Please ensure Docker is running or PostgreSQL is installed', 'cyan');
  }
  console.log('');

  // Start servers
  await startServers(ports);
}

// Run the script
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});