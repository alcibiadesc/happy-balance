// Test script to verify hash consistency between frontend and backend
// Run with: node test-duplicate-detection.js

// Frontend hash function (updated version)
function createHashFrontend(date, partner, amount, currency = 'EUR') {
  // Normalize date to ISO format (YYYY-MM-DD)
  const normalizedDate = normalizeDate(date);

  // Normalize merchant name (matches backend Merchant.normalize())
  const normalizedMerchant = partner.trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  // Use absolute amount with currency (matching backend format)
  const normalizedAmount = Math.abs(amount);

  const hashData = `${normalizedDate}_${normalizedMerchant}_${normalizedAmount}_${currency}`;
  let hash = 0;
  for (let i = 0; i < hashData.length; i++) {
    const char = hashData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Helper function to normalize date format
function normalizeDate(dateStr) {
  try {
    // Try to parse the date and return in YYYY-MM-DD format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if can't parse
    }
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr; // Return original if error
  }
}

// Backend hash function simulation
function createHashBackend(date, merchant, amount, currency = 'EUR') {
  // Backend normalization
  const normalizedDate = new Date(date).toISOString().split('T')[0];
  const normalizedMerchant = merchant
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  const hashData = `${normalizedDate}_${normalizedMerchant}_${Math.abs(amount)}_${currency}`;
  let hash = 0;
  for (let i = 0; i < hashData.length; i++) {
    const char = hashData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Test data from CSV
const testData = [
  { date: '2025-01-15', partner: 'Test Store', amount: -50.00 },
  { date: '2025-01-14', partner: 'Supermarket', amount: -30.50 },
  { date: '2025-01-13', partner: 'Salary', amount: 2500.00 }
];

console.log('=== Testing Hash Consistency ===');
console.log('');

for (const tx of testData) {
  const frontendHash = createHashFrontend(tx.date, tx.partner, tx.amount);
  const backendHash = createHashBackend(tx.date, tx.partner, tx.amount);

  console.log(`Transaction: ${tx.date} | ${tx.partner} | ${tx.amount}`);
  console.log(`Frontend Hash: ${frontendHash}`);
  console.log(`Backend Hash:  ${backendHash}`);
  console.log(`Match: ${frontendHash === backendHash ? '✓' : '✗'}`);
  console.log('');
}

console.log('=== Testing Duplicate Detection ===');
console.log('');

// Simulate duplicate detection
const existingHashes = new Set();
const newTransactions = [...testData, ...testData]; // Duplicate the data

for (const tx of newTransactions) {
  const hash = createHashFrontend(tx.date, tx.partner, tx.amount);
  const isDuplicate = existingHashes.has(hash);

  if (!isDuplicate) {
    existingHashes.add(hash);
  }

  console.log(`${tx.date} | ${tx.partner} | ${tx.amount} | Hash: ${hash} | ${isDuplicate ? 'DUPLICATE' : 'NEW'}`);
}

console.log('');
console.log(`Total unique hashes: ${existingHashes.size}`);
console.log(`Total transactions processed: ${newTransactions.length}`);
console.log(`Expected duplicates: ${newTransactions.length - testData.length}`);