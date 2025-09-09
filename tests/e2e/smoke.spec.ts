import { test, expect } from '@playwright/test';

test.describe('Smoke Test - Current App State', () => {
  test('take screenshot of homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'test-results/homepage-screenshot.png', 
      fullPage: true 
    });
    
    // Log page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page Title: ${title}`);
    console.log(`Page URL: ${url}`);
    
    // Log all visible text on the page
    const bodyText = await page.locator('body').textContent();
    console.log(`Page Content Preview: ${bodyText?.substring(0, 500)}...`);
    
    // Check if basic elements exist
    const hasNavigation = await page.locator('nav, header, [role="navigation"]').count();
    const hasMainContent = await page.locator('main, [role="main"], .main-content').count();
    const hasButtons = await page.locator('button, [role="button"]').count();
    const hasLinks = await page.locator('a[href]').count();
    
    console.log(`Navigation elements: ${hasNavigation}`);
    console.log(`Main content areas: ${hasMainContent}`);
    console.log(`Interactive buttons: ${hasButtons}`);
    console.log(`Links: ${hasLinks}`);
    
    // Basic assertion that page loaded
    expect(title).toBeTruthy();
    expect(bodyText).toBeTruthy();
  });

  test('take screenshots of key pages', async ({ page }) => {
    const pages = [
      { path: '/transactions', name: 'transactions' },
      { path: '/categories', name: 'categories' },
      { path: '/import', name: 'import' },
      { path: '/budgets', name: 'budgets' },
      { path: '/savings', name: 'savings' },
    ];

    for (const pageInfo of pages) {
      try {
        await page.goto(pageInfo.path);
        await page.waitForTimeout(2000);
        await page.screenshot({ 
          path: `test-results/${pageInfo.name}-screenshot.png`, 
          fullPage: true 
        });
        console.log(`✓ Screenshot taken for ${pageInfo.name}`);
      } catch (error) {
        console.log(`✗ Failed to screenshot ${pageInfo.name}: ${error}`);
      }
    }
  });
});