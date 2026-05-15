import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { normalizeInstanceUrl } from '../lib/pleroma/http';
import { expectNoHorizontalOverflow, setViewport, viewports } from '../test/playwright';

const publicInstanceUrl = normalizeInstanceUrl(process.env.PUBLIC_PLEROMA_INSTANCE_URL ?? 'https://pleroma.social');
const timelineUrl = `${publicInstanceUrl}/api/v1/timelines/public`;

const fulfillJson = async (route: Route, body: unknown, status = 200) => {
	await route.fulfill({
		status,
		contentType: 'application/json',
		body: JSON.stringify(body)
	});
};

const mockPublicTimeline = async (page: Page, handler: (route: Route, url: URL) => Promise<void>) => {
	await page.route(`${timelineUrl}**`, async (route) => {
		await handler(route, new URL(route.request().url()));
	});
};

test('anonymous public route loads local and federated timelines through the API client', async ({ page }) => {
	const requests: Array<{ local: string | null; authorization: string | null }> = [];
	await mockPublicTimeline(page, async (route, url) => {
		requests.push({ local: url.searchParams.get('local'), authorization: route.request().headers().authorization ?? null });
		await fulfillJson(route, url.searchParams.get('local') === 'true' ? [pleromaFixtures.status] : pleromaFixtures.timelines.public);
	});

	await setViewport(page, 'desktop');
	await page.goto('/public');

	await expect(page.getByRole('heading', { name: 'Public timeline' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'Local' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('public-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	await expect(page.getByTestId('public-timeline-list').getByRole('img', { name: 'quiet admin avatar' })).toHaveAttribute('src', 'https://pleroma.example/avatar.png');
	await expect(requests[0]).toEqual({ local: 'true', authorization: null });

	await page.getByRole('tab', { name: 'Federated' }).click();
	await expect(page.getByRole('tab', { name: 'Federated' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('public-timeline-list')).toContainText('@datagram@retro.social');
	await expect(requests[1]).toEqual({ local: null, authorization: null });
	await expectNoHorizontalOverflow(page);
});

test('public timeline renders empty state from mocked API response', async ({ page }) => {
	await mockPublicTimeline(page, async (route) => {
		await fulfillJson(route, []);
	});

	await page.goto('/public');

	await expect(page.getByText('No public posts yet')).toBeVisible();
	await expect(page.getByText('This Pleroma timeline returned no statuses for this slice.')).toBeVisible();
});

test('public timeline renders loading state while a request is pending', async ({ page }) => {
	let releaseRequest: () => void = () => undefined;
	const pending = new Promise<void>((resolve) => {
		releaseRequest = resolve;
	});
	await mockPublicTimeline(page, async (route) => {
		await pending;
		await fulfillJson(route, [pleromaFixtures.status]);
	});

	await page.goto('/public');
	await expect(page.getByRole('status', { name: 'Request status' })).toContainText('Loading Pleroma data');
	releaseRequest();
	await expect(page.getByTestId('public-timeline-list')).toContainText('quiet CSS can still carry the voice.');
});

test('public timeline ignores stale responses after switching tabs', async ({ page }) => {
	let releaseLocal: () => void = () => undefined;
	const localPending = new Promise<void>((resolve) => {
		releaseLocal = resolve;
	});
	await mockPublicTimeline(page, async (route, url) => {
		if (url.searchParams.get('local') === 'true') {
			await localPending;
			await fulfillJson(route, [pleromaFixtures.status]);
			return;
		}

		await fulfillJson(route, pleromaFixtures.timelines.public);
	});

	await page.goto('/public');
	await page.getByRole('tab', { name: 'Federated' }).click();
	await expect(page.getByRole('tab', { name: 'Federated' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('public-timeline-list')).toContainText('@datagram@retro.social');
	releaseLocal();
	await expect(page.getByRole('tab', { name: 'Federated' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('public-timeline-list')).toContainText('@datagram@retro.social');
});

test('public timeline stays anonymous even when OAuth storage contains a session', async ({ page }) => {
	let authorization: string | undefined;
	await page.addInitScript(() => {
		window.localStorage.setItem(
			'pleromanet.session',
			JSON.stringify({ instanceUrl: 'https://pleroma.example', accessToken: 'access-token', tokenType: 'Bearer', scope: 'read', createdAt: Date.now() })
		);
	});
	await mockPublicTimeline(page, async (route) => {
		authorization = route.request().headers().authorization;
		await fulfillJson(route, [pleromaFixtures.status]);
	});

	await page.goto('/public');

	await expect(page.getByTestId('public-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	expect(authorization).toBeUndefined();
});

test('public timeline renders retryable API errors and retries without a token', async ({ page }) => {
	let attempts = 0;
	await mockPublicTimeline(page, async (route) => {
		attempts += 1;
		expect(route.request().headers().authorization).toBeUndefined();

		if (attempts === 1) {
			await fulfillJson(route, { error: 'maintenance' }, 503);
			return;
		}

		await fulfillJson(route, [pleromaFixtures.status]);
	});

	await page.goto('/public');

	await expect(page.getByText('Pleroma server error')).toBeVisible();
	await page.getByRole('button', { name: 'Retry request' }).click();
	await expect(page.getByTestId('public-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	expect(attempts).toBe(2);
});

test('public timeline is available without OAuth storage and stays responsive', async ({ page }) => {
	await mockPublicTimeline(page, async (route) => {
		await fulfillJson(route, [pleromaFixtures.status]);
	});

	for (const viewport of [viewports.desktop, viewports.tablet, viewports.mobile]) {
		await page.setViewportSize(viewport);
		await page.goto('/public');

		await expect(page).toHaveURL('/public');
		await expect(page.getByRole('heading', { name: 'Public timeline' })).toBeVisible();
		await expect(page.getByTestId('public-timeline-list')).toBeVisible();
		await expectNoHorizontalOverflow(page);
	}
});
