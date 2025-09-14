#!/usr/bin/env node

/**
 * Development Environment Manager V2
 * 
 * NUEVO FLUJO ROBUSTO:
 * 1. Database → Establecer y verificar conexión DB
 * 2. Ports → Asignar puertos estables y persistentes  
 * 3. Config → Actualizar TODAS las configuraciones
 * 4. Backend → Levantar y verificar API
 * 5. Frontend → Levantar y verificar interfaz
 * 6. Test → Verificar conectividad end-to-end
 */

import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import crypto from 'crypto';
import { getWorkspacePorts, getDatabaseName, getContainerName } from './port-manager.js';

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

// Get workspace information
function getWorkspaceInfo() {
  const currentPath = process.cwd();
  const currentDir = currentPath.split('/').pop();
  
  // Simple and reliable detection
  console.log(`Debug: Current path: ${currentPath}`);
  console.log(`Debug: Current directory: ${currentDir}`);
  console.log(`Debug: Root directory: ${rootDir}`);
  
  // If we're not in the root directory, we're in a worktree
  if (currentPath !== rootDir) {
    console.log(`Debug: Detected as worktree: ${currentDir}`);
    return { id: currentDir, isWorktree: true };
  }

  // If we are exactly at root, treat as main (do not rely on git worktree output)
  console.log(`Debug: Detected as main repository`);
  return { id: 'main', isWorktree: false };

  // Try git worktree detection as fallback (unreached due to early return)
  try {
    const gitWorktreeInfo = execSync('git worktree list --porcelain', { 
      encoding: 'utf-8',
      cwd: currentPath 
    });
    
    const lines = gitWorktreeInfo.split('\n');
    
    // Find our current path in the worktree list
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('worktree ') && lines[i].substring(9) === currentPath) {
        // This is a worktree, find the branch name
        for (let j = i + 1; j < lines.length && !lines[j].startsWith('worktree '); j++) {
          if (lines[j].startsWith('branch ')) {
            const branchPath = lines[j].substring(7);
            const branchName = branchPath.replace('refs/heads/', '');
            console.log(`Debug: Git detected worktree: ${branchName}`);
            return { id: branchName, isWorktree: true };
          }
        }
        // If no branch found, use directory name
        console.log(`Debug: Git detected worktree (no branch): ${currentDir}`);
        return { id: currentDir, isWorktree: true };
      }
    }
  } catch (error) {
    console.log(`Debug: Git worktree detection failed: ${error.message}`);
  }
  
  console.log(`Debug: Detected as main repository`);
  return { id: 'main', isWorktree: false };
}

// Check if port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    
    server.on('error', () => resolve(true));
  });
}

// Wait for port to be in use (service started)
async function waitForPort(port, serviceName, maxRetries = 30) {
  log(`⏳ Waiting for ${serviceName} on port ${port}...`, 'yellow');
  
  for (let i = 0; i < maxRetries; i++) {
    const inUse = await isPortInUse(port);
    if (inUse) {
      log(`✅ ${serviceName} is ready on port ${port}!`, 'green');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  log(`❌ ${serviceName} failed to start on port ${port}`, 'red');
  return false;
}

// Test HTTP endpoint
async function testEndpoint(url, expectedStatus = 200) {
  try {
    const response = await fetch(url);
    return response.status === expectedStatus;
  } catch {
    return false;
  }
}

// Kill process on port  
function killPort(port) {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: 'ignore' });
    }
  } catch {
    // Port might not be in use, ignore
  }
}

// STEP 1: Setup Database (FIRST!)
async function setupDatabase(workspaceInfo, ports) {
  const separator = '═'.repeat(50);
  log(separator, 'cyan');
  log('🗄️  STEP 1: DATABASE SETUP', 'bright');  
  log(separator, 'cyan');
  
  const dbName = getDatabaseName(workspaceInfo.id);
  const containerName = getContainerName(workspaceInfo.id);
  
  if (!workspaceInfo.isWorktree) {
    log('📍 Main repository - ensuring standard database is available', 'gray');
    // If standard DB port is already in use, assume a local DB is running
    const dbInUse = await isPortInUse(ports.dbPort);
    if (dbInUse) {
      log(`✅ Database detected on port ${ports.dbPort}`, 'green');
      return true;
    }

    // Try to start a local postgres via Docker on standard ports
    const mainContainerName = getContainerName('main');
    try {
      // Start existing container if present
      execSync(`docker start ${mainContainerName} 2>/dev/null || true`, { stdio: 'ignore' });
    } catch {}

    // Check again
    if (!(await isPortInUse(ports.dbPort))) {
      log('🐳 Starting local PostgreSQL container for main...', 'cyan');
      try {
        const dockerCommand = `docker run -d \
      --name ${mainContainerName} \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=happy_balance \
      -p ${ports.dbPort}:5432 \
      --restart unless-stopped \
      postgres:17-alpine`;
        execSync(dockerCommand, { stdio: 'ignore' });
      } catch (error) {
        log(`❌ Failed to start main DB container: ${error.message}`, 'red');
        return false;
      }
    }

    // Wait until ready
    log('⏳ Waiting for database to be ready...', 'yellow');
    for (let i = 0; i < 30; i++) {
      try {
        execSync(`pg_isready -h localhost -p ${ports.dbPort} -d happy_balance -U postgres`, { stdio: 'ignore' });
        log('✅ Database is ready!', 'green');
        return true;
      } catch {}
      await new Promise(r => setTimeout(r, 1000));
    }
    log('❌ Database failed to become ready on main', 'red');
    return false;
  }
  
  log(`🐳 Setting up database for worktree: ${workspaceInfo.id}`, 'cyan');
  log(`   Database: ${dbName}`, 'gray');
  log(`   Container: ${containerName}`, 'gray');
  log(`   Port: ${ports.dbPort}`, 'gray');
  
  // First, stop and remove any existing container to start fresh
  log('🧹 Cleaning any existing container...', 'yellow');
  try {
    execSync(`docker stop ${containerName} 2>/dev/null || true`, { stdio: 'ignore' });
    execSync(`docker rm ${containerName} 2>/dev/null || true`, { stdio: 'ignore' });
  } catch {}
  
  // Create new container directly with docker run (simpler than docker-compose)
  log('📦 Creating fresh database container...', 'yellow');
  
  try {
    const dockerCommand = `docker run -d \
      --name ${containerName} \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=${dbName} \
      -p ${ports.dbPort}:5432 \
      --restart unless-stopped \
      postgres:17-alpine`;
    
    execSync(dockerCommand, { stdio: 'ignore' });
    log('✅ Database container created', 'green');
  } catch (error) {
    log(`❌ Failed to create container: ${error.message}`, 'red');
    return false;
  }
  
  // Wait for database to be ready with simpler check
  log('⏳ Waiting for database to be ready...', 'yellow');
  for (let i = 0; i < 30; i++) {
    try {
      // Simple connection test
      execSync(`docker exec ${containerName} pg_isready -U postgres`, {
        stdio: 'ignore'
      });
      
      log('✅ Database is ready!', 'green');
      return true;
      
    } catch (error) {
      if (i < 29) {
        process.stdout.write('.');
      } else {
        log(`\n❌ Database failed to start after 30 attempts`, 'red');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

// STEP 2: Configure Ports (STABLE!) 
async function configurePorts(workspaceInfo) {
  const separator = '═'.repeat(50);
  log(separator, 'cyan');
  log('🔌 STEP 2: PORT CONFIGURATION', 'bright');
  log(separator, 'cyan');
  
  const ports = await getWorkspacePorts(workspaceInfo.id);
  
  log(`📍 Workspace: ${workspaceInfo.id}`, 'gray');
  log(`🔌 Database Port: ${ports.dbPort}`, 'gray');
  log(`🔌 Backend Port: ${ports.backendPort}`, 'gray');
  log(`🔌 Frontend Port: ${ports.frontendPort}`, 'gray');
  
  // Verify ports are free (except database which should be in use)
  if (!workspaceInfo.isWorktree) {
    return ports;
  }
  
  const dbInUse = await isPortInUse(ports.dbPort);
  const backendInUse = await isPortInUse(ports.backendPort);
  const frontendInUse = await isPortInUse(ports.frontendPort);
  
  log(`🔍 Port Status Check:`, 'yellow');
  log(`   Database (${ports.dbPort}): ${dbInUse ? '🟢 In Use (Good!)' : '🔴 Free (Problem!)'}`, dbInUse ? 'green' : 'red');
  log(`   Backend (${ports.backendPort}): ${backendInUse ? '🟡 In Use (Conflict!)' : '🟢 Free (Good!)'}`, backendInUse ? 'yellow' : 'green');
  log(`   Frontend (${ports.frontendPort}): ${frontendInUse ? '🟡 In Use (Conflict!)' : '🟢 Free (Good!)'}`, frontendInUse ? 'yellow' : 'green');
  
  // Clean up conflicts
  if (backendInUse) {
    log(`🧹 Cleaning backend port ${ports.backendPort}...`, 'yellow');
    killPort(ports.backendPort);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (frontendInUse) {
    log(`🧹 Cleaning frontend port ${ports.frontendPort}...`, 'yellow');
    killPort(ports.frontendPort);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!dbInUse) {
    log('❌ Database should be running but port is free!', 'red');
    throw new Error('Database setup failed - port not in use');
  }
  
  log('✅ Ports configured successfully!', 'green');
  return ports;
}

// STEP 3: Update ALL configurations
async function updateConfigurations(workspaceInfo, ports) {
  const separator = '═'.repeat(50);
  log(separator, 'cyan');
  log('⚙️  STEP 3: CONFIGURATION UPDATE', 'bright');
  log(separator, 'cyan');
  
  const dbName = getDatabaseName(workspaceInfo.id);
  
  // Backend .env
  log('📝 Updating backend .env...', 'yellow');
  const backendEnvPath = resolve(rootDir, 'backend', '.env');
  const backendEnvContent = `DATABASE_URL="postgresql://postgres:postgres@localhost:${ports.dbPort}/${dbName}"
PORT=${ports.backendPort}
NODE_ENV=development
CORS_ORIGIN="http://localhost:${ports.frontendPort}"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"
`;
  writeFileSync(backendEnvPath, backendEnvContent);
  log('   ✅ Backend .env written', 'green');
  
  // Frontend .env.local
  log('📝 Updating frontend .env.local...', 'yellow');
  const frontendEnvPath = resolve(rootDir, '.env.local');
  const frontendEnvContent = `VITE_API_URL=http://localhost:${ports.backendPort}/api
VITE_PORT=${ports.frontendPort}
`;
  writeFileSync(frontendEnvPath, frontendEnvContent);
  log('   ✅ Frontend .env.local written', 'green');
  
  // Vite config
  log('📝 Updating vite.config.ts...', 'yellow');
  const viteConfigPath = resolve(rootDir, 'vite.config.ts');
  if (existsSync(viteConfigPath)) {
    let viteConfig = readFileSync(viteConfigPath, 'utf-8');
    viteConfig = viteConfig.replace(/port:\s*\d+/, `port: ${ports.frontendPort}`);
    writeFileSync(viteConfigPath, viteConfig);
    log('   ✅ Vite config updated', 'green');
  }
  
  // Verify files were written correctly
  log('🧪 Verifying configurations...', 'yellow');
  
  const backendEnv = readFileSync(backendEnvPath, 'utf-8');
  const frontendEnv = readFileSync(frontendEnvPath, 'utf-8');
  const viteConfig = readFileSync(viteConfigPath, 'utf-8');
  
  const backendPortMatch = backendEnv.match(/PORT=(\d+)/);
  const dbPortMatch = backendEnv.match(/localhost:(\d+)/);
  const frontendPortMatch = viteConfig.match(/port:\s*(\d+)/);
  
  if (backendPortMatch?.[1] == ports.backendPort && 
      dbPortMatch?.[1] == ports.dbPort &&
      frontendPortMatch?.[1] == ports.frontendPort) {
    log('✅ All configurations verified!', 'green');
  } else {
    log('❌ Configuration verification failed!', 'red');
    log(`   Expected: Backend=${ports.backendPort}, DB=${ports.dbPort}, Frontend=${ports.frontendPort}`, 'red');
    log(`   Found: Backend=${backendPortMatch?.[1]}, DB=${dbPortMatch?.[1]}, Frontend=${frontendPortMatch?.[1]}`, 'red');
    throw new Error('Configuration verification failed');
  }
}

// STEP 4: Start Backend (VERIFIED!)
async function startBackend(ports) {
  const separator = '═'.repeat(50);
  log(separator, 'cyan');
  log('🏗️  STEP 4: BACKEND STARTUP', 'bright');
  log(separator, 'cyan');
  
  log('🚀 Starting backend server...', 'cyan');
  
  const backendProcess = spawn('pnpm', ['dev'], {
    cwd: resolve(rootDir, 'backend'),
    env: { ...process.env, FORCE_COLOR: '1' },
    shell: true
  });
  
  // Capture output for debugging
  let backendOutput = '';
  backendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    backendOutput += output;
    process.stdout.write(`${colors.blue}[Backend]${colors.reset} ${output}`);
  });
  
  backendProcess.stderr.on('data', (data) => {
    const output = data.toString();
    backendOutput += output;
    process.stderr.write(`${colors.red}[Backend Error]${colors.reset} ${output}`);
  });
  
  // Wait for backend to start
  const backendReady = await waitForPort(ports.backendPort, 'Backend', 30);
  
  if (!backendReady) {
    log('❌ Backend failed to start!', 'red');
    log('📄 Backend output:', 'yellow');
    console.log(backendOutput);
    throw new Error('Backend startup failed');
  }
  
  // Test backend endpoints
  log('🧪 Testing backend endpoints...', 'yellow');
  
  const healthOk = await testEndpoint(`http://localhost:${ports.backendPort}/health`);
  if (!healthOk) {
    log('❌ Backend health check failed!', 'red');
    throw new Error('Backend health check failed');
  }
  log('   ✅ Health endpoint OK', 'green');
  
  const apiOk = await testEndpoint(`http://localhost:${ports.backendPort}/api/transactions`);
  if (!apiOk) {
    log('❌ Backend API check failed!', 'red');
    throw new Error('Backend API check failed');
  }
  log('   ✅ API endpoint OK', 'green');
  
  log('✅ Backend is fully operational!', 'green');
  return backendProcess;
}

// STEP 5: Start Frontend (CONNECTED!)
async function startFrontend(ports) {
  const separator = '═'.repeat(50);
  log(separator, 'cyan');
  log('🎨 STEP 5: FRONTEND STARTUP', 'bright');
  log(separator, 'cyan');
  
  log('🚀 Starting frontend server...', 'cyan');
  log(`   Port: ${ports.frontendPort}`, 'gray');
  log(`   API URL: http://localhost:${ports.backendPort}/api`, 'gray');
  
  const frontendProcess = spawn('vite', ['dev', '--host', '0.0.0.0', '--port', ports.frontendPort.toString()], {
    cwd: rootDir,
    env: { ...process.env, FORCE_COLOR: '1', VITE_PORT: ports.frontendPort.toString() },
    shell: true
  });
  
  // Capture output
  let frontendOutput = '';
  frontendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    frontendOutput += output;
    process.stdout.write(`${colors.magenta}[Frontend]${colors.reset} ${output}`);
  });
  
  frontendProcess.stderr.on('data', (data) => {
    const output = data.toString();
    frontendOutput += output;
    process.stderr.write(`${colors.red}[Frontend Error]${colors.reset} ${output}`);
  });
  
  // Capture the port from stdout if Vite selects an alternative
  let actualFrontendPort = ports.frontendPort;
  let detectedPort = null;

  const tryDetectPortFromOutput = (chunk) => {
    const text = chunk.toString();
    const match = text.match(/Local:\s*http:\/\/localhost:(\d+)/);
    if (match && match[1]) {
      detectedPort = parseInt(match[1], 10);
    }
  };

  // Also parse stdout/stderr to detect actual port quickly
  frontendProcess.stdout.on('data', tryDetectPortFromOutput);
  frontendProcess.stderr.on('data', tryDetectPortFromOutput);

  // Wait up to 30s for either default or detected alt port
  let frontendReady = false;
  for (let i = 0; i < 60; i++) {
    if (detectedPort && typeof detectedPort === 'number') {
      actualFrontendPort = detectedPort;
      const ok = await isPortInUse(actualFrontendPort);
      if (ok) { frontendReady = true; break; }
    }
    const defaultOk = await isPortInUse(ports.frontendPort);
    if (defaultOk) { actualFrontendPort = ports.frontendPort; frontendReady = true; break; }
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (!frontendReady) {
    // Vite might have moved to next available port
    log('🔍 Frontend not on expected port, checking alternatives...', 'yellow');
    
    for (let i = 1; i <= 5; i++) {
      const altPort = ports.frontendPort + i;
      const altReady = await waitForPort(altPort, `Frontend (alt port ${altPort})`, 3);
      if (altReady) {
        actualFrontendPort = altPort;
        frontendReady = true;
        log(`✅ Frontend found on alternative port ${altPort}!`, 'green');
        break;
      }
    }
  }
  
  if (!frontendReady) {
    log('❌ Frontend failed to start on any port!', 'red');
    log('📄 Frontend output:', 'yellow');
    console.log(frontendOutput);
    throw new Error('Frontend startup failed');
  }
  
  log('✅ Frontend is running!', 'green');
  
  // Update ports object with actual frontend port for later use
  if (actualFrontendPort !== ports.frontendPort) {
    ports.frontendPort = actualFrontendPort;
    log(`📝 Updated frontend port to ${actualFrontendPort}`, 'gray');
  }
  
  return frontendProcess;
}

// STEP 6: End-to-end test
async function testConnectivity(ports) {
  const separator = '═'.repeat(50);
  log(separator, 'cyan');
  log('🧪 STEP 6: CONNECTIVITY TEST', 'bright');
  log(separator, 'cyan');
  
  log('🔗 Testing full stack connectivity...', 'yellow');
  
  // Test backend
  log('   🔍 Testing backend...', 'gray');
  const backendOk = await testEndpoint(`http://localhost:${ports.backendPort}/health`);
  log(`   ${backendOk ? '✅' : '❌'} Backend health`, backendOk ? 'green' : 'red');
  
  // Test API
  log('   🔍 Testing API...', 'gray');
  const apiOk = await testEndpoint(`http://localhost:${ports.backendPort}/api/transactions`);
  log(`   ${apiOk ? '✅' : '❌'} API transactions`, apiOk ? 'green' : 'red');
  
  // Test frontend
  log('   🔍 Testing frontend...', 'gray');
  const frontendOk = await testEndpoint(`http://localhost:${ports.frontendPort}`);
  log(`   ${frontendOk ? '✅' : '❌'} Frontend app`, frontendOk ? 'green' : 'red');
  
  if (backendOk && apiOk && frontendOk) {
    log('✅ Full stack connectivity verified!', 'green');
    return true;
  } else {
    log('❌ Connectivity issues detected!', 'red');
    return false;
  }
}

// Show final URLs
function showSuccessMessage(ports, workspaceInfo) {
  const separator = '━'.repeat(70);
  
  console.log('\n\n');
  log(separator, 'green');
  log('   🎉 DEVELOPMENT ENVIRONMENT IS READY!', 'bright');
  log(separator, 'green');
  console.log('');
  
  log('   📱 FRONTEND APPLICATION:', 'bright');
  log(`   ➜ ${colors.bright}http://localhost:${ports.frontendPort}${colors.reset}`, 'green');
  console.log('');
  
  log('   🔧 BACKEND API:', 'bright');
  log(`   ➜ ${colors.bright}http://localhost:${ports.backendPort}/api${colors.reset}`, 'blue');
  console.log('');
  
  log('   🗄️  DATABASE:', 'bright');
  const dbName = getDatabaseName(workspaceInfo.id);
  log(`   ➜ ${colors.bright}postgresql://localhost:${ports.dbPort}/${dbName}${colors.reset}`, 'yellow');
  console.log('');
  
  log(separator, 'green');
  console.log('');
  log('   🚀 Ready to code! All services are connected and verified.', 'bright');
  console.log('');
}

// Main function with new robust flow
async function main() {
  console.clear();
  
  const separator = '='.repeat(60);
  log(separator, 'bright');
  log('🚀 EXPENSE TRACKER - DEVELOPMENT ENVIRONMENT V2', 'bright');
  log(separator, 'bright');
  console.log('');
  
  try {
    // Get workspace info
    const workspaceInfo = getWorkspaceInfo();
    const workspaceType = workspaceInfo.isWorktree ? 'worktree' : 'main repository';
    log(`📁 Workspace: ${colors.bright}${workspaceInfo.id}${colors.reset} (${workspaceType})`, 'blue');
    console.log('');
    
    // ROBUST 6-STEP PROCESS
    // STEP 1: Database first (foundation)
    const ports = await getWorkspacePorts(workspaceInfo.id);
    const dbReady = await setupDatabase(workspaceInfo, ports);
    if (!dbReady) throw new Error('Database setup failed');
    
    // STEP 2: Configure ports (stable)
    const confirmedPorts = await configurePorts(workspaceInfo);
    
    // STEP 3: Update all configs (before starting services)
    await updateConfigurations(workspaceInfo, confirmedPorts);
    
    // STEP 4: Start backend (verified)
    const backendProcess = await startBackend(confirmedPorts);
    
    // STEP 5: Start frontend (connected)
    const frontendProcess = await startFrontend(confirmedPorts);
    
    // STEP 6: Test everything (end-to-end)
    const connectivityOk = await testConnectivity(confirmedPorts);
    if (!connectivityOk) {
      log('⚠️  Some connectivity issues detected, but services are running', 'yellow');
    }
    
    // Success!
    showSuccessMessage(confirmedPorts, workspaceInfo);
    
    // Handle cleanup
    const cleanup = () => {
      log('\n🛑 Shutting down development servers...', 'yellow');
      if (backendProcess && !backendProcess.killed) {
        log('  Stopping Backend...', 'gray');
        backendProcess.kill('SIGTERM');
      }
      if (frontendProcess && !frontendProcess.killed) {
        log('  Stopping Frontend...', 'gray');
        frontendProcess.kill('SIGTERM');
      }
      log('👋 Goodbye!', 'green');
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    // Keep alive
    await new Promise(() => {});
    
  } catch (error) {
    log(`\n❌ SETUP FAILED: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the new robust dev environment
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});
