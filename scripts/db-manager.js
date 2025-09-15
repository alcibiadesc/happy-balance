#!/usr/bin/env node

/**
 * 🗄️ Database Manager
 * Simple and efficient database management for development
 */

import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  mainDb: 'happy_balance'
};

/**
 * Check if PostgreSQL is running
 */
async function isPostgresRunning() {
  try {
    await execAsync(`docker ps --format "table {{.Names}}" | grep -q expense-tracker-db`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Start PostgreSQL container
 */
async function startPostgres() {

  const dockerCommand = `
    docker run -d \
      --name expense-tracker-db \
      -e POSTGRES_USER=${DB_CONFIG.user} \
      -e POSTGRES_PASSWORD=${DB_CONFIG.password} \
      -e POSTGRES_DB=${DB_CONFIG.mainDb} \
      -p ${DB_CONFIG.port}:5432 \
      -v expense-tracker-db:/var/lib/postgresql/data \
      postgres:17-alpine
  `.trim();

  try {
    await execAsync(dockerCommand);

    // Wait for database to be ready
    await waitForDatabase();

  } catch (error) {
    if (error.message.includes('already in use')) {
    } else {
      throw error;
    }
  }
}

/**
 * Wait for database to be ready
 */
async function waitForDatabase(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await execAsync(`docker exec expense-tracker-db pg_isready -U ${DB_CONFIG.user}`);
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Database failed to start in time');
}

/**
 * Create database for workspace
 */
async function createWorkspaceDatabase(workspaceName) {
  const dbName = workspaceName === 'main'
    ? DB_CONFIG.mainDb
    : `${DB_CONFIG.mainDb}_${workspaceName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;


  try {
    const createDbCommand = `docker exec expense-tracker-db psql -U ${DB_CONFIG.user} -c "CREATE DATABASE ${dbName};"`;
    await execAsync(createDbCommand);
  } catch (error) {
    if (error.message.includes('already exists')) {
    } else {
      console.error(`⚠️ Warning: ${error.message}`);
    }
  }

  return dbName;
}

/**
 * Stop PostgreSQL container
 */
async function stopPostgres() {
  try {
    await execAsync('docker stop expense-tracker-db');
    await execAsync('docker rm expense-tracker-db');
  } catch (error) {
  }
}

/**
 * Reset database
 */
async function resetDatabase(dbName) {

  try {
    const dropCommand = `docker exec expense-tracker-db psql -U ${DB_CONFIG.user} -c "DROP DATABASE IF EXISTS ${dbName};"`;
    const createCommand = `docker exec expense-tracker-db psql -U ${DB_CONFIG.user} -c "CREATE DATABASE ${dbName};"`;

    await execAsync(dropCommand);
    await execAsync(createCommand);
  } catch (error) {
    console.error(`❌ Reset failed: ${error.message}`);
  }
}

export {
  isPostgresRunning,
  startPostgres,
  stopPostgres,
  createWorkspaceDatabase,
  resetDatabase,
  waitForDatabase,
  DB_CONFIG
};

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'start':
      startPostgres().catch(console.error);
      break;
    case 'stop':
      stopPostgres().catch(console.error);
      break;
    case 'reset':
      const dbName = process.argv[3] || DB_CONFIG.mainDb;
      resetDatabase(dbName).catch(console.error);
      break;
    default:
  }
}