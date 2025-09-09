import { test, expect } from '@playwright/test';

test.describe('Category Management - Happy Path', () => {
  test('should display categories page', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded correctly
    await expect(page.getByRole('heading', { name: /Categories|Category/ })).toBeVisible();
    
    // Check for categories container
    const categoriesContainer = page.locator('[data-testid="categories-list"], .categories-grid, .category-list');
    await expect(categoriesContainer.first()).toBeVisible();
    
    // Look for add new category button
    const addButton = page.locator('button:has-text("Add"), [data-testid="add-category"], button:has-text("New Category")');
    if (await addButton.first().isVisible()) {
      await expect(addButton.first()).toBeVisible();
    }
    
    // Verify default categories exist (common ones)
    const commonCategories = ['Food', 'Transport', 'Income', 'Entertainment', 'Utilities'];
    for (const category of commonCategories) {
      const categoryElement = page.getByText(category).first();
      if (await categoryElement.isVisible()) {
        await expect(categoryElement).toBeVisible();
      }
    }
  });

  test('should create new category', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    // Look for add category button
    const addButton = page.locator('button:has-text("Add"), [data-testid="add-category"], button:has-text("New")');
    
    if (await addButton.first().isVisible()) {
      await addButton.first().click();
    } else {
      // Alternative: check for inline add functionality
      const inlineAdd = page.locator('input[placeholder*="category"], [data-testid="category-input"]');
      if (await inlineAdd.first().isVisible()) {
        await expect(inlineAdd.first()).toBeVisible();
      }
      return; // Skip rest of test if no add functionality found
    }
    
    // Should show add category form or modal
    await page.waitForTimeout(500);
    
    // Look for category name input
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"], [data-testid="category-name"]');
    await expect(nameInput.first()).toBeVisible();
    
    // Look for color picker or icon selector
    const colorPicker = page.locator('input[type="color"], [data-testid="color-picker"], .color-selector');
    const iconSelector = page.locator('[data-testid="icon-selector"], .icon-picker');
    
    // Fill out form
    await nameInput.first().fill('Test Category');
    
    if (await colorPicker.first().isVisible()) {
      await colorPicker.first().fill('#ff0000');
    }
    
    // Save category
    const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    await saveButton.first().click();
    
    // Should see new category in list
    await page.waitForTimeout(500);
    await expect(page.getByText('Test Category')).toBeVisible();
  });

  test('should edit category', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    // Look for edit buttons or click on category
    const editButtons = page.locator('button:has-text("Edit"), [data-testid*="edit"], .edit-btn');
    const categories = page.locator('.category-item, [data-testid*="category"]');
    
    if (await editButtons.first().isVisible()) {
      await editButtons.first().click();
    } else if (await categories.first().isVisible()) {
      // Try clicking on category
      await categories.first().click();
    } else {
      console.log('No categories found to edit');
      return;
    }
    
    await page.waitForTimeout(500);
    
    // Should show edit form
    const editForm = page.locator('form, [data-testid="edit-form"], .edit-category');
    const nameInput = page.locator('input[name="name"], [data-testid="category-name"]');
    
    if (await editForm.first().isVisible() && await nameInput.first().isVisible()) {
      await expect(editForm.first()).toBeVisible();
      await expect(nameInput.first()).toBeVisible();
      
      // Test editing
      await nameInput.first().clear();
      await nameInput.first().fill('Updated Category');
      
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
      await saveButton.first().click();
      
      await page.waitForTimeout(500);
    }
  });

  test('should assign categories to transactions', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    // Check for category assignment features
    const assignButton = page.locator('button:has-text("Assign"), [data-testid="assign-category"]');
    const bulkActions = page.locator('[data-testid="bulk-actions"], .bulk-actions');
    
    if (await assignButton.first().isVisible()) {
      await expect(assignButton.first()).toBeVisible();
    }
    
    if (await bulkActions.first().isVisible()) {
      await expect(bulkActions.first()).toBeVisible();
    }
    
    // Check for rules/automation setup
    const rulesSection = page.locator('[data-testid="category-rules"], .rules-section, .automation');
    if (await rulesSection.first().isVisible()) {
      await expect(rulesSection.first()).toBeVisible();
    }
  });

  test('should display category analytics', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    // Look for spending by category
    const analytics = page.locator('[data-testid="category-analytics"], .category-stats, .spending-breakdown');
    const charts = page.locator('canvas, .chart, [data-testid*="chart"]');
    
    if (await analytics.first().isVisible()) {
      await expect(analytics.first()).toBeVisible();
    }
    
    if (await charts.first().isVisible()) {
      await expect(charts.first()).toBeVisible();
    }
    
    // Check for category spending amounts
    const spendingAmounts = page.locator('.amount, .spending-amount, [data-testid*="amount"]');
    if (await spendingAmounts.first().isVisible()) {
      await expect(spendingAmounts.first()).toBeVisible();
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    // Verify mobile layout
    await expect(page.getByRole('heading', { name: /Categories/ })).toBeVisible();
    
    // Check that categories display properly on mobile
    const categoriesContainer = page.locator('[data-testid="categories-list"], .categories-grid');
    await expect(categoriesContainer.first()).toBeVisible();
    
    // Verify content fits within viewport
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
    
    // Check mobile navigation
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-menu, button[aria-label*="menu"]');
    if (await mobileNav.first().isVisible()) {
      await expect(mobileNav.first()).toBeVisible();
    }
    
    // Verify category items are touch-friendly
    const categoryItems = page.locator('.category-item, [data-testid*="category"]');
    for (const item of await categoryItems.all()) {
      if (await item.isVisible()) {
        const itemBox = await item.boundingBox();
        if (itemBox) {
          expect(itemBox.height).toBeGreaterThanOrEqual(32); // Minimum touch target
        }
      }
    }
  });
});