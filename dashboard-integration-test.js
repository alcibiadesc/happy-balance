import { chromium } from 'playwright';

async function testDashboardIntegration() {
  console.log('🚀 Testing Dashboard Integration with New API...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging for errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Error') || msg.text().includes('Failed')) {
      console.log('❌ CONSOLE ERROR:', msg.text());
    } else if (msg.text().includes('metrics/dashboard') || msg.text().includes('Dashboard API')) {
      console.log('📊 API CALL:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');

    console.log('📊 Initial load complete...');
    await page.waitForTimeout(3000);

    // Check if dashboard loads with data
    const initialMetrics = await page.evaluate(() => {
      const incomeElement = document.querySelector('[data-testid="income-amount"], .metric-card:has-text("Income") .metric-value');
      const expensesElement = document.querySelector('[data-testid="expenses-amount"], .metric-card:has-text("Expenses") .metric-value');
      const balanceElement = document.querySelector('[data-testid="balance-amount"], .metric-card:has-text("Balance") .metric-value');

      return {
        income: incomeElement?.textContent || 'NOT_FOUND',
        expenses: expensesElement?.textContent || 'NOT_FOUND',
        balance: balanceElement?.textContent || 'NOT_FOUND'
      };
    });

    console.log('💰 Initial metrics:', initialMetrics);

    // Check charts
    let canvasCount = await page.locator('canvas').count();
    let noDataCount = await page.locator('text=No data available').count();
    console.log(`📈 Charts: Canvas=${canvasCount}, NoData=${noDataCount}`);

    if (canvasCount >= 2 && noDataCount === 0) {
      console.log('✅ Initial dashboard load: SUCCESS');
    } else {
      console.log('❌ Initial dashboard load: FAILED');
    }

    // Test different periods
    console.log('\n🔄 Testing period changes...');

    // Test dropdown navigation (month changes)
    const dropdown = page.locator('.period-select');
    if (await dropdown.count() > 0) {
      console.log('📅 Testing month navigation...');

      const initialOption = await dropdown.locator('option').first().textContent();
      console.log(`Starting with: ${initialOption}`);

      // Select second option
      await dropdown.selectOption({ index: 1 });
      await page.waitForTimeout(2000);

      const secondMetrics = await page.evaluate(() => {
        const incomeElement = document.querySelector('[data-testid="income-amount"], .metric-card:has-text("Income") .metric-value');
        const expensesElement = document.querySelector('[data-testid="expenses-amount"], .metric-card:has-text("Expenses") .metric-value');

        return {
          income: incomeElement?.textContent || 'NOT_FOUND',
          expenses: expensesElement?.textContent || 'NOT_FOUND'
        };
      });

      console.log('💰 Second period metrics:', secondMetrics);

      canvasCount = await page.locator('canvas').count();
      noDataCount = await page.locator('text=No data available').count();
      console.log(`📈 Charts after change: Canvas=${canvasCount}, NoData=${noDataCount}`);

      // Check if data actually changed
      const dataChanged = initialMetrics.income !== secondMetrics.income ||
                         initialMetrics.expenses !== secondMetrics.expenses;

      if (dataChanged) {
        console.log('✅ Period navigation: Data is changing correctly');
      } else {
        console.log('⚠️  Period navigation: Data might not be changing (could be legitimate if data is same)');
      }

      if (canvasCount >= 2 && noDataCount === 0) {
        console.log('✅ Charts after period change: Working correctly');
      } else {
        console.log('❌ Charts after period change: Failed');
      }
    }

    // Test API directly to validate backend
    console.log('\n🔍 Validating backend API...');

    const apiTests = [
      { period: 'month', offset: 0, name: 'Current Month' },
      { period: 'month', offset: 1, name: 'Previous Month' },
      { period: 'week', offset: 0, name: 'Current Week' },
      { period: 'quarter', offset: 0, name: 'Current Quarter' }
    ];

    for (const test of apiTests) {
      const apiResponse = await page.evaluate(async (testParams) => {
        try {
          const response = await fetch(`http://localhost:3004/api/metrics/dashboard?period=${testParams.period}&periodOffset=${testParams.offset}`);
          const data = await response.json();
          return {
            success: data.success,
            hasData: !!(data.data?.summary?.totalIncome?._amount !== undefined),
            income: data.data?.summary?.totalIncome?._amount || 0,
            trends: data.data?.monthlyTrend?.length || 0
          };
        } catch (error) {
          return { error: error.message };
        }
      }, test);

      if (apiResponse.success && apiResponse.hasData) {
        console.log(`✅ ${test.name}: API working (Income: €${apiResponse.income}, Trends: ${apiResponse.trends})`);
      } else {
        console.log(`❌ ${test.name}: API failed`, apiResponse);
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'dashboard-integration-test.png', fullPage: true });

    console.log('\n🎉 Dashboard integration test completed!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    await page.screenshot({ path: 'dashboard-integration-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testDashboardIntegration();