#!/usr/bin/env node

/**
 * Local development script without Docker
 * Automatically handles worktree database setup and dependencies
 */

import { spawn, execSync } from "child_process";
import { existsSync, writeFileSync, mkdirSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { setupWorktreeDatabase, getGitInfo, log } from "./worktree-db-utils.js";
import { getAvailablePorts } from "./port-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Setup environment files if they don't exist
function setupEnvironment() {
  // Setup worktree-specific database (this will handle backend .env)
  const dbName = setupWorktreeDatabase(rootDir);
  const frontendEnvPath = resolve(rootDir, ".env.local");

  // Create frontend .env.local if it doesn't exist
  if (!existsSync(frontendEnvPath)) {
    const frontendEnv = `# Frontend Configuration
VITE_API_URL=http://localhost:3003/api
VITE_PORT=5176`;

    writeFileSync(frontendEnvPath, frontendEnv);
    log("✅ Created .env.local", "green");
  }
}

// Check and install dependencies if needed
function checkAndInstallDependencies() {
  const backendNodeModules = resolve(rootDir, "backend", "node_modules");
  const frontendNodeModules = resolve(rootDir, "node_modules");
  let needsInstall = false;

  // Check for pnpm
  try {
    execSync("pnpm --version", { stdio: "pipe" });
  } catch (error) {
    log("❌ pnpm is not installed. Please install it first:", "red");
    log("   npm install -g pnpm", "yellow");
    process.exit(1);
  }

  if (!existsSync(frontendNodeModules)) {
    log("📦 Installing frontend dependencies...", "yellow");
    needsInstall = true;
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

  if (!existsSync(backendNodeModules)) {
    log("📦 Installing backend dependencies...", "yellow");
    needsInstall = true;
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

  return needsInstall;
}

// Setup and configure database
function setupDatabase() {
  const backendPath = resolve(rootDir, "backend");

  try {
    // Generate Prisma client
    log("🔄 Generating Prisma client...", "cyan");
    execSync("npx prisma generate", {
      cwd: backendPath,
      stdio: "pipe",
    });
    log("✅ Prisma client ready", "green");

    // Try to push database schema if PostgreSQL is running
    try {
      execSync("pg_isready", { stdio: "pipe" });

      // Push schema to database
      log("🔄 Pushing database schema...", "cyan");
      execSync("npx prisma db push --skip-generate", {
        cwd: backendPath,
        stdio: "pipe",
      });
      log("✅ Database schema synchronized", "green");
    } catch (error) {
      // PostgreSQL not running or schema push failed
    }
  } catch (error) {
    log("⚠️  Database setup warning (non-critical)", "yellow");
  }
}

// Start backend server with specific port
function startBackend(port) {
  const backendPath = resolve(rootDir, "backend");
  const mainTsPath = resolve(backendPath, "src", "main.ts");

  if (!existsSync(mainTsPath)) {
    log("❌ Backend main.ts not found at " + mainTsPath, "red");
    return null;
  }

  // Use pnpm if available, otherwise npm
  const packageManager = existsSync(resolve(backendPath, "pnpm-lock.yaml"))
    ? "pnpm"
    : "npm";

  return spawn(packageManager, ["run", "dev"], {
    cwd: backendPath,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PORT: port.toString(),
      FORCE_COLOR: "1",
    },
  });
}

// Start frontend server with specific port and backend URL
function startFrontend(frontendPort, backendPort) {
  // Use pnpm if available, otherwise npm
  const packageManager = existsSync(resolve(rootDir, "pnpm-lock.yaml"))
    ? "pnpm"
    : "npm";

  return spawn(
    packageManager,
    ["exec", "vite", "--port", frontendPort.toString(), "--host"],
    {
      cwd: rootDir,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        VITE_API_URL: `http://localhost:${backendPort}/api`,
        FORCE_COLOR: "1",
      },
    },
  );
}

// Create required directories
function createRequiredDirs() {
  const uploadDir = resolve(rootDir, "backend", "uploads");
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
    log("📁 Created backend/uploads directory", "green");
  }
}

// Main function
async function main() {
  console.clear();
  log("🚀 LOCAL DEVELOPMENT MODE", "bright");
  log("═".repeat(50), "cyan");

  // Check if we're in a git worktree and show info
  const gitInfo = getGitInfo(rootDir);
  if (gitInfo.isWorktree) {
    log("📍 Worktree: " + gitInfo.branch, "cyan");
  } else if (gitInfo.branch) {
    log("🌿 Branch: " + gitInfo.branch, "cyan");
  }

  // Setup environment (includes worktree database setup)
  log("\n🔧 Setting up environment...", "yellow");
  setupEnvironment();

  // Check and install dependencies if needed
  const installed = checkAndInstallDependencies();

  // Create required directories
  createRequiredDirs();

  // Setup database (generate client and push schema)
  if (installed || !existsSync(resolve(rootDir, "backend", ".prisma"))) {
    setupDatabase();
  }

  // Find available ports
  log("\n🔍 Finding available ports...", "yellow");
  const ports = await getAvailablePorts();
  log(
    "✅ Ports found - Backend: " +
      ports.backend +
      ", Frontend: " +
      ports.frontend,
    "green",
  );

  // Update backend .env with the dynamic port
  const backendEnvPath = resolve(rootDir, "backend", ".env");
  if (existsSync(backendEnvPath)) {
    let envContent = readFileSync(backendEnvPath, "utf-8");
    envContent = envContent.replace(/^PORT=.*$/m, `PORT=${ports.backend}`);
    envContent = envContent.replace(
      /^CORS_ORIGIN=.*$/m,
      `CORS_ORIGIN="http://localhost:${ports.frontend}"`,
    );
    writeFileSync(backendEnvPath, envContent);
  }

  log("\n📋 Starting servers...", "yellow");

  // Start both servers with dynamic ports
  const backend = startBackend(ports.backend);
  const frontend = startFrontend(ports.frontend, ports.backend);

  if (!backend) {
    log("⚠️  Backend server could not be started", "red");
    log("   Running frontend only...", "yellow");
  }

  // Show database info
  const dbInfo = getGitInfo(rootDir);
  const { getDatabaseName } = await import("./worktree-db-utils.js");
  const dbName = getDatabaseName(dbInfo.branch);

  log("\n🌐 Services:", "bright");
  log("  Frontend: http://localhost:" + ports.frontend, "magenta");
  if (backend) {
    log("  Backend:  http://localhost:" + ports.backend + "/api", "blue");
  }
  log("  Database: " + dbName, "yellow");
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
