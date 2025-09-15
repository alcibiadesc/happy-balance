#!/usr/bin/env node

/**
 * 🚀 Development Environment Manager
 * Simple, clean, and efficient development setup
 */

import { spawn, execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  isPostgresRunning,
  startPostgres,
  createWorkspaceDatabase,
  DB_CONFIG
} from './db-manager.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};


/**
 * Detect if we're in a worktree or main repository
 */
function getWorkspaceInfo() {
  try {
    const gitDir = execSync('git rev-parse --git-dir', {
      encoding: 'utf-8',
      cwd: process.cwd()
    }).trim();

    const isWorktree = gitDir.includes('.git/worktrees/');
    const branch = execSync('git branch --show-current', {
      encoding: 'utf-8',
      cwd: process.cwd()
    }).trim();

    const workspaceName = isWorktree
      ? process.cwd().split('/').pop()
      : 'main';

    return {
      name: workspaceName,
      branch: branch || 'main',
      isWorktree,
      path: process.cwd()
    };
  } catch {
    return {
      name: 'main',
      branch: 'main',
      isWorktree: false,
      path: process.cwd()
    };
  }
}

/**
 * Get ports for workspace
 * Main uses default ports, worktrees use incremented ports
 */
function getWorkspacePorts(workspaceInfo) {
  if (!workspaceInfo.isWorktree) {
    return {
      backend: 3000,
      frontend: 5173
    };
  }

  // Simple incremental ports for worktrees
  const offset = workspaceInfo.name.split('').reduce((acc, char) =>
    acc + char.charCodeAt(0), 0) % 10;

  return {
    backend: 3001 + offset,
    frontend: 5174 + offset
  };
}

/**
 * Create environment files
 */
function createEnvironmentFiles(workspaceInfo, dbName, ports) {
  log('📝 Creating environment files...', 'cyan');

  // Backend .env
  const backendEnvPath = resolve(rootDir, 'backend', '.env');
  const backendEnv = `# Backend Configuration - ${workspaceInfo.branch}
DATABASE_URL="postgresql://${DB_CONFIG.user}:${DB_CONFIG.password}@localhost:${DB_CONFIG.port}/${dbName}"
PORT=${ports.backend}
NODE_ENV=development
CORS_ORIGIN="http://localhost:${ports.frontend}"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"
`;

  writeFileSync(backendEnvPath, backendEnv);
  log(`  ✅ Backend .env (port ${ports.backend})`, 'green');

  // Frontend .env.local
  const frontendEnvPath = resolve(rootDir, '.env.local');
  const frontendEnv = `# Frontend Configuration - ${workspaceInfo.branch}
VITE_API_URL=http://localhost:${ports.backend}/api
VITE_PORT=${ports.frontend}
`;

  writeFileSync(frontendEnvPath, frontendEnv);
  log(`  ✅ Frontend .env.local (port ${ports.frontend})`, 'green');
}

/**
 * Install dependencies if needed
 */
async function installDependencies() {
  const needsInstall = !existsSync(resolve(rootDir, 'node_modules')) ||
                       !existsSync(resolve(rootDir, 'backend', 'node_modules'));

  if (needsInstall) {
    log('📦 Installing dependencies...', 'yellow');
    execSync('pnpm install', { cwd: rootDir, stdio: 'inherit' });
    execSync('pnpm install', { cwd: resolve(rootDir, 'backend'), stdio: 'inherit' });
  }
}

/**
 * Setup Prisma database
 */
async function setupPrisma() {
  log('🔧 Setting up Prisma...', 'cyan');

  try {
    execSync('pnpm run db:generate', {
      cwd: resolve(rootDir, 'backend'),
      stdio: 'inherit'
    });

    execSync('pnpm run db:push', {
      cwd: resolve(rootDir, 'backend'),
      stdio: 'inherit'
    });

    log('✅ Database schema updated', 'green');
  } catch (error) {
    log(`⚠️ Prisma setup warning: ${error.message}`, 'yellow');
  }
}

/**
 * Start development servers
 */
function startServers(ports) {
  log('\n🚀 Starting development servers...', 'bright');

  // Start backend
  const backend = spawn('pnpm', ['dev'], {
    cwd: resolve(rootDir, 'backend'),
    stdio: 'pipe',
    shell: true
  });

  backend.stdout.on('data', (data) => {
    process.stdout.write(`${colors.blue}[Backend]${colors.reset} ${data}`);
  });

  backend.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[Backend]${colors.reset} ${data}`);
  });

  // Start frontend
  const frontend = spawn('pnpm', ['vite', 'dev', '--host', '0.0.0.0', '--port', ports.frontend.toString()], {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true
  });

  frontend.stdout.on('data', (data) => {
    process.stdout.write(`${colors.magenta}[Frontend]${colors.reset} ${data}`);
  });

  frontend.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[Frontend]${colors.reset} ${data}`);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    log('\n\n🛑 Shutting down...', 'yellow');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  return { backend, frontend };
}

/**
 * Setup command - prepare workspace
 */
async function setup() {
  console.clear();
  log('🔧 EXPENSE TRACKER - SETUP', 'bright');
  log('═'.repeat(50), 'cyan');

  const workspaceInfo = getWorkspaceInfo();
  const ports = getWorkspacePorts(workspaceInfo);

  log(`\n📁 Workspace: ${workspaceInfo.name} (${workspaceInfo.branch})`, 'blue');
  log(`📍 Type: ${workspaceInfo.isWorktree ? 'Worktree' : 'Main Repository'}`, 'blue');

  // Install dependencies
  await installDependencies();

  // Start database if needed
  if (!await isPostgresRunning()) {
    await startPostgres();
  }

  // Create workspace database
  const dbName = await createWorkspaceDatabase(workspaceInfo.name);

  // Create environment files
  createEnvironmentFiles(workspaceInfo, dbName, ports);

  // Setup Prisma
  await setupPrisma();

  log('\n✅ Setup completed!', 'bright');
  log('\n📋 Next steps:', 'cyan');
  log('  1. Run: pnpm dev', 'yellow');
  log(`  2. Open: http://localhost:${ports.frontend}`, 'yellow');
}

/**
 * Dev command - start development environment
 */
async function dev() {
  console.clear();
  log('🚀 EXPENSE TRACKER - DEVELOPMENT', 'bright');
  log('═'.repeat(50), 'cyan');

  const workspaceInfo = getWorkspaceInfo();
  const ports = getWorkspacePorts(workspaceInfo);

  log(`\n📁 Workspace: ${workspaceInfo.name} (${workspaceInfo.branch})`, 'blue');
  log(`📍 Type: ${workspaceInfo.isWorktree ? 'Worktree' : 'Main Repository'}`, 'blue');

  // Ensure database is running
  if (!await isPostgresRunning()) {
    await startPostgres();
  }

  // Create workspace database
  const dbName = await createWorkspaceDatabase(workspaceInfo.name);

  // Create environment files
  createEnvironmentFiles(workspaceInfo, dbName, ports);

  // Install dependencies if needed
  await installDependencies();

  // Setup Prisma
  await setupPrisma();

  // Start servers
  log(`\n🌐 URLs:`, 'bright');
  log(`  Frontend: http://localhost:${ports.frontend}`, 'magenta');
  log(`  Backend:  http://localhost:${ports.backend}/api`, 'blue');
  log(`  Database: postgresql://localhost:${DB_CONFIG.port}/${dbName}`, 'yellow');

  startServers(ports);
}

// Main CLI
const command = process.argv[2];

switch (command) {
  case 'setup':
    setup().catch(error => {
      log(`\n❌ Setup failed: ${error.message}`, 'red');
      process.exit(1);
    });
    break;

  case 'start':
  case undefined:
    dev().catch(error => {
      log(`\n❌ Failed to start: ${error.message}`, 'red');
      process.exit(1);
    });
    break;

  default:
    log('Usage: dev.js [setup|start]', 'yellow');
    log('  setup - Setup workspace environment', 'cyan');
    log('  start - Start development servers (default)', 'cyan');
}