#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printBanner() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('🚀 HAPPY BALANCE - DEVELOPMENT MODE', 'cyan'));
  console.log('='.repeat(60));
  console.log(colorize('📦 Starting Docker containers...', 'yellow'));
  console.log('='.repeat(60) + '\n');
}

function printUrls() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('🌐 APPLICATION URLS', 'green'));
  console.log('='.repeat(60));
  console.log(colorize('Frontend (SvelteKit): ', 'bright') + colorize('http://localhost:5173', 'cyan'));
  console.log(colorize('Backend API:          ', 'bright') + colorize('http://localhost:3000', 'cyan'));
  console.log(colorize('Database:            ', 'bright') + colorize('postgresql://localhost:5432/happy_balance', 'cyan'));
  console.log('='.repeat(60));
  console.log(colorize('💡 Tip: Press Ctrl+C to stop all services', 'yellow'));
  console.log('='.repeat(60) + '\n');
}

async function main() {
  printBanner();

  // Ejecutar docker compose
  const dockerProcess = spawn('docker', [
    'compose', 
    '-f', 
    'docker-compose.dev.yml', 
    'up', 
    '--build'
  ], {
    stdio: 'pipe',
    cwd: process.cwd()
  });

  let frontendStarted = false;
  let backendStarted = false;
  let urlsShown = false;

  // Procesar stdout
  dockerProcess.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // Detectar cuando los servicios están listos
    if (output.includes('Frontend server started') || output.includes('Local:') || output.includes('Network:')) {
      frontendStarted = true;
    }
    
    if (output.includes('Backend server started') || output.includes('Server is running on port 3000')) {
      backendStarted = true;
    }

    // Mostrar URLs cuando ambos servicios estén listos
    if (frontendStarted && backendStarted && !urlsShown) {
      setTimeout(() => {
        printUrls();
        urlsShown = true;
      }, 1000);
    }
  });

  // Procesar stderr
  dockerProcess.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output);
  });

  // Manejar cierre del proceso
  dockerProcess.on('close', (code) => {
    console.log(colorize(`\n🛑 Docker process exited with code ${code}`, 'red'));
    process.exit(code);
  });

  // Manejar Ctrl+C
  process.on('SIGINT', () => {
    console.log(colorize('\n🛑 Stopping services...', 'yellow'));
    dockerProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log(colorize('\n🛑 Stopping services...', 'yellow'));
    dockerProcess.kill('SIGTERM');
  });

  // Mostrar URLs después de un tiempo si no se detecta automáticamente
  setTimeout(() => {
    if (!urlsShown) {
      printUrls();
      urlsShown = true;
    }
  }, 15000); // 15 segundos
}

main().catch((error) => {
  console.error(colorize('❌ Error starting development environment:', 'red'), error);
  process.exit(1);
});
