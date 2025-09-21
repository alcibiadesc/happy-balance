import { chromium } from 'playwright';

async function simpleDashboardTest() {
  console.log('🎯 Simple Dashboard Test...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track API calls
  page.on('response', response => {
    if (response.url().includes('metrics/dashboard')) {
      console.log(`📡 API Response: ${response.status()} - ${response.url()}`);
    }
  });

  // Track console logs
  page.on('console', msg => {
    if (msg.text().includes('Dashboard API response') || msg.text().includes('Error')) {
      console.log('💬 Console:', msg.text().substring(0, 100) + '...');
    }
  });

  try {
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');

    console.log('📊 Page loaded, waiting for data...');
    await page.waitForTimeout(4000);

    // Check if charts are present
    const canvasCount = await page.locator('canvas').count();
    const noDataMessages = await page.locator('text=No data available').count();

    console.log(`📈 Dashboard state: ${canvasCount} charts, ${noDataMessages} "no data" messages`);

    if (canvasCount >= 2 && noDataMessages === 0) {
      console.log('✅ Dashboard is working correctly!');
    } else {
      console.log('❌ Dashboard has issues');
    }

    // Test month navigation
    console.log('\n🔄 Testing month navigation...');

    const dropdown = page.locator('.period-select');
    if (await dropdown.count() > 0) {
      // Get current option
      const currentOption = await dropdown.inputValue();
      console.log(`Current period: option ${currentOption}`);

      // Change to next option
      const options = await dropdown.locator('option').count();
      if (options > 1) {
        await dropdown.selectOption({ index: 1 });
        await page.waitForTimeout(3000);

        const newCanvasCount = await page.locator('canvas').count();
        const newNoDataMessages = await page.locator('text=No data available').count();

        console.log(`📈 After change: ${newCanvasCount} charts, ${newNoDataMessages} "no data" messages`);

        if (newCanvasCount >= 2 && newNoDataMessages === 0) {
          console.log('✅ Month navigation works correctly!');
        } else {
          console.log('❌ Month navigation has issues');
        }
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'simple-dashboard-test.png', fullPage: true });

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'simple-dashboard-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

simpleDashboardTest();