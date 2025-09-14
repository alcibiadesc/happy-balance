#!/usr/bin/env node

/**
 * 🚀 Universal Workspace Manager
 * 
 * Simplified approach for managing development environments across worktrees
 * - Auto-detects workspace (main/worktree)
 * - Assigns deterministic but collision-free ports
 * - Creates proper environment configuration
 * - Works with the new universal Docker Compose
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Detect current workspace information
 */
function getWorkspaceInfo() {
  const currentPath = process.cwd();
  const currentDir = currentPath.split('/').pop();
  
  // Simple detection: if we're not in the root directory, we're in a worktree
  if (currentPath !== rootDir) {
    return { 
      id: currentDir, 
      isWorktree: true,
      path: currentPath,
      displayName: currentDir
    };
  }

  // Try git to get branch info for main
  try {
    const branch = execSync('git branch --show-current', { 
      encoding: 'utf-8', 
      cwd: rootDir 
    }).trim();
    return { 
      id: 'main', 
      isWorktree: false,
      path: rootDir,
      displayName: branch || 'main'
    };
  } catch {
    return { 
      id: 'main', 
      isWorktree: false,
      path: rootDir,
      displayName: 'main'
    };
  }
}

/**
 * Generate deterministic ports for workspace
 * Uses hash to ensure consistency but avoid collisions
 */
function generateWorkspacePorts(workspaceId) {
  // For main, always use standard ports
  if (workspaceId === 'main') {
    return {
      dbPort: 5432,
      backendPort: 3000,
      frontendPort: 5173
    };
  }

  // For worktrees, generate deterministic but unique ports
  const hash = crypto.createHash('md5').update(workspaceId).digest('hex');
  const offset = parseInt(hash.substring(0, 3), 16) % 900; // 0-899 range
  
  return {
    dbPort: 5432, // Shared database
    backendPort: 3001 + offset,
    frontendPort: 5174 + offset
  };
}

/**
 * Get database name for workspace
 */
function getDatabaseName(workspaceId) {
  if (workspaceId === 'main') {
    return 'happy_balance';
  }
  // Clean workspace ID for database naming
  const cleanId = workspaceId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `happy_balance_${cleanId}`;
}

/**
 * Create environment configuration for workspace
 */
function createEnvironmentConfig(workspaceInfo, ports) {
  const dbName = getDatabaseName(workspaceInfo.id);
  
  // Backend .env
  const backendEnvPath = resolve(rootDir, 'backend', '.env');
  const backendEnvContent = `# 🏗️ Backend Configuration for: ${workspaceInfo.displayName}
DATABASE_URL="postgresql://postgres:postgres@localhost:${ports.dbPort}/${dbName}"
PORT=${ports.backendPort}
NODE_ENV=development
CORS_ORIGIN="http://localhost:${ports.frontendPort}"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"
WORKSPACE_ID="${workspaceInfo.id}"
`;
  
  writeFileSync(backendEnvPath, backendEnvContent);
  log(`✅ Backend .env created (Port: ${ports.backendPort})`, 'green');

  // Frontend .env.local
  const frontendEnvPath = resolve(rootDir, '.env.local');
  const frontendEnvContent = `# 🎨 Frontend Configuration for: ${workspaceInfo.displayName}
VITE_API_URL=http://localhost:${ports.backendPort}/api
VITE_PORT=${ports.frontendPort}
WORKSPACE_ID="${workspaceInfo.id}"
`;
  
  writeFileSync(frontendEnvPath, frontendEnvContent);
  log(`✅ Frontend .env.local created (Port: ${ports.frontendPort})`, 'green');

  // Docker Compose .env
  const dockerEnvPath = resolve(rootDir, '.env');
  const dockerEnvContent = `# 🐳 Docker Compose Configuration for: ${workspaceInfo.displayName}
WORKSPACE_ID=${workspaceInfo.id}
DB_PORT=${ports.dbPort}
BACKEND_PORT=${ports.backendPort}
FRONTEND_PORT=${ports.frontendPort}
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/${dbName}
`;
  
  writeFileSync(dockerEnvPath, dockerEnvContent);
  log(`✅ Docker .env created`, 'green');

  return { dbName, ...ports };
}

/**
 * Update package.json scripts for easier access
 */
function updatePackageScripts(workspaceInfo, ports) {
  const packageJsonPath = resolve(rootDir, 'package.json');
  
  if (!existsSync(packageJsonPath)) return;
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    // Update dev script to use the new universal approach
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['dev'] = 'node scripts/workspace-manager.js start';
    packageJson.scripts['setup'] = 'node scripts/workspace-manager.js setup';
    packageJson.scripts['dev:docker'] = 'docker compose -f docker-compose.dev.yml up --build';
    packageJson.scripts['dev:down'] = 'docker compose -f docker-compose.dev.yml down';
    packageJson.scripts['dev:clean'] = 'docker compose -f docker-compose.dev.yml down -v --remove-orphans';
    packageJson.scripts['dev:logs'] = 'docker compose -f docker-compose.dev.yml logs -f';
    
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('✅ Package.json scripts updated', 'green');
  } catch (error) {
    log(`⚠️ Could not update package.json: ${error.message}`, 'yellow');
  }
}

/**
 * Setup workspace (called by pnpm setup)
 */
async function setupWorkspace() {
  console.clear();
  
  const separator = '═'.repeat(60);
  log(separator, 'bright');
  log('🚀 EXPENSE TRACKER - WORKSPACE SETUP', 'bright');
  log(separator, 'bright');
  console.log('');
  
  const workspaceInfo = getWorkspaceInfo();
  const workspaceType = workspaceInfo.isWorktree ? 'Worktree' : 'Main Repository';
  
  log(`📁 Workspace: ${colors.bright}${workspaceInfo.displayName}${colors.reset} (${workspaceType})`, 'blue');
  log(`📍 Path: ${workspaceInfo.path}`, 'gray');
  console.log('');
  
  // Generate ports
  const ports = generateWorkspacePorts(workspaceInfo.id);
  log('🔌 Port Assignment:', 'cyan');
  log(`   Database:  ${ports.dbPort} ${ports.dbPort === 5432 ? '(Shared)' : ''}`, 'gray');
  log(`   Backend:   ${ports.backendPort}`, 'gray');
  log(`   Frontend:  ${ports.frontendPort}`, 'gray');
  console.log('');
  
  // Create environment configuration
  log('⚙️ Creating environment configuration...', 'yellow');
  const config = createEnvironmentConfig(workspaceInfo, ports);
  console.log('');
  
  // Update package.json scripts
  updatePackageScripts(workspaceInfo, ports);
  console.log('');
  
  // Install dependencies if needed
  log('📦 Checking dependencies...', 'yellow');
  
  const needsInstall = !existsSync(resolve(rootDir, 'node_modules')) || 
                      !existsSync(resolve(rootDir, 'backend', 'node_modules'));
  
  if (needsInstall) {
    log('📦 Installing dependencies...', 'cyan');
    try {
      execSync('pnpm install', { cwd: rootDir, stdio: 'inherit' });
      execSync('pnpm install', { cwd: resolve(rootDir, 'backend'), stdio: 'inherit' });
      log('✅ Dependencies installed', 'green');
    } catch (error) {
      log(`⚠️ Dependency installation failed: ${error.message}`, 'yellow');
    }
  } else {
    log('✅ Dependencies are up to date', 'green');
  }
  
  console.log('');
  log('🎉 Workspace setup completed!', 'bright');
  console.log('');
  log('📋 Next steps:', 'bright');
  log('   1. Run: pnpm dev', 'cyan');
  log('   2. Access your app:', 'cyan');
  log(`      • Frontend: http://localhost:${ports.frontendPort}`, 'gray');
  log(`      • Backend:  http://localhost:${ports.backendPort}/api`, 'gray');
  console.log('');
}

/**
 * Start development environment
 */
async function startDevelopment() {
  const workspaceInfo = getWorkspaceInfo();
  const ports = generateWorkspacePorts(workspaceInfo.id);
  
  log('🚀 Starting development environment...', 'bright');
  log(`📁 Workspace: ${workspaceInfo.displayName}`, 'blue');
  
  // Ensure configuration exists
  createEnvironmentConfig(workspaceInfo, ports);
  
  // Start Docker Compose
  log('🐳 Starting Docker services...', 'cyan');
  try {
    execSync('docker compose -f docker-compose.dev.yml up --build', {
      cwd: rootDir,
      stdio: 'inherit'
    });
  } catch (error) {
    log(`❌ Failed to start services: ${error.message}`, 'red');
    process.exit(1);
  }
}

/**
 * Show workspace information
 */
function showInfo() {
  const workspaceInfo = getWorkspaceInfo();
  const ports = generateWorkspacePorts(workspaceInfo.id);
  const dbName = getDatabaseName(workspaceInfo.id);
  
  console.log('');
  log('📊 WORKSPACE INFORMATION', 'bright');
  log('═'.repeat(40), 'gray');
  log(`Name:      ${workspaceInfo.displayName}`, 'cyan');
  log(`Type:      ${workspaceInfo.isWorktree ? 'Worktree' : 'Main Repository'}`, 'cyan');
  log(`Path:      ${workspaceInfo.path}`, 'gray');
  log(`Database:  ${dbName}`, 'yellow');
  console.log('');
  log('🔌 PORTS', 'bright');
  log('─'.repeat(20), 'gray');
  log(`Database:  ${ports.dbPort}`, 'yellow');
  log(`Backend:   ${ports.backendPort}`, 'blue');
  log(`Frontend:  ${ports.frontendPort}`, 'magenta');
  console.log('');
  log('🌐 URLS', 'bright');
  log('─'.repeat(20), 'gray');
  log(`Frontend:  http://localhost:${ports.frontendPort}`, 'magenta');
  log(`Backend:   http://localhost:${ports.backendPort}/api`, 'blue');
  log(`Database:  postgresql://localhost:${ports.dbPort}/${dbName}`, 'yellow');
  console.log('');
}

// CLI Interface
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupWorkspace().catch(error => {
      log(`❌ Setup failed: ${error.message}`, 'red');
      process.exit(1);
    });
    break;
    
  case 'start':
    startDevelopment().catch(error => {
      log(`❌ Start failed: ${error.message}`, 'red');
      process.exit(1);
    });
    break;
    
  case 'info':
    showInfo();
    break;
    
  default:
    log('🚀 Expense Tracker - Workspace Manager', 'bright');
    log('', 'reset');
    log('Available commands:', 'cyan');
    log('  setup  - Setup workspace environment', 'gray');
    log('  start  - Start development servers', 'gray');
    log('  info   - Show workspace information', 'gray');
    log('', 'reset');
    log('Quick usage:', 'yellow');
    log('  pnpm setup  (runs: node scripts/workspace-manager.js setup)', 'gray');
    log('  pnpm dev    (runs: node scripts/workspace-manager.js start)', 'gray');
}
