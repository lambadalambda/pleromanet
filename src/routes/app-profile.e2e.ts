import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import type { PleromaAccount, PleromaRelationship, PleromaStatus } from '../lib/pleroma/types';
import { expectNoHorizontalOverflow, fulfillJson, mockRightRailApis, setViewport } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};

const profileAccount: PleromaAccount = {
	...pleromaFixtures.account,
	id: 'account-soft',
	username: 'soft.hertz',
	acct: 'soft.hertz@kolektiva.social',
	display_name: 'soft.hertz ✦',
	note: '<p>field recordings + slow web · cassette decks · taipei.</p><script>alert("bio")</script>',
	url: 'https://kolektiva.social/users/soft.hertz',
	avatar: 'https://cdn.example/soft-hertz.png',
	avatar_static: 'https://cdn.example/soft-hertz.png',
	header: 'https://cdn.example/soft-hertz-header.png',
	header_static: 'https://cdn.example/soft-hertz-header.png',
	locked: false,
	bot: true,
	followers_count: 1921,
	following_count: 312,
	statuses_count: 2148,
	fields: [
		{ name: 'Pronouns', value: 'they / them', verified_at: null },
		{ name: 'Web', value: '<a href="https://softhertz.land">softhertz.land</a><img src=x onerror=alert(1)>', verified_at: '2026-01-01T00:00:00.000Z' },
		{ name: 'Instance', value: 'kolektiva.social', verified_at: null }
	],
	pleroma: {
		...pleromaFixtures.account.pleroma,
		relationship: {
			...pleromaFixtures.relationship,
			id: 'account-soft',
			following: true,
			followed_by: true
		},
		tags: ['field-recordist']
	}
};

const datagramAccount: PleromaAccount = {
	...profileAccount,
	id: 'account-datagram',
	username: 'datagram',
	acct: 'datagram@retro.social',
	display_name: 'datagram',
	locked: false,
	bot: false,
	fields: [],
	pleroma: { ...profileAccount.pleroma, relationship: undefined }
};

const relationshipFor = (id: string, overrides: Partial<PleromaRelationship> = {}): PleromaRelationship => ({
	...pleromaFixtures.relationship,
	id,
	following: false,
	followed_by: false,
	requested: false,
	blocking: false,
	...overrides
});

const statusForProfile = (id: string, text: string, options: Partial<PleromaStatus> = {}): PleromaStatus => ({
	...pleromaFixtures.status,
	id,
	uri: `https://kolektiva.social/objects/${id}`,
	url: `https://kolektiva.social/notice/${id}`,
	account: profileAccount,
	content: `<p>${text}</p>`,
	created_at: options.created_at ?? '2026-05-19T12:00:00.000Z',
	favourited: options.favourited ?? false,
	favourites_count: options.favourites_count ?? 12,
	in_reply_to_account_id: options.in_reply_to_account_id ?? null,
	in_reply_to_id: options.in_reply_to_id ?? null,
	media_attachments: options.media_attachments ?? [],
	pinned: options.pinned ?? false,
	pleroma: {
		...pleromaFixtures.status.pleroma,
		content: { 'text/plain': text },
		local: false,
		spoiler_text: { 'text/plain': options.spoiler_text ?? '' }
	},
	reblogged: options.reblogged ?? false,
	reblogs_count: options.reblogs_count ?? 4,
	replies_count: options.replies_count ?? 2,
	sensitive: options.sensitive ?? false,
	spoiler_text: options.spoiler_text ?? '',
	tags: [],
	visibility: options.visibility ?? 'public'
});

const pinnedStatuses = [
	statusForProfile('pin-1', "the algorithm doesn't care about you. the timeline doesn't either. but the people in it do, and that's worth keeping.", { pinned: true, favourites_count: 891, reblogs_count: 312, replies_count: 142 }),
	statusForProfile('pin-2', 'follow whoever you want. mute liberally. block when you need to. the timeline is yours to tend.', { pinned: true, favourites_count: 612, reblogs_count: 124, replies_count: 38 })
];
const postStatuses = [
	statusForProfile('soft-post-1', "rain recording from this morning's walk — 11 minutes, two takes, the kettle made it onto the second one.", {
		media_attachments: [{ id: 'audio-1', type: 'audio', url: 'https://cdn.example/rain.wav', description: 'rain on glass · take 2', meta: { duration: 702 } }]
	}),
	statusForProfile('soft-post-2', "thinking about how the slow web isn't really slow — it's just the pace at which a person can actually pay attention.")
];
const replyStatuses = [
	statusForProfile('soft-reply-1', 'reply from the margins, still part of the shape.', { in_reply_to_id: 'parent-1', in_reply_to_account_id: 'account-parent' }),
	...postStatuses
];
const mediaStatuses = [
	postStatuses[0],
	statusForProfile('soft-media-2', 'dusk in the alley behind the apartment.', {
		media_attachments: [{ id: 'photo-1', type: 'image', url: 'https://cdn.example/cat-door.webp', preview_url: 'https://cdn.example/cat-door-thumb.webp', description: 'door with cat at dusk' }]
	}),
	statusForProfile('soft-media-hidden', 'private contact sheet.', {
		media_attachments: [{ id: 'photo-hidden', type: 'image', url: 'https://cdn.example/private.webp', preview_url: 'https://cdn.example/private-thumb.webp', description: 'hidden sensitive frame' }],
		sensitive: true,
		spoiler_text: 'contact sheet'
	})
];

const authenticate = async (page: Page) => {
	await mockRightRailApis(page);
	await page.route('https://pleroma.example/api/v1/notifications**', async (route) => fulfillJson(route, []));
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

const mockProfileApis = async (page: Page, account: PleromaAccount = profileAccount) => {
	await page.route('https://pleroma.example/api/v1/accounts/search**', async (route: Route) => {
		const url = new URL(route.request().url());
		expect(url.searchParams.get('q')).toBe(account.acct);
		expect(url.searchParams.get('resolve')).toBe('true');
		expect(route.request().headers().authorization).toBe('Bearer access-token');
		await fulfillJson(route, [account]);
	});
	await page.route(`https://pleroma.example/api/v1/accounts/${account.id}/statuses**`, async (route: Route) => {
		const url = new URL(route.request().url());
		const body = url.searchParams.get('pinned') === 'true'
			? pinnedStatuses
			: url.searchParams.get('only_media') === 'true'
				? mediaStatuses
				: url.searchParams.get('exclude_replies') === 'true'
					? postStatuses
					: replyStatuses;
		await fulfillJson(route, body);
	});
};

const mockProfileSearchAndStatuses = async (page: Page) => {
	const accounts = [profileAccount, pleromaFixtures.account, datagramAccount];
	await page.route('https://pleroma.example/api/v1/accounts/search**', async (route: Route) => {
		const q = new URL(route.request().url()).searchParams.get('q') ?? '';
		const normalized = q.replace(/^@/, '').toLowerCase();
		await fulfillJson(route, accounts.filter((account) => account.acct.toLowerCase() === normalized || account.username.toLowerCase() === normalized || account.id === q));
	});
	for (const account of accounts) {
		await page.route(`https://pleroma.example/api/v1/accounts/${account.id}/statuses**`, async (route: Route) => {
			const url = new URL(route.request().url());
			await fulfillJson(route, url.searchParams.get('pinned') === 'true' ? [] : postStatuses.map((status) => ({ ...status, account })));
		});
	}
	await page.route('https://pleroma.example/api/v1/accounts/relationships**', async (route: Route) => {
		const ids = new URL(route.request().url()).searchParams.getAll('id[]');
		await fulfillJson(route, ids.map((id) => relationshipFor(id)));
	});
};

test('profile route loads the canonical account timeline surface', async ({ page }) => {
	await authenticate(page);
	await mockProfileApis(page);
	await page.route('https://pleroma.example/api/v1/accounts/relationships**', async (route: Route) => {
		const url = new URL(route.request().url());
		expect(url.searchParams.getAll('id[]')).toEqual([profileAccount.id]);
		expect(route.request().headers().authorization).toBe('Bearer access-token');
		await fulfillJson(route, [relationshipFor(profileAccount.id, { following: true, followed_by: true })]);
	});
	await setViewport(page, 'desktop');

	await page.goto('/app/profiles/soft.hertz@kolektiva.social');

	const profile = page.getByTestId('profile-view');
	await expect(profile.getByRole('heading', { name: 'soft.hertz ✦' })).toBeVisible();
	await expect(profile).toContainText('@soft.hertz@kolektiva.social');
	await expect(profile).toContainText('field recordings + slow web · cassette decks · taipei.');
	await expect(profile).toContainText('Mutuals');
	await expect(profile).toContainText('bot');
	await expect(profile).toContainText('remote');
	await expect(profile).not.toContainText('alert("bio")');
	await expect(profile.locator('script')).toHaveCount(0);

	await expect(profile).toContainText('pinned');
	await expect(profile).toContainText("the algorithm doesn't care about you");
	await profile.getByRole('button', { name: 'Show all (2)' }).click();
	await expect(profile).toContainText('mute liberally');
	await expect(profile.getByTestId('profile-posts')).toContainText("rain recording from this morning's walk");

	await profile.getByRole('tab', { name: /Posts & Replies/ }).click();
	await expect(profile.getByTestId('profile-posts')).toContainText('reply from the margins');

	await profile.getByRole('tab', { name: /Media/ }).click();
	await expect(profile.getByTestId('profile-media-grid')).toContainText('AUDIO');
	await expect(profile.getByAltText('door with cat at dusk')).toBeVisible();
	await expect(profile.getByAltText('hidden sensitive frame')).toHaveCount(0);

	const rail = page.getByTestId('right-rail');
	await expect(rail).toContainText('Numbers');
	await expect(rail).toContainText('2,148');
	await expect(rail).toContainText('Details');
	await expect(rail).toContainText('softhertz.land');
	await expect(rail).toContainText('Also pinned');
	await expectNoHorizontalOverflow(page);

	await setViewport(page, 'mobile');
	await expect(profile.getByRole('heading', { name: 'soft.hertz ✦' })).toBeVisible();
	await expect(profile).toContainText('Numbers');
	await expectNoHorizontalOverflow(page);
});

test('profile route fetches missing relationship state before rendering follow labels', async ({ page }) => {
	const relationshipAccount: PleromaAccount = {
		...profileAccount,
		id: 'account-following',
		username: 'line.noise',
		acct: 'line.noise@kolektiva.social',
		display_name: 'line.noise',
		pleroma: { ...profileAccount.pleroma, relationship: undefined }
	};
	let relationshipRequestCount = 0;

	await authenticate(page);
	await mockProfileApis(page, relationshipAccount);
	await page.route('https://pleroma.example/api/v1/accounts/relationships**', async (route: Route) => {
		relationshipRequestCount += 1;
		const url = new URL(route.request().url());
		expect(url.searchParams.getAll('id[]')).toEqual([relationshipAccount.id]);
		expect(route.request().headers().authorization).toBe('Bearer access-token');
		await fulfillJson(route, [relationshipFor(relationshipAccount.id, { following: true })]);
	});
	await setViewport(page, 'desktop');

	await page.goto('/app/profiles/line.noise@kolektiva.social');

	const profile = page.getByTestId('profile-view');
	await expect(profile.getByRole('heading', { name: 'line.noise' })).toBeVisible();
	await expect(profile.getByRole('button', { name: 'Following' })).toBeVisible();
	await expect(profile).not.toContainText('Mutuals');
	expect(relationshipRequestCount).toBe(1);
});

test('profile route refreshes stale embedded relationship state before rendering follow labels', async ({ page }) => {
	const relationshipAccount: PleromaAccount = {
		...profileAccount,
		id: 'account-stale-following',
		username: 'stale.signal',
		acct: 'stale.signal@kolektiva.social',
		display_name: 'stale.signal',
		pleroma: { ...profileAccount.pleroma, relationship: relationshipFor('account-stale-following') }
	};
	let relationshipRequestCount = 0;

	await authenticate(page);
	await mockProfileApis(page, relationshipAccount);
	await page.route('https://pleroma.example/api/v1/accounts/relationships**', async (route: Route) => {
		relationshipRequestCount += 1;
		const url = new URL(route.request().url());
		expect(url.searchParams.getAll('id[]')).toEqual([relationshipAccount.id]);
		expect(route.request().headers().authorization).toBe('Bearer access-token');
		await fulfillJson(route, [relationshipFor(relationshipAccount.id, { following: true })]);
	});
	await setViewport(page, 'desktop');

	await page.goto('/app/profiles/stale.signal@kolektiva.social');

	const profile = page.getByTestId('profile-view');
	await expect(profile.getByRole('heading', { name: 'stale.signal' })).toBeVisible();
	await expect(profile.getByRole('button', { name: 'Following' })).toBeVisible();
	await expect(profile).not.toContainText('Mutuals');
	expect(relationshipRequestCount).toBe(1);
});

test('post avatars, handles, body mentions, and reply pings navigate to profiles', async ({ page }) => {
	const linkedStatus = statusForProfile('link-home', '@quietadmin@pleroma.example checking profile links with @datagram@retro.social.', { in_reply_to_id: 'parent-1', in_reply_to_account_id: 'account-1' });
	await authenticate(page);
	await mockProfileSearchAndStatuses(page);
	await page.route('https://pleroma.example/api/v1/timelines/home**', async (route) => fulfillJson(route, [linkedStatus]));
	await setViewport(page, 'desktop');

	await page.goto('/app/home');
	const post = page.getByTestId('home-timeline-list').locator('.post').first();

	const avatarLink = post.getByRole('link', { name: 'Open profile for soft.hertz ✦' });
	await expect(avatarLink).toHaveAttribute('href', '/app/profiles/soft.hertz%40kolektiva.social');
	await avatarLink.click();
	await expect(page).toHaveURL(/\/app\/profiles\/soft\.hertz%40kolektiva\.social$/);
	await expect(page.getByTestId('profile-view').getByRole('heading', { name: 'soft.hertz ✦' })).toBeVisible();

	await page.goto('/app/home');
	const handleLink = post.getByRole('link', { name: '@soft.hertz@kolektiva.social' });
	await expect(handleLink).toHaveAttribute('href', '/app/profiles/soft.hertz%40kolektiva.social');
	await handleLink.click();
	await expect(page).toHaveURL(/\/app\/profiles\/soft\.hertz%40kolektiva\.social$/);
	await expect(page.getByTestId('profile-view').getByRole('heading', { name: 'soft.hertz ✦' })).toBeVisible();

	await page.goto('/app/home');
	const mentionLink = post.getByRole('link', { name: '@datagram@retro.social' });
	await expect(mentionLink).toHaveAttribute('href', '/app/profiles/datagram%40retro.social');
	await mentionLink.click();
	await expect(page).toHaveURL(/\/app\/profiles\/datagram%40retro\.social$/);
	await expect(page.getByTestId('profile-view').getByRole('heading', { name: 'datagram' })).toBeVisible();

	await page.goto('/app/home');
	const pingLink = post.getByRole('link', { name: 'Open profile for @quietadmin@pleroma.example' });
	await expect(pingLink).toHaveAttribute('href', '/app/profiles/quietadmin%40pleroma.example');
	await pingLink.click();
	await expect(page).toHaveURL(/\/app\/profiles\/quietadmin%40pleroma\.example$/);
	await expect(page.getByTestId('profile-view').getByRole('heading', { name: 'quiet admin' })).toBeVisible();
});

test('profile route gates locked accounts without rendering their timeline', async ({ page }) => {
	const lockedAccount = { ...profileAccount, id: 'account-locked', acct: 'locked.user@kolektiva.social', display_name: 'locked user', locked: true, pleroma: { ...profileAccount.pleroma, relationship: undefined } };
	let statusRequestCount = 0;
	await authenticate(page);
	await page.route('https://pleroma.example/api/v1/accounts/search**', async (route: Route) => fulfillJson(route, [lockedAccount]));
	await page.route('https://pleroma.example/api/v1/accounts/relationships**', async (route: Route) => fulfillJson(route, [relationshipFor(lockedAccount.id)]));
	await page.route(`https://pleroma.example/api/v1/accounts/${lockedAccount.id}/statuses**`, async (route: Route) => {
		statusRequestCount += 1;
		await fulfillJson(route, postStatuses);
	});
	await setViewport(page, 'desktop');

	await page.goto('/app/profiles/locked.user@kolektiva.social');

	const profile = page.getByTestId('profile-view');
	await expect(profile.getByRole('heading', { name: 'locked user' })).toBeVisible();
	await expect(profile).toContainText('locked');
	await expect(profile).toContainText('This account is locked');
	await expect(profile).not.toContainText("rain recording from this morning's walk");
	expect(statusRequestCount).toBe(0);
	await expectNoHorizontalOverflow(page);
});

test('profile route refreshes token-only own locked profiles after account hydration', async ({ page }) => {
	const lockedOwnAccount: PleromaAccount = {
		...pleromaFixtures.account,
		locked: true,
		pleroma: { ...pleromaFixtures.account.pleroma, relationship: undefined }
	};
	let statusRequestCount = 0;
	await mockRightRailApis(page);
	await page.route('https://pleroma.example/api/v1/notifications**', async (route) => fulfillJson(route, []));
	await page.route('https://pleroma.example/api/v1/accounts/verify_credentials', async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 150));
		await fulfillJson(route, lockedOwnAccount);
	});
	await page.route('https://pleroma.example/api/v1/accounts/search**', async (route) => fulfillJson(route, [lockedOwnAccount]));
	await page.route('https://pleroma.example/api/v1/accounts/account-1/statuses**', async (route) => {
		statusRequestCount += 1;
		await fulfillJson(route, pleromaFixtures.timelines.home);
	});
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, {
		instanceUrl: session.instanceUrl,
		accessToken: session.accessToken,
		tokenType: session.tokenType,
		scope: session.scope,
		createdAt: session.createdAt
	});
	await setViewport(page, 'desktop');

	await page.goto('/app/profiles/quietadmin@pleroma.example');

	const profile = page.getByTestId('profile-view');
	await expect(profile.getByRole('heading', { name: 'quiet admin' })).toBeVisible();
	await expect(profile).toContainText('Edit profile');
	await expect(profile).not.toContainText('This account is locked');
	await expect(profile.getByTestId('profile-posts')).toContainText('quiet CSS can still carry the voice.');
	expect(statusRequestCount).toBeGreaterThan(0);
});
