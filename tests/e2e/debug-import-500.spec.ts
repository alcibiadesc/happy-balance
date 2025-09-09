import { test, expect } from '@playwright/test';

test('Debug CSV import 500 error', async ({ page }) => {
  // Enable verbose logging
  await page.route('**/*', route => {
    console.log(`Request: ${route.request().method()} ${route.request().url()}`);
    route.continue();
  });

  // Listen to all console logs
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  // Listen to response errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.error(`[HTTP ERROR] ${response.status()} - ${response.url()}`);
    }
  });

  console.log('Navigating to import page...');
  await page.goto('http://localhost:5179/import');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  console.log('Page loaded successfully');

  // Create a simple test CSV content
  const csvContent = `Booking Date,Partner Name,Amount (EUR),Payment reference
2023-12-01,Test Shop,-10.50,TEST-REF-001
2023-12-02,Salary,2000.00,SALARY-DEC`;

  // Create a file for upload
  console.log('Creating test CSV file...');
  const fileBuffer = Buffer.from(csvContent);

  // Look for file input
  console.log('Looking for file input...');
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeVisible();

  // Upload the file
  console.log('Uploading file...');
  await fileInput.setInputFiles({
    name: 'test-import.csv',
    mimeType: 'text/csv',
    buffer: fileBuffer
  });

  // Look for "Parse CSV" or similar button
  console.log('Looking for parse/next button...');
  
  // Wait a moment for file to be processed
  await page.waitForTimeout(1000);

  // Try to find and click the next/parse button
  const buttons = [
    'text=Parse CSV',
    'text=Next',
    'text=Continue', 
    'text=Validate',
    'button[type="submit"]',
    '.btn-primary'
  ];

  for (const buttonSelector of buttons) {
    const button = page.locator(buttonSelector);
    if (await button.isVisible()) {
      console.log(`Found button: ${buttonSelector}`);
      console.log('Clicking button...');
      await button.click();
      break;
    }
  }

  // Wait and watch for any errors
  console.log('Waiting for processing...');
  await page.waitForTimeout(3000);

  // Try to find import/confirm button if we get to that step
  const importButtons = [
    'text=Import',
    'text=Confirm Import',
    'text=Complete Import',
    'button:has-text("Import")'
  ];

  for (const buttonSelector of importButtons) {
    const button = page.locator(buttonSelector);
    if (await button.isVisible()) {
      console.log(`Found import button: ${buttonSelector}`);
      console.log('Clicking import button...');
      
      // Monitor network requests during import
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/transactions/import') && response.request().method() === 'POST'
      );
      
      await button.click();
      
      try {
        const response = await responsePromise;
        console.log(`Import response status: ${response.status()}`);
        
        if (response.status() >= 400) {
          const responseText = await response.text();
          console.error(`Import API Error: ${response.status()}`);
          console.error(`Response body: ${responseText}`);
        } else {
          const responseJson = await response.json();
          console.log(`Import API Success:`, responseJson);
        }
      } catch (error) {
        console.error('Failed to get import response:', error);
      }
      
      break;
    }
  }

  // Wait a bit more to see what happens
  await page.waitForTimeout(2000);

  // Take a screenshot at the end
  await page.screenshot({ path: 'import-debug-screenshot.png', fullPage: true });
  console.log('Screenshot saved as import-debug-screenshot.png');
});