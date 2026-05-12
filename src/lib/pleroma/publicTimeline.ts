import type { AvatarVariant, TimelinePost, TimelineView } from '$lib/social/types';

export type PublicTimelineScope = Extract<TimelineView, 'local' | 'federated'>;

type PleromaAccount = {
	display_name?: string | null;
	username?: string | null;
	acct?: string | null;
	avatar?: string | null;
	avatar_static?: string | null;
};

type PleromaMediaAttachment = {
	type?: string | null;
	url?: string | null;
	preview_url?: string | null;
	description?: string | null;
};

type PleromaStatus = {
	id: string;
	url?: string | null;
	uri?: string | null;
	created_at?: string | null;
	content?: string | null;
	spoiler_text?: string | null;
	replies_count?: number | null;
	reblogs_count?: number | null;
	favourites_count?: number | null;
	account?: PleromaAccount | null;
	media_attachments?: PleromaMediaAttachment[] | null;
	reblog?: PleromaStatus | null;
};

type FetchPublicTimelineOptions = {
	scope: PublicTimelineScope;
	apiOrigin?: string;
	limit?: number;
	fetcher?: typeof fetch;
};

const DEFAULT_PLEROMA_API_ORIGIN = 'https://lain.com';
const avatarVariants: AvatarVariant[] = ['grad-1', 'grad-2', 'grad-3', 'orb', 'pc'];

const normalizeApiOrigin = (origin: string) => {
	const trimmed = origin.trim().replace(/\/+$/, '');
	const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

	return new URL(withProtocol).origin;
};

export const getPleromaApiOrigin = () => {
	const configured = String(import.meta.env.PUBLIC_PLEROMA_API_BASE_URL ?? '').trim();

	return normalizeApiOrigin(configured || DEFAULT_PLEROMA_API_ORIGIN);
};

const plainTextFromHtml = (html: string) => {
	if (typeof document === 'undefined') {
		return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
	}

	const template = document.createElement('template');
	template.innerHTML = html.replace(/<br\s*\/?>/gi, '\n');

	return (template.content.textContent ?? '').replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
};

const pickAvatarVariant = (id: string): AvatarVariant => {
	const hash = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);

	return avatarVariants[hash % avatarVariants.length];
};

const formatHandle = (account: PleromaAccount, apiOrigin: string) => {
	const host = new URL(apiOrigin).host;
	const acct = account.acct?.trim() || account.username?.trim() || 'unknown';

	return `@${acct.includes('@') ? acct : `${acct}@${host}`}`;
};

const formatStatusTime = (createdAt: string | null | undefined) => {
	if (!createdAt) return '';

	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) return '';

	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(date);
};

const count = (value: number | null | undefined) => (Number.isFinite(value) ? Number(value) : 0);

const mapPleromaStatus = (status: PleromaStatus, scope: PublicTimelineScope, apiOrigin: string): TimelinePost => {
	const source = status.reblog ?? status;
	const account = source.account ?? {};
	const displayName = plainTextFromHtml(account.display_name ?? '').trim();
	const username = account.username?.trim() || account.acct?.trim() || 'unknown';
	const body = plainTextFromHtml(source.content || source.spoiler_text || '(empty post)');

	return {
		id: source.id,
		timelines: [scope],
		name: displayName || username,
		handle: formatHandle(account, apiOrigin),
		time: formatStatusTime(source.created_at),
		body,
		avatar: pickAvatarVariant(source.id),
		avatarUrl: account.avatar_static || account.avatar || undefined,
		url: source.url || source.uri || undefined,
		media: source.media_attachments?.length ? 'city' : undefined,
		replies: count(source.replies_count),
		boosts: count(source.reblogs_count),
		favorites: count(source.favourites_count),
		actions: { reply: false, boost: false, favorite: false }
	};
};

export const fetchPublicTimeline = async ({
	scope,
	apiOrigin = getPleromaApiOrigin(),
	limit = 20,
	fetcher = fetch
}: FetchPublicTimelineOptions): Promise<TimelinePost[]> => {
	const origin = normalizeApiOrigin(apiOrigin);
	const url = new URL('/api/v1/timelines/public', origin);
	url.searchParams.set('limit', String(limit));

	if (scope === 'local') {
		url.searchParams.set('local', 'true');
	}

	const response = await fetcher(url.toString(), { headers: { Accept: 'application/json' } });

	if (!response.ok) {
		throw new Error(`Pleroma public timeline request failed: ${response.status}`);
	}

	const data: unknown = await response.json();

	if (!Array.isArray(data)) {
		throw new Error('Pleroma public timeline response was not an array');
	}

	return data.map((status) => mapPleromaStatus(status as PleromaStatus, scope, origin));
};
