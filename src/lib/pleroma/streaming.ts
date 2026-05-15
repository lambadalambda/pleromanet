import { normalizeInstanceUrl } from './http';
import type { PleromaStatus } from './types';

type StreamName = 'user' | 'public' | 'public:local';

type WebSocketLike = {
	onmessage: ((event: { data: unknown }) => void) | null;
	onerror: ((event: Event) => void) | null;
	onclose: ((event: Event) => void) | null;
	close: () => void;
};

type WebSocketFactory = new (url: string) => WebSocketLike;

export type PleromaStreamingMessage = {
	event: string;
	payload: unknown;
	status?: PleromaStatus;
};

type TimelineStreamOptions = {
	instanceUrl: string;
	accessToken: string;
	stream?: StreamName;
	WebSocketImpl?: WebSocketFactory;
	onUpdate: (status: PleromaStatus) => void;
	onError?: (error: unknown) => void;
	onClose?: (event: unknown) => void;
};

const parsePayload = (payload: unknown) => {
	if (typeof payload !== 'string') return payload;

	try {
		return JSON.parse(payload) as unknown;
	} catch {
		return payload;
	}
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object');

const isPleromaStatusPayload = (payload: unknown): payload is PleromaStatus => {
	if (!isRecord(payload) || !isRecord(payload.account) || !isRecord(payload.pleroma)) return false;

	return typeof payload.id === 'string' &&
		typeof payload.uri === 'string' &&
		typeof payload.url === 'string' &&
		typeof payload.content === 'string' &&
		typeof payload.created_at === 'string' &&
		Array.isArray(payload.media_attachments) &&
		Array.isArray(payload.mentions) &&
		typeof payload.account.id === 'string' &&
		typeof payload.account.username === 'string' &&
		typeof payload.account.acct === 'string' &&
		typeof payload.account.display_name === 'string';
};

export const buildPleromaStreamingUrl = ({ instanceUrl, accessToken, stream = 'user' }: Pick<TimelineStreamOptions, 'instanceUrl' | 'accessToken' | 'stream'>) => {
	const origin = normalizeInstanceUrl(instanceUrl);
	const url = new URL('/api/v1/streaming/', origin);
	url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:';
	url.searchParams.set('stream', stream);
	url.searchParams.set('access_token', accessToken);

	return url.toString();
};

export const parsePleromaStreamingMessage = (data: unknown): PleromaStreamingMessage | null => {
	if (typeof data !== 'string') return null;

	try {
		const message = JSON.parse(data) as unknown;
		if (!message || typeof message !== 'object' || !('event' in message)) return null;

		const event = typeof message.event === 'string' ? message.event : '';
		const payload = parsePayload('payload' in message ? message.payload : undefined);

		return {
			event,
			payload,
			status: event === 'update' && isPleromaStatusPayload(payload) ? payload : undefined
		};
	} catch {
		return null;
	}
};

export const openPleromaTimelineStream = ({
	instanceUrl,
	accessToken,
	stream = 'user',
	WebSocketImpl,
	onUpdate,
	onError,
	onClose
}: TimelineStreamOptions) => {
	const SocketImpl = WebSocketImpl ?? globalThis.WebSocket as unknown as WebSocketFactory | undefined;
	if (!SocketImpl) {
		onError?.(new Error('WebSocket is not available in this browser.'));
		return { close: () => undefined };
	}

	let socket: WebSocketLike;
	let closed = false;
	try {
		socket = new SocketImpl(buildPleromaStreamingUrl({ instanceUrl, accessToken, stream }));
	} catch (error) {
		onError?.(error);
		return { close: () => undefined };
	}

	socket.onmessage = (event) => {
		if (closed) return;
		const message = parsePleromaStreamingMessage(event.data);
		if (!message?.status) return;

		try {
			onUpdate(message.status);
		} catch (error) {
			if (!closed) onError?.(error);
		}
	};
	socket.onerror = (event) => {
		if (!closed) onError?.(event);
	};
	socket.onclose = (event) => {
		if (!closed) onClose?.(event);
	};

	return {
		close: () => {
			if (closed) return;
			closed = true;
			socket.onmessage = null;
			socket.onerror = null;
			socket.onclose = null;
			socket.close();
		}
	};
};
