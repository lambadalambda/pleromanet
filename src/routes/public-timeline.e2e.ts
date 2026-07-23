import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { normalizeInstanceUrl } from '../lib/pleroma/http';
import { expectNoHorizontalOverflow, setViewport, viewports } from '../test/playwright';

const publicInstanceUrl = normalizeInstanceUrl(process.env.PUBLIC_PLEROMA_INSTANCE_URL ?? 'https://pleroma.social');
const timelineUrl = `${publicInstanceUrl}/api/v1/timelines/public`;

const fulfillJson = async (route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) => {
	await route.fulfill({
		status,
		contentType: 'application/json',
		headers: headers.link ? { 'access-control-expose-headers': 'link', ...headers } : headers,
		body: JSON.stringify(body)
	});
};

const statusWithText = (id: string, text: string) => ({
	...pleromaFixtures.status,
	id,
	uri: `https://pleroma.example/objects/${id}`,
	url: `https://pleroma.example/notice/${id}`,
	content: `<p>${text}</p>`,
	pleroma: {
		...pleromaFixtures.status.pleroma,
		content: { 'text/plain': text }
	}
});

const mockPublicTimeline = async (page: Page, handler: (route: Route, url: URL) => Promise<void>) => {
	await page.route(`${timelineUrl}**`, async (route) => {
		await handler(route, new URL(route.request().url()));
	});
};

test('anonymous public route loads local and federated timelines through the API client', async ({ page }) => {
	const requests: Array<{ local: string | null; authorization: string | null }> = [];
	const localStatus = {
		...pleromaFixtures.status,
		visibility: 'unlisted' as const,
		media_attachments: [{ id: 'public-image', type: 'image', url: 'https://cdn.example/public-image.jpg', description: 'public image' }]
	};
	await page.addInitScript(() => window.localStorage.setItem('pleromanet.timeline.fit-images', 'true'));
	await mockPublicTimeline(page, async (route, url) => {
		requests.push({ local: url.searchParams.get('local'), authorization: route.request().headers().authorization ?? null });
		await fulfillJson(route, url.searchParams.get('local') === 'true' ? [localStatus] : pleromaFixtures.timelines.public);
	});

	await setViewport(page, 'desktop');
	await page.goto('/public');

	await expect(page.getByRole('heading', { name: 'Public timeline' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'Local' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('public-timeline-list')).toContainText('quiet CSS can still carry the voice.');
	await expect(page.getByTestId('public-timeline-list').getByLabel('Visibility: Unlisted')).toBeVisible();
	await expect(page.getByTestId('public-timeline-list').getByRole('img', { name: 'quiet admin avatar' })).toHaveAttribute('src', 'https://pleroma.example/avatar.png');
	await expect(page.getByTestId('public-timeline-list').locator('.ph-raw')).toHaveCSS('object-fit', 'cover');
	await expect(requests[0]).toEqual({ local: 'true', authorization: null });

	await page.getByRole('tab', { name: 'Federated' }).click();
	await expect(page.getByRole('tab', { name: 'Federated' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('public-timeline-list')).toContainText('@datagram@retro.social');
	await expect(requests[1]).toEqual({ local: null, authorization: null });
	await expectNoHorizontalOverflow(page);
});

test('anonymous public route renders account and status custom emoji', async ({ page }) => {
	const emojiStatus = {
		...statusWithText('public-custom-emoji', 'public body :blobcat:'),
		account: {
			...pleromaFixtures.account,
			display_name: 'quiet :tux:',
			emojis: [{ shortcode: 'tux', url: 'https://cdn.example/emoji/tux.png', static_url: 'https://cdn.example/emoji/tux-static.png' }]
		},
		emojis: [{ shortcode: 'blobcat', url: 'https://cdn.example/emoji/blobcat.png', static_url: 'https://cdn.example/emoji/blobcat-static.png' }]
	};
	await mockPublicTimeline(page, async (route) => fulfillJson(route, [emojiStatus]));

	await page.goto('/public');

	const post = page.locator('[data-status-id="public-custom-emoji"]');
	await expect(post.locator('.post-name img[alt=":tux:"]')).toHaveAttribute('src', 'https://cdn.example/emoji/tux.png');
	await expect(post.locator('.post-body img[alt=":blobcat:"]')).toHaveAttribute('src', 'https://cdn.example/emoji/blobcat.png');
	await expect(post).not.toContainText(':tux:');
	await expect(post).not.toContainText(':blobcat:');
});

test('anonymous public route keeps CW bodies and sensitive media concealed', async ({ page }) => {
	let hiddenEmojiRequests = 0;
	let hiddenMediaRequests = 0;
	await page.route('https://cdn.example/emoji/secret.png', async (route) => {
		hiddenEmojiRequests += 1;
		await route.fulfill({ status: 204 });
	});
	await page.route('https://cdn.example/hidden-*.png', async (route) => {
		hiddenMediaRequests += 1;
		await route.fulfill({ status: 204 });
	});
	const cwStatus = {
		...statusWithText('public-cw', 'hidden :secret: body'),
		spoiler_text: 'public :warning:',
		emojis: [
			{ shortcode: 'secret', url: 'https://cdn.example/emoji/secret.png', static_url: 'https://cdn.example/emoji/secret-static.png' },
			{ shortcode: 'warning', url: 'https://cdn.example/emoji/warning.png', static_url: 'https://cdn.example/emoji/warning-static.png' }
		],
		media_attachments: [{ id: 'cw-media', type: 'image', url: 'https://cdn.example/hidden-cw.png', description: 'hidden CW image' }],
		pleroma: {
			...pleromaFixtures.status.pleroma,
			content: { 'text/plain': 'hidden :secret: body' },
			spoiler_text: { 'text/plain': 'public :warning:' }
		}
	};
	const sensitiveStatus = {
		...statusWithText('public-sensitive', 'visible sensitive caption'),
		sensitive: true,
		media_attachments: [{ id: 'sensitive-media', type: 'image', url: 'https://cdn.example/hidden-sensitive.png', description: 'hidden sensitive image' }]
	};
	await mockPublicTimeline(page, async (route) => fulfillJson(route, [cwStatus, sensitiveStatus]));

	await page.goto('/public');

	const cwPost = page.locator('[data-status-id="public-cw"]');
	await expect(cwPost.locator('.post-cw-summary img[alt=":warning:"]')).toHaveAttribute('src', 'https://cdn.example/emoji/warning.png');
	await expect(cwPost).not.toContainText('hidden body');
	await expect(cwPost.locator('img[alt=":secret:"]')).toHaveCount(0);
	await expect(page.locator('[data-status-id="public-sensitive"] .post-sensitive-media')).toBeVisible();
	await expect.poll(() => hiddenEmojiRequests).toBe(0);
	await expect.poll(() => hiddenMediaRequests).toBe(0);
});

test('public timeline loads a next cursor page and deduplicates overlapping statuses', async ({ page }) => {
	const requestedMaxIds: Array<string | null> = [];
	await mockPublicTimeline(page, async (route, url) => {
		const maxId = url.searchParams.get('max_id');
		requestedMaxIds.push(maxId);

		if (maxId === 'status-1') {
			await fulfillJson(route, [pleromaFixtures.status, statusWithText('status-public-2', 'older public pagination post')]);
			return;
		}

		await fulfillJson(route, [pleromaFixtures.status], 200, {
			link: `<${timelineUrl}?local=true&max_id=status-1>; rel="next"`
		});
	});

	await page.goto('/public');

	const list = page.getByTestId('public-timeline-list');
	await expect(list).toContainText('quiet CSS can still carry the voice.');
	await page.getByRole('button', { name: 'Load more' }).click();
	await expect(list).toContainText('older public pagination post');
	await expect(page.locator('[data-status-id="status-1"]')).toHaveCount(1);
	await expect(page.locator('[data-status-id="status-public-2"]')).toHaveCount(1);
	await expect(page.locator('[data-action-status-id="status-public-2"]')).toHaveCount(1);
	expect(requestedMaxIds).toEqual([null, 'status-1']);
});

test('public timeline retries load-more errors with the same cursor', async ({ page }) => {
	let nextAttempts = 0;
	const requestedMaxIds: Array<string | null> = [];
	await mockPublicTimeline(page, async (route, url) => {
		const maxId = url.searchParams.get('max_id');
		requestedMaxIds.push(maxId);

		if (maxId !== 'status-1') {
			await fulfillJson(route, [pleromaFixtures.status], 200, {
				link: `<${timelineUrl}?local=true&max_id=status-1>; rel="next"`
			});
			return;
		}

		nextAttempts += 1;
		if (nextAttempts === 1) {
			await fulfillJson(route, { error: 'maintenance' }, 503);
			return;
		}

		await fulfillJson(route, [statusWithText('status-public-retry', 'older public post after retry')]);
	});

	await page.goto('/public');

	const list = page.getByTestId('public-timeline-list');
	await expect(list).toContainText('quiet CSS can still carry the voice.');
	await page.getByRole('button', { name: 'Load more' }).click();
	await expect(page.getByText('Pleroma server error')).toBeVisible();
	await expect(list).toContainText('quiet CSS can still carry the voice.');
	await page.getByRole('button', { name: 'Retry load more' }).click();
	await expect(list).toContainText('older public post after retry');
	expect(nextAttempts).toBe(2);
	expect(requestedMaxIds).toEqual([null, 'status-1', 'status-1']);
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
