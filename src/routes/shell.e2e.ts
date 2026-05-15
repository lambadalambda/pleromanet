import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, setViewport } from '../test/playwright';

test.skip(true, 'Legacy /mockup shell coverage is retired; src/routes/app-routes.e2e.ts covers the real shell.');

test('renders the authenticated desktop shell', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/mockup');

	await expect(page.getByTestId('app-header')).toBeVisible();
	await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
	await expect(page.getByRole('searchbox', { name: 'Search PleromaNet' })).toBeVisible();
	await expect(page.getByTestId('left-sidebar')).toBeVisible();
	await expect(page.getByTestId('right-rail')).toBeVisible();
	await expect(page.getByTestId('profile-mini')).toContainText('dreambyte');
	await page.getByRole('tablist', { name: 'Timeline sections' }).getByRole('tab', { name: 'Local' }).click();
	await expect(page.getByRole('tablist', { name: 'Timeline sections' }).getByRole('tab', { name: 'Local' })).toHaveAttribute('aria-selected', 'true');
	const sidebarSettings = page.getByTestId('left-sidebar').getByRole('button', { name: 'Settings' });
	await expect(sidebarSettings).toBeVisible();
	await expect(page.getByTestId('settings-subnav')).toBeHidden();
	await sidebarSettings.click();
	await expect(page.getByTestId('settings-subnav')).toBeVisible();
	await expect(page.getByTestId('settings-subnav').getByRole('button', { name: 'Profile' })).toHaveClass(/active/);
	await expectNoHorizontalOverflow(page);
});

test('right rail changes by view and hides on medium widths', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/mockup');

	await expect(page.getByTestId('right-rail')).toContainText('Trends & Activity');
	await page.getByRole('button', { name: 'Explore' }).first().click();
	await expect(page.getByTestId('right-rail')).toContainText('Discover');

	await setViewport(page, 'medium');
	await expect(page.getByTestId('right-rail')).toBeHidden();
	await expectNoHorizontalOverflow(page);
});

test('user menu supports theme switching and keyboard dismissal', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/mockup');

	await page.getByRole('button', { name: 'dreambyte account menu' }).click();
	await expect(page.getByTestId('user-menu')).toBeVisible();
	await page.getByRole('button', { name: 'Simoun' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'simoun');

	await page.keyboard.press('Escape');
	await expect(page.getByTestId('user-menu')).toBeHidden();
});

test('mobile shell opens drawer, sheet, and bottom navigation without overflow', async ({ page }) => {
	await setViewport(page, 'mobile');
	await page.goto('/mockup');

	await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();
	await expect(page.getByTestId('left-sidebar')).toBeHidden();
	await expect(page.getByTestId('right-rail')).toBeHidden();

	await page.getByRole('button', { name: 'Open navigation menu' }).click();
	await expect(page.getByTestId('mobile-drawer')).toBeVisible();
	await page.getByTestId('mobile-drawer').getByRole('button', { name: 'Local' }).click();
	await expect(page.getByRole('tablist', { name: 'Timeline sections' }).getByRole('tab', { name: 'Local' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('mobile-drawer')).toBeHidden();

	await page.getByRole('button', { name: 'Open navigation menu' }).click();
	await expect(page.getByTestId('mobile-drawer')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('mobile-drawer')).toBeHidden();

	await page.getByTestId('mobile-bottom-nav').getByRole('button', { name: 'More' }).click();
	await expect(page.getByTestId('mobile-sheet')).toBeVisible();
	await page.getByRole('button', { name: 'Close details sheet' }).click();
	await expect(page.getByTestId('mobile-sheet')).toBeHidden();
	await expectNoHorizontalOverflow(page);
});
