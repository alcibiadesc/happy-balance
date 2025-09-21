import { chromium } from 'playwright';

async function finalChartTest() {
  console.log('🏁 Final Chart Functionality Test...');

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
    console.log(`✅ Initial: Canvas=${canvasCount}, NoData=${noDataCount}`);

    // Test all period buttons with correct Spanish text
    const periodButtons = [
      { text: 'Semana', name: 'week' },
      { text: 'Mes', name: 'month' },
      { text: 'Trimestre', name: 'quarter' },
      { text: 'Año', name: 'year' }
    ];

    for (const period of periodButtons) {
      console.log(`\n🔄 Testing ${period.name.toUpperCase()} period...`);

      try {
        // Find button by text content
        const button = page.locator('.period-button', { hasText: period.text });
        const buttonExists = await button.count();

        if (buttonExists === 0) {
          console.log(`❌ Button "${period.text}" not found`);
          continue;
        }

        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        console.log(`Button "${period.text}": visible=${isVisible}, enabled=${isEnabled}`);

        if (isVisible && isEnabled) {
          // Click the button
          await button.click();

          // Wait for loading and data processing
          await page.waitForTimeout(3000);

          // Check results
          canvasCount = await page.locator('canvas').count();
          noDataCount = await page.locator('text=No data available').count();

          console.log(`After ${period.name}: Canvas=${canvasCount}, NoData=${noDataCount}`);

          if (noDataCount > 0) {
            console.log(`❌ PROBLEM: ${period.name} shows "No data available"`);
            await page.screenshot({ path: `final-error-${period.name}.png` });

            // Get detailed chart state
            const lineChartHTML = await page.locator('.financial-chart').innerHTML().catch(() => 'NOT FOUND');
            const barChartHTML = await page.locator('.financial-bar-charts .chart-wrapper').innerHTML().catch(() => 'NOT FOUND');

            console.log(`Line chart state: ${lineChartHTML.includes('canvas') ? 'HAS CANVAS' : 'NO CANVAS'}`);
            console.log(`Bar chart state: ${barChartHTML.includes('canvas') ? 'HAS CANVAS' : 'NO CANVAS'}`);
          } else {
            console.log(`✅ ${period.name} working correctly - charts showing data`);
            await page.screenshot({ path: `final-success-${period.name}.png` });
          }
        }
      } catch (error) {
        console.log(`❌ Error with ${period.name}: ${error.message}`);
      }
    }

    // Test month dropdown navigation
    console.log('\n🔄 Testing month dropdown navigation...');

    // Ensure we're on month view
    await page.locator('.period-button', { hasText: 'Mes' }).click().catch(() => {});
    await page.waitForTimeout(2000);

    // Test dropdown
    const dropdown = page.locator('.period-select');
    if (await dropdown.count() > 0) {
      console.log('📅 Testing dropdown month navigation...');

      // Test 3 different months
      for (let i = 0; i < 3; i++) {
        const option = dropdown.locator('option').nth(i);
        const optionText = await option.textContent();

        console.log(`\n📅 Testing month: ${optionText}`);

        await dropdown.selectOption({ index: i });
        await page.waitForTimeout(2500);

        canvasCount = await page.locator('canvas').count();
        noDataCount = await page.locator('text=No data available').count();

        console.log(`Month ${i}: Canvas=${canvasCount}, NoData=${noDataCount}`);

        if (noDataCount > 0) {
          console.log(`❌ PROBLEM: Month navigation ${i} shows "No data available"`);
          await page.screenshot({ path: `final-month-error-${i}.png` });
        } else {
          console.log(`✅ Month navigation ${i} working correctly`);
        }
      }
    }

    // Final verification
    console.log('\n🏁 Final verification...');

    // Go back to current month
    await page.locator('.period-button', { hasText: 'Mes' }).click();
    await dropdown.selectOption({ index: 0 }).catch(() => {});
    await page.waitForTimeout(2000);

    canvasCount = await page.locator('canvas').count();
    noDataCount = await page.locator('text=No data available').count();

    console.log(`Final state: Canvas=${canvasCount}, NoData=${noDataCount}`);

    await page.screenshot({ path: 'final-chart-test-complete.png', fullPage: true });

    if (canvasCount >= 2 && noDataCount === 0) {
      console.log('🎉 SUCCESS: Charts are working correctly after filter changes!');
    } else {
      console.log('❌ ISSUE: Charts may still have problems');
    }

  } catch (error) {
    console.error('❌ Final test failed:', error);
    await page.screenshot({ path: 'final-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

finalChartTest();