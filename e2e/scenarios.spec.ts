import { test, expect } from '@playwright/test';

// Clear localStorage before every test so state never leaks between scenarios.
test.beforeEach(async ({ page }) => {
  await page.goto('/auth');
  await page.evaluate(() => localStorage.clear());
});

// ─── Scenario 1 ──────────────────────────────────────────────────────────────
// User registers a new account → lands on /home → logs out → back at /auth
test('Scenario 1: register, land on home, then log out', async ({ page }) => {
  await page.goto('/auth');

  // Switch to REGISTER mode
  await page.getByRole('button', { name: /register/i }).click();

  // Fill in the register form
  await page.getByPlaceholder('your@email.com').fill('scenario1@voltvybe.com');
  await page.getByPlaceholder('VOLT_USER').fill('SC1USER');
  await page.getByPlaceholder('••••••••').fill('securepass1');

  // Submit
  await page.getByRole('button', { name: /join the vybe/i }).click();

  // Should redirect to /home after registration
  await expect(page).toHaveURL(/\/home/);

  // Logout button is visible in the sidebar
  await page.getByRole('button', { name: /logout/i }).click();

  // Should land back on the auth page
  await expect(page).toHaveURL(/\/auth/);
});

// ─── Scenario 2 ──────────────────────────────────────────────────────────────
// User logs in → goes to Catalog → adds a new item → item appears in the table
test('Scenario 2: login, add item in Catalog, verify it appears in the table', async ({ page }) => {
  await page.goto('/auth');

  // Log in with demo credentials
  await page.getByPlaceholder('your@email.com').fill('demo@voltvybe.com');
  await page.getByPlaceholder('••••••••').fill('demo1234');
  await page.getByRole('button', { name: /enter the volt/i }).click();
  await expect(page).toHaveURL(/\/home/);

  // Navigate to Catalog
  await page.goto('/catalog');
  await expect(page).toHaveURL(/\/catalog/);

  // Open the Add Item modal
  await page.getByRole('button', { name: /add item/i }).click();

  // Fill in required fields
  await page.getByPlaceholder('VOLT TEE').fill('E2E PLAYWRIGHT TEE');
  await page.getByPlaceholder('45').fill('59');
  await page.getByPlaceholder('Electric Yellow').fill('Test Color');
  await page.getByPlaceholder('100% Cotton').fill('100% Polyester');

  // Submit the form
  await page.getByRole('button', { name: /^create$/i }).click();

  // The new item should appear in the table
  await expect(page.getByText('E2E PLAYWRIGHT TEE')).toBeVisible();
});

// ─── Scenario 3 ──────────────────────────────────────────────────────────────
// User clicks an item row in the Catalog → Detail page loads with correct name + price
test('Scenario 3: click item row, verify detail page shows item name and price', async ({ page }) => {
  await page.goto('/auth');

  // Log in
  await page.getByPlaceholder('your@email.com').fill('demo@voltvybe.com');
  await page.getByPlaceholder('••••••••').fill('demo1234');
  await page.getByRole('button', { name: /enter the volt/i }).click();
  await expect(page).toHaveURL(/\/home/);

  await page.goto('/catalog');

  // Grab the first item's name and price from the table before clicking
  const firstRow = page.locator('table tbody tr').first();
  const itemNameText = await firstRow.locator('td').nth(1).locator('span').first().textContent();
  const itemPriceText = await firstRow.locator('td').nth(3).textContent();

  // Click the item name link to open the detail page
  await firstRow.locator('td').nth(1).locator('a').click();

  // URL should change to /catalog/:id
  await expect(page).toHaveURL(/\/catalog\/.+/);

  // The item name should appear on the detail page heading
  if (itemNameText) {
    await expect(page.locator('h1')).toContainText(itemNameText.trim());
  }

  // The price should also be visible somewhere on the page
  if (itemPriceText) {
    await expect(page.getByText(itemPriceText.trim())).toBeVisible();
  }
});
