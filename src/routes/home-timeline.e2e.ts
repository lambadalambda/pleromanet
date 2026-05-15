import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { expectNoHorizontalOverflow, setViewport } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000
};

const homeUrl = 'https://pleroma.example/api/v1/timelines/home**';

const authenticate = async (page: Page) => {
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

const mockHomeTimeline = async (page: Page, handler: (route: Route) => Promise<void>) => {
	await page.route(homeUrl, handler);
};

const fulfillHome = async (route: Route, body: unknown, status = 200) => {
	await route.fulfill({
		status,
		contentType: 'application/json',
		body: JSON.stringify(body)
	});
};

test('authenticated home timeline loads and renders posts through adapters', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, pleromaFixtures.timelines.home);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page.getByTestId('app-header')).toBeVisible();
	await expect(page.getByRole('tablist', { name: 'Timeline sections' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
	await expect(page.getByTestId('home-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	await expect(page.getByTestId('home-timeline-list')).toContainText('@quietadmin@pleroma.example');
	await expect(page.getByTestId('home-timeline-list')).toContainText('@datagram@retro.social');
	await expectNoHorizontalOverflow(page);
});

test('home timeline sends the OAuth token in the request', async ({ page }) => {
	await authenticate(page);
	let authorization: string | undefined;
	await mockHomeTimeline(page, async (route) => {
		authorization = route.request().headers().authorization;
		await fulfillHome(route, pleromaFixtures.timelines.home);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page.getByTestId('home-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	expect(authorization).toBe('Bearer access-token');
});

test('home timeline renders repeated mention separators without duplicate keyed blocks', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [
			{
				...pleromaFixtures.status,
				id: 'status-repeated-separators',
				content: '<p>@one  @two  @three</p>',
				pleroma: {
					...pleromaFixtures.status.pleroma,
					content: { 'text/plain': '@one  @two  @three' }
				}
			}
		]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page.getByTestId('home-timeline-list')).toContainText('@one  @two  @three');
});

test('home timeline renders empty state from mocked API response', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, []);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page.getByText('No posts yet')).toBeVisible();
	await expect(page.getByText('Your home timeline is empty. Follow accounts to see posts here.')).toBeVisible();
});

test('home timeline renders loading state while a request is pending', async ({ page }) => {
	await authenticate(page);
	let releaseRequest: () => void = () => undefined;
	const pending = new Promise<void>((resolve) => {
		releaseRequest = resolve;
	});
	await mockHomeTimeline(page, async (route) => {
		await pending;
		await fulfillHome(route, pleromaFixtures.timelines.home);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect(page.getByRole('status', { name: 'Request status' })).toContainText('Loading Pleroma data');
	releaseRequest();
	await expect(page.getByTestId('home-timeline-list')).toContainText('quiet CSS can still carry the voice.');
});

test('home timeline renders retryable API errors and retries with a token', async ({ page }) => {
	await authenticate(page);
	let attempts = 0;
	await mockHomeTimeline(page, async (route) => {
		attempts += 1;
		expect(route.request().headers().authorization).toBe('Bearer access-token');

		if (attempts === 1) {
			await fulfillHome(route, { error: 'maintenance' }, 503);
			return;
		}

		await fulfillHome(route, pleromaFixtures.timelines.home);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page.getByText('Pleroma server error')).toBeVisible();
	await page.getByRole('button', { name: 'Retry request' }).click();
	await expect(page.getByTestId('home-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	expect(attempts).toBe(2);
});

test('home timeline 401 response triggers sign-out and root redirect', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, { error: 'The access token is invalid' }, 401);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: /quieter corner of the social web/i })).toBeVisible();
});

test('home timeline 403 response triggers sign-out and root redirect', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, { error: 'not authorized' }, 403);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: /quieter corner of the social web/i })).toBeVisible();
});

test('home timeline stays responsive at desktop, tablet, and mobile', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, pleromaFixtures.timelines.home);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect(page.getByTestId('home-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	await expectNoHorizontalOverflow(page);

	await setViewport(page, 'tablet');
	await page.goto('/app/home');
	await expect(page.getByTestId('home-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	await expectNoHorizontalOverflow(page);

	await setViewport(page, 'mobile');
	await page.goto('/app/home');
	await expect(page.getByTestId('home-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	await expectNoHorizontalOverflow(page);
});
