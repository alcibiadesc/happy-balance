import { chromium } from 'playwright';

async function testChartsDataFlow() {
  console.log('📊 Testing Charts Data Flow...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track console logs for data processing
  page.on('console', msg => {
    if (msg.text().includes('Charts data') ||
        msg.text().includes('Dashboard API response') ||
        msg.text().includes('monthlyTrend') ||
        msg.text().includes('monthlyBarData')) {
      console.log('📊 DATA FLOW:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');

    console.log('🔄 Loading dashboard...');
    await page.waitForTimeout(5000);

    // Check if charts are present and contain data
    const chartStatus = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      const noDataMessages = document.querySelectorAll('.chart-empty, [data-text*="No data"]');

      return {
        canvasCount: canvases.length,
        noDataCount: noDataMessages.length,
        canvasVisible: Array.from(canvases).map(canvas => ({
          visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0,
          width: canvas.offsetWidth,
          height: canvas.offsetHeight
        }))
      };
    });

    console.log('📈 Chart Status:', chartStatus);

    // Test dropdown navigation to see if data updates
    console.log('\n🔄 Testing data updates with dropdown...');

    const dropdown = page.locator('.period-select');
    if (await dropdown.count() > 0) {
      // Change to different month
      await dropdown.selectOption({ index: 1 });
      await page.waitForTimeout(3000);

      const updatedChartStatus = await page.evaluate(() => {
        const canvases = document.querySelectorAll('canvas');
        const noDataMessages = document.querySelectorAll('.chart-empty, [data-text*="No data"]');

        return {
          canvasCount: canvases.length,
          noDataCount: noDataMessages.length
        };
      });

      console.log('📈 Updated Chart Status:', updatedChartStatus);

      if (updatedChartStatus.canvasCount >= 2 && updatedChartStatus.noDataCount === 0) {
        console.log('✅ Charts are updating correctly with new data!');
      } else {
        console.log('❌ Charts are not updating properly');
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'charts-data-test.png', fullPage: true });

    console.log('✅ Charts data flow test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'charts-data-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testChartsDataFlow();