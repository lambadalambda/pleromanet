import { expect, test, type Page } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { expectNoHorizontalOverflow, setViewport } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};

const authenticate = async (page: Page) => {
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

test('real settings route keeps preview and tips in the shell rail and syncs edits', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/settings');

	await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible();
	await expect(page.getByText('Settings / Profile')).toBeVisible();
	await expect(page.getByTestId('settings-save-state')).toContainText('Saved');
	await expect(page.getByText('22 / 160')).toBeVisible();

	const rail = page.getByTestId('right-rail');
	await expect(rail).toBeVisible();
	await expect(rail.getByTestId('profile-preview-card')).toBeVisible();
	await expect(rail.getByTestId('profile-tips-card')).toBeVisible();
	await expect(rail.getByTestId('profile-preview-card')).toContainText('This is how your profile appears to other users.');
	await expect(page.getByTestId('app-content').getByTestId('profile-preview-card')).toHaveCount(0);

	await page.getByRole('textbox', { name: 'Display name' }).fill('dreambyte archive');
	await page.getByRole('textbox', { name: 'Website' }).fill('https://pleromanet.social/~dreambyte');
	await page.getByRole('textbox', { name: 'Location' }).fill('low orbit');

	await expect(page.getByTestId('settings-save-state')).toContainText('Unsaved changes');
	await expect(rail.getByTestId('profile-preview-card')).toContainText('dreambyte archive');
	await page.getByRole('button', { name: 'Save profile settings' }).click();
	await expect(page.getByTestId('settings-save-state')).toContainText('Saved just now');

	await page.getByRole('textbox', { name: 'Username' }).fill('changed-name');
	await expect(page.getByTestId('settings-save-state')).toContainText('Unsaved changes');
	await page.getByRole('button', { name: 'Reset profile settings' }).click();
	await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue('dreambyte');
	await expect(page.getByRole('textbox', { name: 'Display name' })).toHaveValue('dreambyte archive');
});

test('real settings route stays touch-friendly on mobile', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'mobile');
	await page.goto('/app/settings');

	await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Choose avatar' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Choose banner' })).toBeVisible();
	await expect(page.getByTestId('right-rail')).toBeHidden();

	const saveBox = await page.getByRole('button', { name: 'Save profile settings' }).boundingBox();
	const toggleBox = await page.getByRole('switch', { name: 'Discoverable profile' }).boundingBox();

	expect(saveBox?.height ?? 0).toBeGreaterThanOrEqual(40);
	expect(toggleBox?.height ?? 0).toBeGreaterThanOrEqual(40);
	await expectNoHorizontalOverflow(page);
});
