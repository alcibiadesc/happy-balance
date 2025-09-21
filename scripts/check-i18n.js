#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load translation files
const enTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/i18n/en.json'), 'utf8'));
const esTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/i18n/es.json'), 'utf8'));

// Flatten nested objects to dot notation
function flattenObject(obj, prefix = '') {
  const flattened = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], prefix + key + '.'));
    } else {
      flattened[prefix + key] = obj[key];
    }
  }
  return flattened;
}

const flatEnKeys = flattenObject(enTranslations);
const flatEsKeys = flattenObject(esTranslations);

// Find all Svelte and TypeScript files
function findFiles(dir, extensions = ['.svelte', '.ts', '.js']) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      files.push(...findFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Extract i18n keys from file content
function extractI18nKeys(content) {
  const patterns = [
    /\$t\(['"`]([^'"`]+)['"`]/g,  // $t('key')
    /\{t\(['"`]([^'"`]+)['"`]/g,   // {t('key')}
    /t\(['"`]([^'"`]+)['"`]/g      // t('key')
  ];

  const keys = new Set();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      keys.add(match[1]);
    }
  }
  return Array.from(keys);
}

// Check for missing keys
function checkMissingKeys() {
  const srcDir = path.join(__dirname, '../src');
  const files = findFiles(srcDir);

  const missingKeys = new Set();
  const keyUsage = new Map();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const keys = extractI18nKeys(content);

    for (const key of keys) {
      if (!keyUsage.has(key)) {
        keyUsage.set(key, []);
      }
      keyUsage.get(key).push(file.replace(srcDir, 'src'));

      // Check if key exists in translations
      if (!flatEnKeys[key] || !flatEsKeys[key]) {
        missingKeys.add(key);
      }
    }
  }

  return { missingKeys: Array.from(missingKeys), keyUsage };
}

// Check for unused keys
function checkUnusedKeys() {
  const srcDir = path.join(__dirname, '../src');
  const files = findFiles(srcDir);

  const usedKeys = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const keys = extractI18nKeys(content);
    keys.forEach(key => usedKeys.add(key));
  }

  const unusedEnKeys = Object.keys(flatEnKeys).filter(key => !usedKeys.has(key));
  const unusedEsKeys = Object.keys(flatEsKeys).filter(key => !usedKeys.has(key));

  return { unusedEnKeys, unusedEsKeys };
}

// Check for key mismatches between languages
function checkKeyMismatches() {
  const enKeys = new Set(Object.keys(flatEnKeys));
  const esKeys = new Set(Object.keys(flatEsKeys));

  const onlyInEn = Array.from(enKeys).filter(key => !esKeys.has(key));
  const onlyInEs = Array.from(esKeys).filter(key => !enKeys.has(key));

  return { onlyInEn, onlyInEs };
}

// Main execution
console.log('🔍 Checking i18n implementation...\n');

// Check missing keys
const { missingKeys, keyUsage } = checkMissingKeys();
if (missingKeys.length > 0) {
  console.log('❌ Missing Translation Keys:');
  missingKeys.forEach(key => {
    console.log(`  - ${key}`);
    console.log(`    Used in: ${keyUsage.get(key).join(', ')}`);
  });
  console.log();
}

// Check unused keys
const { unusedEnKeys, unusedEsKeys } = checkUnusedKeys();
if (unusedEnKeys.length > 0) {
  console.log('⚠️  Unused English Keys:');
  unusedEnKeys.forEach(key => console.log(`  - ${key}`));
  console.log();
}

// Check key mismatches
const { onlyInEn, onlyInEs } = checkKeyMismatches();
if (onlyInEn.length > 0 || onlyInEs.length > 0) {
  console.log('🔄 Key Mismatches Between Languages:');
  if (onlyInEn.length > 0) {
    console.log('  Only in English:');
    onlyInEn.forEach(key => console.log(`    - ${key}`));
  }
  if (onlyInEs.length > 0) {
    console.log('  Only in Spanish:');
    onlyInEs.forEach(key => console.log(`    - ${key}`));
  }
  console.log();
}

// Summary
const totalIssues = missingKeys.length + onlyInEn.length + onlyInEs.length;
if (totalIssues === 0) {
  console.log('✅ All i18n keys are properly configured!');
} else {
  console.log(`❌ Found ${totalIssues} i18n issues that need to be fixed.`);
  process.exit(1);
}