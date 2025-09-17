#!/usr/bin/env node

/**
 * Utilities for managing worktree-specific databases
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

export function log(message, color = "reset") {
  console.log(colors[color] + message + colors.reset);
}

/**
 * Get a sanitized database name from branch name
 * @param {string} branch - Git branch name
 * @returns {string} Sanitized database name
 */
export function getDatabaseName(branch) {
  if (!branch) return "happy_balance_dev";

  // Sanitize branch name for PostgreSQL
  // Replace special characters with underscore, convert to lowercase
  const sanitized = branch
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_") // Remove consecutive underscores
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

  // Limit length to avoid PostgreSQL limits (63 chars)
  const prefix = "happy_balance_";
  const maxBranchLength = 63 - prefix.length;
  const truncatedBranch = sanitized.substring(0, maxBranchLength);

  return `${prefix}${truncatedBranch}`;
}

/**
 * Get git branch information
 * @param {string} rootDir - Project root directory
 * @returns {{isWorktree: boolean, branch: string|null, gitDir: string|null}}
 */
export function getGitInfo(rootDir) {
  try {
    const gitDir = execSync("git rev-parse --git-dir", {
      cwd: rootDir,
      encoding: "utf-8",
    }).trim();

    const branch = execSync("git branch --show-current", {
      cwd: rootDir,
      encoding: "utf-8",
    }).trim();

    const isWorktree = gitDir.includes(".git/worktrees");

    return { isWorktree, branch, gitDir };
  } catch (error) {
    return { isWorktree: false, branch: null, gitDir: null };
  }
}

/**
 * Check if PostgreSQL is running
 * @returns {boolean}
 */
export function isPostgresRunning() {
  try {
    execSync("pg_isready", { stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a database exists
 * @param {string} dbName - Database name
 * @returns {boolean}
 */
export function databaseExists(dbName) {
  try {
    const result = execSync(
      `psql -U postgres -lqt | cut -d \\| -f 1 | grep -qw ${dbName}`,
      { shell: true, stdio: "pipe" },
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create a database if it doesn't exist
 * @param {string} dbName - Database name
 * @returns {boolean} Success status
 */
export function createDatabase(dbName) {
  try {
    // First check if database exists
    if (databaseExists(dbName)) {
      log(`  ✓ Database '${dbName}' already exists`, "cyan");
      return true;
    }

    log(`  Creating database '${dbName}'...`, "yellow");

    // Create the database
    execSync(`psql -U postgres -c "CREATE DATABASE \\"${dbName}\\""`, {
      stdio: "pipe",
      shell: true,
    });

    log(`  ✅ Database '${dbName}' created successfully`, "green");
    return true;
  } catch (error) {
    log(`  ❌ Failed to create database: ${error.message}`, "red");
    return false;
  }
}

/**
 * Update DATABASE_URL in .env file
 * @param {string} envPath - Path to .env file
 * @param {string} dbName - Database name
 */
export function updateDatabaseUrl(envPath, dbName) {
  const newUrl = `postgresql://postgres:password@localhost:5432/${dbName}`;

  if (existsSync(envPath)) {
    // Read existing .env file
    let envContent = readFileSync(envPath, "utf-8");

    // Replace DATABASE_URL line
    const databaseUrlRegex = /^DATABASE_URL=.*$/m;
    if (databaseUrlRegex.test(envContent)) {
      envContent = envContent.replace(
        databaseUrlRegex,
        `DATABASE_URL="${newUrl}"`,
      );
    } else {
      // Add DATABASE_URL if it doesn't exist
      envContent = `DATABASE_URL="${newUrl}"\n${envContent}`;
    }

    // Also ensure PORT is correct
    const portRegex = /^PORT=.*$/m;
    if (portRegex.test(envContent)) {
      envContent = envContent.replace(portRegex, "PORT=3003");
    } else {
      envContent += "\nPORT=3003";
    }

    // Ensure CORS_ORIGIN is correct
    const corsRegex = /^CORS_ORIGIN=.*$/m;
    if (corsRegex.test(envContent)) {
      envContent = envContent.replace(
        corsRegex,
        'CORS_ORIGIN="http://localhost:5176"',
      );
    } else {
      envContent += '\nCORS_ORIGIN="http://localhost:5176"';
    }

    writeFileSync(envPath, envContent);
    log(`  ✅ Updated DATABASE_URL and config in .env`, "green");
  } else {
    // Create new .env file with DATABASE_URL
    const envContent = `# Database
DATABASE_URL="${newUrl}"

# Server
PORT=3003
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5176"

# File upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR="uploads"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
`;

    writeFileSync(envPath, envContent);
    log(`  ✅ Created .env with DATABASE_URL`, "green");
  }
}

/**
 * Setup database for worktree
 * @param {string} rootDir - Project root directory
 * @returns {string} Database name used
 */
export function setupWorktreeDatabase(rootDir) {
  const gitInfo = getGitInfo(rootDir);
  const dbName = getDatabaseName(gitInfo.branch);
  const backendEnvPath = resolve(rootDir, "backend", ".env");

  log("\n🗄️  Database Configuration:", "bright");

  if (gitInfo.isWorktree) {
    log(`  📍 Worktree branch: ${gitInfo.branch}`, "cyan");
    log(`  📍 Database name: ${dbName}`, "cyan");
  } else {
    log(`  📍 Regular repository`, "cyan");
    log(`  📍 Database name: ${dbName}`, "cyan");
  }

  // Check if PostgreSQL is running
  if (!isPostgresRunning()) {
    log("  ⚠️  PostgreSQL is not running", "yellow");
    log("     Please start PostgreSQL first", "yellow");
    log("     On macOS: brew services start postgresql", "yellow");
    log("     On Linux: sudo systemctl start postgresql", "yellow");

    // Still update the .env file
    updateDatabaseUrl(backendEnvPath, dbName);
    return dbName;
  }

  // Create database if needed
  if (createDatabase(dbName)) {
    // Update DATABASE_URL in .env
    updateDatabaseUrl(backendEnvPath, dbName);
  }

  return dbName;
}
