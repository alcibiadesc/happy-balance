// Test CSV parsing with the fixed date logic
import fs from 'fs';

// Simulate the frontend CSV parser
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      i++;
    } else {
      current += char;
      i++;
    }
  }

  result.push(current.trim());
  return result;
}

function parseDate(dateStr) {
  if (!dateStr) return null;

  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // YYYY-MM-DD - Use UTC to avoid timezone issues
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        return new Date(Date.UTC(year, month, day, 0, 0, 0));
      } else {
        // DD/MM/YYYY or DD-MM-YYYY
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        return new Date(Date.UTC(year, month, day, 0, 0, 0));
      }
    }
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Read and parse ejemplo.csv
const csvContent = fs.readFileSync('ejemplo.csv', 'utf-8');
const lines = csvContent.split("\n").filter((line) => line.trim());

console.log(`Total lines in CSV: ${lines.length}`);
console.log(`Data rows: ${lines.length - 1}`);
console.log("\nParsing dates from CSV...\n");

// Parse header
const headers = parseCSVLine(lines[0]);
console.log("Headers:", headers);

// Find date column index
const dateIndex = headers.findIndex(h => /booking\s*date|fecha\s*reserva|date|fecha/i.test(h));
const merchantIndex = headers.findIndex(h => /partner\s*name|nombre\s*socio|beneficiario|partner|merchant/i.test(h));
const amountIndex = headers.findIndex(h => /amount.*eur|importe.*eur|cantidad|amount|importe/i.test(h));

console.log(`\nDate column index: ${dateIndex}`);
console.log(`Merchant column index: ${merchantIndex}`);
console.log(`Amount column index: ${amountIndex}`);

// Parse first 10 transactions
console.log("\nFirst 10 transactions:");
console.log("========================");

for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
  const values = parseCSVLine(lines[i]);
  const date = parseDate(values[dateIndex]);
  const merchant = values[merchantIndex]?.replace(/^"|"$/g, '').trim() || 'Unknown';
  const amount = values[amountIndex] || '0';

  console.log(`Row ${i}:`);
  console.log(`  Date string: "${values[dateIndex]}"`);
  console.log(`  Parsed date: ${date ? date.toDateString() : 'NULL'}`);
  console.log(`  ISO date: ${date ? date.toISOString().split('T')[0] : 'NULL'}`);
  console.log(`  Merchant: ${merchant}`);
  console.log(`  Amount: ${amount}`);
}

// Count transactions by month
const monthCounts = {};
for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  const date = parseDate(values[dateIndex]);
  if (date) {
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
  }
}

console.log("\nTransactions by month:");
console.log("======================");
Object.entries(monthCounts).sort().forEach(([month, count]) => {
  console.log(`${month}: ${count} transactions`);
});