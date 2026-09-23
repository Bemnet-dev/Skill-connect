import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should have correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Create Next App/);
  });

  test('should display basic page structure', async ({ page }) => {
    await page.goto('/');
    // Verify page loads successfully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display Next.js logo', async ({ page }) => {
    await page.goto('/');
    const logo = page.getByAltText('Next.js logo');
    await expect(logo).toBeVisible();
  });

  test('should display main heading with code element', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: /To get started, edit/i });
    await expect(heading).toBeVisible();
    await expect(heading.locator('code')).toContainText('page.tsx');
  });

  test('should display navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check for Deploy button
    const deployLink = page.getByRole('link', { name: /Deploy Now/i });
    await expect(deployLink).toBeVisible();
    await expect(deployLink).toHaveAttribute('href', /vercel.com/);
    
    // Check for Documentation link
    const docsLink = page.getByRole('link', { name: /Documentation/i });
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute('href', /nextjs.org\/docs/);
  });

  test('should have proper link attributes for external links', async ({ page }) => {
    await page.goto('/');
    
    // Verify all external links have proper security attributes
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      await expect(externalLinks.nth(i)).toHaveAttribute('rel', /noopener noreferrer/);
    }
  });

  test('should display descriptive text with links', async ({ page }) => {
    await page.goto('/');
    
    const templatesLink = page.getByRole('link', { name: 'Templates' });
    await expect(templatesLink).toBeVisible();
    
    const learningLink = page.getByRole('link', { name: 'Learning' });
    await expect(learningLink).toBeVisible();
  });
});
