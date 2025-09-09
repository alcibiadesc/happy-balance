import { test, expect } from '@playwright/test';

test('Debug CSV import 500 error - simplified', async ({ page }) => {
  console.log('=== STARTING IMPORT DEBUG TEST ===');

  // Enable verbose logging
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  page.on('response', response => {
    console.log(`[HTTP] ${response.status()} ${response.url()}`);
    if (response.status() >= 400) {
      response.text().then(body => {
        console.error(`[HTTP ERROR BODY] ${body}`);
      });
    }
  });

  console.log('Navigating to import page...');
  
  try {
    await page.goto('http://localhost:5179/import', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ Page loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load page:', error);
    return;
  }

  // Take initial screenshot
  await page.screenshot({ path: 'debug-step1-page-loaded.png', fullPage: true });

  // Wait a moment for any dynamic content
  await page.waitForTimeout(2000);

  // Check if we can see the upload form
  const fileInput = page.locator('input[type="file"]');
  const isFileInputVisible = await fileInput.isVisible();
  console.log(`File input visible: ${isFileInputVisible}`);

  if (isFileInputVisible) {
    console.log('Creating test CSV file...');
    const csvContent = `Booking Date,Partner Name,Amount (EUR),Payment reference
2023-12-01,Test Shop,-10.50,TEST-REF-001`;

    console.log('Uploading file...');
    await fileInput.setInputFiles({
      name: 'test-debug.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await page.screenshot({ path: 'debug-step2-file-uploaded.png', fullPage: true });
    console.log('✅ File uploaded');

    // Wait for processing and look for any buttons that appear
    await page.waitForTimeout(2000);

    // Try to find any clickable buttons
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on page`);

    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      if (isVisible && isEnabled) {
        const text = await button.textContent();
        console.log(`Button ${i}: "${text}" (visible: ${isVisible}, enabled: ${isEnabled})`);
      }
    }

    // Look for specific button texts and click the first relevant one
    const buttonSelectors = [
      'button:has-text("Parse")', 
      'button:has-text("Next")', 
      'button:has-text("Continue")',
      'button:has-text("Validate")',
      '.btn-primary:visible'
    ];

    let foundButton = false;
    for (const selector of buttonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          const buttonText = await button.textContent();
          console.log(`Found button: "${buttonText}" with selector: ${selector}`);
          console.log('Clicking button...');
          
          await button.click();
          foundButton = true;
          
          // Wait and observe what happens
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'debug-step3-after-first-click.png', fullPage: true });
          
          break;
        }
      } catch (error) {
        // Button not found, continue
        console.log(`Button not found with selector: ${selector}`);
      }
    }

    if (!foundButton) {
      console.log('No clickable buttons found, waiting to see what happens...');
      await page.waitForTimeout(5000);
    }

    // Look for import/confirm buttons
    const importSelectors = [
      'button:has-text("Import")',
      'button:has-text("Confirm")',
      'button:has-text("Complete")',
      'button:has-text("Submit")'
    ];

    for (const selector of importSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          const buttonText = await button.textContent();
          console.log(`Found import button: "${buttonText}"`);
          
          // Set up response monitoring
          const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/transactions/import'),
            { timeout: 10000 }
          );
          
          console.log('Clicking import button...');
          await button.click();
          
          try {
            const response = await responsePromise;
            console.log(`Import API response: ${response.status()}`);
            
            if (response.status() >= 400) {
              const responseBody = await response.text();
              console.error(`❌ API ERROR ${response.status()}:`);
              console.error(responseBody);
            } else {
              console.log('✅ API call successful');
              const responseBody = await response.json();
              console.log('Response:', JSON.stringify(responseBody, null, 2));
            }
          } catch (error) {
            console.error('Failed to capture API response:', error);
          }
          
          break;
        }
      } catch (error) {
        console.log(`Import button not found: ${selector}`);
      }
    }
  } else {
    console.error('❌ File input not found on page');
  }

  // Final wait and screenshot
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug-final-state.png', fullPage: true });
  
  console.log('=== DEBUG TEST COMPLETED ===');
  console.log('Screenshots saved:');
  console.log('- debug-step1-page-loaded.png');
  console.log('- debug-step2-file-uploaded.png');
  console.log('- debug-step3-after-first-click.png');
  console.log('- debug-final-state.png');
});