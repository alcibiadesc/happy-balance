#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
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
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

  // 1. Install dependencies (in parallel if needed)
  await installDependencies();

  // 2. Generate Prisma client (only if needed)
  generatePrismaClient();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  log(`\n✨ Worktree setup completed in ${elapsed}s!`, 'green');
  log('You can now run: pnpm run dev', 'cyan');
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