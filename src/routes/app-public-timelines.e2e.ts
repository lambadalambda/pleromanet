import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { expectNoHorizontalOverflow, mockRightRailApis, setViewport } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};
const timelineUrl = 'https://pleroma.example/api/v1/timelines/public';
const customEmojisUrl = 'https://pleroma.example/api/v1/custom_emojis';
const notificationsUrl = 'https://pleroma.example/api/v1/notifications**';

const authenticate = async (page: Page) => {
	await mockRightRailApis(page);
	await page.route(customEmojisUrl, async (route) => {
		await fulfillTimeline(route, pleromaFixtures.customEmojis);
	});
	await page.route(notificationsUrl, async (route) => {
		await fulfillTimeline(route, pleromaFixtures.notifications);
	});
	await page.addInitScript((storedSession) => {
		type MockSocket = {
			url: string;
			closeCalled: boolean;
			onopen: ((event: Event) => void) | null;
			onmessage: ((event: { data: string }) => void) | null;
			onerror: ((event: Event) => void) | null;
			onclose: ((event: Event) => void) | null;
			close: () => void;
		};
		const testWindow = window as typeof window & { __pleromanetSockets?: MockSocket[] };
		if (!testWindow.__pleromanetSockets) {
			testWindow.__pleromanetSockets = [];
			const MockWebSocket = function (url: string) {
				const socket: MockSocket = {
					url,
					closeCalled: false,
					onopen: null,
					onmessage: null,
					onerror: null,
					onclose: null,
					close() {
						this.closeCalled = true;
					}
				};
				testWindow.__pleromanetSockets?.push(socket);
				return socket;
			} as unknown as new (url: string) => MockSocket;

			Object.defineProperty(window, 'WebSocket', { configurable: true, value: MockWebSocket });
		}

		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

const fulfillTimeline = async (route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) => {
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

const statusWithImage = (id: string, text: string) => ({
	...statusWithText(id, text),
	media_attachments: [{
		id: `${id}-image`,
		type: 'image',
		url: `https://cdn.example/media/${id}.jpg`,
		preview_url: `https://cdn.example/media/${id}-preview.jpg`,
		description: `${text} image`
	}]
});

const mockAppPublicTimeline = async (page: Page, handler: (route: Route, url: URL) => Promise<void>) => {
	await page.route(`${timelineUrl}**`, async (route) => {
		await handler(route, new URL(route.request().url()));
	});
};

const streamSocketUrls = async (page: Page) => page.evaluate(() => {
	const testWindow = window as typeof window & { __pleromanetSockets?: Array<{ url: string }> };
	return testWindow.__pleromanetSockets?.map((socket) => socket.url) ?? [];
});

const streamSockets = async (page: Page, stream: 'public' | 'public:local') => page.evaluate((streamName) => {
	type MockSocket = { url: string; closeCalled: boolean };
	const testWindow = window as typeof window & { __pleromanetSockets?: MockSocket[] };
	return (testWindow.__pleromanetSockets ?? [])
		.filter((socket) => new URL(socket.url).searchParams.get('stream') === streamName)
		.map((socket) => ({ url: socket.url, closeCalled: socket.closeCalled }));
}, stream);

const emitStreamUpdate = async (page: Page, stream: 'public' | 'public:local', status: unknown) => {
	await page.evaluate(({ streamName, nextStatus }) => {
		type MockSocket = { url: string; onmessage: ((event: { data: string }) => void) | null };
		const testWindow = window as typeof window & { __pleromanetSockets?: MockSocket[] };
		const socket = testWindow.__pleromanetSockets?.find((candidate) => new URL(candidate.url).searchParams.get('stream') === streamName);
		socket?.onmessage?.({ data: JSON.stringify({ event: 'update', payload: JSON.stringify(nextStatus) }) });
	}, { streamName: stream, nextStatus: status });
};

const emitStreamError = async (page: Page, stream: 'public' | 'public:local') => {
	await page.evaluate((streamName) => {
		type MockSocket = { url: string; onerror: ((event: Event) => void) | null };
		const testWindow = window as typeof window & { __pleromanetSockets?: MockSocket[] };
		const socket = testWindow.__pleromanetSockets?.find((candidate) => new URL(candidate.url).searchParams.get('stream') === streamName);
		socket?.onerror?.(new Event('error'));
	}, stream);
};

const emitStreamOpen = async (page: Page, stream: 'public' | 'public:local') => {
	await page.evaluate((streamName) => {
		type MockSocket = { url: string; onopen: ((event: Event) => void) | null };
		const testWindow = window as typeof window & { __pleromanetSockets?: MockSocket[] };
		const socket = testWindow.__pleromanetSockets
			?.filter((candidate) => new URL(candidate.url).searchParams.get('stream') === streamName)
			.at(-1);
		socket?.onopen?.(new Event('open'));
	}, stream);
};

test('authenticated local and federated app timelines load public data through the API client', async ({ page }) => {
	await authenticate(page);
	const requests: Array<{ local: string | null; authorization: string | null }> = [];
	await mockAppPublicTimeline(page, async (route, url) => {
		requests.push({ local: url.searchParams.get('local'), authorization: route.request().headers().authorization ?? null });
		await fulfillTimeline(
			route,
			url.searchParams.get('local') === 'true'
				? [statusWithText('status-local-app', 'local app timeline post from the instance')]
				: [statusWithText('status-federated-app', 'federated app timeline post from the network')]
		);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	await expect(page.getByTestId('app-content').getByRole('heading', { name: 'Local timeline' })).toHaveCount(0);
	await expect(page.getByTestId('app-content')).not.toContainText('Posts from this Pleroma instance');
	await expect(page.getByRole('tab', { name: 'Local' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('local app timeline post from the instance');
	expect(requests[0]).toEqual({ local: 'true', authorization: 'Bearer access-token' });

	await page.getByRole('tab', { name: 'Federated' }).click();
	await expect(page).toHaveURL('/app/federated');
	await expect(page.getByTestId('app-content').getByRole('heading', { name: 'Federated timeline' })).toHaveCount(0);
	await expect(page.getByTestId('app-content')).not.toContainText('Public posts from across the federation');
	await expect(page.getByRole('tab', { name: 'Federated' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('federated app timeline post from the network');
	expect(requests[1]).toEqual({ local: null, authorization: 'Bearer access-token' });
	await expectNoHorizontalOverflow(page);
});

test('app public timelines use the home feed surface and stream newer posts', async ({ page }) => {
	await authenticate(page);
	await mockAppPublicTimeline(page, async (route, url) => {
		await fulfillTimeline(
			route,
			url.searchParams.get('local') === 'true'
				? [statusWithText('status-local-start', 'local app first streamed baseline')]
				: [statusWithText('status-federated-start', 'federated app first streamed baseline')]
		);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	const list = page.getByTestId('app-public-timeline-list');
	await expect(page.getByRole('tablist', { name: 'Timeline sections' })).toBeVisible();
	await expect(page.getByTestId('app-content').getByRole('heading', { name: /timeline/i })).toHaveCount(0);
	await expect(list).toContainText('local app first streamed baseline');
	await expect.poll(() => streamSocketUrls(page)).toContain('wss://pleroma.example/api/v1/streaming/?stream=public%3Alocal&access_token=access-token');

	await emitStreamUpdate(page, 'public:local', statusWithText('status-local-stream', 'fresh local stream post'));
	const localIndicator = page.getByTestId('timeline-header-actions').getByRole('button', { name: '1 new posts' });
	await expect(localIndicator).toBeVisible();
	await expect(page.getByRole('tablist', { name: 'Timeline sections' }).getByRole('button', { name: '1 new posts' })).toHaveCount(0);
	await expect(list).not.toContainText('fresh local stream post');
	await localIndicator.click();
	await expect(list).toContainText('fresh local stream post');

	await page.getByRole('tab', { name: 'Federated' }).click();
	await expect(page).toHaveURL('/app/federated');
	await expect(page.getByTestId('app-content').getByRole('heading', { name: /timeline/i })).toHaveCount(0);
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('federated app first streamed baseline');
	await expect.poll(() => streamSocketUrls(page)).toContain('wss://pleroma.example/api/v1/streaming/?stream=public&access_token=access-token');

	await emitStreamUpdate(page, 'public', statusWithText('status-federated-stream', 'fresh federated stream post'));
	const federatedIndicator = page.getByTestId('timeline-header-actions').getByRole('button', { name: '1 new posts' });
	await expect(federatedIndicator).toBeVisible();
	await federatedIndicator.click();
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('fresh federated stream post');
});

test('timeline auto-insert preference applies across local and federated streams', async ({ page }) => {
	await authenticate(page);
	await mockAppPublicTimeline(page, async (route, url) => {
		const prefix = url.searchParams.get('local') === 'true' ? 'local' : 'federated';
		await fulfillTimeline(route, Array.from({ length: 18 }, (_, index) => statusWithText(`${prefix}-${index}`, `${prefix} existing post ${index}`)));
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');
	let list = page.getByTestId('app-public-timeline-list');
	await expect(list).toContainText('local existing post 0');
	await page.getByRole('button', { name: 'Timeline settings' }).click();
	await page.getByRole('switch', { name: 'Automatically add new posts at the top' }).click();
	await page.keyboard.press('Escape');

	await emitStreamUpdate(page, 'public:local', statusWithText('local-auto', 'automatically inserted local post'));
	await expect(list).toContainText('automatically inserted local post');
	await page.getByRole('tab', { name: 'Federated' }).click();
	list = page.getByTestId('app-public-timeline-list');
	await expect(list).toContainText('federated existing post 0');
	await emitStreamUpdate(page, 'public', statusWithText('federated-auto', 'automatically inserted federated post'));
	await expect(list).toContainText('automatically inserted federated post');

	await page.evaluate(() => {
		window.scrollTo(0, document.body.scrollHeight);
		window.dispatchEvent(new Event('scroll'));
	});
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
	await emitStreamUpdate(page, 'public', statusWithText('federated-queued', 'queued federated post'));
	await expect(list).not.toContainText('queued federated post');
	await expect(page.getByRole('button', { name: '1 new posts' })).toBeVisible();
});

test('fit-images preference applies across local and federated timelines', async ({ page }) => {
	await authenticate(page);
	await mockAppPublicTimeline(page, async (route, url) => {
		const scope = url.searchParams.get('local') === 'true' ? 'local' : 'federated';
		await fulfillTimeline(route, [statusWithImage(`${scope}-fit-image`, `${scope} fitted image`)]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');
	let list = page.getByTestId('app-public-timeline-list');
	let image = list.locator('[data-status-id="local-fit-image"] .ph-raw');
	await expect(image).toHaveCSS('object-fit', 'cover');
	await page.getByRole('button', { name: 'Timeline settings' }).click();
	await page.getByRole('switch', { name: 'Fit images' }).click();
	await expect(image).toHaveCSS('object-fit', 'contain');

	await page.getByRole('tab', { name: 'Federated' }).click();
	list = page.getByTestId('app-public-timeline-list');
	image = list.locator('[data-status-id="federated-fit-image"] .ph-raw');
	await expect(image).toHaveCSS('object-fit', 'contain');
	await page.getByRole('tab', { name: 'Local' }).click();
	await expect(page.getByTestId('app-public-timeline-list').locator('[data-status-id="local-fit-image"] .ph-raw')).toHaveCSS('object-fit', 'contain');
});

test('app public timeline reconnects streams after failures', async ({ page }) => {
	await page.clock.install();
	await authenticate(page);
	const requestedSinceIds: Array<string | null> = [];
	await mockAppPublicTimeline(page, async (route, url) => {
		const sinceId = url.searchParams.get('since_id');
		requestedSinceIds.push(sinceId);
		await fulfillTimeline(route, sinceId
			? [statusWithText('status-local-catch-up', 'local post missed during outage')]
			: [statusWithText('status-local-reconnect', 'local reconnect baseline')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	await expect(page.getByTestId('app-public-timeline-list')).toContainText('local reconnect baseline');
	await expect.poll(async () => (await streamSockets(page, 'public:local')).length).toBe(1);
	await emitStreamError(page, 'public:local');
	await expect.poll(async () => (await streamSockets(page, 'public:local'))[0]?.closeCalled).toBe(true);
	await expect.poll(() => requestedSinceIds).toEqual([null, 'status-local-reconnect']);
	await page.getByRole('button', { name: '1 new posts' }).click();
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('local post missed during outage');

	await page.clock.fastForward(60_000);
	await expect.poll(async () => (await streamSockets(page, 'public:local')).length).toBe(2);
	await emitStreamOpen(page, 'public:local');
	await expect.poll(() => requestedSinceIds.length).toBeGreaterThanOrEqual(3);
	expect(requestedSinceIds.slice(0, 2)).toEqual([null, 'status-local-reconnect']);
	expect(requestedSinceIds.slice(2).every((sinceId) => sinceId === 'status-local-catch-up')).toBe(true);
});

test('app public timeline rechecks after reconnect opens during catch-up', async ({ page }) => {
	await page.clock.install();
	await authenticate(page);
	let releaseFirstCatchUp: () => void = () => undefined;
	let markFirstCatchUpStarted: () => void = () => undefined;
	const firstCatchUpStarted = new Promise<void>((resolve) => {
		markFirstCatchUpStarted = resolve;
	});
	const firstCatchUpPending = new Promise<void>((resolve) => {
		releaseFirstCatchUp = resolve;
	});
	const requestedSinceIds: Array<string | null> = [];
	await mockAppPublicTimeline(page, async (route, url) => {
		const sinceId = url.searchParams.get('since_id');
		requestedSinceIds.push(sinceId);
		if (sinceId === 'status-local-race-baseline') {
			markFirstCatchUpStarted();
			await firstCatchUpPending;
			await fulfillTimeline(route, [statusWithText('status-local-race-2', 'post at stream failure')]);
			return;
		}
		if (sinceId === 'status-local-race-2') {
			await fulfillTimeline(route, [statusWithText('status-local-race-3', 'post before reconnect opened')]);
			return;
		}
		await fulfillTimeline(route, [statusWithText('status-local-race-baseline', 'reconnect race baseline')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');
	await expect.poll(async () => (await streamSockets(page, 'public:local')).length).toBe(1);
	await emitStreamError(page, 'public:local');
	await firstCatchUpStarted;
	await page.clock.fastForward(60_000);
	await expect.poll(async () => (await streamSockets(page, 'public:local')).length).toBeGreaterThanOrEqual(2);
	await emitStreamOpen(page, 'public:local');
	await releaseFirstCatchUp();

	await expect.poll(() => requestedSinceIds).toEqual([null, 'status-local-race-baseline', 'status-local-race-2']);
	await page.getByRole('button', { name: '2 new posts' }).click();
	const list = page.getByTestId('app-public-timeline-list');
	await expect(list).toContainText('post at stream failure');
	await expect(list).toContainText('post before reconnect opened');
	const renderedStatusIds = await page.locator('[data-status-id]').evaluateAll((nodes) => nodes.slice(0, 3).map((node) => node.getAttribute('data-status-id')));
	expect(renderedStatusIds).toEqual(['status-local-race-3', 'status-local-race-2', 'status-local-race-baseline']);
});

test('app public timeline retries a failed catch-up while the stream remains open', async ({ page }) => {
	await page.clock.install();
	await authenticate(page);
	let catchUpAttempts = 0;
	await mockAppPublicTimeline(page, async (route, url) => {
		const sinceId = url.searchParams.get('since_id');
		if (sinceId) {
			catchUpAttempts += 1;
			if (catchUpAttempts === 1) {
				await fulfillTimeline(route, { error: 'temporary outage' }, 503);
				return;
			}
			await fulfillTimeline(route, [statusWithText('status-local-retry-catch-up', 'post recovered after catch-up retry')]);
			return;
		}
		await fulfillTimeline(route, [statusWithText('status-local-retry-baseline', 'catch-up retry baseline')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('catch-up retry baseline');
	await expect.poll(async () => (await streamSockets(page, 'public:local')).length).toBe(1);
	await emitStreamError(page, 'public:local');
	await expect.poll(() => catchUpAttempts).toBe(1);
	await page.clock.fastForward(60_000);

	await expect.poll(() => catchUpAttempts).toBeGreaterThanOrEqual(2);
	await page.getByRole('button', { name: '1 new posts' }).click();
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('post recovered after catch-up retry');
});

test('app public timeline replaces a stream that never opens', async ({ page }) => {
	await page.clock.install();
	await authenticate(page);
	await mockAppPublicTimeline(page, async (route) => {
		await fulfillTimeline(route, [statusWithText('status-local-stalled', 'local stalled baseline')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');
	await expect.poll(async () => (await streamSockets(page, 'public:local')).length).toBe(1);

	await page.clock.fastForward(30_000);
	await expect.poll(async () => (await streamSockets(page, 'public:local'))[0]?.closeCalled).toBe(true);
	await page.clock.fastForward(60_000);
	await expect.poll(async () => (await streamSockets(page, 'public:local')).length).toBe(2);
});

test('app public timeline catches up after returning to a retained route', async ({ page }) => {
	await authenticate(page);
	const localSinceIds: Array<string | null> = [];
	await mockAppPublicTimeline(page, async (route, url) => {
		const isLocal = url.searchParams.get('local') === 'true';
		const sinceId = url.searchParams.get('since_id');
		if (isLocal) localSinceIds.push(sinceId);
		if (isLocal && sinceId) {
			await fulfillTimeline(route, [statusWithText('status-local-returned', 'local post missed on another route')]);
			return;
		}
		await fulfillTimeline(route, [isLocal
			? statusWithText('status-local-retained', 'local retained baseline')
			: statusWithText('status-federated-away', 'federated route baseline')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('local retained baseline');
	await page.getByRole('tab', { name: 'Federated' }).click();
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('federated route baseline');
	await page.goBack();
	await emitStreamOpen(page, 'public:local');

	await expect.poll(() => localSinceIds).toEqual([null, 'status-local-retained']);
	await page.getByRole('button', { name: '1 new posts' }).click();
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('local post missed on another route');
});

test('stale local catch-up cannot consume a federated reconnect recheck', async ({ page }) => {
	await authenticate(page);
	let releaseLocalCatchUp: () => void = () => undefined;
	let markLocalCatchUpStarted: () => void = () => undefined;
	let releaseFederatedCatchUp: () => void = () => undefined;
	let markFederatedCatchUpStarted: () => void = () => undefined;
	const localCatchUpStarted = new Promise<void>((resolve) => {
		markLocalCatchUpStarted = resolve;
	});
	const localCatchUpPending = new Promise<void>((resolve) => {
		releaseLocalCatchUp = resolve;
	});
	const federatedCatchUpStarted = new Promise<void>((resolve) => {
		markFederatedCatchUpStarted = resolve;
	});
	const federatedCatchUpPending = new Promise<void>((resolve) => {
		releaseFederatedCatchUp = resolve;
	});
	const federatedSinceIds: Array<string | null> = [];
	await mockAppPublicTimeline(page, async (route, url) => {
		const isLocal = url.searchParams.get('local') === 'true';
		const sinceId = url.searchParams.get('since_id');
		if (isLocal && sinceId) {
			markLocalCatchUpStarted();
			await localCatchUpPending;
			await fulfillTimeline(route, [statusWithText('status-stale-local', 'stale local catch-up result')]);
			return;
		}
		if (!isLocal) federatedSinceIds.push(sinceId);
		if (sinceId === 'status-federated-race-baseline') {
			markFederatedCatchUpStarted();
			await federatedCatchUpPending;
			await fulfillTimeline(route, [statusWithText('status-federated-race-2', 'federated first recovery')]);
			return;
		}
		if (sinceId === 'status-federated-race-2') {
			await fulfillTimeline(route, [statusWithText('status-federated-race-3', 'federated reconnect recovery')]);
			return;
		}
		await fulfillTimeline(route, [isLocal
			? statusWithText('status-local-race-route', 'local route race baseline')
			: statusWithText('status-federated-race-baseline', 'federated route race baseline')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('local route race baseline');
	await page.evaluate(() => window.dispatchEvent(new Event('pleromanet:check-home-timeline')));
	await localCatchUpStarted;
	await page.getByRole('tab', { name: 'Federated' }).click();
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('federated route race baseline');
	await page.evaluate(() => window.dispatchEvent(new Event('pleromanet:check-home-timeline')));
	await federatedCatchUpStarted;
	await emitStreamOpen(page, 'public');
	const staleLocalResponsePromise = page.waitForResponse((response) => {
		const url = new URL(response.url());
		return url.pathname === '/api/v1/timelines/public' && url.searchParams.get('local') === 'true' && Boolean(url.searchParams.get('since_id'));
	});
	await releaseLocalCatchUp();
	const staleLocalResponse = await staleLocalResponsePromise;
	await staleLocalResponse.finished();
	await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
	await releaseFederatedCatchUp();

	await expect.poll(() => federatedSinceIds).toEqual([null, 'status-federated-race-baseline', 'status-federated-race-2']);
	await page.getByRole('button', { name: '2 new posts' }).click();
	const list = page.getByTestId('app-public-timeline-list');
	await expect(list).toContainText('federated first recovery');
	await expect(list).toContainText('federated reconnect recovery');
});

test('app public timeline new-post header action fits mobile', async ({ page }) => {
	await authenticate(page);
	await mockAppPublicTimeline(page, async (route, url) => {
		await fulfillTimeline(
			route,
			url.searchParams.get('local') === 'true'
				? [statusWithText('status-local-mobile', 'local mobile baseline')]
				: [statusWithText('status-federated-mobile', 'federated mobile baseline')]
		);
	});

	await setViewport(page, 'mobile');
	await page.goto('/app/local');

	await expect(page.getByTestId('app-public-timeline-list')).toContainText('local mobile baseline');
	await emitStreamUpdate(page, 'public:local', statusWithText('status-local-mobile-stream', 'fresh local mobile stream post'));
	await expect(page.getByTestId('timeline-header-actions').getByRole('button', { name: '1 new posts' })).toBeVisible();
	await expectNoHorizontalOverflow(page);

	await page.goto('/app/federated');
	await expect(page.getByRole('tab', { name: 'Federated' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('federated mobile baseline');
	await emitStreamUpdate(page, 'public', statusWithText('status-federated-mobile-stream', 'fresh federated mobile stream post'));
	await expect(page.getByTestId('timeline-header-actions').getByRole('button', { name: '1 new posts' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'Federated' })).toBeInViewport();
	await expectNoHorizontalOverflow(page);
});

test('app public timelines load older pages and deduplicate overlapping statuses', async ({ page }) => {
	await authenticate(page);
	const requestedMaxIds: Array<string | null> = [];
	const requestedLocalParams: Array<string | null> = [];
	await mockAppPublicTimeline(page, async (route, url) => {
		const maxId = url.searchParams.get('max_id');
		requestedMaxIds.push(maxId);
		requestedLocalParams.push(url.searchParams.get('local'));

		if (maxId === 'status-local-app-1') {
			await fulfillTimeline(route, [
				statusWithText('status-local-app-1', 'local app first page post'),
				statusWithText('status-local-app-2', 'older local app pagination post')
			]);
			return;
		}

		await fulfillTimeline(route, [statusWithText('status-local-app-1', 'local app first page post')], 200, {
			link: `<${timelineUrl}?local=true&max_id=status-local-app-1>; rel="next"`
		});
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	const list = page.getByTestId('app-public-timeline-list');
	await expect(list).toContainText('local app first page post');
	await page.getByRole('button', { name: 'Load more' }).click();
	await expect(list).toContainText('older local app pagination post');
	await expect(page.locator('[data-status-id="status-local-app-1"]')).toHaveCount(1);
	await expect(page.locator('[data-status-id="status-local-app-2"]')).toHaveCount(1);
	expect(requestedMaxIds).toEqual([null, 'status-local-app-1']);
	expect(requestedLocalParams).toEqual(['true', 'true']);
});

test('local and federated timelines retain independent pages and history scroll', async ({ page }) => {
	await authenticate(page);
	const requests: Array<{ local: string | null; maxId: string | null }> = [];
	await mockAppPublicTimeline(page, async (route, url) => {
		const local = url.searchParams.get('local');
		const maxId = url.searchParams.get('max_id');
		requests.push({ local, maxId });
		if (local === 'true' && maxId === 'retained-local-12') {
			await fulfillTimeline(route, Array.from({ length: 12 }, (_, index) => statusWithText(`retained-local-${index + 13}`, `retained older local post ${index + 13}`)), 200, {
				link: `<${timelineUrl}?local=true&max_id=retained-local-24>; rel="next"`
			});
			return;
		}
		if (local === 'true') {
			await fulfillTimeline(route, Array.from({ length: 12 }, (_, index) => statusWithText(`retained-local-${index + 1}`, `retained local post ${index + 1}`)), 200, {
				link: `<${timelineUrl}?local=true&max_id=retained-local-12>; rel="next"`
			});
			return;
		}
		await fulfillTimeline(route, Array.from({ length: 12 }, (_, index) => statusWithText(`retained-federated-${index + 1}`, `retained federated post ${index + 1}`)));
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');
	await page.getByRole('button', { name: 'Load more' }).click();
	const olderLocalPost = page.locator('[data-status-id="retained-local-18"]');
	await expect(olderLocalPost).toContainText('retained older local post 18');
	await olderLocalPost.scrollIntoViewIfNeeded();
	const localScroll = await page.evaluate(() => window.scrollY);
	expect(localScroll).toBeGreaterThan(500);

	await page.getByRole('tab', { name: 'Federated' }).click();
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('retained federated post 1');
	await expect(page.getByTestId('app-public-timeline-list')).not.toContainText('retained local post 1');
	await page.goBack();

	await expect(page).toHaveURL('/app/local');
	await expect(olderLocalPost).toContainText('retained older local post 18');
	await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
	await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - localScroll)).toBeLessThanOrEqual(12);
	const replacementStreamClosed = await page.evaluate((staleStatus) => {
		type MockSocket = {
			url: string;
			closeCalled: boolean;
			onmessage: ((event: { data: string }) => void) | null;
			onerror: ((event: Event) => void) | null;
		};
		const sockets = ((window as typeof window & { __pleromanetSockets?: MockSocket[] }).__pleromanetSockets ?? [])
			.filter((socket) => new URL(socket.url).searchParams.get('stream') === 'public:local');
		const staleSocket = sockets[0];
		staleSocket?.onmessage?.({ data: JSON.stringify({ event: 'update', payload: JSON.stringify(staleStatus) }) });
		staleSocket?.onerror?.(new Event('error'));
		return sockets.at(-1)?.closeCalled ?? true;
	}, statusWithText('stale-local-stream', 'stale closed local stream post'));
	await expect(page.getByTestId('app-public-timeline-list')).not.toContainText('stale closed local stream post');
	expect(replacementStreamClosed).toBe(false);
	await page.goForward();
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('retained federated post 1');
	expect(requests).toEqual([
		{ local: 'true', maxId: null },
		{ local: 'true', maxId: 'retained-local-12' },
		{ local: null, maxId: null }
	]);
});

test('app public timeline cache clears when the authenticated session changes', async ({ page }) => {
	await authenticate(page);
	const nextSession = { ...session, accessToken: 'fresh-token', createdAt: 1700000002000 };
	const authorizations: string[] = [];
	await mockAppPublicTimeline(page, async (route) => {
		const authorization = route.request().headers().authorization ?? '';
		authorizations.push(authorization);
		await fulfillTimeline(route, [authorization === 'Bearer fresh-token'
			? statusWithText('fresh-session-local', 'fresh account local post')
			: statusWithText('old-session-local', 'old account local post')]);
	});

	await page.goto('/app/local');
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('old account local post');
	await page.evaluate((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
		window.dispatchEvent(new StorageEvent('storage', {
			key: 'pleromanet.session',
			newValue: JSON.stringify(storedSession),
			storageArea: window.localStorage
		}));
	}, nextSession);

	const list = page.getByTestId('app-public-timeline-list');
	await expect(list).toContainText('fresh account local post');
	await expect(list).not.toContainText('old account local post');
	expect(authorizations).toEqual(['Bearer access-token', 'Bearer fresh-token']);
});

test('app public timeline rolls back failed actions after navigating away', async ({ page }) => {
	await authenticate(page);
	const actionStatus = { ...statusWithText('retained-local-action', 'retained local action rollback'), favourites_count: 9 };
	let releaseFavorite: () => void = () => undefined;
	const favoritePending = new Promise<void>((resolve) => {
		releaseFavorite = resolve;
	});
	await mockAppPublicTimeline(page, async (route, url) => {
		await fulfillTimeline(route, url.searchParams.get('local') === 'true'
			? [actionStatus]
			: [statusWithText('federated-action-baseline', 'federated action baseline')]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/retained-local-action/favourite', async (route) => {
		await favoritePending;
		await fulfillTimeline(route, { error: 'favorite failed after leaving local' }, 503);
	});

	await page.goto('/app/local');
	const localPost = page.locator('[data-status-id="retained-local-action"]');
	await localPost.getByRole('button', { name: 'Favorite 9' }).click();
	await expect(localPost.getByRole('button', { name: 'Favorite 10' })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('tab', { name: 'Federated' }).click();
	const favoriteResponse = page.waitForResponse('https://pleroma.example/api/v1/statuses/retained-local-action/favourite');
	releaseFavorite();
	await favoriteResponse;
	await page.goBack();

	await expect(localPost.getByRole('button', { name: 'Favorite 9' })).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByText('favorite failed after leaving local')).toHaveCount(0);
});

test('app public timeline action failures rollback while pagination is loading', async ({ page }) => {
	await authenticate(page);
	const actionStatus = { ...statusWithText('status-local-action', 'rollback local timeline favorite'), favourites_count: 9 };
	let resolveFavorite: () => void = () => undefined;
	let releaseNextPage: () => void = () => undefined;
	const favoritePending = new Promise<void>((resolve) => {
		resolveFavorite = resolve;
	});
	const nextPagePending = new Promise<void>((resolve) => {
		releaseNextPage = resolve;
	});

	await mockAppPublicTimeline(page, async (route, url) => {
		if (url.searchParams.get('max_id') === 'status-local-action') {
			await nextPagePending;
			await fulfillTimeline(route, [statusWithText('status-local-older-action', 'older local post after action failure')]);
			return;
		}

		await fulfillTimeline(route, [actionStatus], 200, {
			link: `<${timelineUrl}?local=true&max_id=status-local-action>; rel="next"`
		});
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-local-action/favourite', async (route) => {
		await favoritePending;
		await fulfillTimeline(route, { error: 'favorite failed during pagination' }, 503);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	const list = page.getByTestId('app-public-timeline-list');
	const post = page.locator('[data-status-id="status-local-action"]');
	await expect(list).toContainText('rollback local timeline favorite');
	await post.getByRole('button', { name: 'Favorite 9' }).click();
	await expect(post.getByRole('button', { name: 'Favorite 10' })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Load more' }).click();
	await expect(page.getByRole('status', { name: 'Timeline pagination status' })).toContainText('Loading older posts');

	resolveFavorite();
	await expect(post.getByRole('button', { name: 'Favorite 9' })).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByRole('alert')).toContainText('favorite failed during pagination');
	releaseNextPage();
	await expect(list).toContainText('older local post after action failure');
});

test('app public timelines render empty state from mocked API response', async ({ page }) => {
	await authenticate(page);
	await mockAppPublicTimeline(page, async (route) => {
		await fulfillTimeline(route, []);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/federated');

	await expect(page.getByText('No federated posts yet')).toBeVisible();
	await expect(page.getByText('This Pleroma timeline returned no statuses for this slice.')).toBeVisible();
});

test('app public timelines render retryable API errors and retry with a token', async ({ page }) => {
	await authenticate(page);
	let attempts = 0;
	await mockAppPublicTimeline(page, async (route) => {
		attempts += 1;
		expect(route.request().headers().authorization).toBe('Bearer access-token');

		if (attempts === 1) {
			await fulfillTimeline(route, { error: 'maintenance' }, 503);
			return;
		}

		await fulfillTimeline(route, [statusWithText('status-local-retry', 'local app timeline recovers after retry')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/local');

	await expect(page.getByText('Pleroma server error')).toBeVisible();
	await page.getByRole('button', { name: 'Retry request' }).click();
	await expect(page.getByTestId('app-public-timeline-list')).toContainText('local app timeline recovers after retry');
	expect(attempts).toBe(2);
});
