#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get unique identifier for this workspace
function getWorkspaceId() {
  const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8' }).trim();
  const isWorktree = gitDir.includes('.git/worktrees/');

  if (isWorktree) {
    // Extract worktree name from path
    const worktreeName = gitDir.split('/worktrees/')[1]?.split('/')[0] || 'unknown';
    return worktreeName;
  }

  // For main repo, use branch name
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    return branch || 'main';
  } catch {
    return 'main';
  }
}

// Find available port
async function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });

    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Generate consistent ports based on workspace
async function generatePorts(workspaceId) {
  // Use hash to generate consistent but unique ports per workspace
  const hash = crypto.createHash('md5').update(workspaceId).digest('hex');
  const baseOffset = parseInt(hash.substring(0, 4), 16) % 1000;

  const dbPort = await findAvailablePort(5432 + baseOffset);
  const backendPort = await findAvailablePort(3000 + baseOffset);
  const frontendPort = await findAvailablePort(5173 + baseOffset);

  return { dbPort, backendPort, frontendPort };
}

// Create Docker Compose configuration for this workspace
function createDockerCompose(workspaceId, dbPort) {
  const dockerComposeContent = `
version: '3.8'

services:
  postgres-${workspaceId}:
    image: postgres:17-alpine
    container_name: expense-tracker-db-${workspaceId}
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: happy_balance_${workspaceId.replace(/-/g, '_')}
    ports:
      - "${dbPort}:5432"
    volumes:
      - postgres_data_${workspaceId}:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d happy_balance_${workspaceId.replace(/-/g, '_')}"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data_${workspaceId}:
    external: false
`;

  const dockerComposeFile = resolve(rootDir, `.docker-compose.${workspaceId}.yml`);
  writeFileSync(dockerComposeFile, dockerComposeContent);
  return dockerComposeFile;
}

// Update environment files
function updateEnvironmentFiles(workspaceId, ports) {
  // Backend .env
  const backendEnvPath = resolve(rootDir, 'backend', '.env');
  const backendEnvContent = `DATABASE_URL="postgresql://postgres:postgres@localhost:${ports.dbPort}/happy_balance_${workspaceId.replace(/-/g, '_')}"
PORT=${ports.backendPort}
NODE_ENV=development
CORS_ORIGIN="http://localhost:${ports.frontendPort}"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"
`;
  writeFileSync(backendEnvPath, backendEnvContent);

  // Frontend .env
  const frontendEnvPath = resolve(rootDir, '.env.local');
  const frontendEnvContent = `VITE_API_URL=http://localhost:${ports.backendPort}/api
VITE_PORT=${ports.frontendPort}
`;
  writeFileSync(frontendEnvPath, frontendEnvContent);

  // Update Vite config to use dynamic port
  const viteConfigPath = resolve(rootDir, 'vite.config.js');
  if (existsSync(viteConfigPath)) {
    let viteConfig = readFileSync(viteConfigPath, 'utf-8');

    // Check if server config exists
    if (!viteConfig.includes('server:')) {
      // Add server config
      viteConfig = viteConfig.replace(
        'export default defineConfig({',
        `export default defineConfig({
  server: {
    port: ${ports.frontendPort},
    host: '0.0.0.0',
    strictPort: false
  },`
      );
    } else {
      // Update existing port
      viteConfig = viteConfig.replace(
        /port:\s*\d+/,
        `port: ${ports.frontendPort}`
      );
    }

    writeFileSync(viteConfigPath, viteConfig);
  }
}

// Start Docker container for database
async function startDatabase(dockerComposeFile, workspaceId) {
  log(`🐳 Starting database for workspace: ${workspaceId}`, 'cyan');

  try {
    execSync(`docker-compose -f ${dockerComposeFile} up -d`, {
      stdio: 'inherit',
      cwd: rootDir
    });

    // Wait for database to be ready
    log('⏳ Waiting for database to be ready...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 5000));

    return true;
  } catch (error) {
    log(`❌ Failed to start database: ${error.message}`, 'red');
    return false;
  }
}

// Run Prisma migrations
async function runMigrations() {
  log('🔄 Running database migrations...', 'cyan');

  try {
    execSync('cd backend && npx prisma generate', {
      stdio: 'inherit',
      cwd: rootDir
    });

    execSync('cd backend && npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: rootDir
    });

    log('✅ Migrations completed', 'green');
    return true;
  } catch (error) {
    log(`⚠️  Migration warning: ${error.message}`, 'yellow');

    // Try to create and migrate if database doesn't exist
    try {
      execSync('cd backend && npx prisma migrate dev --name init', {
        stdio: 'inherit',
        cwd: rootDir
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Kill processes on specific ports
function killPort(port) {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      execSync(`netstat -ano | findstr :${port} | findstr LISTENING | awk '{print $5}' | xargs taskkill /PID /F`,
        { stdio: 'ignore' });
    }
  } catch {
    // Port might not be in use, ignore
  }
}

// Check if node_modules exists
function checkDependencies() {
  if (!existsSync(resolve(rootDir, 'node_modules')) ||
      !existsSync(resolve(rootDir, 'backend', 'node_modules'))) {
    return false;
  }

  // Check if Prisma client is generated
  const prismaClientPath = resolve(rootDir, 'node_modules', '.pnpm', '@prisma+client@5.22.0_prisma@5.22.0',
                                  'node_modules', '@prisma', 'client');
  if (!existsSync(prismaClientPath)) {
    return false;
  }

  return true;
}

// Setup worktree dependencies
async function setupWorktree() {
  log('📦 Setting up worktree dependencies...', 'yellow');

  try {
    // Run setup script
    execSync('node scripts/setup-worktree.js', {
      stdio: 'inherit',
      cwd: rootDir
    });
    return true;
  } catch (error) {
    log(`❌ Failed to setup worktree: ${error.message}`, 'red');
    return false;
  }
}

// Main function
async function main() {
  console.clear();
  log('🚀 Expense Tracker Development Environment', 'bright');
  log('==========================================\n', 'bright');

  const workspaceId = getWorkspaceId();
  log(`📁 Workspace: ${workspaceId}`, 'blue');

  // Check dependencies
  if (!checkDependencies()) {
    log('⚠️  Dependencies not found or incomplete', 'yellow');
    const setupSuccess = await setupWorktree();
    if (!setupSuccess) {
      log('❌ Failed to setup dependencies. Please run manually:', 'red');
      log('   node scripts/setup-worktree.js', 'cyan');
      process.exit(1);
    }
  }

  // Generate ports
  const ports = await generatePorts(workspaceId);
  log(`🔌 Ports:`, 'blue');
  log(`   Database:  ${ports.dbPort}`, 'cyan');
  log(`   Backend:   ${ports.backendPort}`, 'cyan');
  log(`   Frontend:  ${ports.frontendPort}\n`, 'cyan');

  // Kill existing processes on these ports
  log('🧹 Cleaning up existing processes...', 'yellow');
  killPort(ports.dbPort);
  killPort(ports.backendPort);
  killPort(ports.frontendPort);

  // Create Docker Compose file
  const dockerComposeFile = createDockerCompose(workspaceId, ports.dbPort);

  // Update environment files
  updateEnvironmentFiles(workspaceId, ports);

  // Start database
  const dbStarted = await startDatabase(dockerComposeFile, workspaceId);
  if (!dbStarted) {
    log('❌ Failed to start database. Exiting...', 'red');
    process.exit(1);
  }

  // Run migrations
  const migrationsRun = await runMigrations();
  if (!migrationsRun) {
    log('⚠️  Migrations failed, but continuing...', 'yellow');
  }

  // Start backend and frontend
  log('\n🎯 Starting application servers...', 'green');

  const backendProcess = spawn('pnpm', ['dev'], {
    cwd: resolve(rootDir, 'backend'),
    stdio: 'inherit',
    shell: true
  });

  // Wait a bit for backend to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  const frontendProcess = spawn('pnpm', ['dev'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });

  log('\n✨ Development environment is ready!', 'green');
  log(`📱 Frontend: http://localhost:${ports.frontendPort}`, 'cyan');
  log(`🔧 Backend:  http://localhost:${ports.backendPort}`, 'cyan');
  log(`🗄️  Database: localhost:${ports.dbPort}\n`, 'cyan');

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    log('\n🛑 Shutting down development environment...', 'yellow');

    backendProcess.kill();
    frontendProcess.kill();

    // Optionally stop Docker container
    try {
      execSync(`docker-compose -f ${dockerComposeFile} down`, {
        stdio: 'ignore',
        cwd: rootDir
      });
    } catch {}

    log('👋 Goodbye!', 'green');
    process.exit(0);
  });
}

// Run
main().catch(error => {
  log(`❌ Error: ${error.message}`, 'red');
  process.exit(1);
});