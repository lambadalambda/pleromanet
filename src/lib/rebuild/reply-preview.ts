export type ReplyPreview = {
	name: string;
	handle: string;
	time: string;
	createdAt?: string;
	avatarUrl?: string | null;
	avClass?: string;
	body: string;
	cw?: string;
};

export type ReplyPreviewLoader = (statusId: string) => Promise<ReplyPreview | null>;

export const replyPreviewLoaderContext = Symbol('reply-preview-loader');
