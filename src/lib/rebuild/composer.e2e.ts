import { expect, test } from '@playwright/test';
import { composerReplyDraft } from './composer';

test('reply drafts follow Pleroma FE participant ordering, deduplication, and self exclusion', () => {
	const participants = [
		{ id: 'author', acct: 'datagram@retro.social' },
		{ id: 'self', acct: 'quietadmin' },
		{ id: 'author', acct: 'datagram@retro.social' },
		{ id: 'local', acct: 'softlocal' },
		{ id: 'remote', acct: 'soft.hertz@kolektiva.social' }
	];

	expect(composerReplyDraft(participants, 'self')).toBe('@datagram@retro.social @softlocal @soft.hertz@kolektiva.social ');
	expect(composerReplyDraft([{ id: 'self', acct: 'quietadmin' }], 'self')).toBe('');
});
