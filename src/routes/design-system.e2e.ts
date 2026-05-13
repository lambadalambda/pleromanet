import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, setViewport } from '../test/playwright';

test('shows core design primitives and switches themes', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	await expect(page.getByRole('heading', { name: 'Design System' })).toBeVisible();
	await expect(page.getByTestId('primitive-card')).toBeVisible();
	await expect(page.getByTestId('primitive-tabs')).toBeVisible();
	await expect(page.getByTestId('primitive-form')).toBeVisible();
	await expect(page.getByTestId('primitive-status')).toBeVisible();
	await expect(page.getByTestId('primitive-vapor-banner')).toBeVisible();
	await expect(page.getByTestId('primitive-composer')).toBeVisible();
	await expect(page.getByTestId('primitive-post-actions')).toBeVisible();
	await expect(page.getByTestId('primitive-pleroma-fixture')).toContainText('quiet CSS can still carry the voice.');
	await expect(page.getByTestId('primitive-pleroma-fixture')).toContainText('@quietadmin@pleroma.example');
	await expect(page.getByTestId('primitive-request-state')).toContainText('Adapted fixture content loaded');
	await expect(page.getByRole('textbox', { name: 'Component post text' })).toBeVisible();
	const componentPost = page.getByTestId('primitive-post-actions');
	await expect(componentPost.getByTestId('post-action-reply-icon')).toBeVisible();
	await expect(componentPost.getByTestId('post-action-boost-icon')).toBeVisible();
	await expect(componentPost.getByTestId('post-action-favorite-icon')).toBeVisible();

	const componentComposer = page.getByTestId('primitive-composer');
	await expect(componentComposer.getByTestId('composer-tool-image-icon')).toBeVisible();
	await expect(componentComposer.getByTestId('composer-tool-poll-icon')).toBeVisible();
	await expect(componentComposer.getByTestId('composer-tool-emoji-icon')).toBeVisible();
	await expect(componentComposer.getByTestId('composer-tool-privacy-icon')).toBeVisible();
	await expect(componentComposer.getByTestId('composer-tool-privacy-chevron')).toBeVisible();
	await componentComposer.getByRole('button', { name: 'Privacy Public' }).click();
	await componentComposer.getByRole('button', { name: 'Followers' }).click();
	await expect(componentComposer.getByRole('button', { name: 'Privacy Followers' })).toBeVisible();
	await componentComposer.getByRole('textbox', { name: 'Component post text' }).fill('clear this preview');
	await componentComposer.getByRole('button', { name: 'Post', exact: true }).click();
	await expect(componentComposer.getByRole('textbox', { name: 'Component post text' })).toHaveValue('');

	await componentPost.getByRole('button', { name: 'Favorite 42' }).click();
	await expect(componentPost.getByRole('button', { name: 'Favorite 43' })).toHaveAttribute('aria-pressed', 'true');

	await page.getByRole('button', { name: 'Simoun' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'simoun');
	await expectNoHorizontalOverflow(page);
});

test('request-state primitive renders loading, empty, retryable, auth-required, and success states', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');
	const primitive = page.getByTestId('primitive-request-state');

	await primitive.getByRole('button', { name: 'Show loading' }).click();
	await expect(primitive.getByRole('status', { name: 'Request status' })).toContainText('Loading Pleroma data');

	await primitive.getByRole('button', { name: 'Show empty' }).click();
	await expect(primitive).toContainText('No statuses yet');

	await primitive.getByRole('button', { name: 'Show retryable error' }).click();
	await expect(primitive).toContainText('Network connection failed');
	await primitive.getByRole('button', { name: 'Retry request' }).click();
	await expect(primitive).toContainText('Retry count 1');

	await primitive.getByRole('button', { name: 'Show auth required' }).click();
	await expect(primitive).toContainText('Re-authentication required');
	await expect(primitive).toContainText('Return to sign in when a real guarded route exists.');
	await expect(primitive.getByRole('link', { name: 'Return to sign in' })).toHaveAttribute('href', '/#oauth');

	await primitive.getByRole('button', { name: 'Show success' }).click();
	await expect(primitive).toContainText('Adapted fixture content loaded');
});

test('keeps design primitives usable on mobile', async ({ page }) => {
	await setViewport(page, 'mobile');
	await page.goto('/design-system');

	await expect(page.getByRole('heading', { name: 'Design System' })).toBeVisible();
	await expect(page.getByTestId('primitive-grid')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Simoun' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
