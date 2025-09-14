#!/usr/bin/env node

import { createServer } from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ports = [3000, 5173, 5432];

async function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

async function killPortsIfNeeded() {
  const busyPorts = [];

  for (const port of ports) {
    const isFree = await isPortFree(port);
    if (!isFree) {
      busyPorts.push(port);
    }
  }

  if (busyPorts.length === 0) {
    console.log('✅ Todos los puertos están libres');
    return;
  }

  console.log(`🔄 Liberando puertos ocupados: ${busyPorts.join(', ')}`);

  try {
    await execAsync(`npx kill-port ${busyPorts.join(' ')}`);
    console.log('✅ Puertos liberados exitosamente');
  } catch (error) {
    // Ignoramos el error ya que kill-port puede fallar si no encuentra el proceso
    console.log('✅ Intento de liberación completado');
  }
}

killPortsIfNeeded().catch(console.error);