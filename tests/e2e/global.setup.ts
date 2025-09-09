import { test as setup } from '@playwright/test';

/**
 * Global setup for all tests
 * This runs once before all tests
 */
setup('global setup', async ({ page }) => {
  // Navigate to the application to warm it up
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for the app to initialize
  await page.waitForTimeout(3000);
  
  // Optionally: Set up any test data, authentication, etc.
  console.log('🎭 Playwright setup completed - App is ready for testing');
});