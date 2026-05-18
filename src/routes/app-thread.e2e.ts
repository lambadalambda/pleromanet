import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import type { PleromaAccount, PleromaStatus } from '../lib/pleroma/types';
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

const accountWithName = (id: string, displayName: string, acct: string): PleromaAccount => ({
	...pleromaFixtures.account,
	id,
	username: acct.split('@')[0],
	acct,
	display_name: displayName,
	avatar: `https://pleroma.example/${id}.png`,
	avatar_static: `https://pleroma.example/${id}.png`
});

const statusWithText = (id: string, text: string, overrides: Partial<PleromaStatus> = {}): PleromaStatus => ({
	...pleromaFixtures.status,
	id,
	uri: `https://pleroma.example/objects/${id}`,
	url: `https://pleroma.example/notice/${id}`,
	content: `<p>${text}</p>`,
	created_at: '2026-05-11T16:18:00.000Z',
	pleroma: {
		...pleromaFixtures.status.pleroma,
		content: { 'text/plain': text },
		conversation_id: 99,
		spoiler_text: { 'text/plain': '' }
	},
	...overrides
});

const threadStatus = statusWithText('status-1', 'quiet CSS can still carry the voice.', {
	application: { name: 'Pleroma Web' },
	media_attachments: [
		{ id: 'thread-photo', type: 'image', url: 'https://cdn.example/thread-photo.jpg', preview_url: 'https://cdn.example/thread-photo-preview.jpg', description: 'thread photo' }
	],
	replies_count: 2,
	reblogs_count: 12,
	favourites_count: 28
});

const threadAncestor = statusWithText('ancestor-1', 'the earlier context from gridwave', {
	account: accountWithName('gridwave', 'gridwave', 'gridwave@retro.social'),
	created_at: '2026-05-11T15:45:00.000Z',
	replies_count: 1,
	reblogs_count: 4,
	favourites_count: 18
});

const threadReply = statusWithText('reply-1', 'we used to log off. when did that stop being a thing.', {
	account: accountWithName('datagram', 'datagram', 'datagram@retro.social'),
	created_at: '2026-05-11T16:34:00.000Z',
	in_reply_to_id: 'status-1',
	in_reply_to_account_id: 'account-1',
	replies_count: 0,
	reblogs_count: 12,
	favourites_count: 64
});

const secondThreadReply = statusWithText('reply-2', 'this is the energy i needed today.', {
	account: accountWithName('lumen', 'lumen', 'lumen@example.social'),
	created_at: '2026-05-11T16:39:00.000Z',
	in_reply_to_id: 'status-1',
	in_reply_to_account_id: 'account-1',
	replies_count: 0,
	reblogs_count: 7,
	favourites_count: 39
});

const nestedThreadReply = statusWithText('reply-1-child', 'around the time the algorithm replaced the timeline.', {
	account: accountWithName('orbit', 'orbit', 'orbit@spacebear.net'),
	created_at: '2026-05-11T16:42:00.000Z',
	in_reply_to_id: 'reply-1',
	in_reply_to_account_id: 'datagram',
	replies_count: 0,
	reblogs_count: 5,
	favourites_count: 22
});

const fulfillJson = async (route: Route, body: unknown, status = 200) => {
	await route.fulfill({
		status,
		contentType: 'application/json',
		body: JSON.stringify(body)
	});
};

const mockInstance = async (page: Page) => {
	await page.route('https://pleroma.example/api/v2/instance', async (route) => {
		await fulfillJson(route, pleromaFixtures.instance);
	});
};

const mockHomeTimeline = async (page: Page) => {
	await page.route('https://pleroma.example/api/v1/timelines/home**', async (route) => {
		await fulfillJson(route, pleromaFixtures.timelines.home);
	});
};

const mockThread = async (page: Page) => {
	await mockInstance(page);
	await page.route('https://pleroma.example/api/v1/statuses/status-1', async (route) => {
		await fulfillJson(route, threadStatus);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-1/context', async (route) => {
		await fulfillJson(route, { ancestors: [threadAncestor], descendants: [threadReply, nestedThreadReply, secondThreadReply] });
	});
};

test('real thread route loads focused status, ancestors, and replies from Pleroma', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const threadHeader = page.locator('.thread-head-title');
	const threadTitle = page.getByRole('heading', { name: 'Thread' });
	const headerBox = await threadHeader.boundingBox();
	expect(headerBox).not.toBeNull();
	expect(headerBox?.height ?? 0).toBeLessThanOrEqual(50);
	expect(await threadTitle.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))).toBeLessThanOrEqual(14);
	await expect(page.getByTestId('thread-ancestor')).toContainText('gridwave');
	await expect(page.getByTestId('thread-ancestor')).toContainText('the earlier context from gridwave');
	await expect(page.getByTestId('thread-line')).toBeVisible();
	await expect(page.getByTestId('focused-post')).toContainText('quiet CSS can still carry the voice.');
	await expect(page.getByTestId('focused-post')).toContainText('4:18 PM · May 11, 2026');
	await expect(page.getByTestId('focused-post')).toContainText('Pleroma Web');
	await expect(page.getByTestId('focused-post').locator('.post-photos img[alt="thread photo"]')).toHaveAttribute('src', 'https://cdn.example/thread-photo.jpg');
	await expect(page.getByTestId('focused-engagement')).toContainText('Boost');
	await expect(page.getByRole('textbox', { name: 'Reply text' })).toBeVisible();
	await expect(page.getByTestId('reply-composer-count')).toContainText('500');
	await expect(page.getByTestId('thread-reply-count')).toContainText('3 replies');
	await expect(page.getByTestId('thread-reply').first()).toContainText('we used to log off. when did that stop being a thing.');
	await expect(page.getByTestId('thread-reply').nth(1)).toContainText('this is the energy i needed today.');
	await expect(page.getByText('around the time the algorithm replaced the timeline.')).toBeHidden();
	await page.getByRole('button', { name: 'Show 1 reply' }).click();
	await expect(page.getByText('around the time the algorithm replaced the timeline.')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Reply text' })).toBeVisible();
});

test('real thread route reply composer creates a Pleroma reply', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	let createMethod: string | undefined;
	let createAuthorization: string | undefined;
	let createBody = '';
	await page.route('https://pleroma.example/api/v1/statuses', async (route) => {
		createMethod = route.request().method();
		createAuthorization = route.request().headers().authorization;
		createBody = route.request().postData() ?? '';
		await fulfillJson(route, statusWithText('created-thread-reply', 'replying through real thread composer', {
			account: pleromaFixtures.account,
			in_reply_to_id: 'status-1',
			in_reply_to_account_id: 'account-1',
			replies_count: 0,
			reblogs_count: 0,
			favourites_count: 0
		}));
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	await page.getByRole('textbox', { name: 'Reply text' }).fill('replying through real thread composer');
	await page.getByRole('button', { name: 'Reply', exact: true }).click();

	await expect(page.getByTestId('thread-reply-count')).toContainText('4 replies');
	await expect(page.getByTestId('thread-reply').filter({ hasText: 'replying through real thread composer' })).toBeVisible();
	expect(createMethod).toBe('POST');
	expect(createAuthorization).toBe('Bearer access-token');
	const params = new URLSearchParams(createBody);
	expect(params.get('status')).toBe('replying through real thread composer');
	expect(params.get('visibility')).toBe('public');
	expect(params.get('in_reply_to_id')).toBe('status-1');
});

test('real thread route opens from the home timeline and returns to home', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page);
	await mockThread(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await page.locator('[data-status-id="status-1"]').click();
	await expect(page).toHaveURL('/app/thread/status-1');
	await expect(page.getByTestId('focused-post')).toContainText('quiet CSS can still carry the voice.');

	await page.getByRole('button', { name: 'Back to home timeline' }).click();
	await expect(page).toHaveURL('/app/home');
	await expect(page.getByRole('tablist', { name: 'Timeline sections' })).toBeVisible();
});

test('real thread route reply actions update local state', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const reply = page.getByTestId('thread-reply').filter({ hasText: 'we used to log off. when did that stop being a thing.' });

	await reply.getByRole('button', { name: 'Boost 12' }).click();
	await expect(reply.getByRole('button', { name: 'Boost 13' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Boost 13' })).toHaveClass(/on/);

	await reply.getByRole('button', { name: 'Favorite 64' }).click();
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveClass(/on/);
});

test('real thread route reply sort changes selected state and order', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const replies = page.getByTestId('thread-reply');
	await expect(page.getByRole('group', { name: 'Reply sort' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Top' })).toHaveAttribute('aria-pressed', 'true');
	await expect(replies.first()).toContainText('we used to log off. when did that stop being a thing.');

	await page.getByRole('button', { name: 'Newest' }).click();
	await expect(page.getByRole('button', { name: 'Newest' })).toHaveAttribute('aria-pressed', 'true');
	await expect(replies.first()).toContainText('this is the energy i needed today.');
});

test('real thread route renders an API error state and retries', async ({ page }) => {
	await authenticate(page);
	await mockInstance(page);
	let attempts = 0;
	await page.route('https://pleroma.example/api/v1/statuses/status-1', async (route) => {
		attempts += 1;
		await fulfillJson(route, attempts === 1 ? { error: 'try again' } : threadStatus, attempts === 1 ? 503 : 200);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-1/context', async (route) => {
		await fulfillJson(route, { ancestors: [threadAncestor], descendants: [threadReply] });
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	await expect(page.getByText('Pleroma server error')).toBeVisible();
	await page.getByRole('button', { name: 'Retry thread' }).click();
	await expect(page.getByTestId('focused-post')).toContainText('quiet CSS can still carry the voice.');
});

test('real thread route ignores stale status responses after moving to a no-id thread route', async ({ page }) => {
	await authenticate(page);
	await mockInstance(page);
	let releaseStatus: () => void = () => undefined;
	const statusPending = new Promise<void>((resolve) => {
		releaseStatus = resolve;
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-1', async (route) => {
		await statusPending;
		await fulfillJson(route, threadStatus);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-1/context', async (route) => {
		await fulfillJson(route, { ancestors: [threadAncestor], descendants: [threadReply] });
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');
	await page.goto('/app/thread');
	await expect(page.getByText('Thread unavailable')).toBeVisible();

	releaseStatus();
	await expect(page.getByText('PleromaNet needs a status id to load a thread.')).toBeVisible();
	await expect(page.getByTestId('focused-post')).toHaveCount(0);
});

test('real thread layout remains readable on mobile without horizontal overflow', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	await setViewport(page, 'mobile');
	await page.goto('/app/thread/status-1');

	await expect(page.getByTestId('thread-view')).toBeVisible();
	await expect(page.getByTestId('focused-post')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Reply text' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
