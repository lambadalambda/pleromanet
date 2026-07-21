import type { CustomEmoji } from '$lib/social/types';

export type ReplyPreview = {
	name: string;
	nameEmojis?: CustomEmoji[];
	handle: string;
	time: string;
	createdAt?: string;
	avatarUrl?: string | null;
	avClass?: string;
	body: string;
	bodyEmojis?: CustomEmoji[];
	cw?: string;
	replyingTo?: string | null;
};

export type ReplyPreviewLoader = (statusId: string) => Promise<ReplyPreview | null>;

export const replyPreviewLoaderContext = Symbol('reply-preview-loader');
