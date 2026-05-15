import { expect, test } from '@playwright/test';
import { adaptPleromaStatus, adaptPleromaStatuses, htmlToPlainText, normalizePleromaRequestError } from './ui';
import { pleromaFixtures } from './fixtures';
import type { PleromaStatus } from './types';

const withStatus = (overrides: Partial<PleromaStatus>): PleromaStatus => ({
	...pleromaFixtures.status,
	...overrides,
	account: overrides.account ?? pleromaFixtures.status.account,
	pleroma: { ...pleromaFixtures.status.pleroma, ...overrides.pleroma }
});

test('Pleroma status adapters preserve plain text content and UI action state', () => {
	const post = adaptPleromaStatus(pleromaFixtures.status, { timelines: ['home', 'local'] });

	expect(post).toMatchObject({
		id: 'status-1',
		originalStatusId: 'status-1',
		name: 'quiet admin',
		handle: '@quietadmin@pleroma.example',
		body: 'quiet CSS can still carry the voice.',
		avatarUrl: 'https://pleroma.example/avatar.png',
		timelines: ['home', 'local'],
		replies: 2,
		boosts: 4,
		favorites: 9,
		actions: { reply: false, boost: false, favorite: false },
		account: {
			id: 'account-1',
			displayName: 'quiet admin',
			handle: '@quietadmin@pleroma.example',
			avatarUrl: 'https://pleroma.example/avatar.png'
		},
		pleroma: {
			conversationId: 42,
			local: true,
			plainText: 'quiet CSS can still carry the voice.'
		}
	});
	expect(post.time).toBe('May 1');
	expect(post.contentHtml).toBe('<p>quiet CSS can still carry the voice.</p>');
	expect(post.mediaHidden).toBe(false);
});

test('Pleroma status adapters move leading reply recipients into addressees', () => {
	const reply = withStatus({
		id: 'reply-with-leading-recipients',
		in_reply_to_id: 'parent-status',
		in_reply_to_account_id: 'account-2',
		content: '<p>@dtluna @feld qwen 0.5b can handle it. has @lain tried it?</p>',
		pleroma: {
			content: { 'text/plain': '@dtluna @feld qwen 0.5b can handle it. has @lain tried it?' }
		}
	});

	const post = adaptPleromaStatus(reply);

	expect(post.body).toBe('qwen 0.5b can handle it. has @lain tried it?');
	expect(post.addressees).toEqual(['@dtluna', '@feld']);

	const topLevelPost = adaptPleromaStatus(withStatus({
		id: 'top-level-leading-mentions',
		content: '<p>@dtluna @feld qwen 0.5b can handle it.</p>',
		pleroma: {
			content: { 'text/plain': '@dtluna @feld qwen 0.5b can handle it.' }
		}
	}));

	expect(topLevelPost.body).toBe('@dtluna @feld qwen 0.5b can handle it.');
	expect(topLevelPost.addressees).toBeUndefined();
});

test('Pleroma status adapters use mention metadata for leading recipient mentions without visible parents', () => {
	const post = adaptPleromaStatus(withStatus({
		id: 'remote-leading-mention-with-hidden-parent',
		content: '<span class="h-card"><a class="u-url mention" href="https://lizards.live/@vriska" rel="ugc">@<span>vriska</span></a></span> Joseph was always on the side of the good guys.',
		pleroma: {
			content: { 'text/plain': '@vriska Joseph was always on the side of the good guys.' },
			parent_visible: false
		},
		mentions: [
			{
				id: '9quS1LZ6YIFB6VC6WO',
				url: 'https://lizards.live/@vriska',
				username: 'vriska',
				acct: 'vriska@lizards.live'
			}
		]
	}));

	expect(post.body).toBe('Joseph was always on the side of the good guys.');
	expect(post.addressees).toEqual(['@vriska']);
});

test('Pleroma status adapters handle reblogs, remote handles, warnings, and fallback assets', () => {
	const remoteAccount = {
		...pleromaFixtures.account,
		id: 'remote-account',
		username: 'datagram',
		acct: 'datagram@a-very-long-retro-instance-name.social',
		display_name: '',
		avatar: '',
		avatar_static: ''
	};
	const reblogged = withStatus({
		id: 'remote-status',
		account: remoteAccount,
		content: '<p>HTML fallback with<br>line breaks &amp; entities.</p>',
		spoiler_text: 'remote cw',
		favourited: true,
		favourites_count: 10,
		reblogged: true,
		reblogs_count: 6,
		media_attachments: [
			{
				id: 'media-1',
				type: 'image',
				url: 'https://cdn.example/media.png',
				preview_url: 'https://cdn.example/preview.png',
				description: 'screenshot'
			}
		],
		pleroma: {
			content: {},
			local: false,
			spoiler_text: { 'text/plain': 'plain cw' }
		}
	});
	const wrapper = withStatus({
		id: 'boost-wrapper',
		account: { ...pleromaFixtures.account, acct: 'booster@pleroma.example', display_name: 'booster' },
		reblog: reblogged,
		reblogged: true
	});

	const post = adaptPleromaStatus(wrapper);

	expect(post.id).toBe('boost-wrapper');
	expect(post.timelineItemId).toBe('boost-wrapper');
	expect(post.actionStatusId).toBe('remote-status');
	expect(post.threadStatusId).toBe('remote-status');
	expect(post.originalStatusId).toBe('remote-status');
	expect(post.name).toBe('datagram');
	expect(post.handle).toBe('@datagram@a-very-long-retro-instance-name.social');
	expect(post.account.avatarUrl).toBeNull();
	expect(post.avatar).toBe('grad-2');
	expect(post.body).toBe('Content warning: plain cw');
	expect(post.contentText).toBe('HTML fallback with\nline breaks & entities.');
	expect(post.media).toBeUndefined();
	expect(post.mediaHidden).toBe(true);
	expect(post.boosts).toBe(5);
	expect(post.favorites).toBe(9);
	expect(post.actions).toMatchObject({ boost: true, favorite: true });
	expect(post.hasContentWarning).toBe(true);
	expect(post.spoilerText).toBe('plain cw');
	expect(post.mediaAttachments).toEqual([
		{
			id: 'media-1',
			type: 'image',
			url: 'https://cdn.example/media.png',
			previewUrl: 'https://cdn.example/preview.png',
			description: 'screenshot'
		}
	]);
	expect(post.rebloggedBy).toMatchObject({ displayName: 'booster', handle: '@booster@pleroma.example' });
	expect(post.timelines).toEqual(['federated']);
});

test('Pleroma status list adapter keeps fixture order and covers missing plain-text fallbacks', () => {
	const noPlainText = withStatus({
		id: 'html-only',
		content: '<p>fallback <strong>html</strong> body</p>',
		pleroma: { content: {}, local: true }
	});
	const posts = adaptPleromaStatuses([pleromaFixtures.status, noPlainText], { timelines: ['home'] });

	expect(posts.map((post) => post.id)).toEqual(['status-1', 'html-only']);
	expect(posts.map((post) => post.timelines)).toEqual([['home'], ['home']]);
	expect(posts[1].body).toBe('fallback html body');
	expect(adaptPleromaStatus(withStatus({ id: 'unknown-locality', pleroma: { local: undefined } })).timelines).toEqual([]);
});

test('HTML fallback text keeps malformed entities from breaking list adaptation', () => {
	expect(htmlToPlainText('<p>remote entity &#999999999999; survives</p>')).toBe('remote entity &#999999999999; survives');
});

test('Pleroma request error display distinguishes auth, rate limits, server, and network failures', () => {
	expect(normalizePleromaRequestError({ kind: 'unauthenticated', message: 'token required' })).toMatchObject({
		kind: 'auth-required',
		title: 'Re-authentication required',
		reauthRequired: true,
		retryable: false
	});
	expect(
		normalizePleromaRequestError({
			kind: 'http',
			status: 429,
			path: '/api/v1/timelines/home',
			message: 'slow down',
			response: null
		})
	).toMatchObject({ kind: 'rate-limited', title: 'Rate limit reached', retryable: true });
	expect(
		normalizePleromaRequestError({
			kind: 'http',
			status: 503,
			path: '/api/v1/timelines/home',
			message: 'maintenance',
			response: null
		})
	).toMatchObject({ kind: 'server', title: 'Pleroma server error', retryable: true });
	expect(normalizePleromaRequestError({ kind: 'network', path: '/api/v1/instance', message: 'offline', cause: new Error('offline') })).toMatchObject({
		kind: 'network',
		title: 'Network connection failed',
		retryable: true
	});
});
