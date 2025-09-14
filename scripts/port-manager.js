#!/usr/bin/env node

/**
 * Unified Port Manager for Worktrees
 * 
 * This module provides a single source of truth for port allocation
 * across all scripts (worktree-manager.js, setup-worktree.js, dev-env.js)
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import crypto from 'crypto';
import net from 'net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    
    server.on('error', () => resolve(false));
  });
}

/**
 * Find next available port starting from a base port
 */
async function findAvailablePort(startPort, maxRetries = 50) {
  for (let i = 0; i < maxRetries; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) return port;
  }
  throw new Error(`Could not find available port starting from ${startPort}`);
}

/**
 * Generate deterministic base ports from workspace ID
 */
function generateBasePorts(workspaceId) {
  const hash = crypto.createHash('md5').update(workspaceId).digest('hex');
  const baseOffset = parseInt(hash.substring(0, 4), 16) % 1000;

  return {
    dbPort: 5432 + baseOffset,
    backendPort: 3000 + baseOffset,
    frontendPort: 5173 + baseOffset,
  };
}

/**
 * Get or create persistent ports for a workspace
 * This is the SINGLE source of truth for all port assignments
 */
async function getWorkspacePorts(workspaceId, options = {}) {
  const { forceRegenerate = false, checkAvailability = false } = options;

  // For main repository, always use standard ports
  if (workspaceId === 'main' || !workspaceId) {
    return {
      dbPort: 5432,
      backendPort: 3000,
      frontendPort: 5173,
      useStandardDb: true,
      cached: false
    };
  }

  // Check for existing cached ports
  const portsFile = resolve(rootDir, `.ports.${workspaceId}.json`);
  
  if (!forceRegenerate && existsSync(portsFile)) {
    try {
      const cachedPorts = JSON.parse(readFileSync(portsFile, 'utf8'));
      
      // Validate cached ports structure
      if (cachedPorts.dbPort && cachedPorts.backendPort && cachedPorts.frontendPort) {
        return { ...cachedPorts, cached: true };
      }
    } catch (error) {
      console.log(`⚠️  Invalid ports cache for ${workspaceId}, regenerating...`);
    }
  }

  // Generate new ports
  const basePorts = generateBasePorts(workspaceId);
  let finalPorts;

  if (checkAvailability) {
    // Find available ports (for initial setup)
    console.log(`🔍 Finding available ports for ${workspaceId}...`);
    finalPorts = {
      dbPort: await findAvailablePort(basePorts.dbPort),
      backendPort: await findAvailablePort(basePorts.backendPort),
      frontendPort: await findAvailablePort(basePorts.frontendPort),
      useStandardDb: false
    };
  } else {
    // Use calculated ports directly (for consistency)
    finalPorts = {
      ...basePorts,
      useStandardDb: false
    };
  }

  // Cache the ports
  writeFileSync(portsFile, JSON.stringify(finalPorts, null, 2));
  console.log(`💾 Cached ports for ${workspaceId}: DB:${finalPorts.dbPort}, API:${finalPorts.backendPort}, WEB:${finalPorts.frontendPort}`);

  return { ...finalPorts, cached: false };
}

/**
 * Get database name for workspace
 */
function getDatabaseName(workspaceId) {
  if (workspaceId === 'main' || !workspaceId) {
    return 'happy_balance';
  }
  return `happy_balance_${workspaceId.replace(/-/g, '_')}`;
}

/**
 * Get Docker container name for workspace
 */
function getContainerName(workspaceId) {
  if (workspaceId === 'main' || !workspaceId) {
    return 'happy-balance-db-dev';
  }
  return `expense-tracker-db-${workspaceId}`;
}

/**
 * Clear cached ports for a workspace (for cleanup)
 */
function clearWorkspacePorts(workspaceId) {
  const portsFile = resolve(rootDir, `.ports.${workspaceId}.json`);
  if (existsSync(portsFile)) {
    try {
      import('fs').then(fs => {
        fs.unlinkSync(portsFile);
        console.log(`🗑️  Cleared cached ports for ${workspaceId}`);
      });
    } catch (error) {
      console.log(`⚠️  Could not clear ports cache: ${error.message}`);
    }
  }
}

export {
  getWorkspacePorts,
  getDatabaseName,
  getContainerName,
  clearWorkspacePorts,
  isPortAvailable,
  findAvailablePort
};
