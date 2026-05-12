export type TimelineView = 'home' | 'local' | 'federated';
export type PostAction = 'reply' | 'boost' | 'favorite';
export type ReplySort = 'top' | 'newest';
export type AvatarVariant = 'grad-1' | 'grad-2' | 'grad-3' | 'orb' | 'pc';
export type MediaVariant = 'sunset' | 'city' | 'space';
export type ActionState = Record<PostAction, boolean>;

export type SocialPost = {
	id: string;
	name: string;
	handle: string;
	time: string;
	body: string;
	avatar: AvatarVariant;
	avatarUrl?: string;
	url?: string;
	media?: MediaVariant;
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
