import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { expectElementIsTruncatedWithinParent, expectNoHorizontalOverflow, setViewport } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};

const homeUrl = 'https://pleroma.example/api/v1/timelines/home**';
const instanceUrl = 'https://pleroma.example/api/v2/instance';

const authenticate = async (page: Page) => {
	await page.addInitScript((storedSession) => {
			type MockSocket = {
				url: string;
				closeCalled: boolean;
				onmessage: ((event: { data: string }) => void) | null;
				onerror: ((event: Event) => void) | null;
				onclose: ((event: Event) => void) | null;
				close: () => void;
			};
		const testWindow = window as typeof window & {
			__pleromanetSockets?: MockSocket[];
		};

		if (!testWindow.__pleromanetSockets) {
			testWindow.__pleromanetSockets = [];
			const MockWebSocket = function (url: string) {
				const socket: MockSocket = {
					url,
					closeCalled: false,
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

const authenticateWithThrowingWebSocket = async (page: Page) => {
	await page.addInitScript((storedSession) => {
		const ThrowingWebSocket = function () {
			throw new Error('socket blocked');
		};
		Object.defineProperty(window, 'WebSocket', { configurable: true, value: ThrowingWebSocket });
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

const mockHomeTimeline = async (page: Page, handler: (route: Route) => Promise<void>) => {
	await page.route(homeUrl, handler);
};

const mockInstance = async (page: Page, instance = pleromaFixtures.instance) => {
	await page.route(instanceUrl, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(instance)
		});
	});
};

const fulfillHome = async (route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) => {
	await route.fulfill({
		status,
		contentType: 'application/json',
		headers: headers.link ? { 'access-control-expose-headers': 'link', ...headers } : headers,
		body: JSON.stringify(body)
	});
};

const primeVideoMetadata = async (video: Locator) => video.evaluate((node: HTMLVideoElement) => {
	let currentTime = 0;
	Object.defineProperty(node, 'duration', { configurable: true, value: 42 });
	Object.defineProperty(node, 'currentTime', {
		configurable: true,
		get: () => currentTime,
		set: (value: number) => {
			currentTime = value;
		}
	});
	node.dispatchEvent(new Event('loadedmetadata'));
	return node.currentTime;
});

const startPrimedVideo = async (video: Locator) => video.evaluate((node: HTMLVideoElement) => {
	node.dispatchEvent(new Event('play'));
	return node.currentTime;
});

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

const emitStreamUpdate = async (page: Page, status: unknown) => {
	await page.evaluate((nextStatus) => {
		type MockSocket = { onmessage: ((event: { data: string }) => void) | null };
		const testWindow = window as typeof window & { __pleromanetSockets?: MockSocket[] };
		const socket = testWindow.__pleromanetSockets?.at(-1);
		socket?.onmessage?.({ data: JSON.stringify({ event: 'update', payload: JSON.stringify(nextStatus) }) });
	}, status);
};

const emitStreamError = async (page: Page) => {
	await page.evaluate(() => {
		type MockSocket = { onerror: ((event: Event) => void) | null };
		const testWindow = window as typeof window & { __pleromanetSockets?: MockSocket[] };
		const socket = testWindow.__pleromanetSockets?.at(-1);
		socket?.onerror?.(new Event('error'));
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
	const avatar = page.getByTestId('home-timeline-list').getByRole('img', { name: 'quiet admin avatar' }).first();
	await expect(avatar).toHaveAttribute('src', 'https://pleroma.example/avatar.png');
	expect(await avatar.evaluate((node) => node.parentElement?.className ?? '')).not.toContain('av-orb');
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

test('home timeline composer uses the instance status character limit', async ({ page }) => {
	await authenticate(page);
	await mockInstance(page, {
		...pleromaFixtures.instance,
		configuration: { statuses: { max_characters: 5000 } }
	});
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, pleromaFixtures.timelines.home);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect(page.locator('.composer-count')).toHaveText('5000');
	await page.getByRole('textbox', { name: 'Post text' }).fill('hello from a long-post instance');
	await expect(page.locator('.composer-count')).toHaveText('4969');
});

test('home timeline composer creates statuses through Pleroma', async ({ page }) => {
	await authenticate(page);
	await mockInstance(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, pleromaFixtures.timelines.home);
	});

	let createMethod: string | undefined;
	let createAuthorization: string | undefined;
	let createBody = '';
	await page.route('https://pleroma.example/api/v1/statuses', async (route) => {
		createMethod = route.request().method();
		createAuthorization = route.request().headers().authorization;
		createBody = route.request().postData() ?? '';
		await fulfillHome(route, statusWithText('created-home-status', 'posting through Pleroma composer'));
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect(page.getByTestId('home-timeline-list')).toContainText('quiet CSS can still carry the voice.');

	const composer = page.getByRole('textbox', { name: 'Post text' });
	await composer.fill('posting through Pleroma composer');
	await page.getByRole('button', { name: 'Content warning', exact: true }).click();
	await expect(composer).toHaveValue('posting through Pleroma composer');
	await expect(page.getByRole('button', { name: 'Content warning', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('textbox', { name: 'Content warning text' })).toBeFocused();
	await page.getByRole('textbox', { name: 'Content warning text' }).fill('soft spoiler');
	await page.getByRole('button', { name: 'Post', exact: true }).click();

	await expect(page.locator('[data-status-id="created-home-status"]')).toContainText('posting through Pleroma composer');
	await expect(composer).toHaveValue('');
	await expect(page.getByRole('textbox', { name: 'Content warning text' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Content warning', exact: true })).toHaveAttribute('aria-pressed', 'false');
	expect(createMethod).toBe('POST');
	expect(createAuthorization).toBe('Bearer access-token');
	const params = new URLSearchParams(createBody);
	expect(params.get('status')).toBe('posting through Pleroma composer');
	expect(params.get('visibility')).toBe('public');
	expect(params.get('spoiler_text')).toBe('soft spoiler');
});

test('home timeline composer preserves drafts and shows inline errors on status creation failure', async ({ page }) => {
	await authenticate(page);
	await mockInstance(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, pleromaFixtures.timelines.home);
	});

	let createBody = '';
	await page.route('https://pleroma.example/api/v1/statuses', async (route) => {
		createBody = route.request().postData() ?? '';
		await fulfillHome(route, { error: 'composer backend is tired' }, 503);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const composer = page.getByRole('textbox', { name: 'Post text' });
	await composer.fill('keep this draft when posting fails');
	await page.getByRole('button', { name: 'Content warning', exact: true }).click();
	const warning = page.getByRole('textbox', { name: 'Content warning text' });
	await warning.fill('draft warning');
	await page.getByRole('button', { name: 'Post', exact: true }).click();

	await expect(page.getByRole('alert')).toContainText('Pleroma server error');
	await expect(composer).toHaveValue('keep this draft when posting fails');
	await expect(warning).toHaveValue('draft warning');
	const params = new URLSearchParams(createBody);
	expect(params.get('status')).toBe('keep this draft when posting fails');
	expect(params.get('spoiler_text')).toBe('draft warning');
});

test('home timeline inline reply composer creates a reply for the selected post', async ({ page }) => {
	await authenticate(page);
	await mockInstance(page);
	const targetStatus = { ...statusWithText('status-inline-reply', 'reply inline from the timeline'), replies_count: 0, visibility: 'unlisted' };
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [targetStatus]);
	});

	let createAuthorization = '';
	let createBody = '';
	await page.route('https://pleroma.example/api/v1/statuses', async (route) => {
		createAuthorization = route.request().headers().authorization ?? '';
		createBody = route.request().postData() ?? '';
		await fulfillHome(route, {
			...statusWithText('created-inline-reply', 'timeline inline reply body'),
			in_reply_to_id: 'status-inline-reply'
		});
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('[data-status-id="status-inline-reply"]');
	await post.getByRole('button', { name: 'Reply 0' }).click();
	const replyForm = page.getByRole('form', { name: 'Inline reply to @quietadmin' });
	await expect(replyForm).toBeVisible();
	await expect(replyForm).toContainText('Replying to');
	await expect(replyForm).toContainText('@quietadmin');
	await expect(replyForm.getByRole('img', { name: 'quiet admin avatar' })).toHaveAttribute('src', 'https://pleroma.example/avatar.png');
	await replyForm.getByRole('textbox', { name: 'Reply text' }).fill('timeline inline reply body');
	await replyForm.getByRole('button', { name: 'Reply', exact: true }).click();

	await expect(page.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);
	await expect(post.getByRole('button', { name: 'Reply 1' })).toHaveAttribute('aria-pressed', 'false');
	expect(createAuthorization).toBe('Bearer access-token');
	const params = new URLSearchParams(createBody);
	expect(params.get('status')).toBe('timeline inline reply body');
	expect(params.get('in_reply_to_id')).toBe('status-inline-reply');
	expect(params.get('visibility')).toBe('unlisted');
});

test('home timeline inline reply composer moves between targets and cancels', async ({ page }) => {
	await authenticate(page);
	await mockInstance(page);
	const firstStatus = { ...statusWithText('status-inline-first', 'first inline target'), replies_count: 0 };
	const secondStatus = {
		...statusWithText('status-inline-second', 'second inline target'),
		account: { ...pleromaFixtures.account, id: 'account-2', username: 'datagram', acct: 'datagram@retro.social', display_name: 'datagram' },
		replies_count: 0
	};
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [firstStatus, secondStatus]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const firstPost = page.locator('[data-status-id="status-inline-first"]');
	await firstPost.getByRole('button', { name: 'Reply 0' }).click();
	const firstForm = page.getByRole('form', { name: 'Inline reply to @quietadmin' });
	await expect(firstForm).toBeVisible();
	await firstForm.getByRole('textbox', { name: 'Reply text' }).fill('draft that should close');
	await firstPost.getByRole('button', { name: 'Reply 0' }).click();
	await expect(page.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);

	await firstPost.getByRole('button', { name: 'Reply 0' }).click();
	await firstForm.getByRole('textbox', { name: 'Reply text' }).fill('draft that should not move');
	await page.locator('[data-status-id="status-inline-second"]').getByRole('button', { name: 'Reply 0' }).click();

	await expect(page.getByRole('form', { name: /Inline reply/ })).toHaveCount(1);
	const movedForm = page.getByRole('form', { name: 'Inline reply to @datagram' });
	await expect(movedForm).toBeVisible();
	await expect(movedForm.getByRole('textbox', { name: 'Reply text' })).toHaveValue('');
	await movedForm.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);
});

test('home timeline favorite and boost actions reconcile with Pleroma responses', async ({ page }) => {
	await authenticate(page);
	const actionStatus = { ...statusWithText('status-action', 'wire this post to real actions'), favourites_count: 9, reblogs_count: 4 };
	let favoriteAuthorization = '';
	let boostAuthorization = '';
	let unfavoriteAuthorization = '';
	let unboostAuthorization = '';
	let resolveFavorite: () => void = () => undefined;
	let resolveBoost: () => void = () => undefined;
	const favoritePending = new Promise<void>((resolve) => {
		resolveFavorite = resolve;
	});
	const boostPending = new Promise<void>((resolve) => {
		resolveBoost = resolve;
	});

	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [actionStatus]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action/favourite', async (route) => {
		favoriteAuthorization = route.request().headers().authorization ?? '';
		await favoritePending;
		await fulfillHome(route, { ...actionStatus, favourited: true, favourites_count: 12 });
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action/reblog', async (route) => {
		boostAuthorization = route.request().headers().authorization ?? '';
		await boostPending;
		await fulfillHome(route, { ...actionStatus, reblogged: true, reblogs_count: 7 });
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action/unfavourite', async (route) => {
		unfavoriteAuthorization = route.request().headers().authorization ?? '';
		await fulfillHome(route, { ...actionStatus, favourited: false, favourites_count: 11 });
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action/unreblog', async (route) => {
		unboostAuthorization = route.request().headers().authorization ?? '';
		await fulfillHome(route, { ...actionStatus, reblogged: false, reblogs_count: 6 });
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('[data-status-id="status-action"]');
	await post.getByRole('button', { name: 'Favorite 9' }).click();
	await expect(post.getByRole('button', { name: 'Favorite 10' })).toHaveAttribute('aria-pressed', 'true');
	await expect.poll(() => favoriteAuthorization).toBe('Bearer access-token');
	resolveFavorite();
	await expect(post.getByRole('button', { name: 'Favorite 12' })).toHaveAttribute('aria-pressed', 'true');
	await post.getByRole('button', { name: 'Favorite 12' }).click();
	await expect(post.getByRole('button', { name: 'Favorite 11' })).toHaveAttribute('aria-pressed', 'false');
	await expect.poll(() => unfavoriteAuthorization).toBe('Bearer access-token');

	await post.getByRole('button', { name: 'Boost 4' }).click();
	await expect(post.getByRole('button', { name: 'Boost 5' })).toHaveAttribute('aria-pressed', 'true');
	await expect.poll(() => boostAuthorization).toBe('Bearer access-token');
	resolveBoost();
	await expect(post.getByRole('button', { name: 'Boost 7' })).toHaveAttribute('aria-pressed', 'true');
	await post.getByRole('button', { name: 'Boost 7' }).click();
	await expect(post.getByRole('button', { name: 'Boost 6' })).toHaveAttribute('aria-pressed', 'false');
	await expect.poll(() => unboostAuthorization).toBe('Bearer access-token');
});

test('home timeline status action failures rollback the optimistic state', async ({ page }) => {
	await authenticate(page);
	const actionStatus = { ...statusWithText('status-action-failure', 'rollback this favorite'), favourites_count: 9 };
	let resolveFavorite: () => void = () => undefined;
	const favoritePending = new Promise<void>((resolve) => {
		resolveFavorite = resolve;
	});

	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [actionStatus]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-failure/favourite', async (route) => {
		await favoritePending;
		await fulfillHome(route, { error: 'favorite failed temporarily' }, 503);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('[data-status-id="status-action-failure"]');
	await post.getByRole('button', { name: 'Favorite 9' }).click();
	await expect(post.getByRole('button', { name: 'Favorite 10' })).toHaveAttribute('aria-pressed', 'true');
	resolveFavorite();
	await expect(post.getByRole('button', { name: 'Favorite 9' })).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByRole('alert')).toContainText('favorite failed temporarily');
});

test('home timeline keeps separate scoped errors for multiple failed actions', async ({ page }) => {
	await authenticate(page);
	const favoriteStatus = { ...statusWithText('status-action-error-a', 'first failed action'), favourites_count: 2 };
	const boostStatus = { ...statusWithText('status-action-error-b', 'second failed action'), reblogs_count: 3 };
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [favoriteStatus, boostStatus]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-error-a/favourite', async (route) => {
		await fulfillHome(route, { error: 'first favorite failed' }, 503);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-error-b/reblog', async (route) => {
		await fulfillHome(route, { error: 'second boost failed' }, 503);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await page.locator('[data-status-id="status-action-error-a"]').getByRole('button', { name: 'Favorite 2' }).click();
	await expect(page.getByText('first favorite failed')).toBeVisible();
	await page.locator('[data-status-id="status-action-error-b"]').getByRole('button', { name: 'Boost 3' }).click();

	await expect(page.getByText('first favorite failed')).toBeVisible();
	await expect(page.getByText('second boost failed')).toBeVisible();
});

test('home timeline keeps independent action state across out-of-order responses', async ({ page }) => {
	await authenticate(page);
	const actionStatus = { ...statusWithText('status-action-race', 'race these actions'), favourites_count: 9, reblogs_count: 4 };
	let resolveFavorite: () => void = () => undefined;
	let resolveBoost: () => void = () => undefined;
	const favoritePending = new Promise<void>((resolve) => {
		resolveFavorite = resolve;
	});
	const boostPending = new Promise<void>((resolve) => {
		resolveBoost = resolve;
	});

	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [actionStatus]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-race/favourite', async (route) => {
		await favoritePending;
		await fulfillHome(route, { ...actionStatus, favourited: true, favourites_count: 12, reblogged: false, reblogs_count: 4 });
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-race/reblog', async (route) => {
		await boostPending;
		await fulfillHome(route, { ...actionStatus, favourited: false, favourites_count: 9, reblogged: true, reblogs_count: 7 });
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('[data-status-id="status-action-race"]');
	await post.getByRole('button', { name: 'Favorite 9' }).click();
	await post.getByRole('button', { name: 'Boost 4' }).click();
	await expect(post.getByRole('button', { name: 'Favorite 10' })).toHaveAttribute('aria-pressed', 'true');
	await expect(post.getByRole('button', { name: 'Boost 5' })).toHaveAttribute('aria-pressed', 'true');

	resolveFavorite();
	await expect(post.getByRole('button', { name: 'Favorite 12' })).toHaveAttribute('aria-pressed', 'true');
	await expect(post.getByRole('button', { name: 'Boost 5' })).toHaveAttribute('aria-pressed', 'true');

	resolveBoost();
	await expect(post.getByRole('button', { name: 'Boost 7' })).toHaveAttribute('aria-pressed', 'true');
	await expect(post.getByRole('button', { name: 'Favorite 12' })).toHaveAttribute('aria-pressed', 'true');
});

test('home timeline status action failure after navigation does not clobber thread state', async ({ page }) => {
	await authenticate(page);
	const actionStatus = { ...statusWithText('status-action-navigation', 'keep the thread after failure'), favourites_count: 9 };
	const threadLoadedStatus = { ...actionStatus, favourited: true, favourites_count: 14 };
	let resolveFavorite: () => void = () => undefined;
	const favoritePending = new Promise<void>((resolve) => {
		resolveFavorite = resolve;
	});

	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [actionStatus]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-navigation/favourite', async (route) => {
		await favoritePending;
		await fulfillHome(route, { error: 'favorite failed after navigation' }, 503);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-navigation', async (route) => {
		await fulfillHome(route, threadLoadedStatus);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-navigation/context', async (route) => {
		await fulfillHome(route, { ancestors: [], descendants: [] });
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	const post = page.locator('[data-status-id="status-action-navigation"]');
	await post.getByRole('button', { name: 'Favorite 9' }).click();
	await expect(post.getByRole('button', { name: 'Favorite 10' })).toHaveAttribute('aria-pressed', 'true');
	await post.locator('.post-body').click();
	await expect(page).toHaveURL('/app/thread/status-action-navigation');
	const focused = page.getByTestId('focused-post');
	await expect(focused).toContainText('keep the thread after failure');
	await expect(focused.getByRole('button', { name: 'Favorite 14' })).toHaveAttribute('aria-pressed', 'true');

	const favoriteResponse = page.waitForResponse('https://pleroma.example/api/v1/statuses/status-action-navigation/favourite');
	resolveFavorite();
	await favoriteResponse;
	await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
	await expect(focused).toContainText('keep the thread after failure');
	await expect(focused.getByRole('button', { name: 'Favorite 14' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page).toHaveURL('/app/thread/status-action-navigation');
	await expect(page.getByText('favorite failed after navigation')).toHaveCount(0);
});

test('home timeline status action auth failures sign out and redirect', async ({ page }) => {
	await authenticate(page);
	const actionStatus = { ...statusWithText('status-action-auth', 'expired token action'), favourites_count: 9 };
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [actionStatus]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-auth/favourite', async (route) => {
		await fulfillHome(route, { error: 'The access token is invalid' }, 401);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await page.locator('[data-status-id="status-action-auth"]').getByRole('button', { name: 'Favorite 9' }).click();

	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: /quieter corner of the social web/i })).toBeVisible();
});

test('home timeline clears stale pending actions after session changes', async ({ page }) => {
	await authenticate(page);
	const nextSession = { ...session, accessToken: 'second-token', createdAt: 1700000002000 };
	const actionStatus = { ...statusWithText('status-action-session-change', 'clear stale pending actions'), favourites_count: 9 };
	const favoriteAuthorizations: string[] = [];
	let resolveFirstFavorite: () => void = () => undefined;
	const firstFavoritePending = new Promise<void>((resolve) => {
		resolveFirstFavorite = resolve;
	});

	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [actionStatus]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-action-session-change/favourite', async (route) => {
		favoriteAuthorizations.push(route.request().headers().authorization ?? '');
		if (favoriteAuthorizations.length === 1) {
			await firstFavoritePending;
			await fulfillHome(route, { ...actionStatus, favourited: true, favourites_count: 10 });
			return;
		}

		await fulfillHome(route, { ...actionStatus, favourited: true, favourites_count: 12 });
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	const post = page.locator('[data-status-id="status-action-session-change"]');
	await post.getByRole('button', { name: 'Favorite 9' }).click();
	await expect(post.getByRole('button', { name: 'Favorite 10' })).toHaveAttribute('aria-pressed', 'true');
	await expect.poll(() => favoriteAuthorizations.join('|')).toContain('Bearer access-token');

	await page.evaluate((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, nextSession);
	await page.getByRole('link', { name: 'Explore' }).first().click();
	await expect(page).toHaveURL('/app/explore');
	await page.getByRole('link', { name: 'Home' }).first().click();
	await expect(page).toHaveURL('/app/home');
	await page.locator('[data-status-id="status-action-session-change"]').getByRole('button', { name: 'Favorite 9' }).click();

	await expect.poll(() => favoriteAuthorizations.join('|')).toContain('Bearer second-token');
	resolveFirstFavorite();
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

test('home timeline renders custom emoji in post names and body text', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [
			{
				...pleromaFixtures.status,
				id: 'status-custom-emoji',
				account: {
					...pleromaFixtures.status.account,
					display_name: 'zonk :fatteratte:',
					emojis: [
						{
							shortcode: 'fatteratte',
							url: 'https://cdn.example/emoji/fatteratte.png',
							static_url: 'https://cdn.example/emoji/fatteratte-static.png',
							visible_in_picker: false
						}
					]
				},
				content: 'brainfrot :blobcat:',
				emojis: [
					{
						shortcode: 'blobcat',
						url: 'https://cdn.example/emoji/blobcat.png',
						static_url: 'https://cdn.example/emoji/blobcat-static.png',
						visible_in_picker: true
					}
				],
				pleroma: {
					...pleromaFixtures.status.pleroma,
					content: { 'text/plain': 'brainfrot :blobcat:' }
				}
			}
		]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	const post = page.locator('[data-status-id="status-custom-emoji"]');
	await expect(post).toContainText('zonk');
	await expect(post).toContainText('brainfrot');
	await expect(post.locator('.post-name img[alt=":fatteratte:"]')).toHaveAttribute('src', 'https://cdn.example/emoji/fatteratte.png');
	await expect(post.locator('.post-body img[alt=":blobcat:"]')).toHaveAttribute('src', 'https://cdn.example/emoji/blobcat.png');
});

test('home timeline moves leading reply recipients into parent and cc chips', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [
			{
				...pleromaFixtures.status,
				id: 'status-leading-recipients',
				in_reply_to_id: 'parent-status',
				in_reply_to_account_id: 'account-2',
				content: '<p>@dtluna@retro.social @feld@queer.party qwen 0.5b can handle it. has @lain tried it?</p>',
				pleroma: {
					...pleromaFixtures.status.pleroma,
					content: { 'text/plain': '@dtluna@retro.social @feld@queer.party qwen 0.5b can handle it. has @lain tried it?' }
				}
			}
		]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('.post').filter({ hasText: 'qwen 0.5b can handle it.' }).first();
	await expect(post.locator('.post-body')).toHaveText('qwen 0.5b can handle it. has @lain tried it?');
	await expect(post.locator('.post-pinged-l')).toHaveText('Replying to');
	await expect(post.locator('.post-pinged-chip-parent .post-pinged-handle')).toHaveText('@dtluna');
	await expect(post.locator('.post-pinged-chip-parent')).toHaveAttribute('title', '@dtluna@retro.social');
	await expect(post.locator('.post-pinged-chip-parent svg')).toBeVisible();
	await expect(post.locator('.post-pinged-also')).toContainText('also');
	await expect(post.locator('.post-pinged-chip')).toHaveText('@feld');
	await expect(post.locator('.post-pinged-chip')).toHaveAttribute('title', '@feld@queer.party');
	await expect(post.locator('.post-pinged-list')).not.toContainText('@dtluna@retro.social');
	await expect(post.locator('.post-pinged-list')).not.toContainText('@feld@queer.party');
});

test('home timeline post menu copies raw post JSON for bug reports', async ({ page }) => {
	await authenticate(page);
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async (text: string) => {
					window.localStorage.setItem('pleromanet.copied-post-json', text);
				}
			}
		});
	});
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, pleromaFixtures.timelines.home);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('.post').filter({ hasText: 'quiet CSS can still carry the voice.' }).first();
	await post.getByRole('button', { name: 'More post actions' }).click();
	await post.getByRole('menuitem', { name: 'Copy post JSON' }).click();

	const copied = await page.evaluate(() => window.localStorage.getItem('pleromanet.copied-post-json'));
	expect(copied).not.toBeNull();
	expect(JSON.parse(copied ?? '')).toMatchObject({
		id: 'status-1',
		content: '<p>quiet CSS can still carry the voice.</p>',
		pleroma: {
			content: { 'text/plain': 'quiet CSS can still carry the voice.' }
		}
	});
	await expect(post.getByRole('status', { name: 'Post JSON copy status' })).toHaveText('Copied post JSON');
});

test('home timeline truncates long account names without wrapping the post header', async ({ page }) => {
	await authenticate(page);
	const longDisplayName = "Khamenei's Top Guy Katze Kattepus :crusaderkitty: ".repeat(4).trim();
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [
			{
				...pleromaFixtures.status,
				id: 'status-long-account-name',
				created_at: '2026-05-15T09:32:25.000Z',
				account: {
					...pleromaFixtures.account,
					display_name: longDisplayName,
					username: 'nerthos',
					acct: 'nerthos@shitposter.world'
				},
				content: '<p>Joseph was always on the side of the good guys.</p>',
				pleroma: {
					...pleromaFixtures.status.pleroma,
					content: { 'text/plain': 'Joseph was always on the side of the good guys.' }
				}
			}
		]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('.post').filter({ hasText: 'Joseph was always on the side of the good guys.' }).first();
	const name = post.locator('.post-name');
	const time = post.locator('.post-time');
	const nameBox = await name.boundingBox();
	const timeBox = await time.boundingBox();
	expect(nameBox).not.toBeNull();
	expect(timeBox).not.toBeNull();
	expect(Math.abs((nameBox?.y ?? 0) - (timeBox?.y ?? 0))).toBeLessThanOrEqual(2);
	expect(await name.evaluate((node) => node.scrollWidth > node.clientWidth && getComputedStyle(node).textOverflow === 'ellipsis')).toBe(true);
	await expectNoHorizontalOverflow(page);
});

test('home timeline renders real media attachments from Pleroma statuses', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [
			{
				...pleromaFixtures.status,
				id: 'status-photo-attachment',
				content: '<p>photo attached</p>',
				pleroma: { ...pleromaFixtures.status.pleroma, content: { 'text/plain': 'photo attached' } },
				media_attachments: [
					{ id: 'photo-1', type: 'image', url: 'https://cdn.example/media/photo.jpg', preview_url: 'https://cdn.example/media/photo-preview.jpg', description: 'two cats in a window' }
				]
			},
			{
				...pleromaFixtures.status,
				id: 'status-video-attachment',
				content: '<p>video attached</p>',
				pleroma: { ...pleromaFixtures.status.pleroma, content: { 'text/plain': 'video attached' } },
				media_attachments: [
					{ id: 'video-1', type: 'video', url: 'https://cdn.example/media/clip.mp4', preview_url: 'https://cdn.example/media/clip.jpg', description: 'short clip' }
				]
			},
			{
				...pleromaFixtures.status,
				id: 'status-audio-attachment',
				content: '<p>audio attached</p>',
				pleroma: { ...pleromaFixtures.status.pleroma, content: { 'text/plain': 'audio attached' } },
				media_attachments: [
					{ id: 'audio-1', type: 'audio', url: 'https://cdn.example/media/field.mp3', description: 'field recording' }
				]
			},
			{
				...pleromaFixtures.status,
				id: 'status-mixed-video-attachment',
				content: '<p>mixed video attached</p>',
				pleroma: { ...pleromaFixtures.status.pleroma, content: { 'text/plain': 'mixed video attached' } },
				media_attachments: [
					{ id: 'photo-2', type: 'image', url: 'https://cdn.example/media/second-photo.jpg', preview_url: 'https://cdn.example/media/second-photo-preview.jpg', description: 'second photo' },
					{ id: 'video-2', type: 'video', url: 'https://cdn.example/media/second-clip.mp4', preview_url: 'https://cdn.example/media/blank-video-preview.jpg', description: 'second clip' }
				]
			}
		]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const list = page.getByTestId('home-timeline-list');
	await expect(page.locator('filter#duotoneCream')).toHaveCount(1);
	await expect(list.locator('.post-photos img[alt="two cats in a window"]')).toHaveAttribute('src', 'https://cdn.example/media/photo.jpg');
	const photo = list.locator('.post-photos img[alt="two cats in a window"]');
	const duotoneOverlay = list.locator('.post-photos .ph-duotone').first();
	expect(await photo.evaluate((node) => getComputedStyle(node).filter)).toBe('none');
	expect(await duotoneOverlay.evaluate((node) => getComputedStyle(node).filter)).toContain('duotoneCream');
	expect(await duotoneOverlay.evaluate((node) => {
		const style = getComputedStyle(node);
		return style.transitionProperty.includes('opacity') && style.transitionDuration === '0.6s';
	})).toBe(true);
	const photoVisual = list.locator('.post-photos .ph-visual').first();
	expect(await photoVisual.evaluate((node) => {
		const style = getComputedStyle(node);
		return style.transitionProperty.includes('transform') && style.transitionDuration === '0.6s';
	})).toBe(true);
	await list.locator('.post-photos .ph').first().hover();
	await expect(photo).toHaveCSS('transform', 'none');
	await expect(photoVisual).toHaveCSS('transform', /matrix\(1\.015/);
	const videoPost = list.locator('[data-status-id="status-video-attachment"]');
	const inlineVideo = videoPost.locator('video');
	await expect(inlineVideo).toHaveAttribute('src', 'https://cdn.example/media/clip.mp4');
	await expect(inlineVideo).toHaveAttribute('poster', 'https://cdn.example/media/clip.jpg');
	expect(await primeVideoMetadata(inlineVideo)).toBe(1);
	expect(await inlineVideo.getAttribute('poster')).toBeNull();
	expect(await startPrimedVideo(inlineVideo)).toBe(0);
	expect(await inlineVideo.evaluate((node) => getComputedStyle(node).filter)).toContain('duotoneCream');
	const audioPost = list.locator('[data-status-id="status-audio-attachment"]');
	const audioSource = audioPost.locator('audio');
	const audioWaveform = audioPost.getByRole('slider', { name: 'Seek audio' });
	await expect(audioPost.locator('.post-audio')).toBeVisible();
	await expect(audioWaveform).toBeVisible();
	await expect(audioPost.locator('.pa-bar')).toHaveCount(56);
	await expect(audioPost.locator('.pa-title')).toHaveText('field recording');
	await expect(audioSource).toHaveAttribute('src', 'https://cdn.example/media/field.mp3');
	expect(await audioSource.getAttribute('controls')).toBeNull();
	await expect(audioWaveform).toHaveAttribute('aria-valuenow', '0');
	await audioSource.evaluate((node) => {
		const media = node as HTMLMediaElement;
		const calls = { play: 0, pause: 0 };
		(window as Window & { __audioPlaybackCalls?: typeof calls }).__audioPlaybackCalls = calls;
		Object.defineProperty(media, 'duration', { configurable: true, get: () => 124 });
		Object.defineProperty(media, 'currentTime', { configurable: true, writable: true, value: 0 });
		Object.defineProperty(media, 'play', {
			configurable: true,
			value: () => {
				calls.play += 1;
				media.dispatchEvent(new Event('play'));
				return Promise.resolve();
			}
		});
		Object.defineProperty(media, 'pause', {
			configurable: true,
			value: () => {
				calls.pause += 1;
				media.dispatchEvent(new Event('pause'));
			}
		});
		media.dispatchEvent(new Event('loadedmetadata'));
	});
	await expect(audioPost.locator('.pa-time')).toHaveText('0:00 / 2:04');
	await audioPost.locator('.pa-cover').click();
	await expect(audioPost.locator('.pa-cover')).toHaveAttribute('aria-label', 'Pause');
	expect(await page.evaluate(() => (window as unknown as { __audioPlaybackCalls: { play: number; pause: number } }).__audioPlaybackCalls)).toEqual({ play: 1, pause: 0 });
	await audioPost.locator('.pa-cover').click();
	await expect(audioPost.locator('.pa-cover')).toHaveAttribute('aria-label', 'Play');
	expect(await page.evaluate(() => (window as unknown as { __audioPlaybackCalls: { play: number; pause: number } }).__audioPlaybackCalls)).toEqual({ play: 1, pause: 1 });
	const waveformBox = await audioWaveform.boundingBox();
	expect(waveformBox).not.toBeNull();
	await audioWaveform.click({ position: { x: (waveformBox?.width ?? 2) / 2, y: (waveformBox?.height ?? 2) / 2 } });
	const midpointTime = await audioSource.evaluate((node) => (node as HTMLMediaElement).currentTime);
	expect(midpointTime).toBeGreaterThan(50);
	expect(midpointTime).toBeLessThan(75);
	await audioWaveform.focus();
	await page.keyboard.press('Home');
	await expect(audioWaveform).toHaveAttribute('aria-valuenow', '0');
	await page.keyboard.press('ArrowRight');
	const keyboardTime = await audioSource.evaluate((node) => (node as HTMLMediaElement).currentTime);
	expect(keyboardTime).toBeGreaterThan(5);
	expect(keyboardTime).toBeLessThan(7);
	const mixedPost = list.locator('[data-status-id="status-mixed-video-attachment"]');
	const stripVideo = mixedPost.locator('.media-strip-tile video');
	await expect(stripVideo).toHaveAttribute('src', 'https://cdn.example/media/second-clip.mp4');
	await expect(stripVideo).toHaveAttribute('poster', 'https://cdn.example/media/blank-video-preview.jpg');
	expect(await primeVideoMetadata(stripVideo)).toBe(1);
	expect(await stripVideo.getAttribute('poster')).toBeNull();
	await expect(list.locator('.post-media')).toHaveCount(0);
	await expectNoHorizontalOverflow(page);
});

test('home timeline renders poll attachments below media without opening the thread', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [{
			...pleromaFixtures.status,
			id: 'status-media-poll',
			content: '<p>which side wins?</p>',
			pleroma: { ...pleromaFixtures.status.pleroma, content: { 'text/plain': 'which side wins?' } },
			media_attachments: [
				{ id: 'poll-photo', type: 'image', url: 'https://cdn.example/media/poll-photo.jpg', preview_url: 'https://cdn.example/media/poll-photo-preview.jpg', description: 'poll photo' }
			],
			poll: {
				id: 'poll-home',
				options: [
					{ title: 'warm cassette', votes_count: 142 },
					{ title: 'cold terminal', votes_count: 38 },
					{ title: 'spinning vinyl', votes_count: 214 }
				],
				votes_count: 394,
				multiple: false,
				expired: false,
				ends_in: '6h 12m',
				own_votes: []
			}
		}]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('[data-status-id="status-media-poll"]');
	await expect(post.locator('.post-photos img[alt="poll photo"]')).toHaveAttribute('src', 'https://cdn.example/media/poll-photo.jpg');
	await expect(post.locator('.post-poll')).toContainText('warm cassette');
	const boxes = await post.evaluate((node) => {
		const photo = node.querySelector('.post-photos')?.getBoundingClientRect();
		const poll = node.querySelector('.post-poll')?.getBoundingClientRect();
		return photo && poll ? { photoBottom: photo.bottom, pollTop: poll.top } : null;
	});
	expect(boxes).not.toBeNull();
	expect(boxes?.pollTop ?? 0).toBeGreaterThanOrEqual(boxes?.photoBottom ?? 0);

	await post.locator('.post-poll-vote-row').filter({ hasText: 'warm cassette' }).click();
	await expect(post.getByRole('radio', { name: 'warm cassette' })).toBeChecked();
	await expect(post.getByRole('button', { name: 'Vote' })).toBeDisabled();
	await expect(post.locator('.post-poll-row')).toHaveCount(0);
	await expect(post.locator('.post-poll')).not.toContainText('you voted');
	await expect(page).toHaveURL('/app/home');

	await post.locator('.post-photos button').click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.locator('.lightbox-photo')).toHaveAttribute('src', 'https://cdn.example/media/poll-photo.jpg');
	await expect(dialog).toContainText('1 of 1');
	await expect(dialog).not.toContainText('warm cassette');
	await dialog.getByRole('button', { name: 'Close', exact: true }).click();
});

test('home timeline folds content warnings around body and media until revealed', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [{
			...statusWithText('status-cw-media', 'hidden timeline words with attached proof'),
			spoiler_text: 'timeline spoiler',
			pleroma: {
				...pleromaFixtures.status.pleroma,
				content: { 'text/plain': 'hidden timeline words with attached proof' },
				spoiler_text: { 'text/plain': 'timeline spoiler' }
			},
			media_attachments: [
				{ id: 'cw-photo', type: 'image', url: 'https://cdn.example/media/cw-photo.jpg', preview_url: 'https://cdn.example/media/cw-photo-preview.jpg', description: 'cw hidden photo' }
			]
		}]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-cw-media/favourite', async (route) => {
		await fulfillHome(route, { ...statusWithText('status-cw-media', 'hidden timeline words with attached proof'), favourited: true, favourites_count: 10 });
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('[data-status-id="status-cw-media"]');
	await expect(post.locator('.post-cw-card')).toContainText('timeline spoiler');
	await expect(post.locator('.post-cw-meta-chip')).toContainText(['1 photo', '~6 words']);
	await expect(post).not.toContainText('hidden timeline words');
	await expect(post.locator('.post-photos')).toHaveCount(0);
	await post.getByRole('button', { name: 'Favorite 9' }).click();
	await expect(post.getByRole('button', { name: 'Favorite 10' })).toHaveAttribute('aria-pressed', 'true');

	await post.getByRole('button', { name: 'Show post' }).click();
	await expect(post).toContainText('hidden timeline words with attached proof');
	await expect(post.locator('.post-photos img[alt="cw hidden photo"]')).toHaveAttribute('src', 'https://cdn.example/media/cw-photo.jpg');
	await expect(page).toHaveURL('/app/home');
	await post.getByRole('button', { name: 'Hide' }).click();
	await expect(post).not.toContainText('hidden timeline words');
	await expect(post.getByRole('button', { name: 'Favorite 10' })).toHaveAttribute('aria-pressed', 'true');
});

test('home timeline renders boosted Pleroma statuses with attribution and media actions', async ({ page }) => {
	await authenticate(page);
	await mockInstance(page);
	const original = {
		...statusWithText('boosted-original', 'dusk in the city'),
		account: {
			...pleromaFixtures.account,
			id: 'orbit-account',
			username: 'orbit',
			acct: 'orbit@spacebear.net',
			display_name: 'orbit'
		},
		media_attachments: [
			{
				id: 'boost-photo',
				type: 'image',
				url: 'https://cdn.example/boost-photo.jpg',
				preview_url: 'https://cdn.example/boost-photo-preview.jpg',
				description: 'boosted photo'
			}
		]
	};
	const wrapper = {
		...statusWithText('boost-wrapper', ''),
		account: {
			...pleromaFixtures.account,
			id: 'booster-account',
			username: 'booster-with-a-very-long-unbroken-handle',
			acct: 'booster-with-a-very-long-unbroken-handle@pleroma.example',
			display_name: 'booster-with-a-very-long-unbroken-display-name-that-should-clip'
		},
		reblog: original
	};
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [wrapper]);
	});
	let boostActionPath = '';
	await page.route('https://pleroma.example/api/v1/statuses/boosted-original/reblog', async (route) => {
		boostActionPath = new URL(route.request().url()).pathname;
		await fulfillHome(route, { ...original, reblogged: true, reblogs_count: 5 });
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const boost = page.locator('.post-boost').first();
	const boostAttr = boost.locator('> .post-boost-attr');
	await expect(boost).toHaveCSS('border-left-width', '4px');
	await expect(boost.locator('> .post-boost-rail')).toHaveCount(0);
	await expect(boostAttr.locator('.post-boost-tag')).toContainText('boost');
	await expect(boostAttr.locator('.post-boost-av')).toBeVisible();
	await expect(boostAttr.locator('.post-boost-name')).toContainText('booster');
	await expect(boostAttr.locator('.post-boost-handle')).toContainText('@booster-with-a-very-long-unbroken-handle@pleroma.example');
	await expect(boostAttr.locator('.post-boost-name')).toHaveCSS('text-overflow', 'ellipsis');
	await expect(boostAttr.locator('.post-boost-handle')).toHaveCSS('text-overflow', 'ellipsis');
	await expect(boost.locator('.post')).toContainText('orbit');
	await expect(boost.locator('.post')).toContainText('dusk in the city');
	await boost.locator('.post').getByRole('button', { name: 'Boost 4' }).click();
	await expect(boost.locator('.post').getByRole('button', { name: 'Boost 5' })).toHaveAttribute('aria-pressed', 'true');
	await expect.poll(() => boostActionPath).toBe('/api/v1/statuses/boosted-original/reblog');
	await setViewport(page, 'mobile');
	const mobileNameBox = await boostAttr.locator('.post-boost-name').boundingBox();
	const mobileHandleBox = await boostAttr.locator('.post-boost-handle').boundingBox();
	expect(mobileNameBox?.width ?? 0).toBeGreaterThan(40);
	expect(mobileHandleBox?.width ?? 0).toBeGreaterThan(40);
	await expectElementIsTruncatedWithinParent(boostAttr.locator('.post-boost-name'));
	await expectElementIsTruncatedWithinParent(boostAttr.locator('.post-boost-handle'));
	await expectNoHorizontalOverflow(page);
	await setViewport(page, 'desktop');
	await boost.locator('.post-photos button').click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.locator('.lightbox-photo')).toHaveAttribute('src', 'https://cdn.example/boost-photo.jpg');
	await dialog.getByRole('button', { name: 'Close', exact: true }).click();
	await expect(dialog).toBeHidden();

	await boost.locator('.post-body').click();
	await expect(page).toHaveURL('/app/thread/boosted-original');
});

test('home timeline loads the next cursor page, deduplicates overlap, and keeps status ids', async ({ page }) => {
	await authenticate(page);
	let releaseNextPage: () => void = () => undefined;
	const nextPagePending = new Promise<void>((resolve) => {
		releaseNextPage = resolve;
	});
	const requestedMaxIds: Array<string | null> = [];
	await mockHomeTimeline(page, async (route) => {
		const url = new URL(route.request().url());
		const maxId = url.searchParams.get('max_id');
		requestedMaxIds.push(maxId);

		if (maxId === 'status-2') {
			await nextPagePending;
			await fulfillHome(route, [pleromaFixtures.timelines.home[1], statusWithText('status-3', 'older pagination post')]);
			return;
		}

		await fulfillHome(route, pleromaFixtures.timelines.home, 200, {
			link: '<https://pleroma.example/api/v1/timelines/home?max_id=status-2>; rel="next"'
		});
	});
	let favoriteActionPath = '';
	await page.route('https://pleroma.example/api/v1/statuses/status-3/favourite', async (route) => {
		favoriteActionPath = new URL(route.request().url()).pathname;
		await fulfillHome(route, { ...statusWithText('status-3', 'older pagination post'), favourited: true, favourites_count: 10 });
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const list = page.getByTestId('home-timeline-list');
	await expect(list).toContainText('quiet CSS can still carry the voice.');
	await page.getByRole('button', { name: 'Load more' }).click();
	await expect(page.getByRole('status', { name: 'Timeline pagination status' })).toContainText('Loading older posts');
	releaseNextPage();
	await expect(list).toContainText('older pagination post');
	await expect(page.locator('[data-status-id="status-1"]')).toHaveCount(1);
	await expect(page.locator('[data-status-id="status-2"]')).toHaveCount(1);
	await expect(page.locator('[data-status-id="status-3"]')).toHaveCount(1);
	await expect(page.locator('[data-action-status-id="status-3"]')).toHaveCount(1);
	await page.locator('[data-status-id="status-3"]').getByRole('button', { name: 'Favorite 9' }).click();
	await expect.poll(() => favoriteActionPath).toBe('/api/v1/statuses/status-3/favourite');
	await expect(page.getByText('No older posts')).toBeVisible();
	expect(requestedMaxIds).toEqual([null, 'status-2']);
});

test('home timeline retries load-more errors with the same cursor', async ({ page }) => {
	await authenticate(page);
	let nextAttempts = 0;
	const requestedMaxIds: Array<string | null> = [];
	await mockHomeTimeline(page, async (route) => {
		const url = new URL(route.request().url());
		const maxId = url.searchParams.get('max_id');
		requestedMaxIds.push(maxId);

		if (maxId !== 'status-2') {
			await fulfillHome(route, pleromaFixtures.timelines.home, 200, {
				link: '<https://pleroma.example/api/v1/timelines/home?max_id=status-2>; rel="next"'
			});
			return;
		}

		nextAttempts += 1;
		if (nextAttempts === 1) {
			await fulfillHome(route, { error: 'maintenance' }, 503);
			return;
		}

		await fulfillHome(route, [statusWithText('status-4', 'older post after retry')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const list = page.getByTestId('home-timeline-list');
	await expect(list).toContainText('quiet CSS can still carry the voice.');
	await page.getByRole('button', { name: 'Load more' }).click();
	await expect(page.getByText('Pleroma server error')).toBeVisible();
	await expect(list).toContainText('quiet CSS can still carry the voice.');
	await page.getByRole('button', { name: 'Retry load more' }).click();
	await expect(list).toContainText('older post after retry');
	expect(nextAttempts).toBe(2);
	expect(requestedMaxIds).toEqual([null, 'status-2', 'status-2']);
});

test('home timeline opens a user stream and queues streamed posts behind the indicator', async ({ page }) => {
	await authenticate(page);
	const requestedSinceIds: Array<string | null> = [];
	await mockHomeTimeline(page, async (route) => {
		const url = new URL(route.request().url());
		requestedSinceIds.push(url.searchParams.get('since_id'));
		await fulfillHome(route, [statusWithText('status-1', 'stable existing post')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	const list = page.getByTestId('home-timeline-list');
	await expect(list).toContainText('stable existing post');
	expect(await page.evaluate(() => {
		const testWindow = window as typeof window & { __pleromanetSockets?: Array<{ url: string }> };
		return testWindow.__pleromanetSockets?.[0]?.url;
	})).toBe('wss://pleroma.example/api/v1/streaming/?stream=user&access_token=access-token');

	await emitStreamUpdate(page, statusWithText('status-stream', 'fresh streamed post'));
	const indicator = page.getByRole('button', { name: /New posts available/ });
	await expect(indicator).toBeVisible();
	await expect(list).not.toContainText('fresh streamed post');
	await indicator.click();
	await expect(list).toContainText('fresh streamed post');
	expect(requestedSinceIds).toEqual([null]);

	await page.getByRole('link', { name: 'Explore' }).first().click();
	await expect(page.getByRole('heading', { name: 'Explore the network' })).toBeVisible();
	expect(await page.evaluate(() => {
		const testWindow = window as typeof window & { __pleromanetSockets?: Array<{ closeCalled: boolean }> };
		return testWindow.__pleromanetSockets?.[0]?.closeCalled;
	})).toBe(true);
});

test('home timeline fallback backfills gaps behind streamed posts', async ({ page }) => {
	await authenticate(page);
	const requestedSinceIds: Array<string | null> = [];
	await mockHomeTimeline(page, async (route) => {
		const url = new URL(route.request().url());
		const sinceId = url.searchParams.get('since_id');
		requestedSinceIds.push(sinceId);

		if (sinceId === 'status-1') {
			await fulfillHome(route, [
				statusWithText('status-3', 'streamed newest post'),
				statusWithText('status-2', 'missed gap post')
			]);
			return;
		}

		await fulfillHome(route, [statusWithText('status-1', 'stable existing post')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	const list = page.getByTestId('home-timeline-list');
	await expect(list).toContainText('stable existing post');

	await emitStreamUpdate(page, statusWithText('status-3', 'streamed newest post'));
	await expect(page.getByRole('button', { name: /New posts available/ })).toBeVisible();
	await page.evaluate(() => window.dispatchEvent(new Event('pleromanet:check-home-timeline')));
	await expect.poll(() => requestedSinceIds).toEqual([null, 'status-1']);

	await page.getByRole('button', { name: /New posts available/ }).click();
	await expect(list).toContainText('streamed newest post');
	await expect(list).toContainText('missed gap post');
	const renderedStatusIds = await page.locator('[data-status-id]').evaluateAll((nodes) => nodes.slice(0, 3).map((node) => node.getAttribute('data-status-id')));
	expect(renderedStatusIds).toEqual(['status-3', 'status-2', 'status-1']);
});

test('home timeline keeps loaded posts when the user stream cannot open', async ({ page }) => {
	await authenticateWithThrowingWebSocket(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [statusWithText('status-1', 'stable existing post')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(page.getByTestId('home-timeline-list')).toContainText('stable existing post');
	await expect(page.getByRole('button', { name: 'Retry request' })).toHaveCount(0);
});

test('home timeline stream errors run a fallback check without dropping loaded posts', async ({ page }) => {
	await authenticate(page);
	const requestedSinceIds: Array<string | null> = [];
	await mockHomeTimeline(page, async (route) => {
		const url = new URL(route.request().url());
		const sinceId = url.searchParams.get('since_id');
		requestedSinceIds.push(sinceId);

		if (sinceId === 'status-1') {
			await fulfillHome(route, [statusWithText('status-error-recovery', 'fresh post after stream error')]);
			return;
		}

		await fulfillHome(route, [statusWithText('status-1', 'stable existing post')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	const list = page.getByTestId('home-timeline-list');
	await expect(list).toContainText('stable existing post');

	await emitStreamError(page);
	await expect.poll(() => requestedSinceIds).toEqual([null, 'status-1']);
	await expect(list).toContainText('stable existing post');
	await page.getByRole('button', { name: /New posts available/ }).click();
	await expect(list).toContainText('fresh post after stream error');
	expect(await page.evaluate(() => {
		const testWindow = window as typeof window & { __pleromanetSockets?: Array<{ closeCalled: boolean }> };
		return testWindow.__pleromanetSockets?.[0]?.closeCalled;
	})).toBe(true);
});

test('home timeline ignores initial responses after leaving home while loading', async ({ page }) => {
	await authenticate(page);
	let releaseRequest: () => void = () => undefined;
	let responseFulfilled = false;
	const pending = new Promise<void>((resolve) => {
		releaseRequest = resolve;
	});
	await mockHomeTimeline(page, async (route) => {
		await pending;
		await fulfillHome(route, [statusWithText('status-1', 'stable existing post')]);
		responseFulfilled = true;
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect(page.getByRole('status', { name: 'Request status' })).toContainText('Loading Pleroma data');
	await page.getByRole('link', { name: 'Explore' }).first().click();
	await expect(page.getByRole('heading', { name: 'Explore the network' })).toBeVisible();

	releaseRequest();
	await expect.poll(() => responseFulfilled).toBe(true);
	expect(await page.evaluate(() => {
		const testWindow = window as typeof window & { __pleromanetSockets?: unknown[] };
		return testWindow.__pleromanetSockets?.length ?? 0;
	})).toBe(0);
});

test('home timeline empty-stream fallback refreshes without a stream-only cursor', async ({ page }) => {
	await authenticate(page);
	const requestedSinceIds: Array<string | null> = [];
	await mockHomeTimeline(page, async (route) => {
		const url = new URL(route.request().url());
		requestedSinceIds.push(url.searchParams.get('since_id'));

		if (requestedSinceIds.length === 1) {
			await fulfillHome(route, []);
			return;
		}

		await fulfillHome(route, [
			statusWithText('status-3', 'streamed empty newest post'),
			statusWithText('status-2', 'missed empty gap post')
		], 200, {
			link: '<https://pleroma.example/api/v1/timelines/home?max_id=status-2>; rel="next"'
		});
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect(page.getByText('No posts yet')).toBeVisible();

	await emitStreamUpdate(page, statusWithText('status-3', 'streamed empty newest post'));
	await page.getByRole('button', { name: /New posts available/ }).click();
	const list = page.getByTestId('home-timeline-list');
	await expect(list).toContainText('streamed empty newest post');

	await page.evaluate(() => window.dispatchEvent(new Event('pleromanet:check-home-timeline')));
	await expect.poll(() => requestedSinceIds).toEqual([null, null]);
	await expect(list).toContainText('missed empty gap post');
	const renderedStatusIds = await page.locator('[data-status-id]').evaluateAll((nodes) => nodes.slice(0, 2).map((node) => node.getAttribute('data-status-id')));
	expect(renderedStatusIds).toEqual(['status-3', 'status-2']);
	await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
});

test('home timeline fallback trigger shows new-post indicator, prepends on activation, dedupes, and scrolls to top', async ({ page }) => {
	await authenticate(page);
	const initialStatuses = Array.from({ length: 12 }, (_, index) => statusWithText(`status-${index + 1}`, `older timeline post ${index + 1}`));
	const requestedSinceIds: Array<string | null> = [];
	await mockHomeTimeline(page, async (route) => {
		const url = new URL(route.request().url());
		const sinceId = url.searchParams.get('since_id');
		requestedSinceIds.push(sinceId);

		if (sinceId === 'status-1') {
			await fulfillHome(route, [statusWithText('status-new', 'fresh new post from fallback check'), initialStatuses[0]]);
			return;
		}

		await fulfillHome(route, initialStatuses);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	const list = page.getByTestId('home-timeline-list');
	await expect(list).toContainText('older timeline post 1');
	await page.evaluate(() => window.scrollTo(0, 520));
	const scrollBefore = await page.evaluate(() => window.scrollY);
	expect(scrollBefore).toBeGreaterThan(0);

	await page.evaluate(() => window.dispatchEvent(new Event('pleromanet:check-home-timeline')));
	const indicator = page.getByRole('button', { name: /New posts available/ });
	await expect(indicator).toBeVisible();
	await expect(list).not.toContainText('fresh new post from fallback check');
	await indicator.click();

	await expect(list).toContainText('fresh new post from fallback check');
	await expect(page.locator('[data-status-id="status-new"]')).toHaveCount(1);
	await expect(page.locator('[data-status-id="status-1"]')).toHaveCount(1);
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	expect(requestedSinceIds).toEqual([null, 'status-1']);
});

test('home timeline new-post check errors keep the timeline usable and recover on the next trigger', async ({ page }) => {
	await authenticate(page);
	let checkAttempts = 0;
	await mockHomeTimeline(page, async (route) => {
		const url = new URL(route.request().url());
		if (url.searchParams.get('since_id') === 'status-1') {
			checkAttempts += 1;
			if (checkAttempts === 1) {
				await fulfillHome(route, { error: 'maintenance' }, 503);
				return;
			}

			await fulfillHome(route, [statusWithText('status-new-after-error', 'fresh post after retry')]);
			return;
		}

		await fulfillHome(route, [statusWithText('status-1', 'stable existing post')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	const list = page.getByTestId('home-timeline-list');
	await expect(list).toContainText('stable existing post');

	await page.evaluate(() => window.dispatchEvent(new Event('pleromanet:check-home-timeline')));
	await expect.poll(() => checkAttempts).toBe(1);
	await expect(list).toContainText('stable existing post');
	await expect(page.getByText('Pleroma server error')).toHaveCount(0);

	await page.evaluate(() => window.dispatchEvent(new Event('pleromanet:check-home-timeline')));
	await expect(page.getByRole('button', { name: /New posts available/ })).toBeVisible();
	await page.getByRole('button', { name: /New posts available/ }).click();
	await expect(list).toContainText('fresh post after retry');
	expect(checkAttempts).toBe(2);
});

test('home timeline ignores auth errors from stale new-post checks after the session changes', async ({ page }) => {
	await authenticate(page);
	const nextSession = { ...session, accessToken: 'fresh-token', createdAt: 1700000002000 };
	let releaseCheck: () => void = () => undefined;
	let markCheckStarted: () => void = () => undefined;
	const checkStarted = new Promise<void>((resolve) => {
		markCheckStarted = resolve;
	});
	const pendingCheck = new Promise<void>((resolve) => {
		releaseCheck = resolve;
	});
	await mockHomeTimeline(page, async (route) => {
		const url = new URL(route.request().url());
		if (url.searchParams.get('since_id') === 'status-1') {
			markCheckStarted();
			await pendingCheck;
			await fulfillHome(route, { error: 'old token expired' }, 401);
			return;
		}

		await fulfillHome(route, [statusWithText('status-1', 'stable existing post')]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect(page.getByTestId('home-timeline-list')).toContainText('stable existing post');
	await page.evaluate(() => window.dispatchEvent(new Event('pleromanet:check-home-timeline')));
	await checkStarted;
	await page.evaluate((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, nextSession);
	await page.getByRole('link', { name: 'Explore' }).first().click();
	await expect(page.getByRole('heading', { name: 'Explore the network' })).toBeVisible();

	releaseCheck();
	await expect(page).toHaveURL('/app/explore');
	expect(await page.evaluate(() => JSON.parse(window.localStorage.getItem('pleromanet.session') ?? '{}').accessToken)).toBe('fresh-token');
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
