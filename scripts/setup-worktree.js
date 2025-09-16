#!/usr/bin/env node

/**
 * Script to setup a new worktree with all necessary dependencies
 * Auto-detects if running in a worktree and configures accordingly
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

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

function log(message, color = "reset") {
  console.log(colors[color] + message + colors.reset);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: "utf8",
      ...options,
    });
    return result;
  } catch (error) {
    throw error;
  }
}

function checkGitWorktree() {
  try {
    const gitDir = runCommand("git rev-parse --git-dir", { cwd: rootDir }).trim();
    const isWorktree = gitDir.includes(".git/worktrees");
    const branch = runCommand("git branch --show-current", { cwd: rootDir }).trim();

    log("\n📍 Git Information:", "bright");
    log(`  Type: ${isWorktree ? "Worktree" : "Regular repository"}`, "cyan");
    log(`  Branch: ${branch}`, "cyan");

    return { isWorktree, branch, gitDir };
  } catch (error) {
    log("⚠️  Not a git repository", "yellow");
    return { isWorktree: false, branch: null, gitDir: null };
  }
}

function setupEnvironmentFiles() {
  log("\n📝 Setting up environment files...", "yellow");

  const backendEnvPath = resolve(rootDir, "backend", ".env");
  const frontendEnvPath = resolve(rootDir, ".env.local");

  // Backend .env
  if (!existsSync(backendEnvPath)) {
    const backendEnv = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/happy_balance_dev"

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

    writeFileSync(backendEnvPath, backendEnv);
    log("  ✅ Created backend/.env", "green");
  } else {
    log("  ✓ backend/.env exists", "cyan");
  }

  // Frontend .env.local
  if (!existsSync(frontendEnvPath)) {
    const frontendEnv = `# Frontend Configuration
VITE_API_URL=http://localhost:3003/api
VITE_PORT=5176
`;

    writeFileSync(frontendEnvPath, frontendEnv);
    log("  ✅ Created .env.local", "green");
  } else {
    log("  ✓ .env.local exists", "cyan");
  }
}

function installDependencies() {
  log("\n📦 Installing dependencies...", "yellow");

  // Check for pnpm
  try {
    runCommand("pnpm --version", { stdio: "pipe" });
  } catch (error) {
    log("❌ pnpm is not installed. Please install it first:", "red");
    log("   npm install -g pnpm", "yellow");
    process.exit(1);
  }

  // Install root dependencies
  if (!existsSync(resolve(rootDir, "node_modules"))) {
    log("  Installing frontend dependencies...", "cyan");
    try {
      execSync("pnpm install", { cwd: rootDir, stdio: "inherit" });
      log("  ✅ Frontend dependencies installed", "green");
    } catch (error) {
      log("  ❌ Failed to install frontend dependencies", "red");
      throw error;
    }
  } else {
    log("  ✓ Frontend dependencies already installed", "cyan");
  }

  // Install backend dependencies
  const backendPath = resolve(rootDir, "backend");
  if (!existsSync(resolve(backendPath, "node_modules"))) {
    log("  Installing backend dependencies...", "cyan");
    try {
      execSync("pnpm install", { cwd: backendPath, stdio: "inherit" });
      log("  ✅ Backend dependencies installed", "green");
    } catch (error) {
      log("  ❌ Failed to install backend dependencies", "red");
      throw error;
    }
  } else {
    log("  ✓ Backend dependencies already installed", "cyan");
  }
}

function setupDatabase() {
  log("\n🗄️  Setting up database...", "yellow");

  const backendPath = resolve(rootDir, "backend");

  // Generate Prisma client
  try {
    log("  Generating Prisma client...", "cyan");
    runCommand("npx prisma generate", { cwd: backendPath, stdio: "pipe" });
    log("  ✅ Prisma client generated", "green");
  } catch (error) {
    log("  ⚠️  Could not generate Prisma client (database may not be running)", "yellow");
  }

  // Check if PostgreSQL is running
  try {
    runCommand("pg_isready", { stdio: "pipe" });
    log("  ✓ PostgreSQL is running", "green");

    // Try to push database schema
    try {
      log("  Pushing database schema...", "cyan");
      runCommand("npx prisma db push", { cwd: backendPath, stdio: "pipe" });
      log("  ✅ Database schema pushed", "green");
    } catch (error) {
      log("  ⚠️  Could not push database schema", "yellow");
      log("     You may need to run: pnpm db:push", "yellow");
    }
  } catch (error) {
    log("  ⚠️  PostgreSQL is not running", "yellow");
    log("     Please start PostgreSQL and run: pnpm db:push", "yellow");
  }
}

function createUploadDirs() {
  log("\n📁 Creating upload directories...", "yellow");

  const uploadDir = resolve(rootDir, "backend", "uploads");
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
    log("  ✅ Created backend/uploads directory", "green");
  } else {
    log("  ✓ Upload directory exists", "cyan");
  }
}

async function main() {
  console.clear();
  log("🚀 WORKTREE/DEVELOPMENT SETUP", "bright");
  log("═".repeat(50), "cyan");

  // Check git status
  const gitInfo = checkGitWorktree();

  // Setup environment files
  setupEnvironmentFiles();

  // Install dependencies
  installDependencies();

  // Setup database
  setupDatabase();

  // Create required directories
  createUploadDirs();

  // Summary
  log("\n✨ Setup Complete!", "bright");
  log("═".repeat(50), "cyan");
  log("\n📋 Next steps:", "yellow");
  log("  1. Make sure PostgreSQL is running", "cyan");
  log("  2. Run: pnpm dev", "cyan");
  log("\n🌐 Development URLs:", "yellow");
  log("  Frontend: http://localhost:5176", "magenta");
  log("  Backend:  http://localhost:3003/api", "blue");

  if (gitInfo.isWorktree) {
    log("\n📌 Worktree tips:", "yellow");
    log("  - This is an isolated worktree for branch: " + gitInfo.branch, "cyan");
    log("  - Dependencies are separate from main repository", "cyan");
    log("  - Database schema changes won't affect other worktrees", "cyan");
  }
}

// Run the script
main().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}`, "red");
  process.exit(1);
});
