import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import type { PleromaInstance, PleromaTag } from '../lib/pleroma/types';
import { setViewport } from '../test/playwright';

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

const fulfillJson = async (route: Route, body: unknown, status = 200) => {
	await route.fulfill({
		status,
		contentType: 'application/json',
		body: JSON.stringify(body)
	});
};

const mockNotifications = async (page: Page) => {
	await page.route('https://pleroma.example/api/v1/notifications**', async (route) => {
		await fulfillJson(route, []);
	});
};

const mockRailApis = async (page: Page, options: { trends: PleromaTag[]; instance: PleromaInstance }) => {
	let trendsAuthorization: string | undefined;
	let trendsLimit: string | null = null;
	let instanceAuthorization: string | undefined;
	await page.route('https://pleroma.example/api/v1/trends/tags**', async (route) => {
		trendsAuthorization = route.request().headers().authorization;
		trendsLimit = new URL(route.request().url()).searchParams.get('limit');
		await fulfillJson(route, options.trends);
	});
	await page.route('https://pleroma.example/api/v2/instance', async (route) => {
		instanceAuthorization = route.request().headers().authorization;
		await fulfillJson(route, options.instance);
	});

	return {
		trendsAuthorization: () => trendsAuthorization,
		trendsLimit: () => trendsLimit,
		instanceAuthorization: () => instanceAuthorization
	};
};

test('right rail loads trends and instance metadata from Pleroma', async ({ page }) => {
	await authenticate(page);
	await mockNotifications(page);
	const requests = await mockRailApis(page, {
		trends: pleromaFixtures.trends,
		instance: {
			...pleromaFixtures.instance,
			configuration: { statuses: { max_characters: 5000 } }
		}
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	const rail = page.getByTestId('right-rail');
	await expect(rail.getByTestId('trends-card')).toContainText('#smallweb');
	await expect(rail.getByTestId('trends-card')).toContainText('24 posts');
	await expect(rail.getByTestId('trends-card')).toContainText('#fedidevs');
	await expect(rail.getByTestId('instance-status-card')).toContainText('Pleroma Example');
	await expect(rail.getByTestId('instance-status-card')).toContainText('pleroma.example');
	await expect(rail.getByTestId('instance-status-card')).toContainText('128 active/mo');
	await expect(rail.getByTestId('instance-status-card')).toContainText('5,000 chars');
	await expect(rail.getByTestId('instance-status-card')).toContainText('3 features');
	expect(requests.trendsAuthorization()).toBe('Bearer access-token');
	expect(requests.trendsLimit()).toBe('5');
	expect(requests.instanceAuthorization()).toBe('Bearer access-token');
});

test('right rail shows loading states while trend and instance requests are pending', async ({ page }) => {
	await authenticate(page);
	await mockNotifications(page);
	await page.route('https://pleroma.example/api/v1/trends/tags**', async () => new Promise(() => undefined));
	await page.route('https://pleroma.example/api/v2/instance', async () => new Promise(() => undefined));

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	const rail = page.getByTestId('right-rail');
	await expect(rail.getByTestId('trends-card')).toContainText('Loading trends');
	await expect(rail.getByTestId('instance-status-card')).toContainText('Loading instance metadata');
});

test('right rail handles empty trend and metadata responses', async ({ page }) => {
	await authenticate(page);
	await mockNotifications(page);
	await mockRailApis(page, {
		trends: [],
		instance: {
			...pleromaFixtures.instance,
			domain: '',
			title: '',
			version: '',
			description: '',
			usage: undefined,
			pleroma: { metadata: { features: [] } }
		}
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	const rail = page.getByTestId('right-rail');
	await expect(rail.getByTestId('trends-card')).toContainText('No trends available');
	await expect(rail.getByTestId('instance-status-card')).toContainText('No instance metadata');
});

test('right rail degrades when trends or instance metadata are unavailable', async ({ page }) => {
	await authenticate(page);
	await mockNotifications(page);
	await page.route('https://pleroma.example/api/v1/trends/tags**', async (route) => {
		await fulfillJson(route, { error: 'trends disabled' }, 404);
	});
	await page.route('https://pleroma.example/api/v2/instance', async (route) => {
		await fulfillJson(route, { error: 'instance metadata disabled' }, 404);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	const rail = page.getByTestId('right-rail');
	await expect(rail.getByTestId('trends-card')).toContainText('Trends unavailable');
	await expect(rail.getByTestId('instance-status-card')).toContainText('Instance metadata unavailable');
});

test('right rail renders trend and instance request errors', async ({ page }) => {
	await authenticate(page);
	await mockNotifications(page);
	await page.route('https://pleroma.example/api/v1/trends/tags**', async (route) => {
		await fulfillJson(route, { error: 'trend server exploded' }, 500);
	});
	await page.route('https://pleroma.example/api/v2/instance', async (route) => {
		await fulfillJson(route, { error: 'instance server exploded' }, 500);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	const rail = page.getByTestId('right-rail');
	await expect(rail.getByTestId('trends-card')).toContainText('trend server exploded');
	await expect(rail.getByTestId('instance-status-card')).toContainText('instance server exploded');
});
