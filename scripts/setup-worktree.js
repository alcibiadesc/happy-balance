#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

function runCommand(command, options = {}) {
  try {
    console.log(`\n🔧 Ejecutando: ${command}`);
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options
    });
    return result;
  } catch (error) {
    console.error(`❌ Error ejecutando: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function setupWorktree(worktreePath) {
  if (!existsSync(worktreePath)) {
    console.error(`❌ El worktree ${worktreePath} no existe`);
    process.exit(1);
  }

  console.log(`\n🚀 Configurando worktree: ${worktreePath}`);

  // Cambiar al directorio del worktree
  process.chdir(worktreePath);

  // Verificar que estamos en un worktree
  const currentDir = process.cwd();
  console.log(`📁 Directorio actual: ${currentDir}`);

  // Instalar dependencias del frontend y backend
  console.log('\n📦 Instalando dependencias...');
  runCommand('pnpm worktree:setup');

  console.log('\n✅ Worktree configurado correctamente!');
  console.log(`💡 Ahora puedes ejecutar "pnpm run dev" en ${worktreePath}`);
}

// Obtener el path del worktree como argumento
const worktreePath = process.argv[2];

if (!worktreePath) {
  console.error('❌ Uso: node scripts/setup-worktree.js <path-to-worktree>');
  console.log('💡 Ejemplo: node scripts/setup-worktree.js /tmp/vibe-kanban/worktrees/mi-worktree');
  process.exit(1);
}

setupWorktree(worktreePath);