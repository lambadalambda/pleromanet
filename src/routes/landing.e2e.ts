import { expect, test, type Page } from '@playwright/test';

const expectNoHorizontalOverflow = async (page: Page) => {
	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);

	expect(hasOverflow).toBe(false);
};

test('root page links to mocked app surfaces', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'A quieter Pleroma frontend is coming soon.' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Open mockup' })).toHaveAttribute('href', '/mockup');
	await expect(page.getByRole('link', { name: 'Design system' })).toHaveAttribute('href', '/design-system');
	await expect(page.getByText('/', { exact: true })).toBeVisible();
	await expect(page.getByText('/mockup')).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('root page remains usable on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Open mockup' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Design system' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
