import { expect, test, type Page, type Route } from '@playwright/test';
import { NOTIFICATION_POLL_EVENT, notificationLastSeenStorageKey } from '../lib/pleroma/notifications';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import type { PleromaAccount, PleromaNotification, PleromaStatus } from '../lib/pleroma/types';
import { expectNoHorizontalOverflow, mockRightRailApis, setViewport } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};

const authenticate = async (page: Page) => {
	await mockRightRailApis(page);
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

const authenticateTokenOnly = async (page: Page) => {
	await mockRightRailApis(page);
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, {
		instanceUrl: session.instanceUrl,
		accessToken: session.accessToken,
		tokenType: session.tokenType,
		scope: session.scope,
		createdAt: session.createdAt
	});
};

const accountWithName = (id: string, displayName: string, acct: string): PleromaAccount => ({
	...pleromaFixtures.account,
	id,
	username: acct.split('@')[0],
	acct,
	display_name: displayName,
	url: `https://pleroma.example/users/${id}`,
	avatar: `https://pleroma.example/${id}.png`,
	avatar_static: `https://pleroma.example/${id}.png`
});

const statusWithText = (id: string, text: string, account = pleromaFixtures.account): PleromaStatus => ({
	...pleromaFixtures.status,
	id,
	uri: `https://pleroma.example/objects/${id}`,
	url: `https://pleroma.example/notice/${id}`,
	account,
	content: `<p>${text}</p>`,
	created_at: '2026-05-18T12:00:00.000Z',
	pleroma: {
		...pleromaFixtures.status.pleroma,
		content: { 'text/plain': text },
		spoiler_text: { 'text/plain': '' }
	}
});

const notification = (id: string, type: string, account: PleromaAccount, createdAt: string, status?: PleromaStatus): PleromaNotification => ({
	id,
	type,
	created_at: createdAt,
	account,
	status: status ?? null,
	pleroma: {}
});

const mentionActor = accountWithName('account-mention', 'orbit', 'orbit@spacebear.net');
const followActor = accountWithName('account-follow', 'static.gif', 'staticgif@modem.zone');
const favActor = accountWithName('account-fav', 'kestrel', 'kestrel@audio.garden');
const boostActor = accountWithName('account-boost', 'lumen', 'lumen@candle.house');
const unknownActor = accountWithName('account-unknown', 'relay bot', 'relay@pleroma.example');
const mentionStatus = statusWithText('status-mention', 'hey @quietadmin, this carries through notifications.', mentionActor);
const favStatus = statusWithText('status-fav', 'a placeholder is more honest than a guess.');
const boostStatus = statusWithText('status-boost', 'living in a soft world. quietly federating.');
const initialNotifications = [
	notification('notif-mention', 'mention', mentionActor, '2026-05-18T12:02:00.000Z', mentionStatus),
	notification('notif-follow', 'follow', followActor, '2026-05-18T12:01:00.000Z'),
	notification('notif-fav', 'favourite', favActor, '2026-05-18T12:00:00.000Z', favStatus),
	notification('notif-boost', 'reblog', boostActor, '2026-05-18T11:59:00.000Z', boostStatus),
	notification('notif-unknown', 'pleroma:emoji_reaction', unknownActor, '2026-05-18T11:58:00.000Z', favStatus)
];

const fulfillJson = async (route: Route, body: unknown, status = 200) => {
	await route.fulfill({
		status,
		contentType: 'application/json',
		body: JSON.stringify(body)
	});
};

const mockHomeTimeline = async (page: Page) => {
	await page.route('https://pleroma.example/api/v1/timelines/home**', async (route) => {
		await fulfillJson(route, pleromaFixtures.timelines.home);
	});
};

const mockThread = async (page: Page, status: PleromaStatus) => {
	await page.route(`https://pleroma.example/api/v1/statuses/${status.id}`, async (route) => {
		await fulfillJson(route, status);
	});
	await page.route(`https://pleroma.example/api/v1/statuses/${status.id}/context`, async (route) => {
		await fulfillJson(route, { ancestors: [], descendants: [] });
	});
};

const mockNotifications = async (page: Page, body: () => PleromaNotification[] | Promise<PleromaNotification[]>) => {
	let requests = 0;
	await page.route('https://pleroma.example/api/v1/notifications**', async (route) => {
		requests += 1;
		expect(route.request().headers().authorization).toBe('Bearer access-token');
		await fulfillJson(route, await body());
	});
	return () => requests;
};

const mockOwnAccount = async (page: Page) => {
	await page.route('https://pleroma.example/api/v1/accounts/verify_credentials', async (route) => {
		await fulfillJson(route, pleromaFixtures.account);
	});
};

const notificationBadge = (page: Page) => page.getByTestId('left-sidebar').getByRole('link', { name: /Notifications/ }).locator('.count');
const headerBell = (page: Page) => page.getByTestId('app-header').getByRole('button', { name: /Notifications/ });

test('real notifications route renders mocked API notifications and navigates by target', async ({ page }) => {
	await authenticate(page);
	await mockThread(page, mentionStatus);
	await mockThread(page, favStatus);
	await mockNotifications(page, () => initialNotifications);
	await setViewport(page, 'desktop');
	await page.goto('/app/notifications');

	await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
	await expect(page.getByTestId('notifications-list')).toContainText('orbit mentioned you');
	await expect(page.getByTestId('notifications-list')).toContainText('static.gif followed you');
	await expect(page.getByTestId('notifications-list')).toContainText('kestrel favorited your post');
	await expect(page.getByTestId('notifications-list')).toContainText('lumen boosted your post');
	await expect(page.getByTestId('notifications-list')).toContainText('relay bot sent a notification');
	await expect(page.getByTestId('notifications-list').getByRole('button', { name: /relay bot sent a notification/ })).toHaveCount(0);
	await expect(notificationBadge(page)).toHaveText('5');

	await page.getByTestId('notifications-list').getByText('orbit mentioned you').click();
	await expect(page).toHaveURL('/app/thread/status-mention');
	await expect(page.getByTestId('focused-post')).toContainText('hey @quietadmin');

	await page.goto('/app/notifications');
	await page.getByTestId('notifications-list').getByText('kestrel favorited your post').click();
	await expect(page).toHaveURL('/app/thread/status-fav');

	await page.goto('/app/notifications');
	await page.getByTestId('notifications-list').getByText('static.gif followed you').click();
	await expect(page).toHaveURL('/app/profiles/staticgif%40modem.zone');

	await page.goto('/app/notifications');
	await page.getByTestId('notifications-list').getByText('relay bot sent a notification').click();
	await expect(page).toHaveURL('/app/notifications');
	await expectNoHorizontalOverflow(page);
});

test('header bell opens real notifications popover with filters and read actions', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page);
	await mockNotifications(page, () => initialNotifications);
	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(headerBell(page).locator('.badge')).toHaveText('5');
	await headerBell(page).click();
	const popover = page.getByTestId('header-notifications-popover');
	await expect(popover).toBeVisible();
	await expect(popover).toContainText('orbit mentioned you');
	await expect(popover).toContainText('static.gif followed you');
	await expect(popover.locator('.notif-pop-count')).toHaveText('5 new');

	await popover.getByRole('button', { name: 'Favorites' }).click();
	await expect(popover).toContainText('kestrel favorited your post');
	await expect(popover).not.toContainText('orbit mentioned you');

	await popover.getByRole('button', { name: 'Mark all read' }).click();
	await expect(headerBell(page).locator('.badge')).toHaveCount(0);
	await expect(popover.locator('.notif-pop-count')).toHaveCount(0);
	await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), notificationLastSeenStorageKey(session))).toBe('2026-05-18T12:02:00.000Z');

	await popover.getByRole('button', { name: /See all notifications/ }).click();
	await expect(page).toHaveURL('/app/notifications');
	await expect(popover).toHaveCount(0);
});

test('header notification rows navigate by target and close the popover', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page);
	await mockThread(page, mentionStatus);
	await mockNotifications(page, () => initialNotifications);
	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await headerBell(page).click();
	const popover = page.getByTestId('header-notifications-popover');
	await expect(popover).toContainText('orbit mentioned you');
	await popover.getByText('orbit mentioned you').click();

	await expect(page).toHaveURL('/app/thread/status-mention');
	await expect(popover).toHaveCount(0);
});

test('notification badge updates on polling and mark-read state persists locally', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page);
	let response = initialNotifications.slice(0, 1);
	const requests = await mockNotifications(page, () => response);
	await setViewport(page, 'desktop');
	await page.goto('/app/home');

	await expect(notificationBadge(page)).toHaveText('1');
	response = [notification('notif-new', 'mention', mentionActor, '2026-05-18T12:03:00.000Z', mentionStatus), ...response];
	await page.evaluate((eventName) => window.dispatchEvent(new Event(eventName)), NOTIFICATION_POLL_EVENT);
	await expect(notificationBadge(page)).toHaveText('2');
	expect(requests()).toBe(2);

	await page.getByTestId('left-sidebar').getByRole('link', { name: /Notifications/ }).click();
	await page.getByRole('button', { name: 'Mark all read' }).click();
	await expect(notificationBadge(page)).toHaveCount(0);
	await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), notificationLastSeenStorageKey(session))).toBe('2026-05-18T12:03:00.000Z');

	await page.reload();
	await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
	await expect(notificationBadge(page)).toHaveCount(0);
});

test('notification read state waits for account hydration before choosing a storage key', async ({ page }) => {
	await authenticateTokenOnly(page);
	await mockOwnAccount(page);
	await mockNotifications(page, () => initialNotifications.slice(0, 1));
	await setViewport(page, 'desktop');
	await page.goto('/app/notifications');

	await expect(page.getByTestId('notifications-list')).toContainText('orbit mentioned you');
	await page.getByRole('button', { name: 'Mark all read' }).click();
	await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), notificationLastSeenStorageKey(session))).toBe('2026-05-18T12:02:00.000Z');
	expect(await page.evaluate((key) => window.localStorage.getItem(key), `pleromanet.notifications.lastSeenAt.${session.instanceUrl}.self`)).toBeNull();
});

test('token-only notification route surfaces account hydration failures', async ({ page }) => {
	await authenticateTokenOnly(page);
	await page.route('https://pleroma.example/api/v1/accounts/verify_credentials', async (route) => {
		await fulfillJson(route, { error: 'verify failed' }, 500);
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/notifications');

	await expect(page.getByRole('heading', { name: 'Pleroma server error' })).toBeVisible();
	await expect(page.getByText('verify failed')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Retry notifications' })).toBeVisible();
	await expect(page.getByTestId('notifications-list')).toHaveCount(0);
});

test('mark all read is not undone by an in-flight notification poll', async ({ page }) => {
	await authenticate(page);
	let requests = 0;
	let resolvePendingPoll: () => void = () => undefined;
	await page.route('https://pleroma.example/api/v1/notifications**', async (route) => {
		requests += 1;
		if (requests > 1) {
			await new Promise<void>((resolve) => {
				resolvePendingPoll = resolve;
			});
		}
		await fulfillJson(route, initialNotifications.slice(0, 1));
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/notifications');
	await expect(notificationBadge(page)).toHaveText('1');

	await page.evaluate((eventName) => window.dispatchEvent(new Event(eventName)), NOTIFICATION_POLL_EVENT);
	await expect.poll(() => requests).toBe(2);
	await page.evaluate((eventName) => window.dispatchEvent(new Event(eventName)), NOTIFICATION_POLL_EVENT);
	await page.waitForTimeout(50);
	expect(requests).toBe(2);
	await page.getByRole('button', { name: 'Mark all read' }).click();
	await expect(notificationBadge(page)).toHaveCount(0);
	resolvePendingPoll();
	await page.waitForTimeout(50);
	await expect(notificationBadge(page)).toHaveCount(0);
});

test('foreground notification route load supersedes a hung background poll', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page);
	let requests = 0;
	let resolveHungRequest: () => void = () => undefined;
	await page.route('https://pleroma.example/api/v1/notifications**', async (route) => {
		requests += 1;
		if (requests === 1) {
			await new Promise<void>((resolve) => {
				resolveHungRequest = resolve;
			});
		}
		await fulfillJson(route, initialNotifications.slice(0, 1));
	});
	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect.poll(() => requests).toBe(1);

	await page.goto('/app/notifications');
	await expect.poll(() => requests).toBe(2);
	await expect(page.getByTestId('notifications-list')).toContainText('orbit mentioned you');
	resolveHungRequest();
});

test('notification polling pauses after the session is removed', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page);
	const requests = await mockNotifications(page, () => initialNotifications.slice(0, 1));
	await setViewport(page, 'desktop');
	await page.goto('/app/home');
	await expect(notificationBadge(page)).toHaveText('1');
	const beforeSignOutPoll = requests();

	await page.evaluate(() => window.localStorage.removeItem('pleromanet.session'));
	await page.evaluate((eventName) => window.dispatchEvent(new Event(eventName)), NOTIFICATION_POLL_EVENT);
	await page.waitForTimeout(50);

	expect(requests()).toBe(beforeSignOutPoll);
	await expect(notificationBadge(page)).toHaveCount(0);
});
