import { expect, test } from '@playwright/test';
import { createPleromaClient, parseTimelinePaginationLinkHeader } from './client';
import { pleromaFixtures } from './fixtures';
import { normalizeInstanceUrl } from './http';
import {
	buildAuthorizationUrl,
	createOAuthState,
	exchangeOAuthCode,
	parseOAuthCallback,
	registerOAuthApp
} from './oauth';
import { createPleromaResource } from './resource';
import {
	createMemoryPleromaStorage,
	PENDING_OAUTH_TTL_MS,
	readPendingOAuth,
	readPleromaAuthState,
	readSplitPleromaAuthState,
	signOutPleroma,
	storePendingOAuth,
	storePleromaSession
} from './session';
import { buildPleromaStreamingUrl, openPleromaTimelineStream, parsePleromaStreamingMessage } from './streaming';

type RecordedRequest = {
	method: string;
	url: URL;
	authorization: string | null;
	body: string;
};

type MockResponse = { status?: number; body: unknown; headers?: Record<string, string> };

const createJsonFetch = (handler: (request: RecordedRequest) => MockResponse) => {
	const requests: RecordedRequest[] = [];
	const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
		const body = init?.body instanceof URLSearchParams ? init.body.toString() : String(init?.body ?? '');
		const request: RecordedRequest = {
			method: init?.method ?? 'GET',
			url: new URL(String(input)),
			authorization: init?.headers instanceof Headers ? init.headers.get('authorization') : null,
			body
		};

		requests.push(request);
		const response = handler(request);

		return new Response(JSON.stringify(response.body), {
			status: response.status ?? 200,
			headers: { 'content-type': 'application/json', ...response.headers }
		});
	};

	return { fetchImpl, requests };
};

const expectPath = (request: RecordedRequest, path: string) => {
	expect(`${request.url.origin}${request.url.pathname}`).toBe(`https://pleroma.example${path}`);
};

test('Pleroma client isolates typed endpoints and authorization headers', async () => {
	const { fetchImpl, requests } = createJsonFetch((request) => {
		expect(request.authorization).toBe('Bearer access-token');

		if (request.url.pathname === '/api/v1/timelines/home') return { body: pleromaFixtures.timelines.home };
		if (request.url.pathname === '/api/v1/timelines/public') return { body: pleromaFixtures.timelines.public };
		if (request.url.pathname === '/api/v1/statuses/status-1') return { body: pleromaFixtures.status };
		if (request.url.pathname === '/api/v1/statuses/status-1/context') return { body: pleromaFixtures.context };
		if (request.url.pathname === '/api/v1/accounts/account-1') return { body: pleromaFixtures.account };
		if (request.url.pathname === '/api/v2/instance') return { body: pleromaFixtures.instance };
		if (request.url.pathname === '/api/v2/search') return { body: pleromaFixtures.search };
		if (request.url.pathname === '/api/v1/trends/tags') return { body: pleromaFixtures.trends };
		if (request.url.pathname === '/api/v1/accounts/verify_credentials') return { body: pleromaFixtures.account };

		return { status: 404, body: { error: 'missing fixture' } };
	});

	const client = createPleromaClient({
		instanceUrl: 'https://pleroma.example/',
		accessToken: 'access-token',
		fetch: fetchImpl
	});

	const home = await client.getHomeTimeline({ limit: 2, maxId: '10' });
	const local = await client.getLocalTimeline({ onlyMedia: true });
	const federated = await client.getFederatedTimeline({ minId: '1' });
	const status = await client.getStatus('status-1');
	const context = await client.getStatusContext('status-1');
	const account = await client.getAccount('account-1');
	const ownAccount = await client.getOwnAccount();
	const instance = await client.getInstance();
	const search = await client.search({ q: 'small web', type: 'statuses', limit: 5 });
	const trends = await client.getTrendingTags({ limit: 4 });

	expect(home[0].pleroma.local).toBe(true);
	expect(local).toHaveLength(1);
	expect(federated[0].account.acct).toContain('@');
	expect(status.pleroma.content?.['text/plain']).toContain('quiet');
	expect(context.ancestors[0].id).toBe('ancestor-1');
	expect(account.pleroma.is_admin).toBe(false);
	expect(ownAccount.id).toBe('account-1');
	expect(instance.pleroma.metadata.features).toContain('pleroma_api');
	expect(search.statuses[0].id).toBe('status-1');
	expect(trends[0].name).toBe('smallweb');

	expectPath(requests[0], '/api/v1/timelines/home');
	expect(requests[0].url.searchParams.get('limit')).toBe('2');
	expect(requests[0].url.searchParams.get('max_id')).toBe('10');
	expect(requests[1].url.searchParams.get('local')).toBe('true');
	expect(requests[1].url.searchParams.get('only_media')).toBe('true');
	expect(requests[2].url.searchParams.get('min_id')).toBe('1');
	expectPath(requests[3], '/api/v1/statuses/status-1');
	expectPath(requests[4], '/api/v1/statuses/status-1/context');
	expectPath(requests[5], '/api/v1/accounts/account-1');
	expectPath(requests[6], '/api/v1/accounts/verify_credentials');
	expectPath(requests[7], '/api/v2/instance');
	expect(requests[8].url.searchParams.get('q')).toBe('small web');
	expect(requests[8].url.searchParams.get('type')).toBe('statuses');
	expect(requests[9].url.searchParams.get('limit')).toBe('4');
});

test('Pleroma client converts timeline Link headers into cursor data', async () => {
	const cursors = parseTimelinePaginationLinkHeader(
		'<https://pleroma.example/api/v1/timelines/home?max_id=status-2>; rel="next", <https://pleroma.example/api/v1/timelines/home?min_id=status-9>; rel="prev"'
	);
	expect(cursors).toEqual({
		next: { maxId: 'status-2' },
		previous: { minId: 'status-9' }
	});

	const { fetchImpl, requests } = createJsonFetch(() => ({
		body: pleromaFixtures.timelines.home,
		headers: {
			link: '<https://pleroma.example/api/v1/timelines/home?max_id=status-2>; rel="next"'
		}
	}));
	const client = createPleromaClient({
		instanceUrl: 'https://pleroma.example',
		accessToken: 'access-token',
		fetch: fetchImpl
	});

	const page = await client.getHomeTimelinePage({ limit: 2 });

	expect(page.items[0].id).toBe('status-1');
	expect(page.cursors).toEqual({ next: { maxId: 'status-2' }, previous: null });
	expect(requests[0].url.searchParams.get('limit')).toBe('2');
});

test('Pleroma streaming helpers build WebSocket URLs and parse update events', () => {
	expect(buildPleromaStreamingUrl({ instanceUrl: 'https://pleroma.example', accessToken: 'access-token' })).toBe(
		'wss://pleroma.example/api/v1/streaming/?stream=user&access_token=access-token'
	);
	expect(buildPleromaStreamingUrl({ instanceUrl: 'http://localhost:4000', accessToken: 'local-token', stream: 'public:local' })).toBe(
		'ws://localhost:4000/api/v1/streaming/?stream=public%3Alocal&access_token=local-token'
	);

	const message = parsePleromaStreamingMessage(JSON.stringify({
		event: 'update',
		payload: JSON.stringify(pleromaFixtures.status)
	}));

	expect(message?.event).toBe('update');
	expect(message?.status?.id).toBe('status-1');
	expect(parsePleromaStreamingMessage(JSON.stringify({ event: 'update', payload: '{}' }))?.status).toBeUndefined();
	expect(parsePleromaStreamingMessage('not json')).toBeNull();
});

test('Pleroma streaming lifecycle handles unavailable and closed sockets', () => {
	const originalWebSocket = globalThis.WebSocket;
	try {
		let unavailableError: unknown;
		Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: undefined });
		openPleromaTimelineStream({
			instanceUrl: 'https://pleroma.example',
			accessToken: 'access-token',
			onUpdate: () => undefined,
			onError: (error) => (unavailableError = error)
		}).close();
		expect(unavailableError).toBeInstanceOf(Error);

		let constructorError: unknown;
		const ThrowingSocket = function () {
			throw new Error('socket blocked');
		} as unknown as new (url: string) => {
			onmessage: ((event: { data: unknown }) => void) | null;
			onerror: ((event: Event) => void) | null;
			onclose: ((event: Event) => void) | null;
			close: () => void;
		};
		openPleromaTimelineStream({
			instanceUrl: 'https://pleroma.example',
			accessToken: 'access-token',
			WebSocketImpl: ThrowingSocket,
			onUpdate: () => undefined,
			onError: (error) => (constructorError = error)
		}).close();
		expect(constructorError).toBeInstanceOf(Error);

		type TestSocket = {
			url: string;
			closeCount: number;
			onmessage: ((event: { data: unknown }) => void) | null;
			onerror: ((event: Event) => void) | null;
			onclose: ((event: Event) => void) | null;
			close: () => void;
		};
		const sockets: TestSocket[] = [];
		const SocketImpl = function (_url: string) {
			const socket: TestSocket = {
				url: _url,
				closeCount: 0,
				onmessage: null,
				onerror: null,
				onclose: null,
				close() {
					this.closeCount += 1;
				}
			};
			sockets.push(socket);
			return socket;
		} as unknown as new (url: string) => TestSocket;
		const updates: string[] = [];
		let errorCount = 0;
		let closeCount = 0;
		const stream = openPleromaTimelineStream({
			instanceUrl: 'https://pleroma.example',
			accessToken: 'access-token',
			WebSocketImpl: SocketImpl,
			onUpdate: (status) => updates.push(status.id),
			onError: () => (errorCount += 1),
			onClose: () => (closeCount += 1)
		});

		const socket = sockets[0];
		expect(socket.url).toBe('wss://pleroma.example/api/v1/streaming/?stream=user&access_token=access-token');
		socket.onmessage?.({ data: JSON.stringify({ event: 'update', payload: JSON.stringify({ ...pleromaFixtures.status, id: 'status-open' }) }) });
		expect(updates).toEqual(['status-open']);
		socket.onerror?.(new Event('error'));
		socket.onclose?.(new Event('close'));
		expect(errorCount).toBe(1);
		expect(closeCount).toBe(1);

		const retainedMessage = socket.onmessage;
		const retainedError = socket.onerror;
		const retainedClose = socket.onclose;
		stream.close();
		stream.close();
		expect(socket.closeCount).toBe(1);
		expect(socket.onmessage).toBeNull();
		expect(socket.onerror).toBeNull();
		expect(socket.onclose).toBeNull();

		retainedMessage?.({ data: JSON.stringify({ event: 'update', payload: JSON.stringify({ ...pleromaFixtures.status, id: 'status-after-close' }) }) });
		retainedError?.(new Event('error'));
		retainedClose?.(new Event('close'));
		expect(updates).toEqual(['status-open']);
		expect(errorCount).toBe(1);
		expect(closeCount).toBe(1);
	} finally {
		Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: originalWebSocket });
	}
});

test('Pleroma client covers mutations, unauthenticated state, and API errors', async () => {
	const { fetchImpl, requests } = createJsonFetch((request) => {
		if (request.url.pathname === '/api/v1/statuses/bad/favourite') {
			return { status: 422, body: { error: 'status already favourited' } };
		}

		if (request.url.pathname.endsWith('/follow') || request.url.pathname.endsWith('/unfollow')) {
			return { body: pleromaFixtures.relationship };
		}

		if (request.url.pathname === '/api/v1/accounts/update_credentials') {
			return { body: { ...pleromaFixtures.account, display_name: 'quiet admin' } };
		}

		return { body: pleromaFixtures.status };
	});

	const unauthenticated = createPleromaClient({ instanceUrl: 'https://pleroma.example', fetch: fetchImpl });
	await expect(unauthenticated.getHomeTimeline()).rejects.toMatchObject({ kind: 'unauthenticated' });
	await expect(unauthenticated.favoriteStatus('status-1')).rejects.toMatchObject({ kind: 'unauthenticated' });

	const client = createPleromaClient({
		instanceUrl: 'https://pleroma.example',
		accessToken: 'access-token',
		fetch: fetchImpl
	});

	await client.favoriteStatus('status-1');
	await client.unfavoriteStatus('status-1');
	await client.boostStatus('status-1');
	await client.unboostStatus('status-1');
	await client.followAccount('account-1');
	await client.unfollowAccount('account-1');
	const account = await client.updateAccountProfile({ displayName: 'quiet admin', note: 'no ads' });

	expect(account.display_name).toBe('quiet admin');
	expect(requests.map((request) => `${request.method} ${request.url.pathname}`)).toEqual([
		'POST /api/v1/statuses/status-1/favourite',
		'POST /api/v1/statuses/status-1/unfavourite',
		'POST /api/v1/statuses/status-1/reblog',
		'POST /api/v1/statuses/status-1/unreblog',
		'POST /api/v1/accounts/account-1/follow',
		'POST /api/v1/accounts/account-1/unfollow',
		'PATCH /api/v1/accounts/update_credentials'
	]);
	expect(requests[6].body).toContain('display_name');
	expect(requests[6].body).toContain('quiet admin');

	await expect(client.favoriteStatus('bad')).rejects.toMatchObject({
		kind: 'http',
		status: 422,
		message: 'status already favourited'
	});
});

test('OAuth boundary registers apps, builds redirects, parses callbacks, and stores sessions', async () => {
	const { fetchImpl, requests } = createJsonFetch((request) => {
		if (request.url.pathname === '/api/v1/apps') return { body: pleromaFixtures.oauthApp };
		if (request.url.pathname === '/oauth/token') return { body: pleromaFixtures.token };

		return { status: 404, body: { error: 'missing fixture' } };
	});

	const redirectUri = 'http://localhost:4173/auth/callback';
	const scopes = ['read', 'write', 'follow'] as const;
	const app = await registerOAuthApp({
		instanceUrl: 'https://pleroma.example',
		clientName: 'PleromaNet',
		redirectUri,
		scopes,
		website: 'https://pleromanet.test',
		fetch: fetchImpl
	});

	expect(app.clientId).toBe('client-id');
	expect(requests[0].method).toBe('POST');
	expectPath(requests[0], '/api/v1/apps');
	expect(requests[0].body).toContain('client_name=PleromaNet');
	expect(requests[0].body).toContain('scopes=read+write+follow');

	const authorizeUrl = buildAuthorizationUrl({
		instanceUrl: 'https://pleroma.example/',
		clientId: app.clientId,
		redirectUri,
		scopes,
		state: 'state-1'
	});
	const authorize = new URL(authorizeUrl);
	expect(authorize.origin).toBe('https://pleroma.example');
	expect(authorize.pathname).toBe('/oauth/authorize');
	expect(authorize.searchParams.get('response_type')).toBe('code');
	expect(authorize.searchParams.get('scope')).toBe('read write follow');

	expect(parseOAuthCallback(`${redirectUri}?code=oauth-code&state=state-1`)).toEqual({
		status: 'success',
		code: 'oauth-code',
		state: 'state-1'
	});
	expect(parseOAuthCallback(`${redirectUri}?error=access_denied&error_description=Denied&state=state-1`)).toEqual({
		status: 'error',
		error: 'access_denied',
		description: 'Denied',
		state: 'state-1'
	});

	const token = await exchangeOAuthCode({
		instanceUrl: 'https://pleroma.example',
		clientId: app.clientId,
		clientSecret: app.clientSecret,
		redirectUri,
		code: 'oauth-code',
		fetch: fetchImpl
	});
	expect(token.accessToken).toBe('access-token');
	expect(requests[1].body).toContain('grant_type=authorization_code');
	expect(requests[1].body).toContain('code=oauth-code');

	const storage = createMemoryPleromaStorage();
	storePendingOAuth(storage, {
		instanceUrl: 'https://pleroma.example',
		clientId: app.clientId,
		clientSecret: app.clientSecret,
		redirectUri,
		scopes,
		state: 'state-1',
		createdAt: Date.now()
	});
	expect(readPendingOAuth(storage)?.state).toBe('state-1');
	expect(readPleromaAuthState(storage)).toMatchObject({ status: 'authenticating' });

	storePleromaSession(storage, {
		instanceUrl: 'https://pleroma.example',
		accessToken: token.accessToken,
		tokenType: token.tokenType,
		scope: token.scope,
		createdAt: 1700000001000
	});
	expect(readPleromaAuthState(storage)).toMatchObject({ status: 'authenticated' });
	expect(storage.getItem('pleromanet.session')).not.toContain('password');
	signOutPleroma(storage);
	expect(readPleromaAuthState(storage)).toEqual({ status: 'unauthenticated' });

	const pendingStorage = createMemoryPleromaStorage();
	const sessionStorage = createMemoryPleromaStorage();
	storePendingOAuth(pendingStorage, {
		instanceUrl: 'https://pleroma.example',
		clientId: app.clientId,
		clientSecret: app.clientSecret,
		redirectUri,
		scopes,
		state: 'state-2',
		createdAt: Date.now()
	});
	expect(readSplitPleromaAuthState({ sessionStorage, pendingStorage })).toMatchObject({ status: 'authenticating' });
	storePleromaSession(sessionStorage, {
		instanceUrl: 'https://pleroma.example',
		accessToken: token.accessToken,
		tokenType: token.tokenType,
		scope: token.scope,
		createdAt: 1700000001000
	});
	expect(readSplitPleromaAuthState({ sessionStorage, pendingStorage })).toMatchObject({ status: 'authenticated' });
});

test('auth helpers reject unsafe instances, expire stale pending OAuth, and generate strong state', () => {
	expect(normalizeInstanceUrl('pleroma.example/some/path')).toBe('https://pleroma.example');
	expect(normalizeInstanceUrl('https://user:pass@pleroma.example/some/path')).toBe('https://pleroma.example');
	expect(normalizeInstanceUrl('http://localhost:4000/callback')).toBe('http://localhost:4000');
	expect(normalizeInstanceUrl('http://[::1]:4000/callback')).toBe('http://[::1]:4000');
	expect(() => normalizeInstanceUrl('http://pleroma.example')).toThrow(/HTTPS/);

	const storage = createMemoryPleromaStorage();
	storePendingOAuth(storage, {
		instanceUrl: 'https://pleroma.example',
		clientId: 'client-id',
		clientSecret: 'client-secret',
		redirectUri: 'http://localhost:4173/auth/callback',
		scopes: ['read'],
		state: 'stale-state',
		createdAt: Date.now() - PENDING_OAUTH_TTL_MS - 1
	});
	expect(readPendingOAuth(storage)).toBeNull();
	expect(readPleromaAuthState(storage)).toEqual({ status: 'unauthenticated' });

	const state = createOAuthState();
	expect(state).toHaveLength(43);
	expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
});

test('resource helper exposes loading, success, and error states without Svelte coupling', async () => {
	let resolveTimeline: (value: typeof pleromaFixtures.timelines.home) => void = () => undefined;
	const timelinePromise = new Promise<typeof pleromaFixtures.timelines.home>((resolve) => {
		resolveTimeline = resolve;
	});
	const resource = createPleromaResource<typeof pleromaFixtures.timelines.home>();

	const loading = resource.load(() => timelinePromise);
	expect(resource.getState()).toEqual({ status: 'loading' });
	resolveTimeline(pleromaFixtures.timelines.home);
	await loading;
	expect(resource.getState()).toMatchObject({ status: 'success', data: pleromaFixtures.timelines.home });

	await resource.load(async () => {
		throw { kind: 'http', status: 500, message: 'server sad' };
	});
	expect(resource.getState()).toMatchObject({
		status: 'error',
		error: { kind: 'http', status: 500, message: 'server sad' }
	});
});
