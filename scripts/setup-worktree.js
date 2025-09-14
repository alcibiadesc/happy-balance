#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

function runCommand(command, description, cwd = rootDir) {
  log(`⏳ ${description}...`, 'yellow');
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd,
      shell: true
    });
    log(`✅ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

function cleanNodeModules() {
  log('🧹 Cleaning node_modules and lock files...', 'cyan');

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
  if (existsSync(resolve(rootDir, 'backend', 'pnpm-lock.yaml'))) {
    rmSync(resolve(rootDir, 'backend', 'pnpm-lock.yaml'), { force: true });
  }

  log('✅ Cleanup completed', 'green');
}

async function main() {
  console.clear();
  log('🚀 Worktree Setup Script', 'bright');
  log('========================\n', 'bright');

  // 1. Clean everything
  cleanNodeModules();

  // 2. Prune pnpm store
  runCommand('pnpm store prune', 'Pruning pnpm store');

  // 3. Install root dependencies
  if (!runCommand('pnpm install', 'Installing root dependencies')) {
    log('Failed to install root dependencies', 'red');
    process.exit(1);
  }

  // 4. Install backend dependencies
  if (!runCommand('pnpm install', 'Installing backend dependencies', resolve(rootDir, 'backend'))) {
    log('Failed to install backend dependencies', 'red');
    process.exit(1);
  }

  // 5. Generate Prisma client
  if (!runCommand('npx prisma generate', 'Generating Prisma client', resolve(rootDir, 'backend'))) {
    log('Failed to generate Prisma client', 'red');
    process.exit(1);
  }

  log('\n✨ Worktree setup completed successfully!', 'green');
  log('You can now run: pnpm run dev', 'cyan');
}

main().catch(error => {
  log(`❌ Error: ${error.message}`, 'red');
  process.exit(1);
});