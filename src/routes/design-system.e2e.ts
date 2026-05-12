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
	await expect(page.getByTestId('primitive-composer')).toBeVisible();
	await expect(page.getByTestId('primitive-post-actions')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Component post text' })).toBeVisible();
	await expect(page.getByTestId('post-action-reply-icon')).toBeVisible();
	await expect(page.getByTestId('post-action-boost-icon')).toBeVisible();
	await expect(page.getByTestId('post-action-favorite-icon')).toBeVisible();

	const componentComposer = page.getByTestId('primitive-composer');
	await componentComposer.getByRole('button', { name: 'Privacy Public' }).click();
	await componentComposer.getByRole('button', { name: 'Followers' }).click();
	await expect(componentComposer.getByRole('button', { name: 'Privacy Followers' })).toBeVisible();
	await componentComposer.getByRole('textbox', { name: 'Component post text' }).fill('clear this preview');
	await componentComposer.getByRole('button', { name: 'Post', exact: true }).click();
	await expect(componentComposer.getByRole('textbox', { name: 'Component post text' })).toHaveValue('');

	const componentPost = page.getByTestId('primitive-post-actions');
	await componentPost.getByRole('button', { name: 'Favorite 42' }).click();
	await expect(componentPost.getByRole('button', { name: 'Favorite 43' })).toHaveAttribute('aria-pressed', 'true');

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
