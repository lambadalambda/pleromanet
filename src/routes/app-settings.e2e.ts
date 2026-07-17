import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { expectNoHorizontalOverflow, fulfillJson, setViewport } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};

const updatedAccount = {
	...pleromaFixtures.account,
	display_name: 'dreambyte archive',
	fields: [
		{ name: 'home', value: 'small web', verified_at: null },
		{
			name: 'Website',
			value: '<a href="https://pleromanet.social/~dreambyte">pleromanet.social/~dreambyte</a>',
			verified_at: null
		},
		{ name: 'Location', value: 'low orbit', verified_at: null }
	],
	pleroma: { ...pleromaFixtures.account.pleroma, hide_followers_count: true },
	source: {
		note: 'keeping the lights low',
		fields: [
			{ name: 'home', value: 'small web' },
			{ name: 'Website', value: 'https://pleromanet.social/~dreambyte' },
			{ name: 'Location', value: 'low orbit' }
		]
	}
};

const authenticate = async (page: Page) => {
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

test('real settings route populates the form from the session account', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'wide');
	await page.goto('/app/settings');

	await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible();
	await expect(page.getByText('Settings / Profile')).toBeVisible();
	await expect(page.getByTestId('settings-save-state')).toContainText('Saved');

	await expect(page.getByRole('textbox', { name: 'Display name' })).toHaveValue('quiet admin');
	await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue('quietadmin');
	await expect(page.getByRole('textbox', { name: 'Username' })).toBeDisabled();
	await expect(page.getByRole('textbox', { name: 'Bio' })).toHaveValue('keeping the lights low');
	await expect(page.getByText('22 / 160')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Website' })).toHaveValue('');
	await expect(page.getByRole('textbox', { name: 'Location' })).toHaveValue('');
	await expect(page.getByRole('switch', { name: 'Discoverable profile' })).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByRole('switch', { name: 'Show follower count' })).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByRole('switch', { name: 'Allow search indexing' })).toHaveCount(0);

	const rail = page.getByTestId('right-rail');
	await expect(rail).toBeVisible();
	await expect(rail.getByTestId('profile-preview-card')).toBeVisible();
	await expect(rail.getByTestId('profile-tips-card')).toBeVisible();
	await expect(rail.getByTestId('profile-preview-card')).toContainText('This is how your profile appears to other users.');
	await expect(rail.getByTestId('profile-preview-card')).toContainText('@quietadmin@pleroma.example');
	await expect(page.getByTestId('app-content').getByTestId('profile-preview-card')).toHaveCount(0);
});

test('custom theme editor previews, imports, saves, and restores a shared palette', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'wide');
	await page.goto('/app/settings/appearance');

	await expect(page.getByRole('heading', { name: 'Custom theme' })).toBeVisible();
	await page.getByLabel('Start from').selectOption('drive');
	const pageBackground = page.getByRole('textbox', { name: 'Page background hex' });
	await pageBackground.fill('');
	await pageBackground.pressSequentially('#112233');
	await expect(pageBackground).toHaveValue('#112233');
	await expect(page.getByTestId('theme-preview')).toHaveCSS('--bg', '#112233');
	await pageBackground.fill('#abc');
	await expect(pageBackground).toHaveValue('#abc');
	await expect(page.getByTestId('theme-preview')).toHaveCSS('--bg', '#AABBCC');
	await pageBackground.fill('#112233');
	await pageBackground.fill('not-a-color');
	await expect(pageBackground).toHaveAttribute('aria-invalid', 'true');
	await expect(page.getByRole('button', { name: 'Save as active theme' })).toBeDisabled();
	await page.getByRole('textbox', { name: 'Panel background hex' }).fill('#223344');
	await expect(pageBackground).toHaveValue('not-a-color');
	await expect(pageBackground).toHaveAttribute('aria-invalid', 'true');
	await expect(page.getByRole('button', { name: 'Save as active theme' })).toBeDisabled();

	const shareCode = page.getByRole('textbox', { name: 'Theme share code' });
	await expect(shareCode).toHaveValue(/^PN1:112233,/);
	const imported = 'PN1:F4F0E8,FAF8F1,202442,747890,9B82D2,A2D0AD,DDB574,D28787';
	await page.getByRole('textbox', { name: 'Import theme code' }).fill(imported);
	await page.getByRole('textbox', { name: 'Import theme code' }).press('Control+Enter');
	await expect(pageBackground).toHaveValue('#F4F0E8');
	await expect(pageBackground).toHaveAttribute('aria-invalid', 'false');
	await expect(page.getByRole('button', { name: 'Save as active theme' })).toBeEnabled();
	await expect(shareCode).toHaveValue(imported);

	await page.getByRole('textbox', { name: 'Import theme code' }).fill('PN1:bad');
	await page.getByRole('button', { name: 'Import theme code' }).click();
	await expect(page.getByRole('alert')).toContainText('8 hex colors');
	await expect(pageBackground).toHaveValue('#F4F0E8');

	await page.getByRole('button', { name: 'Save as active theme' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'custom');
	await expect(page.locator('html')).toHaveCSS('--bg', '#F4F0E8');
	await expect(page.locator('#duotoneCustom feFuncR')).toHaveAttribute('tableValues', '0.125 0.608');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'custom');
	await expect(pageBackground).toHaveValue('#F4F0E8');
	await expect(shareCode).toHaveValue(imported);

	await page.getByRole('button', { name: 'quiet admin account menu' }).click();
	await expect(page.getByRole('button', { name: 'Custom', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Cream' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'cream');
	expect(await page.locator('html').evaluate((element) => element.style.getPropertyValue('--bg'))).toBe('');
	await page.getByRole('button', { name: 'Customize theme…' }).click();
	await expect(page).toHaveURL('/app/settings/appearance');
});

test('custom theme editor restores the selected built-in palette and unsaved drafts', async ({ page }) => {
	await authenticate(page);
	await page.goto('/app/settings/appearance');

	const themeSource = page.getByLabel('Start from');
	await themeSource.focus();
	await themeSource.selectOption('drive');
	await expect(themeSource).toBeFocused();
	await expect(themeSource).toHaveValue('drive');
	const pageBackground = page.getByRole('textbox', { name: 'Page background hex' });
	await expect(pageBackground).toHaveValue('#07091A');
	await pageBackground.fill('#123456');
	await page.reload();
	await expect(themeSource).toHaveValue('drive');
	await expect(pageBackground).toHaveValue('#123456');
	await page.getByRole('button', { name: 'Discard changes' }).click();
	await expect(pageBackground).toHaveValue('#07091A');
});

test('custom theme editor stays usable on mobile', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'mobile');
	await page.goto('/app/settings/appearance');

	await expect(page.getByRole('heading', { name: 'Custom theme' })).toBeVisible();
	await expect(page.getByTestId('theme-preview')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Page background hex' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Save as active theme' })).toBeVisible();
	await expect(page.getByTestId('right-rail')).toBeHidden();

	await page.getByRole('button', { name: 'quiet admin account menu' }).click();
	const customizeTheme = page.getByRole('button', { name: 'Customize theme…' });
	await expect(customizeTheme).toBeVisible();
	expect((await customizeTheme.boundingBox())?.height).toBeGreaterThanOrEqual(40);
});

test('real settings route saves through the account update API and reconciles the session', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'wide');

	const updateBodies: unknown[] = [];
	await page.route('https://pleroma.example/api/v1/accounts/update_credentials', async (route: Route) => {
		updateBodies.push(route.request().postDataJSON());
		await fulfillJson(route, updatedAccount);
	});

	await page.goto('/app/settings');
	const rail = page.getByTestId('right-rail');

	await page.getByRole('textbox', { name: 'Display name' }).fill('dreambyte archive');
	await page.getByRole('textbox', { name: 'Website' }).fill('https://pleromanet.social/~dreambyte');
	await page.getByRole('textbox', { name: 'Location' }).fill('low orbit');
	await page.getByRole('switch', { name: 'Show follower count' }).click();

	await expect(page.getByTestId('settings-save-state')).toContainText('Unsaved changes');
	await expect(rail.getByTestId('profile-preview-card')).toContainText('dreambyte archive');

	await page.getByRole('button', { name: 'Save profile settings' }).click();
	await expect(page.getByTestId('settings-save-state')).toContainText('Saved just now');

	expect(updateBodies).toHaveLength(1);
	expect(updateBodies[0]).toMatchObject({
		display_name: 'dreambyte archive',
		note: 'keeping the lights low',
		discoverable: true,
		hide_followers_count: true,
		fields_attributes: [
			{ name: 'home', value: 'small web' },
			{ name: 'Website', value: 'https://pleromanet.social/~dreambyte' },
			{ name: 'Location', value: 'low orbit' }
		]
	});

	await expect(page.getByRole('button', { name: 'dreambyte archive account menu' })).toBeVisible();
	const storedSession = await page.evaluate(() =>
		JSON.parse(window.localStorage.getItem('pleromanet.session') ?? 'null')
	);
	expect(storedSession?.account?.display_name).toBe('dreambyte archive');

	await page.getByRole('textbox', { name: 'Display name' }).fill('temporary name');
	await expect(page.getByTestId('settings-save-state')).toContainText('Unsaved changes');
	await page.getByRole('button', { name: 'Reset profile settings' }).click();
	await expect(page.getByRole('textbox', { name: 'Display name' })).toHaveValue('dreambyte archive');
	await expect(page.getByRole('textbox', { name: 'Website' })).toHaveValue('https://pleromanet.social/~dreambyte');
	await expect(page.getByTestId('settings-save-state')).toContainText('Saved');
});

test('real settings route keeps the draft and shows an error when saving fails', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'wide');

	await page.route('https://pleroma.example/api/v1/accounts/update_credentials', async (route: Route) => {
		await fulfillJson(route, { error: 'Internal server error' }, 500);
	});

	await page.goto('/app/settings');
	await page.getByRole('textbox', { name: 'Display name' }).fill('dreambyte archive');
	await page.getByRole('button', { name: 'Save profile settings' }).click();

	await expect(page.getByTestId('settings-save-error')).toBeVisible();
	await expect(page.getByTestId('settings-save-state')).toContainText('Unsaved changes');
	await expect(page.getByRole('textbox', { name: 'Display name' })).toHaveValue('dreambyte archive');
});

test('real settings route signs out and redirects when the save is unauthorized', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'wide');

	await page.route('https://pleroma.example/api/v1/accounts/update_credentials', async (route: Route) => {
		await fulfillJson(route, { error: 'The access token is invalid' }, 401);
	});

	await page.goto('/app/settings');
	await page.getByRole('textbox', { name: 'Display name' }).fill('dreambyte archive');
	await page.getByRole('button', { name: 'Save profile settings' }).click();

	await page.waitForURL('/');
	const storedSession = await page.evaluate(() => window.localStorage.getItem('pleromanet.session'));
	expect(storedSession).toBeNull();
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
