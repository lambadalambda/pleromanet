import { expect, test, type Page } from '@playwright/test';

const openSettings = async (page: Page) => {
	await page.goto('/mockup');
	await page.getByTestId('left-sidebar').getByRole('button', { name: 'Settings' }).click();
};

const expectNoHorizontalOverflow = async (page: Page) => {
	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);

	expect(hasOverflow).toBe(false);
};

test('edits profile fields, tracks dirty state, saves, and resets', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openSettings(page);

	await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible();
	await expect(page.getByText('Settings / Profile')).toBeVisible();
	await expect(page.getByTestId('avatar-upload-row')).toContainText('Choose avatar');
	await expect(page.getByTestId('banner-upload-row')).toContainText('Choose banner');

	await expect(page.getByTestId('settings-save-state')).toContainText('Saved');
	await expect(page.getByTestId('right-rail')).toBeHidden();
	await expect(page.getByTestId('profile-preview-card')).toBeVisible();

	const avatarUploadBox = await page.getByTestId('avatar-upload-row').boundingBox();
	expect(avatarUploadBox?.height ?? 999).toBeLessThan(180);

	await page.getByRole('textbox', { name: 'Display name' }).fill('dreambyte archive');
	await page.getByRole('textbox', { name: 'Website' }).fill('https://pleromanet.social/~dreambyte');
	await page.getByRole('textbox', { name: 'Location' }).fill('low orbit');

	await expect(page.getByTestId('settings-save-state')).toContainText('Unsaved changes');
	await expect(page.getByTestId('profile-preview-card')).toContainText('dreambyte archive');
	await page.getByRole('button', { name: 'Save profile settings' }).click();
	await expect(page.getByTestId('settings-save-state')).toContainText('Saved just now');

	await page.getByRole('textbox', { name: 'Username' }).fill('changed-name');
	await expect(page.getByTestId('settings-save-state')).toContainText('Unsaved changes');
	await page.getByRole('button', { name: 'Reset profile settings' }).click();
	await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue('dreambyte');
	await expect(page.getByRole('textbox', { name: 'Display name' })).toHaveValue('dreambyte archive');
});

test('toggles profile visibility settings', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openSettings(page);

	const discoverable = page.getByRole('switch', { name: 'Discoverable profile' });
	const indexable = page.getByRole('switch', { name: 'Allow search indexing' });
	const followerCount = page.getByRole('switch', { name: 'Show follower count' });

	await expect(discoverable).toHaveAttribute('aria-checked', 'true');
	await expect(indexable).toHaveAttribute('aria-checked', 'false');
	await expect(followerCount).toHaveAttribute('aria-checked', 'true');

	await discoverable.click();
	await indexable.click();
	await followerCount.click();

	await expect(discoverable).toHaveAttribute('aria-checked', 'false');
	await expect(indexable).toHaveAttribute('aria-checked', 'true');
	await expect(followerCount).toHaveAttribute('aria-checked', 'false');
	await expect(page.getByTestId('settings-save-state')).toContainText('Unsaved changes');
});

test('profile settings stay touch-friendly on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/mockup');

	await page.getByTestId('mobile-bottom-nav').getByRole('button', { name: 'Settings' }).click();

	await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Choose avatar' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Choose banner' })).toBeVisible();
	await expect(page.getByTestId('profile-tips-card')).toBeVisible();

	const saveBox = await page.getByRole('button', { name: 'Save profile settings' }).boundingBox();
	const toggleBox = await page.getByRole('switch', { name: 'Discoverable profile' }).boundingBox();

	expect(saveBox?.height ?? 0).toBeGreaterThanOrEqual(40);
	expect(toggleBox?.height ?? 0).toBeGreaterThanOrEqual(40);
	await expectNoHorizontalOverflow(page);
});
