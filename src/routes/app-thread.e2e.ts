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

const mockThread = async (page: Page, focusedStatus: PleromaStatus = threadStatus, descendants: PleromaStatus[] = [threadReply, nestedThreadReply, secondThreadReply]) => {
	await mockInstance(page);
	await page.route('https://pleroma.example/api/v1/statuses/status-1', async (route) => {
		await fulfillJson(route, focusedStatus);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-1/context', async (route) => {
		await fulfillJson(route, { ancestors: [threadAncestor], descendants });
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
	await expect(page.getByTestId('thread-ancestor').getByRole('button', { name: 'Reply 1' })).toBeDisabled();
	await expect(page.getByTestId('thread-line')).toBeVisible();
	await expect(page.getByTestId('focused-post')).toContainText('quiet CSS can still carry the voice.');
	await expect(page.getByTestId('focused-post')).toContainText('4:18 PM · May 11, 2026');
	await expect(page.getByTestId('focused-post')).toContainText('Pleroma Web');
	await expect(page.getByTestId('focused-post').locator('.post-photos img[alt="thread photo"]')).toHaveAttribute('src', 'https://cdn.example/thread-photo.jpg');
	await expect(page.getByTestId('focused-engagement')).toContainText('Boost');
	await expect(page.getByRole('form', { name: 'Thread reply' })).toHaveCount(0);
	await expect(page.getByTestId('thread-reply-count')).toContainText('3 replies');
	await expect(page.getByTestId('thread-reply').first()).toContainText('we used to log off. when did that stop being a thing.');
	await expect(page.getByTestId('thread-reply').nth(1)).toContainText('this is the energy i needed today.');
	await expect(page.getByText('around the time the algorithm replaced the timeline.')).toBeHidden();
	await page.getByRole('button', { name: 'Show 1 reply' }).click();
	await expect(page.getByText('around the time the algorithm replaced the timeline.')).toBeVisible();
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

test('real thread route opens focused media in the attachment lightbox', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	await page.getByTestId('focused-post').locator('.post-photos button').click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.locator('.lightbox-photo')).toHaveAttribute('src', 'https://cdn.example/thread-photo.jpg');
});

test('real thread route renders focused reply addressee chips', async ({ page }) => {
	await authenticate(page);
	await mockThread(page, {
		...threadStatus,
		content: '<p>@gridwave @lumen quiet CSS can still carry the voice.</p>',
		in_reply_to_id: 'ancestor-1',
		in_reply_to_account_id: 'gridwave',
		pleroma: {
			...threadStatus.pleroma,
			content: { 'text/plain': '@gridwave @lumen quiet CSS can still carry the voice.' }
		}
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const focused = page.getByTestId('focused-post');
	await expect(focused.locator('.focused-body')).toHaveText('quiet CSS can still carry the voice.');
	await expect(focused.locator('.post-pinged-l')).toHaveText('Replying to');
	await expect(focused.locator('.post-pinged-chip-parent')).toContainText('@gridwave');
	await expect(focused.locator('.post-pinged-chip-parent svg')).toBeVisible();
	await expect(focused.locator('.post-pinged-also')).toContainText('also');
	await expect(focused.locator('.post-pinged-chip')).toContainText('@lumen');
});

test('real thread route folds content warnings on ancestors, focused posts, replies, and nested replies', async ({ page }) => {
	await authenticate(page);
	const withContentWarning = (status: PleromaStatus, summary: string, body: string): PleromaStatus => ({
		...status,
		content: `<p>${body}</p>`,
		spoiler_text: summary,
		pleroma: {
			...status.pleroma,
			content: { 'text/plain': body },
			spoiler_text: { 'text/plain': summary }
		}
	});
	await mockInstance(page);
	await page.route('https://pleroma.example/api/v1/statuses/reply-1-child/favourite', async (route) => {
		await fulfillJson(route, { ...nestedThreadReply, favourited: true, favourites_count: 23 });
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-1', async (route) => {
		await fulfillJson(route, withContentWarning(threadStatus, 'focused warning', 'hidden focused thread body'));
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-1/context', async (route) => {
		await fulfillJson(route, {
			ancestors: [withContentWarning(threadAncestor, 'ancestor warning', 'hidden ancestor body')],
			descendants: [
				withContentWarning(threadReply, 'reply warning', 'hidden reply body'),
				withContentWarning(nestedThreadReply, 'nested warning', 'hidden nested body'),
				secondThreadReply
			]
		});
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const ancestor = page.getByTestId('thread-ancestor');
	await expect(ancestor.locator('.post-cw-card')).toContainText('ancestor warning');
	await expect(ancestor).not.toContainText('hidden ancestor body');
	await ancestor.getByRole('button', { name: 'Show post' }).click();
	await expect(ancestor).toContainText('hidden ancestor body');

	const focused = page.getByTestId('focused-post');
	await expect(focused.locator('.post-cw-card')).toContainText('focused warning');
	await expect(focused).not.toContainText('hidden focused thread body');
	await focused.getByRole('button', { name: 'Show post' }).click();
	await expect(focused).toContainText('hidden focused thread body');
	await focused.getByRole('button', { name: 'Hide' }).click();
	await expect(focused).not.toContainText('hidden focused thread body');

	const reply = page.getByTestId('thread-reply').first();
	await expect(reply.locator('.post-cw-card')).toContainText('reply warning');
	await expect(reply).not.toContainText('hidden reply body');
	await reply.getByRole('button', { name: 'Show post' }).click();
	await expect(reply).toContainText('hidden reply body');

	await page.getByRole('button', { name: 'Show 1 reply' }).click();
	const nested = page.locator('.nested-replies .post-reply').first();
	await expect(nested.locator('.post-cw-card')).toContainText('nested warning');
	await expect(nested).not.toContainText('hidden nested body');
	await nested.getByRole('button', { name: 'Show post' }).click();
	await expect(nested).toContainText('hidden nested body');
	await nested.getByRole('button', { name: 'Favorite 22' }).click();
	await expect(nested.getByRole('button', { name: 'Favorite 23' })).toHaveAttribute('aria-pressed', 'true');
	await nested.getByRole('button', { name: 'Hide' }).click();
	await expect(nested.getByRole('button', { name: 'Favorite 23' })).toHaveAttribute('aria-pressed', 'true');
});

test('real thread route reply actions update local state', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	let boostAuthorization = '';
	let favoriteAuthorization = '';
	await page.route('https://pleroma.example/api/v1/statuses/reply-1/reblog', async (route) => {
		boostAuthorization = route.request().headers().authorization ?? '';
		await fulfillJson(route, { ...threadReply, reblogged: true, reblogs_count: 13 });
	});
	await page.route('https://pleroma.example/api/v1/statuses/reply-1/favourite', async (route) => {
		favoriteAuthorization = route.request().headers().authorization ?? '';
		await fulfillJson(route, { ...threadReply, favourited: true, favourites_count: 65 });
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const reply = page.getByTestId('thread-reply').filter({ hasText: 'we used to log off. when did that stop being a thing.' });

	await reply.getByRole('button', { name: 'Boost 12' }).click();
	await expect(reply.getByRole('button', { name: 'Boost 13' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Boost 13' })).toHaveClass(/on/);
	await expect.poll(() => boostAuthorization).toBe('Bearer access-token');

	await reply.getByRole('button', { name: 'Favorite 64' }).click();
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveClass(/on/);
	await expect.poll(() => favoriteAuthorization).toBe('Bearer access-token');
});

test('real thread route inline reply composer submits for the focused post', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	let createAuthorization = '';
	let createBody = '';
	await page.route('https://pleroma.example/api/v1/statuses', async (route) => {
		createAuthorization = route.request().headers().authorization ?? '';
		createBody = route.request().postData() ?? '';
		await fulfillJson(route, statusWithText('created-thread-inline-reply', 'replying inline to the focused thread', {
			in_reply_to_id: 'status-1',
			in_reply_to_account_id: 'account-1',
			replies_count: 0,
			reblogs_count: 0,
			favourites_count: 0
		}));
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const focused = page.getByTestId('focused-post');
	await focused.getByRole('button', { name: 'Reply 2' }).click();
	const replyForm = page.getByRole('form', { name: 'Inline reply to @quietadmin' });
	await expect(replyForm).toBeVisible();
	await expect(replyForm.getByRole('img', { name: 'quiet admin avatar' })).toHaveAttribute('src', 'https://pleroma.example/avatar.png');
	await replyForm.getByRole('textbox', { name: 'Reply text' }).fill('replying inline to the focused thread');
	await replyForm.getByRole('button', { name: 'Reply', exact: true }).click();

	await expect(page.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);
	await expect(page.getByTestId('thread-reply-count')).toContainText('4 replies');
	await expect(page.getByText('replying inline to the focused thread')).toBeVisible();
	expect(createAuthorization).toBe('Bearer access-token');
	const params = new URLSearchParams(createBody);
	expect(params.get('status')).toBe('replying inline to the focused thread');
	expect(params.get('in_reply_to_id')).toBe('status-1');
	expect(params.get('visibility')).toBe('public');
});

test('real thread route inline reply composer opens below a targeted reply and cancels', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const reply = page.getByTestId('thread-reply').filter({ hasText: 'we used to log off. when did that stop being a thing.' });
	await reply.getByRole('button', { name: 'Reply 0' }).click();
	const replyForm = page.getByRole('form', { name: 'Inline reply to @datagram' });
	await expect(replyForm).toBeVisible();
	await expect(replyForm).toContainText('Replying to');
	await expect(replyForm).toContainText('@datagram');
	await expect(replyForm.getByRole('img', { name: 'datagram avatar' })).toHaveAttribute('src', 'https://pleroma.example/datagram.png');
	await reply.getByRole('button', { name: 'Reply 0' }).click();
	await expect(page.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);

	await reply.getByRole('button', { name: 'Reply 0' }).click();
	await expect(replyForm).toBeVisible();
	await replyForm.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);
});

test('real thread route inline reply composer submits below a targeted reply', async ({ page }) => {
	await authenticate(page);
	const unlistedThreadReply = { ...threadReply, visibility: 'unlisted' };
	await mockThread(page, threadStatus, [unlistedThreadReply, nestedThreadReply, secondThreadReply]);
	let createBody = '';
	await page.route('https://pleroma.example/api/v1/statuses', async (route) => {
		createBody = route.request().postData() ?? '';
		await fulfillJson(route, statusWithText('created-nested-inline-reply', 'replying inline to a thread reply', {
			in_reply_to_id: 'reply-1',
			in_reply_to_account_id: 'datagram',
			replies_count: 0,
			reblogs_count: 0,
			favourites_count: 0
		}));
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const reply = page.getByTestId('thread-reply').filter({ hasText: 'we used to log off. when did that stop being a thing.' });
	await reply.getByRole('button', { name: 'Reply 0' }).click();
	const replyForm = page.getByRole('form', { name: 'Inline reply to @datagram' });
	await replyForm.getByRole('textbox', { name: 'Reply text' }).fill('replying inline to a thread reply');
	await replyForm.getByRole('button', { name: 'Reply', exact: true }).click();

	await expect(page.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);
	await expect(page.getByTestId('thread-reply-count')).toContainText('4 replies');
	await expect(reply.getByRole('button', { name: 'Reply 1' })).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByText('replying inline to a thread reply')).toBeVisible();
	const params = new URLSearchParams(createBody);
	expect(params.get('status')).toBe('replying inline to a thread reply');
	expect(params.get('in_reply_to_id')).toBe('reply-1');
	expect(params.get('visibility')).toBe('unlisted');
});

test('real thread route inline reply composer submits below an expanded nested reply', async ({ page }) => {
	await authenticate(page);
	const privateNestedThreadReply = { ...nestedThreadReply, visibility: 'private' };
	const descendants = [threadReply, privateNestedThreadReply, secondThreadReply];
	await mockThread(page, threadStatus, descendants);
	let createBody = '';
	const createdReply = statusWithText('created-deep-inline-reply', 'replying inline to a nested reply', {
		in_reply_to_id: 'reply-1-child',
		in_reply_to_account_id: 'orbit',
		replies_count: 0,
		reblogs_count: 0,
		favourites_count: 0
	});
	await page.route('https://pleroma.example/api/v1/statuses', async (route) => {
		createBody = route.request().postData() ?? '';
		await fulfillJson(route, createdReply);
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	await page.getByRole('button', { name: 'Show 1 reply' }).click();
	const nested = page.locator('.nested-replies .post-reply').first();
	await nested.getByRole('button', { name: 'Reply 0' }).click();
	const replyForm = page.getByRole('form', { name: 'Inline reply to @orbit' });
	await replyForm.getByRole('textbox', { name: 'Reply text' }).fill('replying inline to a nested reply');
	await replyForm.getByRole('button', { name: 'Reply', exact: true }).click();

	await expect(page.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);
	await expect(page.getByTestId('thread-reply-count')).toContainText('4 replies');
	await expect(nested.getByRole('button', { name: 'Reply 1' })).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByText('replying inline to a nested reply')).toBeVisible();
	const params = new URLSearchParams(createBody);
	expect(params.get('status')).toBe('replying inline to a nested reply');
	expect(params.get('in_reply_to_id')).toBe('reply-1-child');
	expect(params.get('visibility')).toBe('private');

	descendants.splice(0, descendants.length, threadReply, { ...privateNestedThreadReply, replies_count: 1 }, createdReply, secondThreadReply);
	await page.reload();
	await expect(page.getByTestId('thread-reply-count')).toContainText('4 replies');
	await page.getByRole('button', { name: 'Show 1 reply' }).click();
	const reloadedNested = page.locator('.nested-replies .post-reply').filter({ hasText: 'around the time the algorithm replaced the timeline.' }).first();
	await expect(reloadedNested).toBeVisible();
	await reloadedNested.getByRole('button', { name: 'Show 1 reply' }).click();
	await expect(page.getByText('replying inline to a nested reply')).toBeVisible();
});

test('real thread route action failures rollback and show scoped errors', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	let resolveFavorite: () => void = () => undefined;
	const favoritePending = new Promise<void>((resolve) => {
		resolveFavorite = resolve;
	});
	await page.route('https://pleroma.example/api/v1/statuses/reply-1/favourite', async (route) => {
		await favoritePending;
		await fulfillJson(route, { error: 'thread favorite failed temporarily' }, 503);
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const reply = page.getByTestId('thread-reply').filter({ hasText: 'we used to log off. when did that stop being a thing.' });
	await reply.getByRole('button', { name: 'Favorite 64' }).click();
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveAttribute('aria-pressed', 'true');

	resolveFavorite();
	await expect(reply.getByRole('button', { name: 'Favorite 64' })).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByRole('alert')).toContainText('thread favorite failed temporarily');
});

test('real thread route action auth failures sign out and redirect', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	await page.route('https://pleroma.example/api/v1/statuses/reply-1/reblog', async (route) => {
		await fulfillJson(route, { error: 'forbidden token' }, 403);
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const reply = page.getByTestId('thread-reply').filter({ hasText: 'we used to log off. when did that stop being a thing.' });
	await reply.getByRole('button', { name: 'Boost 12' }).click();

	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: /quieter corner of the social web/i })).toBeVisible();
});

test('real thread route keeps independent action state across out-of-order responses', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	let resolveFavorite: () => void = () => undefined;
	let resolveBoost: () => void = () => undefined;
	const favoritePending = new Promise<void>((resolve) => {
		resolveFavorite = resolve;
	});
	const boostPending = new Promise<void>((resolve) => {
		resolveBoost = resolve;
	});
	await page.route('https://pleroma.example/api/v1/statuses/reply-1/favourite', async (route) => {
		await favoritePending;
		await fulfillJson(route, { ...threadReply, favourited: true, favourites_count: 70, reblogged: false, reblogs_count: 12 });
	});
	await page.route('https://pleroma.example/api/v1/statuses/reply-1/reblog', async (route) => {
		await boostPending;
		await fulfillJson(route, { ...threadReply, favourited: false, favourites_count: 64, reblogged: true, reblogs_count: 14 });
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const reply = page.getByTestId('thread-reply').filter({ hasText: 'we used to log off. when did that stop being a thing.' });
	await reply.getByRole('button', { name: 'Favorite 64' }).click();
	await reply.getByRole('button', { name: 'Boost 12' }).click();
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Boost 13' })).toHaveAttribute('aria-pressed', 'true');

	resolveBoost();
	await expect(reply.getByRole('button', { name: 'Boost 14' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveAttribute('aria-pressed', 'true');

	resolveFavorite();
	await expect(reply.getByRole('button', { name: 'Favorite 70' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Boost 14' })).toHaveAttribute('aria-pressed', 'true');
});

test('real thread route does not leak action failures across thread id changes', async ({ page }) => {
	await authenticate(page);
	const secondThreadStatus = statusWithText('status-2', 'a different thread should not inherit action errors', {
		replies_count: 0,
		reblogs_count: 1,
		favourites_count: 5
	});
	let resolveFavorite: () => void = () => undefined;
	const favoritePending = new Promise<void>((resolve) => {
		resolveFavorite = resolve;
	});
	await mockInstance(page);
	await page.route('https://pleroma.example/api/v1/statuses/status-1', async (route) => {
		await fulfillJson(route, threadStatus);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-1/context', async (route) => {
		await fulfillJson(route, { ancestors: [threadAncestor], descendants: [threadReply] });
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-2', async (route) => {
		await fulfillJson(route, secondThreadStatus);
	});
	await page.route('https://pleroma.example/api/v1/statuses/status-2/context', async (route) => {
		await fulfillJson(route, { ancestors: [], descendants: [] });
	});
	await page.route('https://pleroma.example/api/v1/statuses/reply-1/favourite', async (route) => {
		await favoritePending;
		await fulfillJson(route, { error: 'late thread favorite failed' }, 503);
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const reply = page.getByTestId('thread-reply').filter({ hasText: 'we used to log off. when did that stop being a thing.' });
	await reply.getByRole('button', { name: 'Favorite 64' }).click();
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveAttribute('aria-pressed', 'true');
	await page.evaluate(() => {
		window.history.pushState({}, '', '/app/thread/status-2');
		window.dispatchEvent(new PopStateEvent('popstate'));
	});
	await expect(page).toHaveURL('/app/thread/status-2');
	await expect(page.getByTestId('focused-post')).toContainText('a different thread should not inherit action errors');

	const favoriteResponse = page.waitForResponse('https://pleroma.example/api/v1/statuses/reply-1/favourite');
	resolveFavorite();
	await favoriteResponse;
	await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
	await expect(page.getByText('late thread favorite failed')).toHaveCount(0);
	await expect(page.getByTestId('focused-post').getByRole('button', { name: 'Favorite 5' })).toHaveAttribute('aria-pressed', 'false');
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
	await expect(page.getByRole('form', { name: 'Thread reply' })).toHaveCount(0);
	await expectNoHorizontalOverflow(page);
});

test('real thread inline reply composer remains usable on mobile', async ({ page }) => {
	await authenticate(page);
	await mockThread(page);
	await setViewport(page, 'mobile');
	await page.goto('/app/thread/status-1');

	await page.getByTestId('focused-post').getByRole('button', { name: 'Reply 2' }).click();
	const replyForm = page.getByRole('form', { name: 'Inline reply to @quietadmin' });
	await expect(replyForm).toBeVisible();
	await expect(replyForm.getByRole('textbox', { name: 'Reply text' })).toBeVisible();
	await expect(replyForm.getByRole('button', { name: 'Reply', exact: true })).toBeDisabled();
	await expectNoHorizontalOverflow(page);
});

test('real thread nested inline reply composer remains usable on mobile', async ({ page }) => {
	await authenticate(page);
	const deepNestedReply = statusWithText('reply-1-grandchild', 'one more nested reply for mobile layout', {
		account: accountWithName('pixel', 'pixel', 'pixel@tiny.social'),
		in_reply_to_id: 'reply-1-child',
		in_reply_to_account_id: 'orbit',
		replies_count: 1,
		reblogs_count: 0,
		favourites_count: 0
	});
	const cappedNestedReply = statusWithText('reply-1-greatgrandchild', 'the fourth nested mobile reply still fits', {
		account: accountWithName('wavelet', 'wavelet', 'wavelet@tiny.social'),
		in_reply_to_id: 'reply-1-grandchild',
		in_reply_to_account_id: 'pixel',
		replies_count: 0,
		reblogs_count: 0,
		favourites_count: 0
	});
	await mockThread(page, threadStatus, [threadReply, { ...nestedThreadReply, replies_count: 1 }, deepNestedReply, cappedNestedReply, secondThreadReply]);
	await setViewport(page, 'mobile');
	await page.goto('/app/thread/status-1');

	await page.getByRole('button', { name: 'Show 1 reply' }).click();
	const nested = page.locator('.nested-replies .post-reply').filter({ hasText: 'around the time the algorithm replaced the timeline.' }).first();
	await nested.getByRole('button', { name: 'Show 1 reply' }).click();
	const deepNested = page.locator('.nested-replies .nested-replies .post-reply').filter({ hasText: 'one more nested reply for mobile layout' }).first();
	await deepNested.getByRole('button', { name: 'Show 1 reply' }).click();
	const cappedNested = page.locator('.nested-replies .nested-replies .nested-replies .post-reply').filter({ hasText: 'the fourth nested mobile reply still fits' }).first();
	await cappedNested.getByRole('button', { name: 'Reply 0' }).click();
	const replyForm = page.getByRole('form', { name: 'Inline reply to @wavelet' });
	await expect(replyForm).toBeVisible();
	await expect(replyForm.getByRole('textbox', { name: 'Reply text' })).toBeVisible();
	await expect(replyForm.getByRole('button', { name: 'Reply', exact: true })).toBeDisabled();
	await expectNoHorizontalOverflow(page);
});
