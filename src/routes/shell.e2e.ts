import { expect, test, type Page } from '@playwright/test';

const expectNoHorizontalOverflow = async (page: Page) => {
	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);

	expect(hasOverflow).toBe(false);
};

test('renders the authenticated desktop shell', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');

	await expect(page.getByTestId('app-header')).toBeVisible();
	await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
	await expect(page.getByRole('searchbox', { name: 'Search PleromaNet' })).toBeVisible();
	await expect(page.getByTestId('left-sidebar')).toBeVisible();
	await expect(page.getByTestId('right-rail')).toBeVisible();
	await expect(page.getByTestId('profile-mini')).toContainText('dreambyte');
	await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
	await expect(page.getByTestId('settings-subnav')).toBeHidden();
	await page.getByRole('button', { name: 'Settings' }).click();
	await expect(page.getByTestId('settings-subnav')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Profile' })).toHaveClass(/active/);
	await page.getByLabel('Timeline sections').getByRole('button', { name: 'Local' }).click();
	await expect(page.getByRole('heading', { name: 'Local timeline' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('right rail changes by view and hides on medium widths', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');

	await expect(page.getByTestId('right-rail')).toContainText('Trends & Activity');
	await page.getByRole('button', { name: 'Explore' }).first().click();
	await expect(page.getByTestId('right-rail')).toContainText('Discover');

	await page.setViewportSize({ width: 1000, height: 800 });
	await expect(page.getByTestId('right-rail')).toBeHidden();
	await expectNoHorizontalOverflow(page);
});

test('user menu supports theme switching and keyboard dismissal', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');

	await page.getByRole('button', { name: 'dreambyte account menu' }).click();
	await expect(page.getByTestId('user-menu')).toBeVisible();
	await page.getByRole('button', { name: 'Dusk' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dusk');

	await page.keyboard.press('Escape');
	await expect(page.getByTestId('user-menu')).toBeHidden();
});

test('mobile shell opens drawer, sheet, and bottom navigation without overflow', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');

	await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();
	await expect(page.getByTestId('left-sidebar')).toBeHidden();
	await expect(page.getByTestId('right-rail')).toBeHidden();

	await page.getByRole('button', { name: 'Open navigation menu' }).click();
	await expect(page.getByTestId('mobile-drawer')).toBeVisible();
	await page.getByTestId('mobile-drawer').getByRole('button', { name: 'Local' }).click();
	await expect(page.getByRole('heading', { name: 'Local timeline' })).toBeVisible();
	await expect(page.getByTestId('mobile-drawer')).toBeHidden();

	await page.getByRole('button', { name: 'Open navigation menu' }).click();
	await expect(page.getByTestId('mobile-drawer')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('mobile-drawer')).toBeHidden();

	await page.getByRole('button', { name: 'More' }).click();
	await expect(page.getByTestId('mobile-sheet')).toBeVisible();
	await page.getByRole('button', { name: 'Close details sheet' }).click();
	await expect(page.getByTestId('mobile-sheet')).toBeHidden();
	await expectNoHorizontalOverflow(page);
});
