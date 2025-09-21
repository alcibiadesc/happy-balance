import { chromium } from 'playwright';

async function testDashboard() {
  console.log('🚀 Starting Dashboard Tests...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    console.log('📊 Opening dashboard...');
    await page.goto('http://localhost:5184');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');

    // Wait for dashboard data to load
    console.log('⏳ Waiting for dashboard data...');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    // Check if loading is complete
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('.chart-loading');
      return loadingElements.length === 0;
    }, { timeout: 15000 });

    console.log('✅ Dashboard loaded');

    // Check current data
    console.log('📈 Checking charts data...');

    // Check if charts exist and are not showing "No data available"
    const chartExists = await page.locator('.financial-chart canvas').count();
    const barChartExists = await page.locator('.financial-bar-charts canvas').count();

    console.log(`Charts found: Line=${chartExists}, Bar=${barChartExists}`);

    // Check if "No data available" message is shown
    const noDataMessages = await page.locator('text=No data available').count();
    console.log(`"No data available" messages: ${noDataMessages}`);

    if (noDataMessages > 0) {
      console.log('❌ PROBLEM: Charts showing "No data available"');
    } else {
      console.log('✅ Charts have data');
    }

    // Test month navigation
    console.log('🔄 Testing month navigation...');

    // Find the period navigation dropdown
    const dropdown = page.locator('.period-select');

    if (await dropdown.count() > 0) {
      console.log('✅ Period dropdown found');

      // Get current selection
      const currentOption = await dropdown.inputValue();
      console.log(`Current period: ${currentOption}`);

      // Change to different month (offset 1)
      await dropdown.selectOption('1');
      console.log('🔄 Changed to previous month');

      // Wait for data to load
      await page.waitForTimeout(2000);

      // Check if charts still work
      const noDataAfterChange = await page.locator('text=No data available').count();
      console.log(`"No data available" after change: ${noDataAfterChange}`);

      if (noDataAfterChange > 0) {
        console.log('❌ PROBLEM: Charts show "No data available" after month change');
      } else {
        console.log('✅ Charts work after month change');
      }

      // Change back to current month
      await dropdown.selectOption('0');
      console.log('🔄 Changed back to current month');

      await page.waitForTimeout(2000);

      const noDataAfterRevert = await page.locator('text=No data available').count();
      console.log(`"No data available" after revert: ${noDataAfterRevert}`);

    } else {
      console.log('❌ Period dropdown not found');
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'dashboard-test.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard-test.png');

    console.log('✅ Dashboard test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'dashboard-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testDashboard();