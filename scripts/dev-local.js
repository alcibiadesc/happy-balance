#!/usr/bin/env node

/**
 * Local development script without Docker
 */

import { spawn } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Setup environment files if they don't exist
function setupEnvironment() {
  const backendEnvPath = resolve(rootDir, 'backend', '.env');
  const frontendEnvPath = resolve(rootDir, '.env.local');

  // Create backend .env if it doesn't exist
  if (!existsSync(backendEnvPath)) {
    const backendEnv = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/happy_balance_vk_83dc_feat_chart"

# Server
PORT=3003
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5176"

# File upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR="uploads"`;

    writeFileSync(backendEnvPath, backendEnv);
    log('✅ Created backend/.env', 'green');
  }

  // Create frontend .env.local if it doesn't exist
  if (!existsSync(frontendEnvPath)) {
    const frontendEnv = `# Frontend Configuration
VITE_API_URL=http://localhost:3003/api
VITE_PORT=5176`;

    writeFileSync(frontendEnvPath, frontendEnv);
    log('✅ Created .env.local', 'green');
  }
}

// Start backend server
function startBackend() {
  return spawn('npx', ['tsx', 'watch', 'src/main.ts'], {
    cwd: resolve(rootDir, 'backend'),
    stdio: 'inherit',
    shell: true
  });
}

// Start frontend server
function startFrontend() {
  return spawn('npx', ['vite', '--port', '5176'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });
}

// Main function
async function main() {
  console.clear();
  log('🚀 LOCAL DEVELOPMENT MODE', 'bright');
  log('═'.repeat(50), 'cyan');

  // Setup environment
  setupEnvironment();

  log('\n📋 Starting servers...', 'yellow');

  // Start both servers
  const backend = startBackend();
  const frontend = startFrontend();

  log('\n🌐 URLs:', 'bright');
  log('  Frontend: http://localhost:5176', 'magenta');
  log('  Backend:  http://localhost:3003/api', 'blue');
  log('  Database: PostgreSQL (local)', 'yellow');

  // Handle exit
  process.on('SIGINT', () => {
    log('\n\n👋 Stopping servers...', 'yellow');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
}

// Run the script
main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});