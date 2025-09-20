// Test date parsing fix for CSV import

// Test the old way (incorrect)
function parseDateOld(dateStr) {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(
      parseInt(match[1]),
      parseInt(match[2]) - 1,
      parseInt(match[3])
    );
  }
  return null;
}

// Test the new way (correct)
function parseDateNew(dateStr) {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const day = parseInt(match[3]);
    return new Date(Date.UTC(year, month, day, 0, 0, 0));
  }
  return null;
}

// Test with dates from the CSV
const testDates = [
  "2025-08-01",
  "2025-08-15",
  "2025-08-31",
];

console.log("Testing date parsing...\n");

testDates.forEach(dateStr => {
  const oldDate = parseDateOld(dateStr);
  const newDate = parseDateNew(dateStr);

  console.log(`Input: ${dateStr}`);
  console.log(`Old method: ${oldDate?.toDateString()} (${oldDate?.toISOString()})`);
  console.log(`New method: ${newDate?.toDateString()} (${newDate?.toISOString()})`);
  console.log(`Old date parts: Year=${oldDate?.getFullYear()}, Month=${oldDate?.getMonth() + 1}, Day=${oldDate?.getDate()}`);
  console.log(`New date parts: Year=${newDate?.getFullYear()}, Month=${newDate?.getMonth() + 1}, Day=${newDate?.getDate()}`);
  console.log("---");
});