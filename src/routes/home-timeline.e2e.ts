import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
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

const homeUrl = 'https://pleroma.example/api/v1/timelines/home**';

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

test('home timeline moves leading reply recipients into the pinged footer', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page, async (route) => {
		await fulfillHome(route, [
			{
				...pleromaFixtures.status,
				id: 'status-leading-recipients',
				in_reply_to_id: 'parent-status',
				in_reply_to_account_id: 'account-2',
				content: '<p>@dtluna @feld qwen 0.5b can handle it. has @lain tried it?</p>',
				pleroma: {
					...pleromaFixtures.status.pleroma,
					content: { 'text/plain': '@dtluna @feld qwen 0.5b can handle it. has @lain tried it?' }
				}
			}
		]);
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	const post = page.locator('.post').filter({ hasText: 'qwen 0.5b can handle it.' }).first();
	await expect(post.locator('.post-body')).toHaveText('qwen 0.5b can handle it. has @lain tried it?');
	await expect(post.locator('.post-pinged')).toContainText('Pinged');
	await expect(post.locator('.post-pinged')).toContainText('@dtluna');
	await expect(post.locator('.post-pinged')).toContainText('@feld');
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
	await expect(list.locator('audio')).toHaveAttribute('src', 'https://cdn.example/media/field.mp3');
	const mixedPost = list.locator('[data-status-id="status-mixed-video-attachment"]');
	const stripVideo = mixedPost.locator('.media-strip-tile video');
	await expect(stripVideo).toHaveAttribute('src', 'https://cdn.example/media/second-clip.mp4');
	await expect(stripVideo).toHaveAttribute('poster', 'https://cdn.example/media/blank-video-preview.jpg');
	expect(await primeVideoMetadata(stripVideo)).toBe(1);
	expect(await stripVideo.getAttribute('poster')).toBeNull();
	await expect(list.locator('.post-media')).toHaveCount(0);
	await expectNoHorizontalOverflow(page);
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
