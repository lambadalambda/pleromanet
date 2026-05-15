export type TimelineView = 'home' | 'local' | 'federated';
export type PostAction = 'reply' | 'boost' | 'favorite';
export type ReplySort = 'top' | 'newest';
export type AvatarVariant = 'grad-1' | 'grad-2' | 'grad-3' | 'orb' | 'pc';
export type MediaVariant = 'sunset' | 'city' | 'space';
export type ActionState = Record<PostAction, boolean>;

export type PhotoAttachment = {
	kind: 'photo';
	src: string;
	alt?: string;
	cw?: boolean;
	filename?: string;
};

export type VideoAttachment = {
	kind: 'video';
	src?: string;
	posterUrl?: string;
	title?: string;
	duration?: string;
	poster?: MediaVariant;
	cc?: boolean;
	caption?: string;
	start?: number;
	filename?: string;
};

export type AudioAttachment = {
	kind: 'audio';
	src?: string;
	title: string;
	byline?: string;
	duration?: string;
	cover?: string;
	start?: number;
	filename?: string;
};

export type PostAttachment = PhotoAttachment | VideoAttachment | AudioAttachment;

export type QuotedPostView = {
	name: string;
	handle: string;
	time: string;
	body: string;
	avatar?: AvatarVariant;
	avatarBanner?: MediaVariant | 'pixel-window';
	replies?: number;
	boosts?: number;
	favs?: number;
	attachments?: PostAttachment[];
};

export type SocialPost = {
	id: string;
	actionStatusId?: string;
	threadStatusId?: string;
	name: string;
	handle: string;
	time: string;
	body: string;
	avatar: AvatarVariant;
	avatarUrl?: string | null;
	media?: MediaVariant;
	attachments?: PostAttachment[];
	addressees?: string[];
	copyJson?: unknown;
	quotedPost?: QuotedPostView;
	replies: number;
	boosts: number;
	favorites: number;
	actions: ActionState;
};

export type TimelinePost = SocialPost & {
	timelines: TimelineView[];
};

export type ThreadPost = SocialPost & {
	fullTime?: string;
	source?: string;
	views?: string;
	bookmarks?: number;
	nestedReplies?: ThreadPost[];
};
