import type {
	PleromaAccount,
	PleromaInstance,
	PleromaRelationship,
	PleromaSearchResult,
	PleromaStatus,
	PleromaStatusContext,
	PleromaTag
} from './types';

const account: PleromaAccount = {
	id: 'account-1',
	username: 'quietadmin',
	acct: 'quietadmin@pleroma.example',
	display_name: 'quiet admin',
	note: '<p>keeping the lights low</p>',
	url: 'https://pleroma.example/users/quietadmin',
	avatar: 'https://pleroma.example/avatar.png',
	avatar_static: 'https://pleroma.example/avatar.png',
	header: 'https://pleroma.example/header.png',
	header_static: 'https://pleroma.example/header.png',
	locked: false,
	bot: false,
	discoverable: true,
	created_at: '2026-01-01T00:00:00.000Z',
	followers_count: 128,
	following_count: 64,
	statuses_count: 512,
	fields: [{ name: 'home', value: 'small web', verified_at: null }],
	emojis: [],
	pleroma: {
		ap_id: 'https://pleroma.example/users/quietadmin',
		favicon: 'https://pleroma.example/favicon.png',
		is_admin: false,
		is_moderator: true,
		tags: ['operator']
	}
};

const status: PleromaStatus = {
	id: 'status-1',
	uri: 'https://pleroma.example/objects/status-1',
	url: 'https://pleroma.example/notice/status-1',
	account,
	content: '<p>quiet CSS can still carry the voice.</p>',
	created_at: '2026-05-01T12:00:00.000Z',
	emojis: [],
	favourited: false,
	favourites_count: 9,
	in_reply_to_account_id: null,
	in_reply_to_id: null,
	language: 'en',
	media_attachments: [],
	mentions: [],
	muted: false,
	pinned: false,
	pleroma: {
		content: { 'text/plain': 'quiet CSS can still carry the voice.' },
		conversation_id: 42,
		local: true,
		spoiler_text: { 'text/plain': '' }
	},
	reblog: null,
	reblogged: false,
	reblogs_count: 4,
	replies_count: 2,
	sensitive: false,
	spoiler_text: '',
	tags: [{ name: 'smallweb', url: 'https://pleroma.example/tag/smallweb' }],
	visibility: 'public'
};

const federatedStatus: PleromaStatus = {
	...status,
	id: 'status-2',
	uri: 'https://retro.social/objects/status-2',
	url: 'https://retro.social/notice/status-2',
	account: { ...account, id: 'account-2', acct: 'datagram@retro.social' },
	pleroma: { ...status.pleroma, local: false }
};

const context: PleromaStatusContext = {
	ancestors: [{ ...status, id: 'ancestor-1', content: '<p>the earlier context</p>' }],
	descendants: [{ ...status, id: 'reply-1', content: '<p>the gentle reply</p>' }]
};

const relationship: PleromaRelationship = {
	id: 'account-1',
	following: true,
	followed_by: false,
	blocking: false,
	muting: false,
	muting_notifications: false,
	requested: false,
	domain_blocking: false,
	showing_reblogs: true,
	endorsed: false,
	notifying: false,
	subscribing: false,
	blocked_by: false
};

const trends: PleromaTag[] = [
	{ name: 'smallweb', url: 'https://pleroma.example/tag/smallweb', history: [{ day: '1', uses: '24', accounts: '9' }] },
	{ name: 'fedidevs', url: 'https://pleroma.example/tag/fedidevs' }
];

const search: PleromaSearchResult = {
	accounts: [account],
	statuses: [status],
	hashtags: trends
};

const instance: PleromaInstance = {
	domain: 'pleroma.example',
	title: 'Pleroma Example',
	version: '2.10.0 (compatible; Pleroma 2.10.0)',
	description: 'A quiet Pleroma instance for deterministic tests.',
	source_url: 'https://git.pleroma.social/pleroma/pleroma',
	usage: { users: { active_month: 128 } },
	pleroma: {
		metadata: {
			features: ['pleroma_api', 'oauth_registration', 'quote_posting']
		}
	}
};

export const pleromaFixtures = {
	account,
	status,
	context,
	relationship,
	trends,
	search,
	instance,
	timelines: {
		home: [status, federatedStatus],
		public: [federatedStatus]
	},
	oauthApp: {
		id: 'app-1',
		name: 'PleromaNet',
		website: 'https://pleromanet.test',
		redirect_uri: 'http://localhost:4173/auth/callback',
		client_id: 'client-id',
		client_secret: 'client-secret',
		vapid_key: 'vapid-key'
	},
	token: {
		access_token: 'access-token',
		token_type: 'Bearer',
		scope: 'read write follow',
		created_at: 1700000001
	}
};
