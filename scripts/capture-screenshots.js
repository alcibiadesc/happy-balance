import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function captureScreenshots() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  try {
    console.log('📸 Starting screenshot capture...');

    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if we need to login or if we're already logged in
    const loginForm = await page.$('#username');
    if (loginForm) {
      // Login
      await page.fill('#username', 'admin');
      await page.fill('#password', 'admin123');

      // Click submit button
      const submitButton = await page.$('button:has-text("Sign in"), button:has-text("Login")');
      if (submitButton) {
        await submitButton.click();
      }

      // Wait for navigation to dashboard
      await page.waitForURL('http://localhost:5173/', { timeout: 10000 }).catch(() => {});
    } else {
      // Already logged in, go to dashboard
      await page.goto('http://localhost:5173/');
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for animations

    // 1. Dashboard Screenshot
    console.log('📸 Capturing dashboard...');
    await page.screenshot({
      path: join(__dirname, '..', 'static', 'screenshots', 'dashboard.png'),
      fullPage: false
    });

    // 2. Transactions Page
    console.log('📸 Capturing transactions...');
    await page.click('a[href="/transactions"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: join(__dirname, '..', 'static', 'screenshots', 'transactions.png'),
      fullPage: false
    });

    // 3. Categories Page
    console.log('📸 Capturing categories...');
    await page.click('a[href="/categories"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: join(__dirname, '..', 'static', 'screenshots', 'categories.png'),
      fullPage: false
    });

    // 4. Settings Page
    console.log('📸 Capturing settings...');
    await page.click('a[href="/settings"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: join(__dirname, '..', 'static', 'screenshots', 'settings.png'),
      fullPage: false
    });

    // 5. Mobile View - Dashboard
    console.log('📸 Capturing mobile view...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: join(__dirname, '..', 'static', 'screenshots', 'mobile-dashboard.png'),
      fullPage: false
    });

    // 6. Dark Mode
    console.log('📸 Capturing dark mode...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173/settings');
    await page.waitForLoadState('networkidle');

    // Toggle dark mode
    const darkModeToggle = await page.$('button:has-text("Dark mode")');
    if (darkModeToggle) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
    }

    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: join(__dirname, '..', 'static', 'screenshots', 'dark-mode.png'),
      fullPage: false
    });

    console.log('✅ All screenshots captured successfully!');

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
captureScreenshots().catch(console.error);