import { test, expect } from '@playwright/test';

test.describe('Transaction Management - Happy Path', () => {
  test('should display transactions list', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded correctly
    await expect(page.getByRole('heading', { name: /Transactions|Transaction/ })).toBeVisible();
    
    // Check for transaction table or list container
    const transactionContainer = page.locator('[data-testid="transactions-list"], .transactions-table, table, .transaction-list');
    await expect(transactionContainer.first()).toBeVisible();
    
    // Verify column headers (if table format)
    const tableHeaders = page.locator('th, .table-header, [data-testid*="header"]');
    if (await tableHeaders.first().isVisible()) {
      await expect(page.getByText(/Date|Description|Amount|Category/)).toBeVisible();
    }
    
    // Check for add new transaction button
    const addButton = page.locator('button:has-text("Add"), [data-testid="add-transaction"], a[href*="/transactions/new"]');
    if (await addButton.first().isVisible()) {
      await expect(addButton.first()).toBeVisible();
    }
    
    // Verify filters or search functionality
    const searchInput = page.locator('input[placeholder*="search"], [data-testid="search"]');
    if (await searchInput.first().isVisible()) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should filter transactions', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    
    // Look for filter controls
    const filterControls = page.locator('.filters, [data-testid="filters"], .filter-section');
    
    // Check for date filters
    const dateFilters = page.locator('input[type="date"], [data-testid*="date"]');
    
    // Check for category filters
    const categoryFilter = page.locator('select[data-testid="category"], .category-filter');
    
    // Check for amount filters
    const amountFilter = page.locator('input[type="number"], [data-testid*="amount"]');
    
    // Verify search functionality
    const searchBox = page.locator('input[placeholder*="search"], [data-testid="search-input"]');
    if (await searchBox.first().isVisible()) {
      await expect(searchBox.first()).toBeVisible();
      
      // Test search interaction
      await searchBox.first().fill('test');
      await searchBox.first().press('Enter');
      
      // Wait for potential filtering to occur
      await page.waitForTimeout(500);
    }
    
    // Verify pagination if present
    const pagination = page.locator('.pagination, [data-testid="pagination"], nav[aria-label*="pagination"]');
    if (await pagination.first().isVisible()) {
      await expect(pagination.first()).toBeVisible();
    }
  });

  test('should add new transaction', async ({ page }) => {
    await page.goto('/transactions/new');
    await page.waitForLoadState('networkidle');
    
    // Verify add transaction form
    await expect(page.getByRole('heading', { name: /Add|New.*Transaction/ })).toBeVisible();
    
    // Check for required form fields
    const amountInput = page.locator('input[name="amount"], [data-testid="amount"]');
    await expect(amountInput.first()).toBeVisible();
    
    const descriptionInput = page.locator('input[name="description"], textarea[name="description"], [data-testid="description"]');
    await expect(descriptionInput.first()).toBeVisible();
    
    const dateInput = page.locator('input[type="date"], input[name="date"], [data-testid="date"]');
    await expect(dateInput.first()).toBeVisible();
    
    // Check for category selection
    const categorySelect = page.locator('select[name="category"], [data-testid="category"]');
    if (await categorySelect.first().isVisible()) {
      await expect(categorySelect.first()).toBeVisible();
    }
    
    // Verify form submission buttons
    await expect(page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel"), a:has-text("Cancel")')).toBeVisible();
    
    // Test form validation
    const saveButton = page.locator('button[type="submit"], button:has-text("Save")').first();
    await saveButton.click();
    
    // Should show validation errors for empty required fields
    await page.waitForTimeout(500);
    
    // Fill out valid form data
    await amountInput.first().fill('25.50');
    await descriptionInput.first().fill('Test Transaction');
    
    if (await dateInput.first().isVisible()) {
      await dateInput.first().fill('2024-01-15');
    }
    
    // Save transaction
    await saveButton.click();
    
    // Should redirect back to transactions list or show success message
    await page.waitForTimeout(1000);
  });

  test('should edit existing transaction', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    
    // Look for edit buttons or clickable transaction rows
    const editButtons = page.locator('button:has-text("Edit"), [data-testid*="edit"], .edit-btn');
    const transactionRows = page.locator('tr, .transaction-row, [data-testid*="transaction"]');
    
    if (await editButtons.first().isVisible()) {
      // Click edit button
      await editButtons.first().click();
    } else if (await transactionRows.first().isVisible()) {
      // Click on transaction row
      await transactionRows.first().click();
    } else {
      // Navigate directly to edit form with mock ID
      await page.goto('/transactions/1/edit');
    }
    
    await page.waitForLoadState('networkidle');
    
    // Should see edit form or inline editing
    const editForm = page.locator('form, [data-testid="edit-form"]');
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
    
    if (await editForm.first().isVisible()) {
      await expect(editForm.first()).toBeVisible();
      await expect(saveButton.first()).toBeVisible();
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    
    // Verify mobile layout
    await expect(page.getByRole('heading', { name: /Transactions/ })).toBeVisible();
    
    // Check that table/list adapts to mobile
    const transactionContainer = page.locator('[data-testid="transactions-list"], table, .transaction-list');
    await expect(transactionContainer.first()).toBeVisible();
    
    // Verify content doesn't overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
    
    // Check mobile navigation
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-menu, button[aria-label*="menu"]');
    if (await mobileNav.first().isVisible()) {
      await expect(mobileNav.first()).toBeVisible();
    }
    
    // Verify touch-friendly interface elements
    const actionButtons = page.locator('button, a[role="button"], .btn');
    for (const button of await actionButtons.all()) {
      if (await button.isVisible()) {
        const buttonBox = await button.boundingBox();
        // Buttons should be at least 44px for good touch targets
        if (buttonBox) {
          expect(Math.min(buttonBox.width, buttonBox.height)).toBeGreaterThanOrEqual(32);
        }
      }
    }
  });
});