import type { CustomEmoji } from '$lib/social/types';
import type { Attachment } from './attachments';

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
	attachments?: Attachment[];
	mediaHidden?: boolean;
	mediaFallback?: string;
	mediaFallbackItems?: string[];
	replyingTo?: string | null;
};

export type ReplyPreviewLoader = (statusId: string) => Promise<ReplyPreview | null>;

export const replyPreviewLoaderContext = Symbol('reply-preview-loader');
