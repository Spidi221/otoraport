/**
 * E2E Test: CSV Upload → Feedback Modal → Data Completion Wizard
 * Tests the complete user workflow from file upload to data completion
 */

import { test, expect } from '@playwright/test'

test.describe('CSV Upload and Data Completion Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assumes user is already authenticated)
    await page.goto('/dashboard')
  })

  test('should upload CSV and show success feedback modal', async ({ page }) => {
    // Locate upload widget
    await expect(page.getByText('Upload CSV')).toBeVisible()

    // Upload CSV file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-data/sample-properties.csv')

    // Wait for upload to complete
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 })

    // Verify upload summary is displayed
    await expect(page.getByText(/properties from/i)).toBeVisible()
    await expect(page.getByText(/Compliance Score/i)).toBeVisible()
  })

  test('should display compliance breakdown in feedback modal', async ({ page }) => {
    // Upload CSV (simplified for this test)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-data/sample-properties.csv')

    // Wait for feedback modal
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 })

    // Check section breakdown
    await expect(page.getByText('Developer Info')).toBeVisible()
    await expect(page.getByText('Location Data')).toBeVisible()
    await expect(page.getByText('Pricing Data')).toBeVisible()
    await expect(page.getByText('Technical Data')).toBeVisible()

    // Check missing fields list
    await expect(page.getByText('Missing Critical Fields')).toBeVisible()
  })

  test('should open data completion wizard from feedback modal', async ({ page }) => {
    // Upload CSV
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-data/sample-properties.csv')

    // Wait for feedback modal
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 })

    // Click "Complete Missing Fields Now" button
    await page.getByRole('button', { name: /complete missing fields now/i }).click()

    // Verify wizard opens
    await expect(page.getByText('Data Completion Wizard')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Step 1 of 4')).toBeVisible()
  })

  test('should set notification badge when clicking "I\'ll Do This Later"', async ({ page }) => {
    // Upload CSV
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-data/sample-properties.csv')

    // Wait for feedback modal
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 })

    // Click "I'll Do This Later" button
    await page.getByRole('button', { name: /i'll do this later/i }).click()

    // Modal should close
    await expect(page.getByText('Upload Successful')).not.toBeVisible()

    // Notification badge should appear in dashboard
    await expect(page.getByText('Data Completion Needed')).toBeVisible({ timeout: 3000 })
  })

  test('should complete wizard and update compliance score', async ({ page }) => {
    // Upload CSV
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-data/sample-properties.csv')

    // Open wizard from feedback modal
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /complete missing fields now/i }).click()

    // Step 1: Developer Info
    await page.getByLabel('Company Name').fill('Test Developer Sp. z o.o.')
    await page.getByLabel('NIP').fill('1234567890')
    await page.getByLabel('REGON').fill('123456789')
    await page.getByRole('button', { name: /next/i }).click()

    // Step 2: Location
    await page.getByLabel('Województwo').fill('mazowieckie')
    await page.getByLabel('Powiat').fill('warszawski')
    await page.getByRole('button', { name: /next/i }).click()

    // Step 3: Pricing (if applicable)
    await page.getByRole('button', { name: /next/i }).click()

    // Step 4: Summary
    await expect(page.getByText(/Your profile is now/i)).toBeVisible()
    await page.getByRole('button', { name: /finish/i }).click()

    // Verify wizard closes
    await expect(page.getByText('Data Completion Wizard')).not.toBeVisible()

    // Verify dashboard shows improved compliance
    await expect(page.getByText(/80%|90%|100%/)).toBeVisible({ timeout: 5000 })
  })

  test('should open wizard from header badge (Task #106.3)', async ({ page }) => {
    // Upload CSV with low compliance to trigger badge
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-data/sample-properties.csv')

    // Wait for upload to complete and click "I'll Do This Later"
    await expect(page.getByText('Upload Successful')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /i'll do this later/i }).click()

    // Verify modal closes
    await expect(page.getByText('Upload Successful')).not.toBeVisible()

    // Verify notification badge appears in header
    await expect(page.locator('button[title="Uzupełnij dane firmy"]')).toBeVisible({ timeout: 3000 })

    // Click badge to open wizard
    await page.locator('button[title="Uzupełnij dane firmy"]').click()

    // Verify wizard opens
    await expect(page.getByText('Uzupełnij dane firmy')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Wypełnij wymagane informacje/i)).toBeVisible()
  })
})

test.describe('Data Quality Dashboard Widget', () => {
  test('should display progress bars for each section', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify widget is visible
    await expect(page.getByText('Data Quality Dashboard')).toBeVisible()

    // Check all section progress bars
    await expect(page.getByText('Developer Info:')).toBeVisible()
    await expect(page.getByText('Location Data:')).toBeVisible()
    await expect(page.getByText('Pricing Data:')).toBeVisible()
    await expect(page.getByText('Technical Data:')).toBeVisible()
  })

  test('should expand accordion to show missing fields', async ({ page }) => {
    await page.goto('/dashboard')

    // Click to expand "Developer Info" section
    await page.getByText('Developer Info').click()

    // Verify missing fields are displayed
    await expect(page.getByText(/NIP|REGON|Company Name/i)).toBeVisible()
  })

  test('should open field edit dialog when clicking on missing field', async ({ page }) => {
    await page.goto('/dashboard')

    // Expand section
    await page.getByText('Developer Info').click()

    // Click on a missing field (e.g., NIP)
    await page.getByText('NIP').first().click()

    // Verify edit dialog opens (or navigates to appropriate page)
    // This depends on implementation - adjust as needed
    await expect(page.getByLabel(/NIP|Company Details/i)).toBeVisible({ timeout: 5000 })
  })
})
