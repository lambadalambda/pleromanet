import type { AvatarVariant, CustomEmoji, PostAttachment, TimelinePost, TimelineView } from '$lib/social/types';
import { isPleromaClientError } from './http';
import type { PleromaAccount, PleromaCustomEmoji, PleromaInstance, PleromaStatus } from './types';

export const DEFAULT_STATUS_CHARACTER_LIMIT = 500;

export type PleromaAccountView = {
	id: string;
	username: string;
	displayName: string;
	acct: string;
	handle: string;
	url: string;
	avatarUrl: string | null;
	emojis: CustomEmoji[];
	faviconUrl: string | null;
	isAdmin: boolean;
	isModerator: boolean;
	tags: string[];
};

export type PleromaMediaAttachmentView = {
	id: string;
	type: string;
	url: string;
	previewUrl: string | null;
	description: string | null;
	filename: string | null;
	duration: string | null;
};

export type PleromaStatusView = TimelinePost & {
	actionStatusId: string;
	threadStatusId: string;
	timelineItemId: string;
	originalStatusId: string;
	url: string;
	uri: string;
	account: PleromaAccountView;
	contentHtml: string;
	contentText: string;
	spoilerText: string;
	hasContentWarning: boolean;
	mediaHidden: boolean;
	mediaAttachments: PleromaMediaAttachmentView[];
	rebloggedBy?: PleromaAccountView;
	pleroma: {
		conversationId?: number;
		local?: boolean;
		plainText?: string;
	};
};

export type PleromaRequestErrorKind = 'auth-required' | 'rate-limited' | 'server' | 'network' | 'request';

export type PleromaRequestErrorView = {
	kind: PleromaRequestErrorKind;
	title: string;
	message: string;
	retryable: boolean;
	reauthRequired: boolean;
	status?: number;
	path?: string;
};

export type PleromaRequestState<Data> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'empty' }
	| { status: 'error'; error: PleromaRequestErrorView }
	| { status: 'success'; data: Data };

export type AdaptPleromaStatusOptions = {
	timelines?: TimelineView[];
};

const htmlEntities: Record<string, string> = {
	amp: '&',
	gt: '>',
	lt: '<',
	quot: '"',
	apos: "'",
	nbsp: ' '
};

const displayName = (account: PleromaAccount) => account.display_name.trim() || account.username || account.acct;

const handle = (acct: string) => `@${acct.replace(/^@/, '')}`;

const decodeHtmlEntities = (value: string) =>
	value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
		const normalized = code.toLowerCase();
		if (normalized.startsWith('#x') || normalized.startsWith('#')) {
			const codePoint = Number.parseInt(normalized.startsWith('#x') ? normalized.slice(2) : normalized.slice(1), normalized.startsWith('#x') ? 16 : 10);
			return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
		}

		return htmlEntities[normalized] ?? entity;
	});

export const htmlToPlainText = (html: string) => {
	const withBreaks = html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
		.replace(/<\/(div|li|blockquote|p)>/gi, '\n')
		.replace(/<li[^>]*>/gi, '- ');
	const stripped = withBreaks.replace(/<[^>]+>/g, '');

	return decodeHtmlEntities(stripped)
		.split('\n')
		.map((line) => line.replace(/[\t ]+/g, ' ').trim())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
};

const lineBreakCount = (value: string) => value.match(/\n/g)?.length ?? 0;

const sameTextIgnoringWhitespace = (left: string, right: string) => left.replace(/\s+/g, '') === right.replace(/\s+/g, '');

const shouldPreferHtmlText = (plainText: string, htmlText: string) => lineBreakCount(htmlText) > lineBreakCount(plainText) && sameTextIgnoringWhitespace(plainText, htmlText);

const plainTextContent = (status: PleromaStatus) => {
	const plainText = status.pleroma.content?.['text/plain']?.trim();
	const htmlText = htmlToPlainText(status.content);
	if (plainText) return shouldPreferHtmlText(plainText, htmlText) ? htmlText : plainText;

	return htmlText;
};

const leadingReplyMentionPattern = /^(@[\w.]+(?:@[\w.-]+)?)(?=\s|$)/;

const leadingMentionHandles = (status: PleromaStatus) =>
	new Set(
		status.mentions.flatMap((mention) => {
			if (!mention || typeof mention !== 'object') return [];
			const values = mention as Record<string, unknown>;
			const username = typeof values.username === 'string' ? values.username.trim() : '';
			const acct = typeof values.acct === 'string' ? values.acct.trim() : '';

			return [username ? `@${username}` : '', acct ? `@${acct}` : '']
				.filter(Boolean)
				.map((handle) => handle.toLowerCase());
		})
	);

const extractLeadingReplyAddressees = (text: string, status: PleromaStatus) => {
	const knownMentionHandles = leadingMentionHandles(status);
	if (!status.in_reply_to_id && knownMentionHandles.size === 0) return { body: text };

	const addressees: string[] = [];
	let rest = text.trimStart();
	while (rest) {
		const match = leadingReplyMentionPattern.exec(rest);
		if (!match) break;
		if (!status.in_reply_to_id && !knownMentionHandles.has(match[1].toLowerCase())) break;

		addressees.push(match[1]);
		rest = rest.slice(match[1].length);
		const separator = /^\s+/.exec(rest);
		if (!separator) break;
		rest = rest.slice(separator[0].length);
	}

	return addressees.length > 0 ? { body: rest.trimStart(), addressees } : { body: text };
};

const spoilerText = (status: PleromaStatus) => {
	const plainText = status.pleroma.spoiler_text?.['text/plain'];
	if (plainText?.trim()) return plainText.trim();

	return htmlToPlainText(status.spoiler_text ?? '');
};

const formatStatusDate = (createdAt: string) => {
	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) return '';

	return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
};

const avatarUrl = (account: PleromaAccount) => account.avatar || account.avatar_static || null;

const avatarVariant = (account: PleromaAccount): AvatarVariant => (avatarUrl(account) ? 'orb' : 'grad-2');

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object');

const stringValue = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null);

const numberValue = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const positiveIntegerValue = (value: unknown) => {
	const number = typeof value === 'string' && value.trim() ? Number(value) : numberValue(value);
	return typeof number === 'number' && Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
};

export const statusCharacterLimit = (instance: PleromaInstance | null | undefined) => {
	const configuration = isRecord(instance?.configuration) ? instance.configuration : null;
	const statuses = isRecord(configuration?.statuses) ? configuration.statuses : null;
	const metadata = isRecord(instance?.pleroma.metadata) ? instance.pleroma.metadata : null;

	return positiveIntegerValue(statuses?.max_characters)
		?? positiveIntegerValue(instance?.max_toot_chars)
		?? positiveIntegerValue(metadata?.max_toot_chars)
		?? DEFAULT_STATUS_CHARACTER_LIMIT;
};

export const adaptCustomEmojis = (emojis: PleromaCustomEmoji[] | undefined): CustomEmoji[] => (emojis ?? [])
	.map((emoji) => ({
		shortcode: emoji.shortcode,
		url: emoji.url,
		staticUrl: emoji.static_url
	}))
	.filter((emoji) => emoji.shortcode && emoji.url);

const filenameFromUrl = (url: string) => {
	try {
		const filename = new URL(url).pathname.split('/').filter(Boolean).pop();
		return filename ? decodeURIComponent(filename) : null;
	} catch {
		const filename = url.split('?')[0]?.split('/').filter(Boolean).pop();
		return filename ? decodeURIComponent(filename) : null;
	}
};

const secondsToDuration = (seconds: number) => {
	const total = Math.max(0, Math.floor(seconds));
	const minutes = Math.floor(total / 60);
	return `${minutes}:${String(total % 60).padStart(2, '0')}`;
};

const mediaDuration = (attachment: Record<string, unknown>) => {
	const meta = isRecord(attachment.meta) ? attachment.meta : null;
	const original = meta && isRecord(meta.original) ? meta.original : null;
	const duration = numberValue(original?.duration) ?? numberValue(meta?.duration) ?? numberValue(attachment.duration);
	return duration == null ? null : secondsToDuration(duration);
};

const adaptMediaAttachment = (attachment: unknown, index: number): PleromaMediaAttachmentView | null => {
	if (!isRecord(attachment)) return null;

	const url = stringValue(attachment.url) ?? stringValue(attachment.remote_url);
	if (!url) return null;

	return {
		id: stringValue(attachment.id) ?? `media-${index + 1}`,
		type: stringValue(attachment.type) ?? 'unknown',
		url,
		previewUrl: stringValue(attachment.preview_url) ?? stringValue(attachment.previewUrl),
		description: stringValue(attachment.description),
		filename: filenameFromUrl(url),
		duration: mediaDuration(attachment)
	};
};

const adaptPostAttachment = (attachment: PleromaMediaAttachmentView): PostAttachment | null => {
	const type = attachment.type.toLowerCase();
	if (type === 'image' || type === 'photo') {
		return {
			kind: 'photo',
			src: attachment.url,
			alt: attachment.description ?? undefined,
			filename: attachment.filename ?? undefined
		};
	}

	if (type === 'video' || type === 'gifv') {
		return {
			kind: 'video',
			src: attachment.url,
			posterUrl: attachment.previewUrl ?? undefined,
			title: attachment.description ?? attachment.filename ?? 'video',
			caption: attachment.description ?? undefined,
			duration: attachment.duration ?? undefined,
			filename: attachment.filename ?? undefined
		};
	}

	if (type === 'audio') {
		return {
			kind: 'audio',
			src: attachment.url,
			title: attachment.description ?? attachment.filename ?? 'audio',
			byline: 'audio',
			duration: attachment.duration ?? undefined,
			filename: attachment.filename ?? undefined
		};
	}

	return null;
};

const timelineMembership = (status: PleromaStatus, options: AdaptPleromaStatusOptions): TimelineView[] => {
	if (options.timelines) return options.timelines;
	if (typeof status.pleroma.local !== 'boolean') return [];

	return [status.pleroma.local ? 'local' : 'federated'];
};

const countBeforeViewerAction = (count: number, active: boolean) => Math.max(0, count - (active ? 1 : 0));

export const adaptPleromaAccount = (account: PleromaAccount): PleromaAccountView => ({
	id: account.id,
	username: account.username,
	displayName: displayName(account),
	acct: account.acct,
	handle: handle(account.acct),
	url: account.url,
	avatarUrl: avatarUrl(account),
	emojis: adaptCustomEmojis(account.emojis),
	faviconUrl: account.pleroma.favicon ?? null,
	isAdmin: account.pleroma.is_admin ?? false,
	isModerator: account.pleroma.is_moderator ?? false,
	tags: account.pleroma.tags ?? []
});

export const adaptPleromaStatus = (status: PleromaStatus, options: AdaptPleromaStatusOptions = {}): PleromaStatusView => {
	const source = status.reblog ?? status;
	const account = adaptPleromaAccount(source.account);
	const mediaAttachments = source.media_attachments.map(adaptMediaAttachment).filter((attachment) => attachment !== null);
	const postAttachments = mediaAttachments.map(adaptPostAttachment).filter((attachment) => attachment !== null);
	const warning = spoilerText(source);
	const plainText = plainTextContent(source);
	const body = warning ? { body: `Content warning: ${warning}` } : extractLeadingReplyAddressees(plainText, source);
	const mediaHidden = postAttachments.length > 0 && Boolean(warning || source.sensitive);

	return {
		id: status.id,
		actionStatusId: source.id,
		threadStatusId: source.id,
		timelineItemId: status.id,
		originalStatusId: source.id,
		timelines: timelineMembership(source, options),
		name: account.displayName,
		nameEmojis: account.emojis,
		handle: account.handle,
		time: formatStatusDate(source.created_at),
		body: body.body,
		bodyEmojis: adaptCustomEmojis(source.emojis),
		addressees: body.addressees,
		copyJson: status,
		avatar: avatarVariant(source.account),
		avatarUrl: account.avatarUrl,
		attachments: mediaHidden ? undefined : postAttachments,
		media: undefined,
		replies: source.replies_count,
		boosts: countBeforeViewerAction(source.reblogs_count, source.reblogged),
		favorites: countBeforeViewerAction(source.favourites_count, source.favourited),
		actions: { reply: false, boost: source.reblogged, favorite: source.favourited },
		url: source.url,
		uri: source.uri,
		account,
		contentHtml: source.content,
		contentText: plainText,
		spoilerText: warning,
		hasContentWarning: Boolean(warning),
		mediaHidden,
		mediaAttachments,
		rebloggedBy: status.reblog ? adaptPleromaAccount(status.account) : undefined,
		pleroma: {
			conversationId: source.pleroma.conversation_id,
			local: source.pleroma.local,
			plainText: source.pleroma.content?.['text/plain']
		}
	};
};

export const adaptPleromaStatuses = (statuses: PleromaStatus[], options: AdaptPleromaStatusOptions = {}) =>
	statuses.map((status) => adaptPleromaStatus(status, options));

export const normalizePleromaRequestError = (error: unknown): PleromaRequestErrorView => {
	if (!isPleromaClientError(error)) {
		return {
			kind: 'request',
			title: 'Request failed',
			message: error instanceof Error ? error.message : 'PleromaNet could not complete this request.',
			retryable: true,
			reauthRequired: false
		};
	}

	if (error.kind === 'unauthenticated' || (error.kind === 'http' && (error.status === 401 || error.status === 403))) {
		return {
			kind: 'auth-required',
			title: 'Re-authentication required',
			message: error.message || 'Your Pleroma session needs to be authorized again.',
			retryable: false,
			reauthRequired: true,
			path: error.path,
			status: error.kind === 'http' ? error.status : undefined
		};
	}

	if (error.kind === 'network') {
		return {
			kind: 'network',
			title: 'Network connection failed',
			message: error.message,
			retryable: true,
			reauthRequired: false,
			path: error.path
		};
	}

	if (error.status === 429) {
		return {
			kind: 'rate-limited',
			title: 'Rate limit reached',
			message: error.message,
			retryable: true,
			reauthRequired: false,
			path: error.path,
			status: error.status
		};
	}

	if (error.status >= 500) {
		return {
			kind: 'server',
			title: 'Pleroma server error',
			message: error.message,
			retryable: true,
			reauthRequired: false,
			path: error.path,
			status: error.status
		};
	}

	return {
		kind: 'request',
		title: 'Pleroma request failed',
		message: error.message,
		retryable: false,
		reauthRequired: false,
		path: error.path,
		status: error.status
	};
};
