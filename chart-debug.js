import { chromium } from 'playwright';

async function debugCharts() {
  console.log('🔍 Deep Chart Analysis...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('Chart') || msg.text().includes('data') || msg.text().includes('effect')) {
      console.log('📊 CHART LOG:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');

    // Wait a bit longer for everything to settle
    await page.waitForTimeout(5000);

    console.log('🔍 Checking chart elements...');

    // Check what's actually in the DOM
    const chartSection = await page.locator('.chart-section').count();
    const barChartsSection = await page.locator('.financial-bar-charts').count();
    console.log(`Chart sections: Line=${chartSection}, Bar=${barChartsSection}`);

    // Check canvas elements specifically
    const lineCanvas = await page.locator('.financial-chart canvas').count();
    const barCanvas = await page.locator('.financial-bar-charts canvas').count();
    console.log(`Canvas elements: Line=${lineCanvas}, Bar=${barCanvas}`);

    // Check if charts are visible
    const lineChartVisible = await page.locator('.financial-chart canvas').isVisible().catch(() => false);
    const barChartVisible = await page.locator('.financial-bar-charts canvas').isVisible().catch(() => false);
    console.log(`Charts visible: Line=${lineChartVisible}, Bar=${barChartVisible}`);

    // Check for "No data available" messages
    const noDataCount = await page.locator('text=No data available').count();
    const chartLoadingCount = await page.locator('.chart-loading').count();
    const chartEmptyCount = await page.locator('.chart-empty').count();

    console.log(`Status messages: NoData=${noDataCount}, Loading=${chartLoadingCount}, Empty=${chartEmptyCount}`);

    // Get the actual HTML content of chart containers
    const lineChartHTML = await page.locator('.financial-chart').innerHTML().catch(() => 'NOT FOUND');
    const barChartHTML = await page.locator('.financial-bar-charts .chart-wrapper').innerHTML().catch(() => 'NOT FOUND');

    console.log('📝 Line Chart HTML:', lineChartHTML.substring(0, 200));
    console.log('📝 Bar Chart HTML:', barChartHTML.substring(0, 200));

    // Check if Chart.js is loaded
    const chartJsLoaded = await page.evaluate(() => {
      return typeof window.Chart !== 'undefined';
    });
    console.log(`Chart.js loaded: ${chartJsLoaded}`);

    // Check data in realData
    const realDataInfo = await page.evaluate(() => {
      // Try to access the dashboard component state
      return {
        monthlyTrendLength: window.realData?.monthlyTrend?.length || 'N/A',
        monthlyBarDataLength: window.realData?.monthlyBarData?.length || 'N/A'
      };
    });
    console.log('📊 RealData info:', realDataInfo);

    // Take detailed screenshot
    await page.screenshot({ path: 'chart-debug-full.png', fullPage: true });

    // Screenshot just the chart areas
    try {
      await page.locator('.chart-section').screenshot({ path: 'chart-debug-line.png' });
      await page.locator('.financial-bar-charts').screenshot({ path: 'chart-debug-bar.png' });
    } catch (e) {
      console.log('Could not screenshot chart areas:', e.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugCharts();