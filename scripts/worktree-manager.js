#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
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

// Generate ports for a worktree ID
function generatePortsForId(id) {
  const hash = crypto.createHash('md5').update(id).digest('hex');
  const baseOffset = parseInt(hash.substring(0, 4), 16) % 1000;

  return {
    dbPort: 5432 + baseOffset,
    backendPort: 3000 + baseOffset,
    frontendPort: 5173 + baseOffset
  };
}

// Check if a port is in use
function isPortInUse(port) {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      const result = execSync(`lsof -i:${port} 2>/dev/null`, { encoding: 'utf-8' });
      return result.trim().length > 0;
    }
    return false;
  } catch {
    return false;
  }
}

// Check Docker container status
function getDockerStatus(worktreeId) {
  try {
    const containerName = `expense-tracker-db-${worktreeId}`;
    const result = execSync(
      `docker ps -a --filter "name=${containerName}" --format "{{.Status}}"`,
      { encoding: 'utf-8' }
    ).trim();

    if (result.includes('Up')) {
      return '🟢 Running';
    } else if (result) {
      return '🟡 Stopped';
    }
    return '⚫ Not created';
  } catch {
    return '⚫ Docker unavailable';
  }
}

// List all worktrees
function listWorktrees() {
  try {
    const worktrees = execSync('git worktree list --porcelain', {
      encoding: 'utf-8',
      cwd: rootDir
    });

    const parsed = [];
    const lines = worktrees.split('\n');

    let current = {};
    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        if (current.path) parsed.push(current);
        current = { path: line.substring(9) };
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).replace('refs/heads/', '');
      }
    }
    if (current.path) parsed.push(current);

    return parsed;
  } catch {
    return [];
  }
}

// Main command handler
const command = process.argv[2];

switch (command) {
  case 'list':
  case 'ls':
    console.clear();
    log('🌳 Git Worktrees Status', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'gray');

    const worktrees = listWorktrees();

    for (const worktree of worktrees) {
      const name = worktree.path.split('/').pop();
      const isMain = !worktree.path.includes('/worktrees/') && !name.includes('worktree');

      if (isMain) {
        log(`\n📁 Main Repository`, 'cyan');
        log(`   Path: ${worktree.path}`, 'gray');
        log(`   Branch: ${worktree.branch || 'main'}`, 'gray');
        log(`   Ports: Standard (3000, 5173, 5432)`, 'gray');
      } else {
        const ports = generatePortsForId(name);
        const dbStatus = getDockerStatus(name);
        const backendRunning = isPortInUse(ports.backendPort);
        const frontendRunning = isPortInUse(ports.frontendPort);

        log(`\n📂 Worktree: ${name}`, 'yellow');
        log(`   Path: ${worktree.path}`, 'gray');
        log(`   Branch: ${worktree.branch || name}`, 'gray');
        log(`   Backend:  http://localhost:${ports.backendPort} ${backendRunning ? '🟢' : '⚫'}`, 'gray');
        log(`   Frontend: http://localhost:${ports.frontendPort} ${frontendRunning ? '🟢' : '⚫'}`, 'gray');
        log(`   Database: localhost:${ports.dbPort} ${dbStatus}`, 'gray');
      }
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'gray');
    log('💡 Legend: 🟢 Running | 🟡 Stopped | ⚫ Not created', 'gray');
    break;

  case 'clean':
    const worktreeName = process.argv[3];
    if (!worktreeName) {
      log('❌ Please specify a worktree name', 'red');
      log('Usage: pnpm worktree:clean <name>', 'yellow');
      process.exit(1);
    }

    log(`🧹 Cleaning up worktree: ${worktreeName}`, 'cyan');

    // Stop and remove Docker container
    try {
      const containerName = `expense-tracker-db-${worktreeName}`;
      execSync(`docker stop ${containerName} 2>/dev/null`, { stdio: 'ignore' });
      execSync(`docker rm ${containerName} 2>/dev/null`, { stdio: 'ignore' });
      log('✅ Docker container removed', 'green');
    } catch {
      log('⚠️  No Docker container to remove', 'yellow');
    }

    // Remove worktree
    try {
      execSync(`git worktree remove ${worktreeName} --force`, { cwd: rootDir, stdio: 'pipe' });
      log('✅ Worktree removed', 'green');
    } catch (error) {
      log(`❌ Failed to remove worktree: ${error.message}`, 'red');
    }
    break;

  case 'create':
    const newWorktreeName = process.argv[3];
    if (!newWorktreeName) {
      log('❌ Please specify a worktree name', 'red');
      log('Usage: pnpm worktree:create <name>', 'yellow');
      process.exit(1);
    }

    log(`🌱 Creating worktree: ${newWorktreeName}`, 'cyan');

    try {
      // Create worktree
      execSync(`git worktree add ${newWorktreeName}`, { cwd: rootDir, stdio: 'pipe' });
      log('✅ Worktree created', 'green');

      // Run setup
      log('🚀 Running setup...', 'cyan');
      execSync(`cd ${newWorktreeName} && pnpm run setup:worktree`, { cwd: rootDir, stdio: 'inherit' });

      const ports = generatePortsForId(newWorktreeName);
      log(`\n✨ Worktree ready!`, 'green');
      log(`📌 Your ports:`, 'bright');
      log(`   Backend:  http://localhost:${ports.backendPort}`, 'gray');
      log(`   Frontend: http://localhost:${ports.frontendPort}`, 'gray');
      log(`   Database: localhost:${ports.dbPort}`, 'gray');
      log(`\n💡 Run 'cd ${newWorktreeName} && pnpm run dev' to start developing`, 'cyan');
    } catch (error) {
      log(`❌ Failed to create worktree: ${error.message}`, 'red');
      process.exit(1);
    }
    break;

  default:
    log('📚 Worktree Manager', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'gray');
    log('Commands:', 'cyan');
    log('  pnpm worktree:list           - List all worktrees and their status', 'gray');
    log('  pnpm worktree:create <name>  - Create and setup a new worktree', 'gray');
    log('  pnpm worktree:clean <name>   - Remove worktree and its Docker container', 'gray');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'gray');
}