#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, statSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import { getWorkspacePorts, getDatabaseName, getContainerName } from './port-manager.js';

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
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get workspace information
function getWorkspaceInfo() {
  try {
    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8', cwd: rootDir }).trim();
    const isWorktree = gitDir.includes('.git/worktrees/');

    if (isWorktree) {
      const worktreeName = gitDir.split('/worktrees/')[1]?.split('/')[0] || 'unknown';
      return { id: worktreeName, isWorktree: true };
    }

    const branch = execSync('git branch --show-current', { encoding: 'utf-8', cwd: rootDir }).trim();
    return { id: branch || 'main', isWorktree: false };
  } catch {
    return { id: 'main', isWorktree: false };
  }
}

// Generate unique ports for worktree (unified)
async function generatePortsForWorktree(workspaceInfo) {
  return await getWorkspacePorts(workspaceInfo.id, { checkAvailability: true });
}

// Create environment files
async function createEnvironmentFiles(workspaceInfo) {
  const ports = await generatePortsForWorktree(workspaceInfo);

  // Backend .env
  const backendEnvPath = resolve(rootDir, 'backend', '.env');
  const dbName = getDatabaseName(workspaceInfo.id);

  const backendEnvContent = `DATABASE_URL="postgresql://postgres:postgres@localhost:${ports.dbPort}/${dbName}"
PORT=${ports.backendPort}
NODE_ENV=development
CORS_ORIGIN="http://localhost:${ports.frontendPort}"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"
JWT_SECRET="${crypto.randomBytes(32).toString('hex')}"
`;

  writeFileSync(backendEnvPath, backendEnvContent);
  log(`✅ Created backend .env with port ${ports.backendPort}`, 'green');

  // Frontend .env.local
  const frontendEnvPath = resolve(rootDir, '.env.local');
  const frontendEnvContent = `VITE_API_URL=http://localhost:${ports.backendPort}/api
VITE_PORT=${ports.frontendPort}
`;

  writeFileSync(frontendEnvPath, frontendEnvContent);
  log(`✅ Created frontend .env.local with port ${ports.frontendPort}`, 'green');

  return { ...ports, dbName };
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

// Start Docker if not running (macOS)
async function ensureDockerRunning() {
  if (!isDockerAvailable()) {
    log('🐳 Docker not running, attempting to start...', 'yellow');

    if (process.platform === 'darwin') {
      try {
        execSync('open -a Docker', { stdio: 'ignore' });
        log('⏳ Waiting for Docker to start...', 'cyan');

        // Wait up to 30 seconds for Docker to start
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (isDockerAvailable()) {
            log('✅ Docker started successfully', 'green');
            return true;
          }
        }
        log('⚠️  Docker took too long to start', 'yellow');
        return false;
      } catch (error) {
        log('❌ Failed to start Docker: ' + error.message, 'red');
        return false;
      }
    }

    log('⚠️  Please start Docker manually', 'yellow');
    return false;
  }

  return true;
}

// Setup Docker database for worktree
async function setupDockerDatabase(workspaceInfo, ports, dbName) {
  if (!isDockerAvailable()) {
    log('⚠️  Docker not available - skipping database setup', 'yellow');
    log('💡 Install Docker or use a local PostgreSQL instance', 'cyan');
    return false;
  }

  if (workspaceInfo.isWorktree) {
    const containerName = getContainerName(workspaceInfo.id);

    try {
      // Check if container already exists
      const existingContainer = execSync(
        `docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`,
        { encoding: 'utf-8' }
      ).trim();

      if (existingContainer) {
        log(`🔄 Starting existing database container for worktree...`, 'cyan');
        execSync(`docker start ${containerName}`, { stdio: 'ignore' });
      } else {
        log(`🐳 Creating database container for worktree: ${workspaceInfo.id}...`, 'cyan');

        // Create and run the container
        execSync(
          `docker run -d \
            --name ${containerName} \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=${dbName} \
            -p ${ports.dbPort}:5432 \
            postgres:17-alpine`,
          { stdio: 'ignore' }
        );
      }

      log(`✅ Database container ready on port ${ports.dbPort}`, 'green');
      return true;
    } catch (error) {
      log(`⚠️  Failed to setup Docker database: ${error.message}`, 'yellow');
      return false;
    }
  }

  return false;
}

function runCommand(command, description, cwd = rootDir, options = {}) {
  const { silent = false, critical = true } = options;

  if (!silent) {
    log(`⏳ ${description}...`, 'yellow');
  }

  try {
    const result = execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      cwd,
      shell: true,
      encoding: 'utf8'
    });

    if (!silent) {
      log(`✅ ${description} completed`, 'green');
    }

    return { success: true, output: result };
  } catch (error) {
    if (!silent) {
      log(`❌ ${description} failed: ${error.message}`, 'red');
    }

    if (critical) {
      throw error;
    }

    return { success: false, error };
  }
}

function checkIfInstallNeeded() {
  // Check if node_modules exist and are recent
  const checks = [
    { path: resolve(rootDir, 'node_modules'), name: 'root' },
    { path: resolve(rootDir, 'backend', 'node_modules'), name: 'backend' }
  ];

  for (const check of checks) {
    if (!existsSync(check.path)) {
      log(`📦 ${check.name} node_modules not found - full install needed`, 'cyan');
      return true;
    }

    // Check if node_modules is older than package.json
    const packageJsonPath = resolve(dirname(check.path), 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJsonStats = statSync(packageJsonPath);
      const nodeModulesStats = statSync(check.path);

      if (packageJsonStats.mtimeMs > nodeModulesStats.mtimeMs) {
        log(`📦 ${check.name} package.json is newer than node_modules - install needed`, 'cyan');
        return true;
      }
    }
  }

  // Check if Prisma client exists
  const prismaClientPath = resolve(rootDir, 'backend', 'node_modules', '.prisma', 'client');
  if (!existsSync(prismaClientPath)) {
    log(`📦 Prisma client not found - generation needed`, 'cyan');
    return true;
  }

  return false;
}

async function installDependencies() {
  const needsFullInstall = checkIfInstallNeeded();

  if (!needsFullInstall) {
    log('✨ Dependencies are up to date - skipping install', 'green');
    return true;
  }

  // Run installations in parallel for speed
  log('📦 Installing dependencies in parallel...', 'cyan');

  const installPromises = [
    // Install root dependencies
    new Promise((resolve) => {
      const result = runCommand('pnpm install --frozen-lockfile', 'Installing root dependencies', rootDir, { critical: false });
      if (!result.success) {
        // Fallback to regular install if frozen-lockfile fails
        runCommand('pnpm install', 'Installing root dependencies (fallback)', rootDir);
      }
      resolve();
    }),

    // Install backend dependencies
    new Promise((resolvePromise) => {
      const backendDir = resolve(rootDir, 'backend');
      const result = runCommand('pnpm install --frozen-lockfile', 'Installing backend dependencies', backendDir, { critical: false });
      if (!result.success) {
        // Fallback to regular install if frozen-lockfile fails
        runCommand('pnpm install', 'Installing backend dependencies (fallback)', backendDir);
      }
      resolvePromise();
    })
  ];

  await Promise.all(installPromises);

  return true;
}

function generatePrismaClient() {
  const prismaClientPath = resolve(rootDir, 'backend', 'node_modules', '.prisma', 'client');
  const prismaSchemaPath = resolve(rootDir, 'backend', 'prisma', 'schema.prisma');

  // Check if Prisma client exists and is newer than schema
  if (existsSync(prismaClientPath) && existsSync(prismaSchemaPath)) {
    const schemaStats = statSync(prismaSchemaPath);
    const clientStats = statSync(prismaClientPath);

    if (clientStats.mtimeMs > schemaStats.mtimeMs) {
      log('✨ Prisma client is up to date - skipping generation', 'green');
      return true;
    }
  }

  return runCommand('npx prisma generate', 'Generating Prisma client', resolve(rootDir, 'backend')).success;
}

async function quickSetup() {
  console.clear();
  log('🚀 Worktree Quick Setup', 'bright');
  log('======================\n', 'bright');

  const startTime = Date.now();

  // 1. Get workspace info and create environment files FIRST
  const workspaceInfo = getWorkspaceInfo();
  log(`📁 Workspace: ${workspaceInfo.id} (${workspaceInfo.isWorktree ? 'worktree' : 'main branch'})`, 'cyan');

  // 2. Create .env files with appropriate ports
  const config = await createEnvironmentFiles(workspaceInfo);
  log(`🔌 Configured ports - Backend: ${config.backendPort}, Frontend: ${config.frontendPort}, DB: ${config.dbPort}`, 'cyan');

  // 3. Ensure Docker is running
  await ensureDockerRunning();

  // 4. Setup Docker database if available (for worktrees)
  await setupDockerDatabase(workspaceInfo, config, config.dbName);

  // 4. Install dependencies (in parallel if needed)
  await installDependencies();

  // 5. Generate Prisma client (only if needed)
  generatePrismaClient();

  // 6. Run Prisma migrations if database is available
  if (isDockerAvailable() && workspaceInfo.isWorktree) {
    try {
      log('🔄 Running database migrations...', 'cyan');
      execSync('npx prisma migrate deploy', {
        cwd: resolve(rootDir, 'backend'),
        stdio: 'pipe'
      });
      log('✅ Database migrations completed', 'green');
    } catch (error) {
      log('⚠️  Migrations skipped (database may not be ready)', 'yellow');
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  log(`\n✨ Worktree setup completed in ${elapsed}s!`, 'green');
  log('You can now run: pnpm run dev', 'cyan');

  // Show ports info
  if (workspaceInfo.isWorktree) {
    log(`\n📌 Your worktree ports:`, 'bright');
    log(`   Backend:  http://localhost:${config.backendPort}`, 'gray');
    log(`   Frontend: http://localhost:${config.frontendPort}`, 'gray');
    log(`   Database: postgresql://localhost:${config.dbPort}/${config.dbName}`, 'gray');
  }
}

// Add a --force flag for full cleanup
const forceClean = process.argv.includes('--force');

if (forceClean) {
  log('🔄 Force clean requested - performing full cleanup', 'yellow');

  // Import the old clean function
  const { rmSync } = await import('fs');

  // Clean root
  if (existsSync(resolve(rootDir, 'node_modules'))) {
    rmSync(resolve(rootDir, 'node_modules'), { recursive: true, force: true });
  }
  if (existsSync(resolve(rootDir, 'pnpm-lock.yaml'))) {
    rmSync(resolve(rootDir, 'pnpm-lock.yaml'), { force: true });
  }

  // Clean backend
  if (existsSync(resolve(rootDir, 'backend', 'node_modules'))) {
    rmSync(resolve(rootDir, 'backend', 'node_modules'), { recursive: true, force: true });
  }

  log('✅ Full cleanup completed', 'green');

  // Run pnpm store prune only on force clean
  runCommand('pnpm store prune', 'Pruning pnpm store');
}

quickSetup().catch(error => {
  log(`❌ Error: ${error.message}`, 'red');
  process.exit(1);
});