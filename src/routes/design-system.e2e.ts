import { expect, test, type Page } from '@playwright/test';

const expectNoHorizontalOverflow = async (page: Page) => {
	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);

	expect(hasOverflow).toBe(false);
};

test('shows core design primitives and switches themes', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/design-system');

	await expect(page.getByRole('heading', { name: 'Design System' })).toBeVisible();
	await expect(page.getByTestId('primitive-card')).toBeVisible();
	await expect(page.getByTestId('primitive-tabs')).toBeVisible();
	await expect(page.getByTestId('primitive-form')).toBeVisible();
	await expect(page.getByTestId('primitive-status')).toBeVisible();
	await expect(page.getByTestId('primitive-vapor-banner')).toBeVisible();
	await expect(page.getByTestId('primitive-post-actions')).toBeVisible();
	await expect(page.getByTestId('post-action-reply-icon')).toBeVisible();
	await expect(page.getByTestId('post-action-boost-icon')).toBeVisible();
	await expect(page.getByTestId('post-action-favorite-icon')).toBeVisible();

	await page.getByRole('button', { name: 'Simoun' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'simoun');
	await expectNoHorizontalOverflow(page);
});

test('keeps design primitives usable on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/design-system');

	await expect(page.getByRole('heading', { name: 'Design System' })).toBeVisible();
	await expect(page.getByTestId('primitive-grid')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Simoun' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
