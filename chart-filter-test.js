import { chromium } from 'playwright';

async function testChartFilters() {
  console.log('🔄 Testing Chart Filter Changes...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable detailed console logging
  page.on('console', msg => {
    if (msg.text().includes('Chart') || msg.text().includes('initChart') || msg.text().includes('effect')) {
      console.log('📊 CHART:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');

    console.log('📊 Initial load complete...');
    await page.waitForTimeout(3000);

    // Check initial state
    let canvasCount = await page.locator('canvas').count();
    let noDataCount = await page.locator('text=No data available').count();
    console.log(`Initial: Canvas=${canvasCount}, NoData=${noDataCount}`);

    // Take initial screenshot
    await page.screenshot({ path: 'chart-filter-initial.png', fullPage: true });

    // Test period button clicks (not dropdown navigation)
    const periodButtons = [
      { selector: '.period-button[class*="active"]', name: 'month (current)' },
      { selector: '.period-button:has-text("Semana")', name: 'week' },
      { selector: '.period-button:has-text("Trimestre")', name: 'quarter' },
      { selector: '.period-button:has-text("Año")', name: 'year' }
    ];

    for (const period of periodButtons) {
      console.log(`\n🔄 Testing ${period.name.toUpperCase()} period...`);

      try {
        // Check if button exists and is visible
        const buttonExists = await page.locator(period.selector).count();
        if (buttonExists === 0) {
          console.log(`❌ Button not found: ${period.selector}`);
          continue;
        }

        const isVisible = await page.locator(period.selector).isVisible();
        console.log(`Button visible: ${isVisible}`);

        if (isVisible) {
          // Click the button
          await page.locator(period.selector).click();

          // Wait for loading to complete
          await page.waitForTimeout(3000);

          // Check results
          canvasCount = await page.locator('canvas').count();
          noDataCount = await page.locator('text=No data available').count();

          console.log(`After ${period.name}: Canvas=${canvasCount}, NoData=${noDataCount}`);

          if (noDataCount > 0) {
            console.log(`❌ PROBLEM: ${period.name} shows "No data available"`);
            await page.screenshot({ path: `chart-filter-error-${period.name}.png` });

            // Check chart container content
            const lineChartHTML = await page.locator('.financial-chart').innerHTML().catch(() => 'NOT FOUND');
            const barChartHTML = await page.locator('.financial-bar-charts .chart-wrapper').innerHTML().catch(() => 'NOT FOUND');

            console.log(`Line chart: ${lineChartHTML.substring(0, 150)}...`);
            console.log(`Bar chart: ${barChartHTML.substring(0, 150)}...`);
          } else {
            console.log(`✅ ${period.name} working correctly`);
            await page.screenshot({ path: `chart-filter-success-${period.name}.png` });
          }
        }
      } catch (error) {
        console.log(`❌ Error with ${period.name}: ${error.message}`);
      }
    }

    // Test dropdown navigation for month
    console.log('\n🔄 Testing dropdown navigation...');

    // Make sure we're on month view
    await page.locator('.period-button:has-text("Mes")').click().catch(() => {});
    await page.waitForTimeout(1000);

    // Test dropdown options
    const dropdown = page.locator('.period-select');
    const dropdownExists = await dropdown.count();

    if (dropdownExists > 0) {
      console.log('Dropdown found, testing month navigation...');

      // Get available options
      const options = await dropdown.locator('option').count();
      console.log(`Found ${options} dropdown options`);

      // Test first few options
      for (let i = 0; i < Math.min(3, options); i++) {
        const optionText = await dropdown.locator('option').nth(i).textContent();
        console.log(`\n📅 Testing option ${i}: ${optionText}`);

        await dropdown.selectOption({ index: i });
        await page.waitForTimeout(2000);

        canvasCount = await page.locator('canvas').count();
        noDataCount = await page.locator('text=No data available').count();

        console.log(`Option ${i}: Canvas=${canvasCount}, NoData=${noDataCount}`);

        if (noDataCount > 0) {
          console.log(`❌ PROBLEM: Option ${i} shows "No data available"`);
          await page.screenshot({ path: `chart-dropdown-error-${i}.png` });
        } else {
          console.log(`✅ Option ${i} working correctly`);
        }
      }
    } else {
      console.log('No dropdown found');
    }

    // Final screenshot
    await page.screenshot({ path: 'chart-filter-final.png', fullPage: true });

    console.log('✅ Chart filter test completed');

  } catch (error) {
    console.error('❌ Chart filter test failed:', error);
    await page.screenshot({ path: 'chart-filter-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testChartFilters();