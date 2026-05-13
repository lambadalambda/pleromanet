import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, setViewport, viewports } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000
};

const authenticate = async (page: Page) => {
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

test('signed-out users are redirected away from authenticated app routes', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: /quieter corner of the social web/i })).toBeVisible();
});

test('authenticated users are redirected from the landing page into the real app', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.goto('/');

	await expect(page).toHaveURL('/app/home');
	await expect(page.getByTestId('app-header')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Home timeline' })).toBeVisible();
});

test('real app routes render shell, deep links, and browser history', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page.getByTestId('app-header')).toBeVisible();
	await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
	await expect(page.getByTestId('left-sidebar')).toBeVisible();
	await expect(page.getByTestId('right-rail')).toContainText('Trends & Activity');
	await expect(page.getByTestId('app-content')).toContainText('quiet CSS can still carry the voice.');

	await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Explore' }).click();
	await expect(page).toHaveURL('/app/explore');
	await expect(page.getByRole('heading', { name: 'Explore the network' })).toBeVisible();
	await expect(page.getByTestId('right-rail')).toContainText('Discover');

	await page.getByTestId('left-sidebar').getByRole('link', { name: 'Settings' }).click();
	await expect(page).toHaveURL('/app/settings');
	await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible();
	await expect(page.getByTestId('settings-subnav')).toBeVisible();

	await page.goBack();
	await expect(page).toHaveURL('/app/explore');
	await page.goBack();
	await expect(page).toHaveURL('/app/home');
	await page.goForward();
	await expect(page).toHaveURL('/app/explore');
	await expectNoHorizontalOverflow(page);
});

test('app route guard revalidates when session disappears during client navigation', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect(page.getByTestId('app-header')).toBeVisible();

	await page.evaluate(() => window.localStorage.removeItem('pleromanet.session'));
	await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Explore' }).click();

	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: /quieter corner of the social web/i })).toBeVisible();
});

test('timeline, thread, profile, notification, and placeholder routes deep link in the real shell', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');

	const cases = [
		['/app/public', 'Public timeline'],
		['/app/local', 'Local timeline'],
		['/app/federated', 'Federated timeline'],
		['/app/thread/status-1', 'Thread'],
		['/app/profiles/quietadmin@pleroma.example', 'quiet admin'],
		['/app/notifications', 'Notifications']
	] as const;

	for (const [path, heading] of cases) {
		await page.goto(path);
		await expect(page.getByTestId('app-header')).toBeVisible();
		await expect(page.getByTestId('app-content').getByRole('heading', { name: heading })).toBeVisible();
		await expectNoHorizontalOverflow(page);
	}
});

test('real app shell stays responsive across desktop, medium, tablet, and mobile', async ({ page }) => {
	await authenticate(page);

	for (const [name, viewport] of Object.entries(viewports)) {
		await page.setViewportSize(viewport);
		await page.goto('/app/home');

		await expect(page.getByTestId('app-header')).toBeVisible();
		if (name === 'desktop') {
			await expect(page.getByTestId('left-sidebar')).toBeVisible();
			await expect(page.getByTestId('right-rail')).toBeVisible();
		} else if (name === 'medium') {
			await expect(page.getByTestId('left-sidebar')).toBeVisible();
			await expect(page.getByTestId('right-rail')).toBeHidden();
		} else {
			await expect(page.getByTestId('left-sidebar')).toBeHidden();
			await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();
		}

		await expectNoHorizontalOverflow(page);
	}
});

test('mobile real app shell opens drawer and details sheet', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'mobile');
	await page.goto('/app/home');

	await page.getByRole('button', { name: 'Open navigation menu' }).click();
	await expect(page.getByTestId('mobile-drawer')).toBeVisible();
	await page.getByTestId('mobile-drawer').getByRole('link', { name: 'Local' }).click();
	await expect(page).toHaveURL('/app/local');
	await expect(page.getByTestId('mobile-drawer')).toBeHidden();

	await page.getByTestId('mobile-bottom-nav').getByRole('button', { name: 'More' }).click();
	await expect(page.getByTestId('mobile-sheet')).toBeVisible();
	await page.getByRole('button', { name: 'Close details sheet' }).click();
	await expect(page.getByTestId('mobile-sheet')).toBeHidden();
	await expectNoHorizontalOverflow(page);
});
