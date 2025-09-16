#!/usr/bin/env node

/**
 * Local development script without Docker
 * Robust script for working with worktrees and regular repos
 */

import { spawn, execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
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

// Setup environment files if they don't exist
function setupEnvironment() {
  const backendEnvPath = resolve(rootDir, "backend", ".env");
  const frontendEnvPath = resolve(rootDir, ".env.local");

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
    log("✅ Created backend/.env", "green");
  }

  // Create frontend .env.local if it doesn't exist
  if (!existsSync(frontendEnvPath)) {
    const frontendEnv = `# Frontend Configuration
VITE_API_URL=http://localhost:3003/api
VITE_PORT=5176`;

    writeFileSync(frontendEnvPath, frontendEnv);
    log("✅ Created .env.local", "green");
  }
}

// Check if dependencies are installed
function checkDependencies() {
  const backendNodeModules = resolve(rootDir, "backend", "node_modules");
  const frontendNodeModules = resolve(rootDir, "node_modules");

  if (!existsSync(backendNodeModules)) {
    log("⚠️  Backend dependencies not found. Installing...", "yellow");
    try {
      execSync("pnpm install", {
        cwd: resolve(rootDir, "backend"),
        stdio: "inherit",
      });
      log("✅ Backend dependencies installed", "green");
    } catch (error) {
      log("❌ Failed to install backend dependencies", "red");
      throw error;
    }
  }

  if (!existsSync(frontendNodeModules)) {
    log("⚠️  Frontend dependencies not found. Installing...", "yellow");
    try {
      execSync("pnpm install", {
        cwd: rootDir,
        stdio: "inherit",
      });
      log("✅ Frontend dependencies installed", "green");
    } catch (error) {
      log("❌ Failed to install frontend dependencies", "red");
      throw error;
    }
  }
}

// Check if database is configured
function checkDatabase() {
  const backendEnvPath = resolve(rootDir, "backend", ".env");

  if (existsSync(backendEnvPath)) {
    try {
      // Generate Prisma client if needed
      log("🔄 Generating Prisma client...", "cyan");
      execSync("npx prisma generate", {
        cwd: resolve(rootDir, "backend"),
        stdio: "pipe",
      });
      log("✅ Prisma client ready", "green");
    } catch (error) {
      log("⚠️  Prisma client generation warning (non-critical)", "yellow");
    }
  }
}

// Start backend server
function startBackend() {
  const backendPath = resolve(rootDir, "backend");
  const mainTsPath = resolve(backendPath, "src", "main.ts");

  if (!existsSync(mainTsPath)) {
    log("❌ Backend main.ts not found at " + mainTsPath, "red");
    return null;
  }

  // Use pnpm if available, otherwise npm
  const packageManager = existsSync(resolve(backendPath, "pnpm-lock.yaml")) ? "pnpm" : "npm";

  return spawn(packageManager, ["run", "dev"], {
    cwd: backendPath,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: "1",
    },
  });
}

// Start frontend server
function startFrontend() {
  // Use pnpm if available, otherwise npm
  const packageManager = existsSync(resolve(rootDir, "pnpm-lock.yaml")) ? "pnpm" : "npm";

  return spawn(packageManager, ["exec", "vite", "--port", "5176", "--host"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: "1",
    },
  });
}

// Main function
async function main() {
  console.clear();
  log("🚀 LOCAL DEVELOPMENT MODE", "bright");
  log("═".repeat(50), "cyan");

  // Check if we're in a git worktree
  try {
    const gitDir = execSync("git rev-parse --git-dir", { cwd: rootDir, encoding: "utf-8" }).trim();
    if (gitDir.includes(".git/worktrees")) {
      log("📍 Running in Git worktree", "cyan");
    }
  } catch (error) {
    // Not in a git repo, that's okay
  }

  // Setup environment
  setupEnvironment();

  // Check and install dependencies if needed
  log("\n🔍 Checking dependencies...", "yellow");
  checkDependencies();

  // Check database configuration
  checkDatabase();

  log("\n📋 Starting servers...", "yellow");

  // Start both servers
  const backend = startBackend();
  const frontend = startFrontend();

  if (!backend) {
    log("⚠️  Backend server could not be started", "red");
    log("   Running frontend only...", "yellow");
  }

  log("\n🌐 URLs:", "bright");
  log("  Frontend: http://localhost:5176", "magenta");
  if (backend) {
    log("  Backend:  http://localhost:3003/api", "blue");
  }
  log("  Database: PostgreSQL (local)", "yellow");
  log("\n📝 Press Ctrl+C to stop all servers\n", "cyan");

  // Handle exit
  process.on("SIGINT", () => {
    log("\n\n👋 Stopping servers...", "yellow");
    if (backend) backend.kill();
    frontend.kill();
    process.exit(0);
  });

  // Handle process errors
  if (backend) {
    backend.on("error", (err) => {
      log(`\n❌ Backend error: ${err.message}`, "red");
    });
  }

  frontend.on("error", (err) => {
    log(`\n❌ Frontend error: ${err.message}`, "red");
  });
}

// Run the script
main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, "red");
  process.exit(1);
});
