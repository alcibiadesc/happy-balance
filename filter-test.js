import { chromium } from 'playwright';

async function testFilterChanges() {
  console.log('🔄 Testing Filter Changes...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable detailed console logging
  page.on('console', msg => {
    if (msg.text().includes('Chart') || msg.text().includes('initChart') || msg.text().includes('updating')) {
      console.log('📊 CHART:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');

    console.log('📊 Initial load...');
    await page.waitForTimeout(3000);

    // Check initial state
    let canvasCount = await page.locator('canvas').count();
    let noDataCount = await page.locator('text=No data available').count();
    console.log(`Initial: Canvas=${canvasCount}, NoData=${noDataCount}`);

    // Test multiple filter changes
    const periods = ['month', 'quarter', 'year', 'week'];

    for (const period of periods) {
      console.log(`\n🔄 Testing ${period.toUpperCase()} period...`);

      // Click period button
      await page.locator(`text=${period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : period === 'year' ? 'Año' : 'Semana'}`).click();

      // Wait for loading
      await page.waitForTimeout(2000);

      // Check canvas and data status
      canvasCount = await page.locator('canvas').count();
      noDataCount = await page.locator('text=No data available').count();

      console.log(`After ${period}: Canvas=${canvasCount}, NoData=${noDataCount}`);

      if (noDataCount > 0) {
        console.log(`❌ PROBLEM: ${period} shows "No data available"`);

        // Take screenshot for debugging
        await page.screenshot({ path: `filter-error-${period}.png` });

        // Check what's in the chart containers
        const lineChartContent = await page.locator('.financial-chart').innerHTML();
        const barChartContent = await page.locator('.financial-bar-charts .chart-wrapper').innerHTML();

        console.log(`Line chart content: ${lineChartContent.substring(0, 100)}`);
        console.log(`Bar chart content: ${barChartContent.substring(0, 100)}`);
      } else {
        console.log(`✅ ${period} working correctly`);
      }
    }

    // Test month navigation (offset changes)
    console.log('\n🔄 Testing month navigation...');

    // Go back to month view
    await page.locator('text=Mes').click();
    await page.waitForTimeout(1000);

    // Test different month offsets
    const dropdown = page.locator('.period-select');
    if (await dropdown.count() > 0) {
      for (const offset of ['0', '1', '2']) {
        console.log(`\n📅 Testing month offset ${offset}...`);

        await dropdown.selectOption(offset);
        await page.waitForTimeout(2000);

        canvasCount = await page.locator('canvas').count();
        noDataCount = await page.locator('text=No data available').count();

        console.log(`Offset ${offset}: Canvas=${canvasCount}, NoData=${noDataCount}`);

        if (noDataCount > 0) {
          console.log(`❌ PROBLEM: Month offset ${offset} shows "No data available"`);
          await page.screenshot({ path: `month-offset-error-${offset}.png` });
        } else {
          console.log(`✅ Month offset ${offset} working correctly`);
        }
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'filter-test-final.png', fullPage: true });

    console.log('✅ Filter test completed');

  } catch (error) {
    console.error('❌ Filter test failed:', error);
    await page.screenshot({ path: 'filter-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testFilterChanges();