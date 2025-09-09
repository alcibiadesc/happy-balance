import { test, expect } from '@playwright/test';

test.describe('Dashboard Analytics - Happy Path', () => {
  test('should display dashboard with key metrics', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check page title and main elements
    await expect(page).toHaveTitle(/Expense Tracker/);
    
    // Verify main dashboard components are visible
    await expect(page.getByTestId('dashboard-metrics')).toBeVisible();
    
    // Check for key metric cards
    await expect(page.getByText(/Total Income|Income/)).toBeVisible();
    await expect(page.getByText(/Total Expenses|Expenses/)).toBeVisible();
    await expect(page.getByText(/Savings|Net Income/)).toBeVisible();
    
    // Verify navigation is present
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check for chart elements (if present)
    const chartElement = page.locator('[data-testid="spending-chart"], canvas, .chart');
    await expect(chartElement.first()).toBeVisible();
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test navigation to different sections
    const navLinks = [
      { text: /Transactions/, url: '/transactions' },
      { text: /Import/, url: '/import' },
      { text: /Categories/, url: '/categories' },
      { text: /Budgets/, url: '/budgets' },
      { text: /Savings/, url: '/savings' }
    ];
    
    for (const link of navLinks) {
      // Click navigation link
      await page.getByRole('link', { name: link.text }).click();
      
      // Verify URL changed
      await expect(page).toHaveURL(new RegExp(link.url));
      
      // Verify page loaded
      await page.waitForLoadState('networkidle');
      
      // Go back to dashboard
      await page.getByRole('link', { name: /Dashboard|Home/ }).click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify mobile navigation (hamburger menu or mobile-specific nav)
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-menu, button[aria-label*="menu"]');
    await expect(mobileNav.first()).toBeVisible();
    
    // Verify metrics are still visible and properly laid out
    await expect(page.getByTestId('dashboard-metrics')).toBeVisible();
    
    // Check that content doesn't overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });
});