<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AncestorPost from '$lib/rebuild/AncestorPost.svelte';
	import AttachmentLightboxHost from '$lib/rebuild/AttachmentLightboxHost.svelte';
	import Button from '$lib/rebuild/Button.svelte';
	import ComposerCWPanel from '$lib/rebuild/ComposerCWPanel.svelte';
	import ComposerMentionEditor from '$lib/rebuild/ComposerMentionEditor.svelte';
	import EmojiPicker from '$lib/rebuild/EmojiPicker.svelte';
	import ComposerPollPanel from '$lib/rebuild/ComposerPollPanel.svelte';
	import FocusedPost from '$lib/rebuild/FocusedPost.svelte';
	import Icon from '$lib/rebuild/Icon.svelte';
	import InlineReplyComposer, { type InlineReplyComposerProps } from '$lib/rebuild/InlineReplyComposer.svelte';
	import NotifRow from '$lib/rebuild/NotifRow.svelte';
	import NotifsPopover from '$lib/rebuild/NotifsPopover.svelte';
	import Post from '$lib/rebuild/Post.svelte';
	import ProfileMini from '$lib/rebuild/ProfileMini.svelte';
	import ProfileSideRail from '$lib/rebuild/ProfileSideRail.svelte';
	import ProfileView from '$lib/rebuild/ProfileView.svelte';
	import ReplyPost from '$lib/rebuild/ReplyPost.svelte';
	import RichText from '$lib/rebuild/RichText.svelte';
	import SurfaceCard from '$lib/rebuild/SurfaceCard.svelte';
	import TimelineLoadMore from '$lib/rebuild/TimelineLoadMore.svelte';
	import TimelineNewPostsIndicator from '$lib/rebuild/TimelineNewPostsIndicator.svelte';
	import { accountsFromPleromaNotifications, accountsFromPleromaStatus, accountsFromPleromaStatuses, createPleromaAccountCache, getCachedPleromaAccount, upsertPleromaAccounts } from '$lib/pleroma/account-cache';
	import { createPleromaClient } from '$lib/pleroma/client';
	import { NOTIFICATION_POLL_EVENT, NOTIFICATION_POLL_INTERVAL_MS, readNotificationLastSeenAt, writeNotificationLastSeenAt } from '$lib/pleroma/notifications';
	import { readPleromaSession, signOutPleroma, writePleromaSession } from '$lib/pleroma/session';
	import { openPleromaTimelineStream } from '$lib/pleroma/streaming';
	import {
		mergeTimelineItems,
		prependTimelineItems,
		queueNewerTimelineItems,
		type PaginatedTimelineBaseState,
		type PaginatedTimelineSuccess
	} from '$lib/pleroma/timeline-state';
	import { DEFAULT_STATUS_CHARACTER_LIMIT, adaptCustomEmojis, adaptPleromaAccount, adaptPleromaNotifications, adaptPleromaProfile, adaptPleromaStatus, adaptPleromaStatuses, htmlToPlainText, normalizePleromaRequestError, statusCharacterLimit, type PleromaAccountView, type PleromaNotificationView, type PleromaProfileFollowState, type PleromaRequestErrorView, type PleromaRequestState, type PleromaStatusView } from '$lib/pleroma/ui';
	import type { BannerVariant, PostLike } from '$lib/rebuild/attachments';
	import { COMPOSER_MAX_UPLOAD_BYTES, COMPOSER_MAX_UPLOADS, composerPollPayload, composerUploadBadge, composerUploadError, composerUploadKind, createComposerPollDraft, getComposerUploadedMediaIds, hasComposerUploadsPending, isComposerUploadType, type ComposerEmoji, type ComposerMentionAccount, type ComposerPollDraft, type ComposerUpload } from '$lib/rebuild/composer';
	import type { IconName } from '$lib/rebuild/icons';
	import type { ProfileData, ProfileMediaItem, ProfilePost } from '$lib/rebuild/profile';
	import type { PleromaAccount, PleromaInstance, PleromaNotification, PleromaRelationship, PleromaSession, PleromaStatus, PleromaTag } from '$lib/pleroma/types';
	import type { SocialNotificationData, SocialPost } from '$lib/social/types';
	import { onMount } from 'svelte';

	type AppRoute = 'home' | 'local' | 'federated' | 'public' | 'thread' | 'profile' | 'notifications' | 'explore' | 'search' | 'settings';
	type NavItem = { route: AppRoute; label: string; icon: IconName; href: string; count?: number };
	type ThemeName = 'cream' | 'dusk' | 'drive' | 'simoun';
	type ExploreFeed = 'popular' | 'new' | 'active';
	type SearchTab = 'all' | 'people' | 'posts';
	type ProfileSettings = {
		displayName: string;
		username: string;
		website: string;
		location: string;
		bio: string;
		discoverable: boolean;
		indexable: boolean;
		showFollowers: boolean;
	};
	type ReplySort = 'top' | 'newest';
	type StatusActionKey = 'boost' | 'fav';
	type StatusActionOrigin = 'home' | 'thread' | 'profile';
	type StatusActionScope = StatusActionOrigin | 'all';
	type StatusActionOriginSnapshot = { route: StatusActionOrigin; requestId: number };
	type StatusActionValue = { active: boolean; count: number };
	type StatusVisibility = PleromaStatus['visibility'];
	type InlineReplyTarget = {
		route: StatusActionOrigin;
		targetId: string;
		renderId: string;
		handle: string;
		visibility: StatusVisibility;
		name: string;
		avClass?: string;
		avBanner?: BannerVariant;
		avatarUrl?: string | null;
	};
	type InlineReplyComposerData = Omit<InlineReplyComposerProps, 'id'>;
	type AccountBackedPost = SocialPost & { visibility?: StatusVisibility; account?: PleromaAccountView; rebloggedBy?: PleromaAccountView };
	type RebuildPost = PostLike & {
		id: string | number;
		actionStatusId?: string;
		threadStatusId?: string;
		visibility?: StatusVisibility;
		name: string;
		nameEmojis?: SocialPost['nameEmojis'];
		handle: string;
		time: string;
		avClass?: string;
		avBanner?: BannerVariant;
		avatarUrl?: string | null;
		body: string;
		bodyEmojis?: SocialPost['bodyEmojis'];
		replies: number;
		boosts: number;
		favs: number;
		addressees?: string[];
		boostedBy?: PostLike['boostedBy'];
		copyJson?: unknown;
		actions: { reply: boolean; boost: boolean; fav: boolean };
	};
	type ThreadViewPost = RebuildPost & {
		bookmarks?: number;
		fullTime?: string;
		source?: string;
		views?: string | null;
		following?: boolean;
		nestedReplies?: ThreadViewPost[];
	};
	type HomeTimelineSuccess = PaginatedTimelineSuccess<PleromaStatusView, PleromaRequestErrorView> & {
		newerPosts: PleromaStatusView[];
		newPostsStatus: 'idle' | 'checking';
	};
	type HomeTimelineState = PaginatedTimelineBaseState<PleromaRequestErrorView> | HomeTimelineSuccess;
	type ThreadState =
		| { status: 'idle' }
		| { status: 'loading' }
		| { status: 'error'; error: PleromaRequestErrorView }
		| { status: 'success'; focused: ThreadViewPost; ancestors: ThreadViewPost[]; replies: ThreadViewPost[] };
	type ProfileState =
		| { status: 'idle' }
		| { status: 'loading' }
		| { status: 'error'; error: PleromaRequestErrorView }
		| { status: 'success'; data: ProfileData; timelineStatus: 'loading' | 'ready' };
	type NotificationState =
		| { status: 'idle' }
		| { status: 'loading' }
		| { status: 'empty' }
		| { status: 'error'; error: PleromaRequestErrorView }
		| { status: 'success'; data: PleromaNotificationView[] };
	type SearchAccountView = PleromaAccountView & { bio: string; followers: number; posts: number; followState: PleromaProfileFollowState };
	type SearchState =
		| { status: 'idle' }
		| { status: 'loading'; query: string }
		| { status: 'empty'; query: string }
		| { status: 'error'; query: string; error: PleromaRequestErrorView }
		| { status: 'success'; query: string; accounts: SearchAccountView[]; posts: PleromaStatusView[] };
	type HeaderSearchSelectableItem =
		| { kind: 'recent'; query: string }
		| { kind: 'account'; account: SearchAccountView }
		| { kind: 'post'; post: PleromaStatusView };
	type TrendView = { rank: number; tag: string; count: string | null };
	type InstanceStatusView = { title: string | null; domain: string | null; rows: { label: string; value: string }[] };
	type StatusActionErrorState = { targetId: string; key: StatusActionKey; route: StatusActionOrigin; error: PleromaRequestErrorView };
	type NotificationPopoverStatus = 'ready' | 'loading' | 'empty' | 'error';
	const HOME_TIMELINE_CHECK_EVENT = 'pleromanet:check-home-timeline';
	const HOME_TIMELINE_FALLBACK_INTERVAL_MS = 60_000;
	const HOME_TIMELINE_STREAM_RECONNECT_MS = HOME_TIMELINE_FALLBACK_INTERVAL_MS;
	const NOTIFICATION_STREAM_RECONNECT_MS = NOTIFICATION_POLL_INTERVAL_MS;
	const HEADER_SEARCH_DEBOUNCE_MS = 160;
	const SEARCH_PAGE_DEBOUNCE_MS = 260;
	const SEARCH_RECENTS_STORAGE_KEY = 'pn-search-recents';
	const defaultProfile: ProfileSettings = {
		displayName: 'dreambyte',
		username: 'dreambyte',
		website: 'https://dreambyte.dev',
		location: 'somewhere on the internet',
		bio: 'living in a soft world',
		discoverable: true,
		indexable: false,
		showFollowers: true
	};

	let sessionReady = $state(false);
	let mounted = $state(false);
	let currentSession = $state<PleromaSession | null>(null);
	let accountCache = $state(createPleromaAccountCache());
	let homeTimelineState = $state<HomeTimelineState>({ status: 'idle' });
	let threadState = $state<ThreadState>({ status: 'idle' });
	let profileRouteState = $state<ProfileState>({ status: 'idle' });
	let notificationState = $state<NotificationState>({ status: 'idle' });
	let searchState = $state<SearchState>({ status: 'idle' });
	let headerSearchState = $state<SearchState>({ status: 'idle' });
	let trendsState = $state<PleromaRequestState<TrendView[]>>({ status: 'idle' });
	let instanceStatusState = $state<PleromaRequestState<InstanceStatusView>>({ status: 'idle' });
	let localHomePosts = $state<RebuildPost[]>([]);
	let composerText = $state('');
	let composerMentionAccounts = $state<ComposerMentionAccount[]>([]);
	let composerCustomEmojis = $state<ComposerEmoji[]>([]);
	let composerEmojiRecents = $state<Array<string | ComposerEmoji>>([]);
	let composerEmojiPickerOpen = $state(false);
	let composerEmojiPickerAnchor = $state<{ left?: number; top?: number; bottom?: number } | null>(null);
	let composerInsertRequest = $state<{ id: number; item: string | ComposerEmoji } | null>(null);
	let composerInsertRequestId = 0;
	let composerFileInput = $state<HTMLInputElement | null>(null);
	let composerUploads = $state<ComposerUpload[]>([]);
	let composerDragActive = $state(false);
	let composerDragCount = $state(0);
	let composerSpoilerActive = $state(false);
	let composerSpoilerText = $state('');
	let composerPoll = $state<ComposerPollDraft | null>(null);
	let mobileDrawerOpen = $state(false);
	let mobileSheetOpen = $state(false);
	let userMenuOpen = $state(false);
	let notificationsMenuOpen = $state(false);
	let headerSearchDraft = $state('');
	let exploreSearchDraft = $state('');
	let searchPageDraft = $state('');
	let searchRecents = $state<string[]>([]);
	let headerSearchOpen = $state(false);
	let headerSearchSelectedIndex = $state(-1);
	let searchSidebarOpen = $state(false);
	let headerSearchInput = $state<HTMLInputElement | null>(null);
	let headerSearchForm = $state<HTMLFormElement | null>(null);
	let exploreFeed = $state<ExploreFeed>('popular');
	let joinedCommunities = $state<Record<string, boolean>>({});
	let settingsSaveState = $state('Saved');
	let profile = $state<ProfileSettings>({ ...defaultProfile });
	let savedProfile = $state<ProfileSettings>({ ...defaultProfile });
	let homePostSubmitState = $state<'idle' | 'submitting'>('idle');
	let homePostSubmitError = $state<PleromaRequestErrorView | null>(null);
	let inlineReplyTarget = $state<InlineReplyTarget | null>(null);
	let inlineReplyDraft = $state('');
	let inlineReplyUploads = $state<ComposerUpload[]>([]);
	let inlineReplySpoilerActive = $state(false);
	let inlineReplySpoilerText = $state('');
	let inlineReplyPoll = $state<ComposerPollDraft | null>(null);
	let inlineReplySubmitState = $state<'idle' | 'submitting'>('idle');
	let inlineReplySubmitError = $state<PleromaRequestErrorView | null>(null);
	let statusActionErrors = $state<StatusActionErrorState[]>([]);
	let statusActionPending = $state<Record<string, number>>({});
	let profileAccountLoadError = $state<PleromaRequestErrorView | null>(null);
	let replySort = $state<ReplySort>('top');
	let expandedThreadReplyIds = $state<Record<string, boolean>>({});
	let homeTimelineRequestId = 0;
	let homeTimelineNewPostsRequestId = 0;
	let threadRequestId = 0;
	let profileRouteRequestId = 0;
	let notificationRequestId = 0;
	let searchRequestId = 0;
	let headerSearchRequestId = 0;
	let trendsRequestId = 0;
	let statusActionRequestId = 0;
	let inlineReplyRequestId = 0;
	let homePostSubmitRequestId = 0;
	let profileAccountRequestId = 0;
	let instanceConfigRequestId = 0;
	let composerMentionSearchRequestId = 0;
	let composerCustomEmojiRequestId = 0;
	let loadedHomeTimelineKey = '';
	let loadedThreadKey = '';
	let loadedProfileRouteKey = '';
	let loadedNotificationsKey = '';
	let loadedForegroundNotificationsKey = '';
	let loadedSearchKey = '';
	let loadedProfileAccountKey = '';
	let loadedTrendsKey = '';
	let loadedInstanceConfigKey = '';
	let loadedComposerCustomEmojiKey = '';
	let homeTimelineFallbackSinceId: string | null = null;
	let homeTimelineStreamKey = '';
	let homeTimelineStreamReadyKey = '';
	let closeHomeTimelineStream: (() => void) | null = null;
	let homeTimelineStreamReconnectTimer: number | null = null;
	let notificationStreamKey = '';
	let notificationStreamReadyKey = '';
	let closeNotificationStream: (() => void) | null = null;
	let notificationStreamReconnectTimer: number | null = null;
	let notificationLoadPromise: Promise<void> | null = null;
	let notificationLoadPromiseKey = '';
	let notificationLoadStartedAt = 0;
	let notificationAbortController: AbortController | null = null;
	let headerSearchDebounceTimer: number | null = null;
	let searchPageDebounceTimer: number | null = null;
	let searchFollowPending = $state<Record<string, boolean>>({});
	let composerCharacterLimit = $state(DEFAULT_STATUS_CHARACTER_LIMIT);
	const sessionKey = (session: PleromaSession | null) => session ? `${session.instanceUrl}\n${session.accessToken}\n${session.createdAt}` : '';
	const resetAccountCache = () => {
		accountCache = createPleromaAccountCache();
	};
	const upsertAccountCache = (accounts: PleromaAccount[], options?: Parameters<typeof upsertPleromaAccounts>[2]) => {
		if (accounts.length === 0) return;
		const nextCache = upsertPleromaAccounts(accountCache, accounts, options);
		if (nextCache !== accountCache) accountCache = nextCache;
	};
	const clearInlineReply = (route?: StatusActionOrigin) => {
		if (route && inlineReplyTarget?.route !== route) return;
		inlineReplyRequestId += 1;
		inlineReplyTarget = null;
		inlineReplyDraft = '';
		inlineReplyUploads = [];
		inlineReplySpoilerActive = false;
		inlineReplySpoilerText = '';
		inlineReplyPoll = null;
		inlineReplySubmitState = 'idle';
		inlineReplySubmitError = null;
	};
	const clearStatusActionErrors = (route?: StatusActionOrigin) => {
		if (!route) {
			if (statusActionErrors.length > 0) statusActionErrors = [];
			return;
		}

		if (!statusActionErrors.some((error) => error.route === route)) return;
		statusActionErrors = statusActionErrors.filter((error) => error.route !== route);
	};
	const removeStatusActionError = (targetId: string, key: StatusActionKey) => {
		statusActionErrors = statusActionErrors.filter((error) => error.targetId !== targetId || error.key !== key);
	};
	const addStatusActionError = (nextError: StatusActionErrorState) => {
		statusActionErrors = [
			...statusActionErrors.filter((error) => error.targetId !== nextError.targetId || error.key !== nextError.key || error.route !== nextError.route),
			nextError
		];
	};
	const invalidateStatusActionRequests = () => {
		statusActionRequestId += 1;
		statusActionPending = {};
		clearStatusActionErrors();
	};
	const invalidateHomeTimelineRequests = () => {
		homeTimelineRequestId += 1;
		homeTimelineNewPostsRequestId += 1;
		homePostSubmitRequestId += 1;
		homePostSubmitState = 'idle';
		homePostSubmitError = null;
		clearInlineReply('home');
		composerUploads = [];
		composerDragActive = false;
		clearStatusActionErrors('home');
	};
	const invalidateThreadRequests = () => {
		threadRequestId += 1;
		loadedThreadKey = '';
		threadState = { status: 'idle' };
		expandedThreadReplyIds = {};
		clearInlineReply('thread');
		clearStatusActionErrors('thread');
	};
	const invalidateProfileRouteRequests = () => {
		profileRouteRequestId += 1;
		loadedProfileRouteKey = '';
		profileRouteState = { status: 'idle' };
		clearStatusActionErrors('profile');
	};
	const clearHomeRouteIfLoaded = () => {
		if (!loadedHomeTimelineKey && homeTimelineState.status === 'idle' && !closeHomeTimelineStream) return;
		invalidateHomeTimelineRequests();
		loadedHomeTimelineKey = '';
		closeHomeTimelineStreaming();
	};
	const clearThreadRouteIfLoaded = () => {
		if (!loadedThreadKey && threadState.status === 'idle') return;
		invalidateThreadRequests();
	};
	const clearProfileRouteIfLoaded = () => {
		if (!loadedProfileRouteKey && profileRouteState.status === 'idle') return;
		invalidateProfileRouteRequests();
	};
	const invalidateNotificationRequests = () => {
		notificationRequestId += 1;
		clearNotificationLoadPromise(true);
		closeNotificationStreaming();
		loadedNotificationsKey = '';
		loadedForegroundNotificationsKey = '';
		notificationState = { status: 'idle' };
	};
	const clearHeaderSearchDebounce = () => {
		if (!headerSearchDebounceTimer) return;
		window.clearTimeout(headerSearchDebounceTimer);
		headerSearchDebounceTimer = null;
	};
	const clearSearchPageDebounce = () => {
		if (!searchPageDebounceTimer) return;
		window.clearTimeout(searchPageDebounceTimer);
		searchPageDebounceTimer = null;
	};
	const closeHeaderSearch = () => {
		clearHeaderSearchDebounce();
		headerSearchOpen = false;
		headerSearchSelectedIndex = -1;
	};
	const invalidateSearchRequests = () => {
		clearSearchPageDebounce();
		searchRequestId += 1;
		headerSearchRequestId += 1;
		loadedSearchKey = '';
		searchState = { status: 'idle' };
		headerSearchState = { status: 'idle' };
		searchFollowPending = {};
		closeHeaderSearch();
	};
	const invalidateProfileAccountRequests = () => {
		profileAccountRequestId += 1;
		loadedProfileAccountKey = '';
		profileAccountLoadError = null;
	};
	const invalidateTrendsRequests = () => {
		trendsRequestId += 1;
		loadedTrendsKey = '';
		trendsState = { status: 'idle' };
	};
	const invalidateInstanceConfigRequests = () => {
		instanceConfigRequestId += 1;
		loadedInstanceConfigKey = '';
		instanceStatusState = { status: 'idle' };
		composerCharacterLimit = DEFAULT_STATUS_CHARACTER_LIMIT;
	};
	const invalidateComposerAutocompleteRequests = () => {
		composerMentionSearchRequestId += 1;
		composerCustomEmojiRequestId += 1;
		loadedComposerCustomEmojiKey = '';
		composerMentionAccounts = [];
		composerCustomEmojis = [];
	};
	const isCurrentSessionRequest = (requestSessionKey: string) => sessionKey(currentSession) === requestSessionKey;
	const clearHomeTimelineStreamReconnect = () => {
		if (homeTimelineStreamReconnectTimer === null) return;
		window.clearTimeout(homeTimelineStreamReconnectTimer);
		homeTimelineStreamReconnectTimer = null;
	};
	const closeHomeTimelineStreaming = () => {
		clearHomeTimelineStreamReconnect();
		closeHomeTimelineStream?.();
		closeHomeTimelineStream = null;
		homeTimelineStreamKey = '';
		homeTimelineStreamReadyKey = '';
	};
	const clearNotificationStreamReconnect = () => {
		if (notificationStreamReconnectTimer === null) return;
		window.clearTimeout(notificationStreamReconnectTimer);
		notificationStreamReconnectTimer = null;
	};
	const closeNotificationStreaming = () => {
		clearNotificationStreamReconnect();
		closeNotificationStream?.();
		closeNotificationStream = null;
		notificationStreamKey = '';
		notificationStreamReadyKey = '';
	};

	let notificationItems = $derived(notificationState.status === 'success' ? notificationState.data : []);
	let unreadNotificationCount = $derived(notificationItems.filter((notification) => !notification.read).length);
	let notificationPopoverStatus = $derived<NotificationPopoverStatus>(
		notificationState.status === 'success' ? 'ready' :
		notificationState.status === 'empty' ? 'empty' :
		notificationState.status === 'error' ? 'error' :
		'loading'
	);
	let notificationPopoverError = $derived(notificationState.status === 'error' ? notificationState.error : null);
	let headerNotificationLabel = $derived(unreadNotificationCount > 0 ? `Notifications, ${unreadNotificationCount} unread` : 'Notifications');
	let headerAccount = $derived(currentSession?.account ? adaptPleromaAccount(currentSession.account) : null);
	let headerAccountName = $derived(headerAccount?.displayName ?? 'Account');
	let headerAccountAvatarUrl = $derived(headerAccount?.avatarUrl ?? null);
	let headerAccountLabel = $derived(`${headerAccountName} account menu`);
	let homeStatusActionErrors = $derived(statusActionErrors.filter((error) => error.route === 'home'));
	let threadStatusActionErrors = $derived(statusActionErrors.filter((error) => error.route === 'thread'));
	let profileStatusActionErrors = $derived(statusActionErrors.filter((error) => error.route === 'profile'));

	let navItems = $derived<NavItem[]>([
		{ route: 'home', label: 'Home', icon: 'home', href: '/app/home' },
		{ route: 'local', label: 'Local', icon: 'users', href: '/app/local' },
		{ route: 'federated', label: 'Federated', icon: 'globe', href: '/app/federated' },
		{ route: 'explore', label: 'Explore', icon: 'search', href: '/app/explore' },
		{ route: 'notifications', label: 'Notifications', icon: 'bell', href: '/app/notifications', count: unreadNotificationCount || undefined },
		{ route: 'settings', label: 'Settings', icon: 'gear', href: '/app/settings' },
	]);
	let primaryNavItems = $derived(navItems.filter((item) => item.route === 'home' || item.route === 'local' || item.route === 'federated' || item.route === 'explore'));
	const timelineRoutes: AppRoute[] = ['home', 'local', 'federated', 'public', 'thread'];
	const settingsSubnav = ['Profile', 'Appearance', 'Notifications', 'Filters', 'Federation', 'Account', 'Import / Export', 'Development'];

	const avatarClass = (avatar: SocialPost['avatar']) =>
		avatar === 'pc' ? 'av-pixel-pc' :
		avatar === 'orb' ? 'av-orb' :
		avatar === 'grad-1' ? 'av-grad-1' :
		avatar === 'grad-2' ? 'av-grad-2' :
		avatar === 'grad-3' ? 'av-grad-3' :
		'av-anime';
	const cachedAccountView = (account: PleromaAccountView | null | undefined): PleromaAccountView | null => {
		if (!account) return null;
		const cached = getCachedPleromaAccount(accountCache, account.id) ?? getCachedPleromaAccount(accountCache, account.acct);
		return cached ? adaptPleromaAccount(cached) : account;
	};

	const postForRebuild = (post: AccountBackedPost): RebuildPost => {
		const account = cachedAccountView(post.account);
		const booster = cachedAccountView(post.rebloggedBy);

		return {
			id: post.id,
			actionStatusId: post.actionStatusId,
			threadStatusId: post.threadStatusId,
			visibility: post.visibility,
			name: account?.displayName ?? post.name,
			nameEmojis: account?.emojis ?? post.nameEmojis,
			handle: account?.handle ?? post.handle,
			time: post.time,
			avClass: avatarClass(post.avatar),
			avatarUrl: account?.avatarUrl ?? post.avatarUrl,
			cw: post.cw,
			body: post.body,
			bodyEmojis: post.bodyEmojis,
			media: post.media,
			attachments: post.attachments,
			addressees: post.addressees,
			boostedBy: post.boostedBy ? {
				name: booster?.displayName ?? post.boostedBy.name,
				handle: booster?.handle ?? post.boostedBy.handle,
				time: post.boostedBy.time,
				avClass: post.boostedBy.avatar ? avatarClass(post.boostedBy.avatar) : undefined,
				avatarUrl: booster?.avatarUrl ?? post.boostedBy.avatarUrl
			} : undefined,
			copyJson: post.copyJson,
			quotedPost: post.quotedPost,
			replies: post.replies,
			boosts: post.boosts,
			favs: post.favorites,
			actions: {
				reply: post.actions.reply,
				boost: post.actions.boost,
				fav: post.actions.favorite,
			},
		};
	};
	const threadFullTime = (createdAt: string) => {
		const date = new Date(createdAt);
		if (Number.isNaN(date.getTime())) return '';

		const time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(date);
		const day = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
		return `${time} · ${day}`;
	};
	const threadPostForRebuild = (post: PleromaStatusView): ThreadViewPost => ({
		...postForRebuild(post),
		fullTime: threadFullTime(post.createdAt),
		source: post.applicationName ?? 'Pleroma',
		views: null
	});
	const profilePostForRebuild = (post: PleromaStatusView): ProfilePost => postForRebuild(post);
	const profileMediaItem = (attachment: PleromaStatusView['mediaAttachments'][number]): ProfileMediaItem | null => {
		const type = attachment.type.toLowerCase();
		if (type === 'image' || type === 'photo') return { kind: 'photo', src: attachment.previewUrl ?? attachment.url, alt: attachment.description ?? undefined };
		if (type === 'video' || type === 'gifv') return { kind: 'video', src: attachment.previewUrl ?? attachment.url, alt: attachment.description ?? undefined, title: attachment.description ?? attachment.filename ?? 'video' };
		if (type === 'audio') return { kind: 'audio', title: attachment.description ?? attachment.filename ?? 'audio' };
		return null;
	};
	const profileMediaItems = (posts: PleromaStatusView[]): ProfileMediaItem[] => posts
		.filter((post) => !post.mediaHidden && !post.hasContentWarning)
		.flatMap((post) => post.mediaAttachments.map(profileMediaItem))
		.filter((item): item is ProfileMediaItem => item !== null);
	const profileLockedForViewer = (profile: { relations: { locked: boolean }; followState: string }) =>
		profile.relations.locked && !['mutual', 'following', 'self'].includes(profile.followState);
	const emptyProfileData = (profile: ProfileData['profile']): ProfileData => ({ profile, posts: [], replies: [], pinned: [], media: [] });
	const threadRepliesForRebuild = (focusedStatusId: string, descendants: PleromaStatusView[]) => {
		const posts: ThreadViewPost[] = descendants.map((post) => ({ ...threadPostForRebuild(post), nestedReplies: [] }));
		const byId = new Map(posts.map((post) => [String(post.id), post]));
		const roots: ThreadViewPost[] = [];

		descendants.forEach((status, index) => {
			const post = posts[index];
			const parent = status.inReplyToId ? byId.get(status.inReplyToId) : null;
			if (parent && status.inReplyToId !== focusedStatusId) {
				parent.nestedReplies = [...(parent.nestedReplies ?? []), post];
				return;
			}

			roots.push(post);
		});

		return roots;
	};
	const threadPostCount = (posts: ThreadViewPost[]): number => posts.reduce((total, post) => total + 1 + threadPostCount(post.nestedReplies ?? []), 0);
	const actionStateKey = (key: StatusActionKey) => key === 'fav' ? 'favorite' : 'boost';
	const statusActionPendingKey = (targetId: string, key: StatusActionKey) => `${targetId}:${key}`;
	const statusActionOriginRequestId = (originRoute: StatusActionOrigin) =>
		originRoute === 'home' ? homeTimelineRequestId :
		originRoute === 'thread' ? threadRequestId :
		profileRouteRequestId;
	const statusActionOriginActive = (origin: StatusActionOriginSnapshot) =>
		origin.route === 'home'
			? route === 'home' && homeTimelineRequestId === origin.requestId
			: origin.route === 'thread'
				? route === 'thread' && threadRequestId === origin.requestId
				: route === 'profile' && profileRouteRequestId === origin.requestId;
	const statusActionTargetId = (post: { id?: string | number; actionStatusId?: string }) => String(post.actionStatusId ?? post.id ?? '');
	const statusReplyTargetId = (post: { id?: string | number; actionStatusId?: string; threadStatusId?: string }) => String(post.threadStatusId ?? post.actionStatusId ?? post.id ?? '');
	const inlineReplyTargetHandle = (handle = '') => {
		const normalized = handle.startsWith('@') ? handle.slice(1) : handle;
		const local = normalized.split('@').filter(Boolean)[0] ?? normalized;
		return `@${local || 'user'}`;
	};
	const matchesStatusActionTarget = (post: { id?: string | number; actionStatusId?: string }, targetId: string) => statusActionTargetId(post) === targetId;
	const matchesStatusReplyTarget = (post: { id?: string | number; actionStatusId?: string; threadStatusId?: string }, targetId: string) => statusReplyTargetId(post) === targetId;
	const statusViewActionValue = (post: PleromaStatusView, key: StatusActionKey): StatusActionValue =>
		key === 'fav'
			? { active: post.actions.favorite, count: post.favorites }
			: { active: post.actions.boost, count: post.boosts };
	const rebuildPostActionValue = (post: RebuildPost, key: StatusActionKey): StatusActionValue =>
		key === 'fav'
			? { active: post.actions.fav, count: post.favs }
			: { active: post.actions.boost, count: post.boosts };
	const setStatusViewAction = <PostType extends PleromaStatusView>(post: PostType, key: StatusActionKey, value: StatusActionValue): PostType => {
		const actionKey = actionStateKey(key);
		return {
			...post,
			boosts: key === 'boost' ? value.count : post.boosts,
			favorites: key === 'fav' ? value.count : post.favorites,
			actions: { ...post.actions, [actionKey]: value.active }
		};
	};
	const setRebuildPostAction = <PostType extends RebuildPost>(post: PostType, key: StatusActionKey, value: StatusActionValue): PostType => ({
		...post,
		boosts: key === 'boost' ? value.count : post.boosts,
		favs: key === 'fav' ? value.count : post.favs,
		actions: { ...post.actions, [key]: value.active }
	});
	const updateRebuildPostsByActionTarget = <PostType extends RebuildPost & { nestedReplies?: PostType[] }>(posts: PostType[], targetId: string, update: (post: PostType) => PostType): PostType[] =>
		posts.map((post) => {
			const updated = matchesStatusActionTarget(post, targetId) ? update(post) : post;

			return updated.nestedReplies ? { ...updated, nestedReplies: updateRebuildPostsByActionTarget(updated.nestedReplies, targetId, update) } : updated;
		});
	const updateStatusViewsByActionTarget = (posts: PleromaStatusView[], targetId: string, update: (post: PleromaStatusView) => PleromaStatusView) =>
		posts.map((post) => matchesStatusActionTarget(post, targetId) ? update(post) : post);
	const updateProfilePostsByActionTarget = (posts: ProfilePost[], targetId: string, update: (post: ProfilePost) => ProfilePost) =>
		posts.map((post) => matchesStatusActionTarget(post, targetId) ? update(post) : post);
	const updateRebuildPostsByReplyTarget = <PostType extends RebuildPost & { nestedReplies?: PostType[] }>(posts: PostType[], targetId: string, update: (post: PostType) => PostType): PostType[] =>
		posts.map((post) => {
			const updated = matchesStatusReplyTarget(post, targetId) ? update(post) : post;

			return updated.nestedReplies ? { ...updated, nestedReplies: updateRebuildPostsByReplyTarget(updated.nestedReplies, targetId, update) } : updated;
		});
	const updateStatusViewsByReplyTarget = (posts: PleromaStatusView[], targetId: string, update: (post: PleromaStatusView) => PleromaStatusView) =>
		posts.map((post) => matchesStatusReplyTarget(post, targetId) ? update(post) : post);
	const updateProfilePostsByReplyTarget = (posts: ProfilePost[], targetId: string, update: (post: ProfilePost) => ProfilePost) =>
		posts.map((post) => matchesStatusReplyTarget(post, targetId) ? update(post) : post);
	const profileHrefForAccount = (account: { acct: string }) => `/app/profiles/${encodeURIComponent(account.acct)}`;
	const searchUrl = (query: string, tab: SearchTab = 'all') => {
		const params = new URLSearchParams();
		const trimmed = query.trim();
		if (trimmed) params.set('q', trimmed);
		if (tab !== 'all') params.set('tab', tab);
		const queryString = params.toString();
		return queryString ? `/app/search?${queryString}` : '/app/search';
	};
	const submitSearch = (query: string, tab: SearchTab = 'all') => {
		const trimmed = query.trim();
		if (!trimmed) return;
		goto(searchUrl(trimmed, tab));
	};
	const incrementStatusViewReplies = <PostType extends PleromaStatusView>(post: PostType): PostType => ({ ...post, replies: post.replies + 1 });
	const incrementRebuildPostReplies = <PostType extends RebuildPost>(post: PostType): PostType => ({ ...post, replies: post.replies + 1 });
	const findPostInList = <PostType extends RebuildPost & { nestedReplies?: PostType[] }>(posts: PostType[], postId: string | number): PostType | null => {
		for (const post of posts) {
			if (String(post.id) === String(postId)) return post;
			const nested = post.nestedReplies ? findPostInList(post.nestedReplies, postId) : null;
			if (nested) return nested;
		}

		return null;
	};
	const findThreadPost = (postId: string | number) => {
		if (threadState.status !== 'success') return null;
		if (String(threadState.focused.id) === String(postId)) return threadState.focused;
		return findPostInList([...threadState.ancestors, ...threadState.replies], postId);
	};
	const showThreadReplyNested = (postId: string | number | undefined) => {
		if (postId == null) return;
		expandedThreadReplyIds = { ...expandedThreadReplyIds, [String(postId)]: true };
	};
	const expandThreadReplyPath = (postId: string) => {
		if (threadState.status !== 'success') return;

		const nextExpanded = { ...expandedThreadReplyIds };
		const expandIn = (posts: ThreadViewPost[]): boolean => {
			for (const post of posts) {
				if (String(post.id) === postId) {
					nextExpanded[String(post.id)] = true;
					return true;
				}

				if (post.nestedReplies && expandIn(post.nestedReplies)) {
					nextExpanded[String(post.id)] = true;
					return true;
				}
			}

			return false;
		};

		if (expandIn(threadState.ancestors) || expandIn(threadState.replies)) expandedThreadReplyIds = nextExpanded;
	};
	const applyStatusActionUpdate = (scope: StatusActionScope, targetId: string, statusUpdate: <PostType extends PleromaStatusView>(post: PostType) => PostType, rebuildUpdate: <PostType extends RebuildPost>(post: PostType) => PostType) => {
		if (scope === 'home' || scope === 'all') {
			localHomePosts = updateRebuildPostsByActionTarget(localHomePosts, targetId, rebuildUpdate);
		}
		if ((scope === 'home' || scope === 'all') && homeTimelineState.status === 'success') {
			homeTimelineState = {
				...homeTimelineState,
				data: updateStatusViewsByActionTarget(homeTimelineState.data, targetId, statusUpdate),
				newerPosts: updateStatusViewsByActionTarget(homeTimelineState.newerPosts, targetId, statusUpdate)
			};
		}
		if ((scope === 'thread' || scope === 'all') && threadState.status === 'success') {
			threadState = {
				...threadState,
				focused: matchesStatusActionTarget(threadState.focused, targetId) ? rebuildUpdate(threadState.focused) : threadState.focused,
				ancestors: updateRebuildPostsByActionTarget(threadState.ancestors, targetId, rebuildUpdate),
				replies: updateRebuildPostsByActionTarget(threadState.replies, targetId, rebuildUpdate)
			};
		}
		if ((scope === 'profile' || scope === 'all') && profileRouteState.status === 'success') {
			profileRouteState = {
				...profileRouteState,
				data: {
					...profileRouteState.data,
					posts: updateProfilePostsByActionTarget(profileRouteState.data.posts, targetId, rebuildUpdate),
					replies: updateProfilePostsByActionTarget(profileRouteState.data.replies, targetId, rebuildUpdate),
					pinned: updateProfilePostsByActionTarget(profileRouteState.data.pinned, targetId, rebuildUpdate)
				}
			};
		}
	};
	const applyReplyCountUpdate = (targetId: string) => {
		localHomePosts = updateRebuildPostsByReplyTarget(localHomePosts, targetId, incrementRebuildPostReplies);
		if (homeTimelineState.status === 'success') {
			homeTimelineState = {
				...homeTimelineState,
				data: updateStatusViewsByReplyTarget(homeTimelineState.data, targetId, incrementStatusViewReplies),
				newerPosts: updateStatusViewsByReplyTarget(homeTimelineState.newerPosts, targetId, incrementStatusViewReplies)
			};
		}
		if (threadState.status === 'success') {
			threadState = {
				...threadState,
				focused: matchesStatusReplyTarget(threadState.focused, targetId) ? incrementRebuildPostReplies(threadState.focused) : threadState.focused,
				ancestors: updateRebuildPostsByReplyTarget(threadState.ancestors, targetId, incrementRebuildPostReplies),
				replies: updateRebuildPostsByReplyTarget(threadState.replies, targetId, incrementRebuildPostReplies)
			};
		}
		if (profileRouteState.status === 'success') {
			profileRouteState = {
				...profileRouteState,
				data: {
					...profileRouteState.data,
					posts: updateProfilePostsByReplyTarget(profileRouteState.data.posts, targetId, incrementRebuildPostReplies),
					replies: updateProfilePostsByReplyTarget(profileRouteState.data.replies, targetId, incrementRebuildPostReplies),
					pinned: updateProfilePostsByReplyTarget(profileRouteState.data.pinned, targetId, incrementRebuildPostReplies)
				}
			};
		}
	};
	const insertNestedThreadReply = (posts: ThreadViewPost[], parentId: string, reply: ThreadViewPost[]): ThreadViewPost[] =>
		posts.map((post) => {
			if (String(post.id) === parentId) return { ...post, nestedReplies: [...(post.nestedReplies ?? []), ...reply] };

			return post.nestedReplies ? { ...post, nestedReplies: insertNestedThreadReply(post.nestedReplies, parentId, reply) } : post;
		});
	const insertThreadReply = (parentId: string, status: PleromaStatus) => {
		if (threadState.status !== 'success') return;

		upsertAccountCache(accountsFromPleromaStatus(status));
		const reply = [{ ...threadPostForRebuild(adaptPleromaStatus(status)), nestedReplies: [] }];
		threadState = String(threadState.focused.id) === parentId
			? { ...threadState, replies: [...threadState.replies, ...reply] }
			: {
				...threadState,
				ancestors: insertNestedThreadReply(threadState.ancestors, parentId, reply),
				replies: insertNestedThreadReply(threadState.replies, parentId, reply)
			};
		if (String(threadState.focused.id) !== parentId) expandThreadReplyPath(parentId);
	};
	const clearStatusActionPending = (pendingKey: string, requestId: number) => {
		if (statusActionPending[pendingKey] !== requestId) return;
		const { [pendingKey]: _cleared, ...rest } = statusActionPending;
		statusActionPending = rest;
	};
	const mutateStatusAction = (targetId: string, key: StatusActionKey, previous: StatusActionValue, originRoute: StatusActionOrigin) => {
		const session = currentSession;
		if (!session) return;
		const pendingKey = statusActionPendingKey(targetId, key);
		if (statusActionPending[pendingKey]) return;

		const requestSessionKey = sessionKey(session);
		const origin = { route: originRoute, requestId: statusActionOriginRequestId(originRoute) };
		const requestId = statusActionRequestId + 1;
		statusActionRequestId = requestId;
		statusActionPending = { ...statusActionPending, [pendingKey]: requestId };
		removeStatusActionError(targetId, key);
		const optimistic = { active: !previous.active, count: previous.count };
		applyStatusActionUpdate(originRoute, targetId, (post) => setStatusViewAction(post, key, optimistic), (post) => setRebuildPostAction(post, key, optimistic));

		void (async () => {
			try {
				const client = createPleromaClient({
					instanceUrl: session.instanceUrl,
					accessToken: session.accessToken,
					fetch: window.fetch.bind(window)
				});
				const status = key === 'fav'
					? previous.active ? await client.unfavoriteStatus(targetId) : await client.favoriteStatus(targetId)
					: previous.active ? await client.unboostStatus(targetId) : await client.boostStatus(targetId);
				if (!isCurrentSessionRequest(requestSessionKey)) return;
				if (statusActionPending[pendingKey] !== requestId) return;

				upsertAccountCache(accountsFromPleromaStatus(status));
				const serverPost = adaptPleromaStatus(status);
				const reconciled = statusViewActionValue(serverPost, key);
				applyStatusActionUpdate('all', targetId, (post) => setStatusViewAction(post, key, reconciled), (post) => setRebuildPostAction(post, key, reconciled));
				clearStatusActionPending(pendingKey, requestId);
			} catch (error) {
				if (!isCurrentSessionRequest(requestSessionKey)) return;
				if (statusActionPending[pendingKey] !== requestId) return;

				const normalized = normalizePleromaRequestError(error);
				if (normalized.reauthRequired) {
					clearStatusActionPending(pendingKey, requestId);
					signOutPleroma(localStorage);
					redirectToLanding();
					return;
				}

				clearStatusActionPending(pendingKey, requestId);
				if (!statusActionOriginActive(origin)) return;

				applyStatusActionUpdate(origin.route, targetId, (post) => setStatusViewAction(post, key, previous), (post) => setRebuildPostAction(post, key, previous));
				addStatusActionError({ targetId, key, route: origin.route, error: normalized });
			}
		})();
	};
	const openThread = (post: { id: string | number; actionStatusId?: string; threadStatusId?: string }) => {
		const statusId = post.threadStatusId ?? post.actionStatusId ?? String(post.id);
		goto(`/app/thread/${encodeURIComponent(statusId)}`);
	};
	const route = $derived<AppRoute>(
		page.url.pathname.startsWith('/app/search') ? 'search' :
		page.url.pathname.startsWith('/app/explore') ? 'explore' :
		page.url.pathname.startsWith('/app/settings') ? 'settings' :
		page.url.pathname.startsWith('/app/local') ? 'local' :
		page.url.pathname.startsWith('/app/federated') ? 'federated' :
		page.url.pathname.startsWith('/app/public') ? 'public' :
		page.url.pathname.startsWith('/app/thread') ? 'thread' :
		page.url.pathname.startsWith('/app/profiles') ? 'profile' :
		page.url.pathname.startsWith('/app/notifications') ? 'notifications' :
		'home'
	);
	const searchShell = $derived(route === 'search');
	const threadStatusId = $derived(route === 'thread' ? decodeURIComponent(page.url.pathname.split('/').filter(Boolean).slice(2).join('/') || '') : '');
	const profileRouteHandle = $derived(route === 'profile' ? decodeURIComponent(page.url.pathname.split('/').filter(Boolean).slice(2).join('/') || '') : '');
	const searchQuery = $derived(route === 'search' ? (page.url.searchParams.get('q') ?? '').trim() : '');
	const searchTab = $derived<SearchTab>(
		page.url.searchParams.get('tab') === 'people' ? 'people' :
		page.url.searchParams.get('tab') === 'posts' ? 'posts' :
		'all'
	);
	const composerRemaining = $derived(composerCharacterLimit - composerText.length);
	const inlineReplyRemaining = $derived(composerCharacterLimit - inlineReplyDraft.length);
	const preparedComposerPoll = $derived(composerPoll ? composerPollPayload(composerPoll) : undefined);
	const preparedInlineReplyPoll = $derived(inlineReplyPoll ? composerPollPayload(inlineReplyPoll) : undefined);
	const composerUploadedMediaIds = $derived(getComposerUploadedMediaIds(composerUploads));
	const composerUploadsPending = $derived(hasComposerUploadsPending(composerUploads));
	const inlineReplyUploadedMediaIds = $derived(getComposerUploadedMediaIds(inlineReplyUploads));
	const inlineReplyUploadsPending = $derived(hasComposerUploadsPending(inlineReplyUploads));
	const composerHasPostContent = $derived(Boolean(composerText.trim()) || composerUploadedMediaIds.length > 0);
	const canSubmitHomePost = $derived(composerHasPostContent && composerRemaining >= 0 && (!composerPoll || Boolean(preparedComposerPoll)) && !composerUploadsPending && homePostSubmitState !== 'submitting');
	const timelinePosts = $derived([
		...localHomePosts,
		...(homeTimelineState.status === 'success' ? homeTimelineState.data.map(postForRebuild) : [])
	]);
	const profileBioCount = $derived(`${profile.bio.length} / 160`);
	const threadReplyPosts = $derived(threadState.status === 'success' ? threadState.replies : []);
	const threadReplyCount = $derived(threadState.status === 'success' ? threadPostCount(threadState.replies) : 0);
	const sortedThreadReplyPosts = $derived(replySort === 'newest' ? [...threadReplyPosts].reverse() : threadReplyPosts);
	const exploreFeedText = $derived(
		exploreFeed === 'popular' ? 'Popular across friendly instances' :
		exploreFeed === 'new' ? 'Fresh instance dispatches' :
		'Most replied threads'
	);
	const searchAccounts = $derived(searchState.status === 'success' ? searchState.accounts : []);
	const searchPosts = $derived(searchState.status === 'success' ? searchState.posts : []);
	const visibleSearchAccounts = $derived(searchTab === 'posts' ? [] : searchAccounts);
	const visibleSearchPosts = $derived(searchTab === 'people' ? [] : searchPosts);
	const searchResultTotal = $derived(searchAccounts.length + searchPosts.length);
	const visibleSearchResultTotal = $derived(visibleSearchAccounts.length + visibleSearchPosts.length);
	const headerSearchAccounts = $derived(headerSearchState.status === 'success' ? headerSearchState.accounts.slice(0, 3) : []);
	const headerSearchPosts = $derived(headerSearchState.status === 'success' ? headerSearchState.posts.slice(0, 3) : []);
	const headerSearchResultTotal = $derived(headerSearchState.status === 'success' ? headerSearchState.accounts.length + headerSearchState.posts.length : 0);
	const headerSearchSelectableItems = $derived<HeaderSearchSelectableItem[]>(
		!headerSearchDraft.trim()
			? searchRecents.map((query) => ({ kind: 'recent', query }))
			: [
				...headerSearchAccounts.map((account) => ({ kind: 'account' as const, account })),
				...headerSearchPosts.map((post) => ({ kind: 'post' as const, post }))
			]
	);
	const headerSearchActiveDescendant = $derived(headerSearchSelectedIndex >= 0 && headerSearchSelectableItems[headerSearchSelectedIndex] ? `header-search-option-${headerSearchSelectedIndex}` : undefined);
	const placeholderHeading = $derived(
		route === 'public' ? 'Public timeline' :
		route === 'local' ? 'Local timeline' :
		route === 'federated' ? 'Federated timeline' :
		route === 'thread' ? 'Thread' :
		route === 'profile' ? 'quiet admin' :
		route === 'notifications' ? 'Notifications' :
		''
	);

	const isActive = (item: NavItem) => item.route === route;
	const isTimelineRoute = (value: AppRoute) => timelineRoutes.includes(value);
	const numberFormatter = new Intl.NumberFormat('en-US');
	const compactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
	const compactString = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
	const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object');
	const nonNegativeInteger = (value: unknown) => {
		const parsed = typeof value === 'string' && value.trim() ? Number(value) : value;
		return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
	};
	const positiveInteger = (value: unknown) => {
		const parsed = nonNegativeInteger(value);
		return parsed && parsed > 0 ? parsed : null;
	};
	const explicitStatusCharacterLimit = (instance: PleromaInstance) => {
		const configuration = isRecord(instance.configuration) ? instance.configuration : null;
		const statuses = isRecord(configuration?.statuses) ? configuration.statuses : null;
		const pleroma = isRecord(instance.pleroma) ? instance.pleroma : null;
		const metadata = isRecord(pleroma?.metadata) ? pleroma.metadata : null;

		return positiveInteger(statuses?.max_characters)
			?? positiveInteger(instance.max_toot_chars)
			?? positiveInteger(metadata?.max_toot_chars);
	};
	const trendUses = (tag: PleromaTag) => (tag.history ?? []).reduce((total, history) => total + (positiveInteger(history.uses) ?? 0), 0);
	const adaptTrendTags = (tags: PleromaTag[]): TrendView[] => tags
		.map((tag) => {
			const name = compactString(tag.name);
			return name ? { tag, name } : null;
		})
		.filter((tag): tag is { tag: PleromaTag; name: string } => Boolean(tag))
		.map(({ tag, name }, index) => {
			const uses = trendUses(tag);
			return {
				rank: index + 1,
				tag: `#${name.replace(/^#/, '')}`,
				count: uses > 0 ? `${numberFormatter.format(uses)} ${uses === 1 ? 'post' : 'posts'}` : null
			};
		});
	const instanceFeatures = (instance: PleromaInstance) => {
		const pleroma = isRecord(instance.pleroma) ? instance.pleroma : null;
		const metadata = isRecord(pleroma?.metadata) ? pleroma.metadata : null;
		const features = metadata?.features;

		return Array.isArray(features) ? features.filter((feature) => typeof feature === 'string' && feature.trim()).length : 0;
	};
	const adaptInstanceStatus = (instance: PleromaInstance): InstanceStatusView | null => {
		const title = compactString(instance.title);
		const domain = compactString(instance.domain);
		const activeUsers = nonNegativeInteger(instance.usage?.users?.active_month);
		const characterLimit = explicitStatusCharacterLimit(instance);
		const featureCount = instanceFeatures(instance);
		const rows: InstanceStatusView['rows'] = [];

		if (activeUsers !== null) rows.push({ label: 'Users', value: `${numberFormatter.format(activeUsers)} active/mo` });
		if (characterLimit) rows.push({ label: 'Status limit', value: `${numberFormatter.format(characterLimit)} chars` });
		if (featureCount > 0) rows.push({ label: 'Features', value: `${numberFormatter.format(featureCount)} ${featureCount === 1 ? 'feature' : 'features'}` });

		return title || domain || rows.length > 0 ? { title, domain, rows } : null;
	};
	const updateProfile = <Key extends keyof ProfileSettings>(key: Key, value: ProfileSettings[Key]) => {
		profile = { ...profile, [key]: value };
		settingsSaveState = 'Unsaved changes';
	};
	const saveProfile = () => {
		savedProfile = { ...profile };
		settingsSaveState = 'Saved just now';
	};
	const resetProfile = () => {
		profile = { ...savedProfile };
		settingsSaveState = 'Saved';
	};
	const queueUploadFiles = (files: FileList | File[], uploads: ComposerUpload[], updateUploads: (updater: (uploads: ComposerUpload[]) => ComposerUpload[]) => void, isStillCurrent: () => boolean = () => true) => {
		const session = currentSession;
		if (!session) return;
		const incoming = Array.from(files).filter((file) => file.size > 0);
		const usedSlots = uploads.filter((upload) => upload.status !== 'error').length;
		const slots = Math.max(0, COMPOSER_MAX_UPLOADS - usedSlots);
		const rejected: ComposerUpload[] = [];
		const accepted: File[] = [];
		for (const file of incoming) {
			if (!isComposerUploadType(file)) rejected.push(composerUploadError(file, `Could not attach ${file.name} · only photos, audio, and video.`));
			else if (file.size > COMPOSER_MAX_UPLOAD_BYTES) rejected.push(composerUploadError(file, `Could not attach ${file.name} · 40 MB limit per file.`));
			else if (accepted.length >= slots) rejected.push(composerUploadError(file, `Could not attach ${file.name} · 8 file limit.`));
			else accepted.push(file);
		}
		if (rejected.length > 0) updateUploads((current) => [...current, ...rejected]);
		if (accepted.length === 0) return;
		const requestSessionKey = sessionKey(session);
		const additions = accepted.map((file, index): ComposerUpload => ({
			localId: `${Date.now()}-${index}-${file.name}`,
			name: file.name,
			kind: composerUploadKind(file),
			progress: 5,
			status: 'uploading'
		}));
		updateUploads((current) => [...current, ...additions]);
		void accepted.forEach((file, index) => {
			const localId = additions[index].localId;
			void (async () => {
				try {
					const client = createPleromaClient({ instanceUrl: session.instanceUrl, accessToken: session.accessToken, fetch: window.fetch.bind(window) });
					const media = await client.uploadMedia(file);
					if (!isCurrentSessionRequest(requestSessionKey) || !isStillCurrent()) return;
					updateUploads((current) => current.map((upload) => upload.localId === localId ? { localId: upload.localId, name: upload.name, kind: upload.kind, progress: 100, status: 'uploaded', media } : upload));
				} catch (error) {
					if (!isCurrentSessionRequest(requestSessionKey) || !isStillCurrent()) return;
					const normalized = normalizePleromaRequestError(error);
					updateUploads((current) => current.map((upload) => upload.localId === localId ? { localId: upload.localId, name: upload.name, kind: upload.kind, progress: 0, status: 'error', error: normalized.message } : upload));
				}
			})();
		});
	};
	const updateComposerUploads = (updater: (uploads: ComposerUpload[]) => ComposerUpload[]) => {
		composerUploads = updater(composerUploads);
	};
	const updateInlineReplyUploads = (updater: (uploads: ComposerUpload[]) => ComposerUpload[]) => {
		inlineReplyUploads = updater(inlineReplyUploads);
	};
	const queueComposerFiles = (files: FileList | File[]) => queueUploadFiles(files, composerUploads, updateComposerUploads);
	const queueInlineReplyFiles = (files: FileList | File[]) => {
		const target = inlineReplyTarget;
		if (!target) return;
		const targetRequestId = inlineReplyRequestId;
		queueUploadFiles(files, inlineReplyUploads, updateInlineReplyUploads, () => inlineReplyRequestId === targetRequestId && inlineReplyTarget?.targetId === target.targetId && inlineReplyTarget?.route === target.route);
	};
	const removeComposerUpload = (localId: string) => {
		composerUploads = composerUploads.filter((upload) => upload.localId !== localId);
	};
	const removeInlineReplyUpload = (localId: string) => {
		inlineReplyUploads = inlineReplyUploads.filter((upload) => upload.localId !== localId);
	};
	const pickComposerFiles = () => composerFileInput?.click();
	const handleComposerFileChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		if (input.files) queueComposerFiles(input.files);
		input.value = '';
	};
	const handleComposerDragOver = (event: DragEvent) => {
		if (!event.dataTransfer?.types.includes('Files')) return;
		event.preventDefault();
		composerDragActive = true;
		composerDragCount = Math.max(1, event.dataTransfer.items.length || event.dataTransfer.files.length || 1);
	};
	const handleComposerDrop = (event: DragEvent) => {
		if (!event.dataTransfer?.files.length) return;
		event.preventDefault();
		composerDragActive = false;
		composerDragCount = 0;
		queueComposerFiles(event.dataTransfer.files);
	};
	const handleComposerPaste = (event: ClipboardEvent) => {
		const files = Array.from(event.clipboardData?.files ?? []);
		if (files.length === 0) return;
		event.preventDefault();
		queueComposerFiles(files);
	};
	const toggleCommunity = (community: string) => {
		joinedCommunities = { ...joinedCommunities, [community]: !joinedCommunities[community] };
	};
	const submitHomePost = async () => {
		const body = composerText.trim();
		const spoilerText = composerSpoilerActive ? composerSpoilerText.trim() : '';
		const pollPayload = composerPoll ? preparedComposerPoll : undefined;
		const poll = pollPayload ?? undefined;
		const session = currentSession;
		if ((!body && composerUploadedMediaIds.length === 0) || composerText.length > composerCharacterLimit || (composerPoll && !pollPayload) || composerUploadsPending || homePostSubmitState === 'submitting' || !session) return;

		const requestSessionKey = sessionKey(session);
		const requestId = homePostSubmitRequestId + 1;
		homePostSubmitRequestId = requestId;
		homePostSubmitState = 'submitting';
		homePostSubmitError = null;

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const status = await client.createStatus({ status: body, visibility: 'public', spoilerText: spoilerText || undefined, poll, mediaIds: composerUploadedMediaIds });
			if (requestId !== homePostSubmitRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			upsertAccountCache(accountsFromPleromaStatus(status));
			const createdPost = adaptPleromaStatus(status, { timelines: ['home'] });
			homeTimelineFallbackSinceId = String(createdPost.id);
			if (homeTimelineState.status === 'success') {
				homeTimelineState = {
					...homeTimelineState,
					data: prependTimelineItems(homeTimelineState.data, [createdPost]),
					newerPosts: homeTimelineState.newerPosts.filter((post) => post.id !== createdPost.id)
				};
			} else if (homeTimelineState.status === 'empty') {
				homeTimelineState = {
					status: 'success',
					data: [createdPost],
					nextCursor: null,
					loadMoreStatus: 'idle',
					newerPosts: [],
					newPostsStatus: 'idle'
				};
			} else {
				localHomePosts = prependTimelineItems(localHomePosts, [postForRebuild(createdPost)]);
			}
			composerText = '';
			composerSpoilerActive = false;
			composerSpoilerText = '';
			composerPoll = null;
			composerUploads = [];
			homePostSubmitState = 'idle';
		} catch (error) {
			if (requestId !== homePostSubmitRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			const normalized = normalizePleromaRequestError(error);
			if (normalized.reauthRequired) {
				signOutPleroma(localStorage);
				redirectToLanding();
				return;
			}

			homePostSubmitError = normalized;
			homePostSubmitState = 'idle';
		}
	};
	const clearComposerSpoiler = () => {
		composerSpoilerActive = false;
		composerSpoilerText = '';
	};
	const toggleComposerSpoiler = () => {
		if (composerSpoilerActive) {
			clearComposerSpoiler();
			return;
		}

		composerSpoilerActive = true;
	};
	const toggleComposerPoll = () => {
		composerPoll = composerPoll ? null : createComposerPollDraft();
	};
	const openInlineReply = (post: RebuildPost, targetRoute: StatusActionOrigin) => {
		if (inlineReplySubmitState === 'submitting') return;

		const targetId = statusReplyTargetId(post);
		if (!targetId) return;

		const nextTarget = {
			route: targetRoute,
			targetId,
			renderId: String(post.id),
			handle: inlineReplyTargetHandle(post.handle),
			visibility: post.visibility ?? 'public',
			name: post.name,
			avClass: post.avClass,
			avBanner: post.avBanner,
			avatarUrl: post.avatarUrl
		};
		const sameTarget = inlineReplyTarget?.route === nextTarget.route && inlineReplyTarget.targetId === nextTarget.targetId && inlineReplyTarget.renderId === nextTarget.renderId;
		if (sameTarget) {
			clearInlineReply(targetRoute);
			return;
		}

		inlineReplyRequestId += 1;
		inlineReplyTarget = nextTarget;
		inlineReplySubmitState = 'idle';
		inlineReplySubmitError = null;
		inlineReplyDraft = '';
		inlineReplyUploads = [];
		inlineReplySpoilerActive = false;
		inlineReplySpoilerText = '';
		inlineReplyPoll = null;
	};
	const clearInlineReplySpoiler = () => {
		inlineReplySpoilerActive = false;
		inlineReplySpoilerText = '';
	};
	const toggleInlineReplySpoiler = () => {
		if (inlineReplySpoilerActive) {
			clearInlineReplySpoiler();
			return;
		}

		inlineReplySpoilerActive = true;
	};
	const toggleInlineReplyPoll = () => {
		inlineReplyPoll = inlineReplyPoll ? null : createComposerPollDraft();
	};
	const inlineReplyOpenFor = (targetRoute: StatusActionOrigin, post: { id?: string | number }) => inlineReplyTarget?.route === targetRoute && inlineReplyTarget.renderId === String(post.id);
	const inlineReplyComposerId = (targetRoute: StatusActionOrigin, post: { id?: string | number }) => {
		if (post.id == null) return undefined;
		return `${targetRoute}-inline-reply-${String(post.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
	};
	const submitInlineReply = async () => {
		const target = inlineReplyTarget;
		const body = inlineReplyDraft.trim();
		const spoilerText = inlineReplySpoilerActive ? inlineReplySpoilerText.trim() : '';
		const pollPayload = inlineReplyPoll ? preparedInlineReplyPoll : undefined;
		const poll = pollPayload ?? undefined;
		const session = currentSession;
		if (!target || (!body && inlineReplyUploadedMediaIds.length === 0) || inlineReplyRemaining < 0 || (inlineReplyPoll && !pollPayload) || inlineReplyUploadsPending || inlineReplySubmitState === 'submitting' || !session) return;

		const requestSessionKey = sessionKey(session);
		const requestId = inlineReplyRequestId + 1;
		inlineReplyRequestId = requestId;
		inlineReplySubmitState = 'submitting';
		inlineReplySubmitError = null;

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const status = await client.createStatus({ status: body, visibility: target.visibility, inReplyToId: target.targetId, spoilerText: spoilerText || undefined, poll, mediaIds: inlineReplyUploadedMediaIds });
			if (requestId !== inlineReplyRequestId || !isCurrentSessionRequest(requestSessionKey)) return;
			if (!inlineReplyTarget || inlineReplyTarget.route !== target.route || inlineReplyTarget.targetId !== target.targetId) return;

			upsertAccountCache(accountsFromPleromaStatus(status));
			applyReplyCountUpdate(target.targetId);
			if (target.route === 'thread') insertThreadReply(target.targetId, status);
			clearInlineReply();
		} catch (error) {
			if (requestId !== inlineReplyRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			const normalized = normalizePleromaRequestError(error);
			if (normalized.reauthRequired) {
				signOutPleroma(localStorage);
				redirectToLanding();
				return;
			}

			inlineReplySubmitError = normalized;
			inlineReplySubmitState = 'idle';
		}
	};
	const handlePostAction = (clickedPost: RebuildPost, key: string) => {
		if (key !== 'reply' && key !== 'boost' && key !== 'fav') return;
		if (key === 'reply') {
			openInlineReply(clickedPost, 'home');
			return;
		}

		const targetId = statusActionTargetId(clickedPost);
		if (targetId) mutateStatusAction(targetId, key, rebuildPostActionValue(clickedPost, key), 'home');
	};
	const handleThreadPostAction = (postId: string | number | undefined, key: string) => {
		if (postId == null || (key !== 'reply' && key !== 'boost' && key !== 'fav')) return;
		if (key === 'reply') {
			const post = findThreadPost(postId);
			if (post) openInlineReply(post, 'thread');
			return;
		}
		const post = findThreadPost(postId);
		const targetId = post ? statusActionTargetId(post) : '';
		if (post && targetId) mutateStatusAction(targetId, key, rebuildPostActionValue(post, key), 'thread');
	};
	const handleProfilePostAction = (post: ProfilePost, key: string) => {
		if (key !== 'reply' && key !== 'boost' && key !== 'fav') return;
		if (key === 'reply') {
			openThread(post);
			return;
		}

		const targetId = statusActionTargetId(post);
		if (targetId) mutateStatusAction(targetId, key, rebuildPostActionValue(post, key), 'profile');
	};
	const closeMobilePanels = () => {
		mobileDrawerOpen = false;
		mobileSheetOpen = false;
	};
	const applyTheme = (theme: ThemeName) => {
		document.documentElement.dataset.theme = theme;
		document.body.dataset.theme = theme;
		localStorage.setItem('pn-theme', theme);
		userMenuOpen = false;
	};
	const handleWindowKeydown = (event: KeyboardEvent) => {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			headerSearchInput?.focus();
			headerSearchInput?.select();
			return;
		}
		if (event.key !== 'Escape') return;
		userMenuOpen = false;
		notificationsMenuOpen = false;
		closeHeaderSearch();
		mobileDrawerOpen = false;
		mobileSheetOpen = false;
	};
	const redirectToLanding = () => {
		invalidateHomeTimelineRequests();
		invalidateThreadRequests();
		invalidateProfileRouteRequests();
		invalidateStatusActionRequests();
		invalidateNotificationRequests();
		invalidateSearchRequests();
		invalidateProfileAccountRequests();
		invalidateTrendsRequests();
		invalidateInstanceConfigRequests();
		invalidateComposerAutocompleteRequests();
		closeHomeTimelineStreaming();
		localHomePosts = [];
		resetAccountCache();
		loadedHomeTimelineKey = '';
		homeTimelineFallbackSinceId = null;
		currentSession = null;
		sessionReady = false;
		goto('/');
	};
	const readSessionOrRedirect = () => {
		const session = readPleromaSession(localStorage);
		if (!session) {
			redirectToLanding();
			return null;
		}

		if (sessionKey(currentSession) !== sessionKey(session)) {
			invalidateHomeTimelineRequests();
			invalidateThreadRequests();
			invalidateProfileRouteRequests();
			invalidateStatusActionRequests();
			invalidateNotificationRequests();
			invalidateSearchRequests();
			invalidateProfileAccountRequests();
			invalidateTrendsRequests();
			invalidateInstanceConfigRequests();
			invalidateComposerAutocompleteRequests();
			closeHomeTimelineStreaming();
			localHomePosts = [];
			resetAccountCache();
			if (session.account) accountCache = upsertPleromaAccounts(createPleromaAccountCache(), [session.account]);
			loadedHomeTimelineKey = '';
			homeTimelineFallbackSinceId = null;
			currentSession = session;
		}
		sessionReady = true;
		return session;
	};
	const loadProfileAccount = async (session: PleromaSession) => {
		const requestSessionKey = sessionKey(session);
		const requestId = profileAccountRequestId + 1;
		profileAccountRequestId = requestId;

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const account = await client.getOwnAccount();
			if (requestId !== profileAccountRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			upsertAccountCache([account]);
			const nextSession = { ...session, account };
			currentSession = nextSession;
			profileAccountLoadError = null;
			writePleromaSession(localStorage, nextSession);
		} catch (error) {
			profileAccountLoadError = normalizePleromaRequestError(error);
			// Profile data is best-effort; authenticated routes can still load with the token.
		}
	};
	const ensureProfileAccount = (session: PleromaSession) => {
		if (session.account) return;

		const requestSessionKey = sessionKey(session);
		if (loadedProfileAccountKey === requestSessionKey) return;

		loadedProfileAccountKey = requestSessionKey;
		void loadProfileAccount(session);
	};
	const loadTrends = async (session: PleromaSession) => {
		const requestSessionKey = sessionKey(session);
		const requestId = trendsRequestId + 1;
		trendsRequestId = requestId;
		trendsState = { status: 'loading' };

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const trends = adaptTrendTags(await client.getTrendingTags({ limit: 5 }));
			if (requestId !== trendsRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			trendsState = trends.length > 0 ? { status: 'success', data: trends } : { status: 'empty' };
		} catch (error) {
			if (requestId !== trendsRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			trendsState = { status: 'error', error: normalizePleromaRequestError(error) };
		}
	};
	const ensureTrends = (session: PleromaSession) => {
		const requestSessionKey = sessionKey(session);
		if (loadedTrendsKey === requestSessionKey) return;

		loadedTrendsKey = requestSessionKey;
		void loadTrends(session);
	};
	const loadInstanceConfig = async (session: PleromaSession) => {
		const requestSessionKey = sessionKey(session);
		const requestId = instanceConfigRequestId + 1;
		instanceConfigRequestId = requestId;
		instanceStatusState = { status: 'loading' };

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const instance = await client.getInstance();
			if (requestId !== instanceConfigRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			composerCharacterLimit = statusCharacterLimit(instance);
			const status = adaptInstanceStatus(instance);
			instanceStatusState = status ? { status: 'success', data: status } : { status: 'empty' };
		} catch (error) {
			if (requestId !== instanceConfigRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			// Character limits are best-effort; keep the conservative default if instance metadata is unavailable.
			instanceStatusState = { status: 'error', error: normalizePleromaRequestError(error) };
		}
	};
	const ensureInstanceConfig = (session: PleromaSession) => {
		const requestSessionKey = sessionKey(session);
		if (loadedInstanceConfigKey === requestSessionKey) return;

		loadedInstanceConfigKey = requestSessionKey;
		void loadInstanceConfig(session);
	};
	const composerMentionAccount = (account: PleromaStatus['account']): ComposerMentionAccount => {
		const view = adaptPleromaAccount(account);
		return {
			id: view.id,
			username: view.username,
			displayName: view.displayName,
			acct: view.acct,
			avatarUrl: view.avatarUrl,
			avClass: view.avatarUrl ? undefined : 'av-grad-3'
		};
	};
	const loadComposerCustomEmojis = async (session: PleromaSession) => {
		const requestSessionKey = sessionKey(session);
		const requestId = composerCustomEmojiRequestId + 1;
		composerCustomEmojiRequestId = requestId;

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const emojis = adaptCustomEmojis(await client.getCustomEmojis()).map((emoji) => ({
				shortcode: emoji.shortcode,
				url: emoji.url,
				staticUrl: emoji.staticUrl,
				pack: 'custom'
			}));
			if (requestId !== composerCustomEmojiRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			composerCustomEmojis = emojis;
		} catch {
			if (requestId !== composerCustomEmojiRequestId || !isCurrentSessionRequest(requestSessionKey)) return;
			composerCustomEmojis = [];
		}
	};
	const ensureComposerCustomEmojis = (session: PleromaSession) => {
		const requestSessionKey = sessionKey(session);
		if (loadedComposerCustomEmojiKey === requestSessionKey) return;

		loadedComposerCustomEmojiKey = requestSessionKey;
		void loadComposerCustomEmojis(session);
	};
	const followStateFromRelationship = (relationship: PleromaRelationship | undefined, accountId: string, currentAccountId?: string): PleromaProfileFollowState => {
		if (currentAccountId && accountId === currentAccountId) return 'self';
		if (!relationship) return 'stranger';
		if (relationship.blocking) return 'blocked';
		if (relationship.requested) return 'requested';
		if (relationship.following && relationship.followed_by) return 'mutual';
		if (relationship.following) return 'following';
		return 'stranger';
	};
	const searchFollowLabel = (followState: PleromaProfileFollowState) => (
		followState === 'self' ? 'You' :
		followState === 'mutual' ? 'Mutuals' :
		followState === 'following' ? 'Following' :
		followState === 'requested' ? 'Requested' :
		followState === 'blocked' ? 'Blocked' :
		'Follow'
	);
	const searchFollowIsFollowing = (followState: PleromaProfileFollowState) => ['following', 'mutual', 'requested'].includes(followState);
	const searchFollowDisabled = (account: SearchAccountView) => account.followState === 'self' || account.followState === 'blocked' || Boolean(searchFollowPending[account.id]);
	const adaptSearchAccount = (account: PleromaAccount, currentAccountId?: string, relationship: PleromaRelationship | undefined = account.pleroma.relationship): SearchAccountView => ({
		...adaptPleromaAccount(account),
		bio: htmlToPlainText(account.note ?? ''),
		followers: account.followers_count,
		posts: account.statuses_count,
		followState: followStateFromRelationship(relationship, account.id, currentAccountId)
	});
	const readSearchRecents = () => {
		try {
			const value = JSON.parse(localStorage.getItem(SEARCH_RECENTS_STORAGE_KEY) ?? '[]') as unknown;
			return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 8) : [];
		} catch {
			return [];
		}
	};
	const writeSearchRecents = (recents: string[]) => {
		searchRecents = recents;
		try {
			localStorage.setItem(SEARCH_RECENTS_STORAGE_KEY, JSON.stringify(recents));
		} catch {
			// Recents are a local convenience; storage failures should not block search.
		}
	};
	const rememberSearch = (query: string) => {
		const q = query.trim();
		if (!q) return;
		writeSearchRecents([q, ...searchRecents.filter((recent) => recent !== q)].slice(0, 8));
	};
	const removeSearchRecent = (query: string) => {
		headerSearchSelectedIndex = -1;
		writeSearchRecents(searchRecents.filter((recent) => recent !== query));
	};
	const clearSearchRecents = () => {
		headerSearchSelectedIndex = -1;
		writeSearchRecents([]);
	};
	const searchResultState = async (session: PleromaSession, query: string) => {
		const client = createPleromaClient({
			instanceUrl: session.instanceUrl,
			accessToken: session.accessToken,
			fetch: window.fetch.bind(window)
		});
		const result = await client.search({ q: query, limit: 20, resolve: true });
		upsertAccountCache([...result.accounts, ...accountsFromPleromaStatuses(result.statuses)]);
		const accountIds = result.accounts.map((account) => account.id);
		const relationshipById = new Map(
			accountIds.length > 0
				? (await client.getAccountRelationships(accountIds)).map((relationship) => [relationship.id, relationship] as const)
				: []
		);
		const currentAccountId = currentSession?.account?.id ?? session.account?.id;
		const accounts = result.accounts.map((account) => adaptSearchAccount(account, currentAccountId, relationshipById.get(account.id)));
		const posts = adaptPleromaStatuses(result.statuses, { timelines: ['home'] });

		return accounts.length + posts.length > 0
			? { status: 'success' as const, query, accounts, posts }
			: { status: 'empty' as const, query };
	};
	const loadSearch = async (session: PleromaSession, query: string) => {
		const q = query.trim();
		if (!q) {
			searchRequestId += 1;
			loadedSearchKey = '';
			searchState = { status: 'idle' };
			return;
		}

		const requestSessionKey = sessionKey(session);
		const requestId = searchRequestId + 1;
		searchRequestId = requestId;
		searchState = { status: 'loading', query: q };

		try {
			const nextState = await searchResultState(session, q);
			if (requestId !== searchRequestId || !isCurrentSessionRequest(requestSessionKey)) return;
			searchState = nextState;
		} catch (error) {
			if (requestId !== searchRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			const normalized = normalizePleromaRequestError(error);
			if (normalized.reauthRequired) {
				signOutPleroma(localStorage);
				redirectToLanding();
				return;
			}

			searchState = { status: 'error', query: q, error: normalized };
		}
	};
	const loadHeaderSearch = async (session: PleromaSession, query: string) => {
		const q = query.trim();
		if (!q) {
			headerSearchRequestId += 1;
			headerSearchState = { status: 'idle' };
			return;
		}

		const requestSessionKey = sessionKey(session);
		const requestId = headerSearchRequestId + 1;
		headerSearchRequestId = requestId;
		headerSearchState = { status: 'loading', query: q };

		try {
			const nextState = await searchResultState(session, q);
			if (requestId !== headerSearchRequestId || !isCurrentSessionRequest(requestSessionKey)) return;
			headerSearchState = nextState;
		} catch (error) {
			if (requestId !== headerSearchRequestId || !isCurrentSessionRequest(requestSessionKey)) return;
			headerSearchState = { status: 'error', query: q, error: normalizePleromaRequestError(error) };
		}
	};
	const ensureSearch = (session: PleromaSession, query: string) => {
		const q = query.trim();
		if (!q) {
			searchRequestId += 1;
			if (searchState.status !== 'idle') searchState = { status: 'idle' };
			loadedSearchKey = '';
			return;
		}

		const requestSessionKey = sessionKey(session);
		const viewerAccountId = currentSession?.account?.id ?? session.account?.id ?? '';
		const loadKey = `${requestSessionKey}\n${viewerAccountId}\n${q}`;
		if (loadedSearchKey === loadKey) return;

		loadedSearchKey = loadKey;
		void loadSearch(session, q);
	};
	const retrySearch = () => {
		if (currentSession && searchQuery) void loadSearch(currentSession, searchQuery);
	};
	const submitHeaderSearch = (event: SubmitEvent) => {
		event.preventDefault();
		rememberSearch(headerSearchDraft);
		closeHeaderSearch();
		submitSearch(headerSearchDraft);
	};
	const submitExploreSearch = (event: SubmitEvent) => {
		event.preventDefault();
		rememberSearch(exploreSearchDraft);
		submitSearch(exploreSearchDraft);
	};
	const submitSearchPage = (event: SubmitEvent) => {
		event.preventDefault();
		clearSearchPageDebounce();
		rememberSearch(searchPageDraft);
		submitSearch(searchPageDraft, searchTab);
	};
	const updateSearchPageDraft = (value: string) => {
		searchPageDraft = value;
		clearSearchPageDebounce();
		searchPageDebounceTimer = window.setTimeout(() => {
			searchPageDebounceTimer = null;
			const q = searchPageDraft.trim();
			goto(q ? searchUrl(q, searchTab) : '/app/search', { replaceState: true });
		}, SEARCH_PAGE_DEBOUNCE_MS);
	};
	const scheduleHeaderSearch = (session: PleromaSession, query: string) => {
		const q = query.trim();
		clearHeaderSearchDebounce();
		headerSearchRequestId += 1;
		headerSearchSelectedIndex = -1;
		if (!q) {
			headerSearchState = { status: 'idle' };
			return;
		}

		headerSearchState = { status: 'loading', query: q };
		headerSearchDebounceTimer = window.setTimeout(() => {
			headerSearchDebounceTimer = null;
			void loadHeaderSearch(session, q);
		}, HEADER_SEARCH_DEBOUNCE_MS);
	};
	const focusHeaderSearch = () => {
		headerSearchOpen = true;
		if (headerSearchDraft.trim() && currentSession) scheduleHeaderSearch(currentSession, headerSearchDraft);
	};
	const updateHeaderSearch = (value: string) => {
		headerSearchDraft = value;
		headerSearchOpen = true;
		headerSearchSelectedIndex = -1;
		const session = currentSession;
		if (!session || !value.trim()) {
			clearHeaderSearchDebounce();
			headerSearchRequestId += 1;
			headerSearchState = { status: 'idle' };
			return;
		}

		scheduleHeaderSearch(session, value);
	};
	const pickSearchRecent = (query: string) => {
		headerSearchDraft = query;
		rememberSearch(query);
		closeHeaderSearch();
		submitSearch(query);
	};
	const openSearchAccount = (account: { acct: string }) => {
		rememberSearch(headerSearchDraft || searchQuery);
		closeHeaderSearch();
		goto(profileHrefForAccount(account));
	};
	const openSearchPost = (post: { id: string | number; actionStatusId?: string; threadStatusId?: string }) => {
		rememberSearch(headerSearchDraft || searchQuery);
		closeHeaderSearch();
		openThread(post);
	};
	const updateSearchAccountFollowState = (accountId: string, followState: PleromaProfileFollowState) => {
		const updateAccount = (account: SearchAccountView) => account.id === accountId ? { ...account, followState } : account;
		if (searchState.status === 'success') {
			searchState = { ...searchState, accounts: searchState.accounts.map(updateAccount) };
		}
		if (headerSearchState.status === 'success') {
			headerSearchState = { ...headerSearchState, accounts: headerSearchState.accounts.map(updateAccount) };
		}
	};
	const setSearchFollowPending = (accountId: string, pending: boolean) => {
		if (pending) {
			searchFollowPending = { ...searchFollowPending, [accountId]: true };
			return;
		}

		const { [accountId]: _cleared, ...rest } = searchFollowPending;
		searchFollowPending = rest;
	};
	const toggleSearchFollow = async (event: MouseEvent, account: SearchAccountView) => {
		event.preventDefault();
		event.stopPropagation();
		const session = currentSession;
		if (!session || searchFollowDisabled(account)) return;

		const requestSessionKey = sessionKey(session);
		setSearchFollowPending(account.id, true);
		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const relationship = searchFollowIsFollowing(account.followState)
				? await client.unfollowAccount(account.id)
				: await client.followAccount(account.id);
			if (!isCurrentSessionRequest(requestSessionKey)) return;
			updateSearchAccountFollowState(account.id, followStateFromRelationship(relationship, account.id, session.account?.id));
		} catch (error) {
			if (!isCurrentSessionRequest(requestSessionKey)) return;
			const normalized = normalizePleromaRequestError(error);
			if (normalized.reauthRequired) {
				signOutPleroma(localStorage);
				redirectToLanding();
			}
		} finally {
			if (isCurrentSessionRequest(requestSessionKey)) setSearchFollowPending(account.id, false);
		}
	};
	const activateHeaderSearchItem = (item: HeaderSearchSelectableItem) => {
		if (item.kind === 'recent') {
			pickSearchRecent(item.query);
			return;
		}

		if (item.kind === 'account') {
			openSearchAccount(item.account);
			return;
		}

		openSearchPost(item.post);
	};
	const moveHeaderSearchSelection = (direction: 1 | -1) => {
		const itemCount = headerSearchSelectableItems.length;
		if (itemCount === 0) return;

		headerSearchOpen = true;
		headerSearchSelectedIndex = headerSearchSelectedIndex < 0
			? direction === 1 ? 0 : itemCount - 1
			: (headerSearchSelectedIndex + direction + itemCount) % itemCount;
	};
	const handleHeaderSearchKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeHeaderSearch();
			return;
		}

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			moveHeaderSearchSelection(event.key === 'ArrowDown' ? 1 : -1);
			return;
		}

		if (event.key !== 'Enter' || headerSearchSelectedIndex < 0) return;
		const item = headerSearchSelectableItems[headerSearchSelectedIndex];
		if (!item) return;

		event.preventDefault();
		activateHeaderSearchItem(item);
	};
	const handleWindowPointerdown = (event: PointerEvent) => {
		if (!headerSearchOpen || !headerSearchForm) return;
		const target = event.target;
		if (target instanceof Node && !headerSearchForm.contains(target)) closeHeaderSearch();
	};
	const setSearchTab = (tab: SearchTab) => {
		if (!searchQuery) return;
		goto(searchUrl(searchQuery, tab));
	};
	const searchComposerMentionAccounts = (query: string) => {
		const session = currentSession;
		const q = query.trim();
		if (!session || q.length === 0) {
			composerMentionAccounts = [];
			return;
		}
		const requestSessionKey = sessionKey(session);
		const requestId = composerMentionSearchRequestId + 1;
		composerMentionSearchRequestId = requestId;

		void (async () => {
			try {
				const client = createPleromaClient({
					instanceUrl: session.instanceUrl,
					accessToken: session.accessToken,
					fetch: window.fetch.bind(window)
				});
				const accounts = await client.searchAccounts({ q, limit: 5, resolve: true });
				if (requestId !== composerMentionSearchRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

				upsertAccountCache(accounts);
				composerMentionAccounts = accounts.map(composerMentionAccount);
			} catch {
				if (requestId !== composerMentionSearchRequestId || !isCurrentSessionRequest(requestSessionKey)) return;
				composerMentionAccounts = [];
			}
		})();
	};
	const toggleComposerEmojiPicker = (event: MouseEvent) => {
		const session = currentSession;
		if (session) ensureComposerCustomEmojis(session);
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		composerEmojiPickerAnchor = { left: rect.left, top: rect.top, bottom: rect.bottom };
		composerEmojiPickerOpen = !composerEmojiPickerOpen;
	};
	const emojiRecentKey = (item: string | ComposerEmoji) => typeof item === 'string' ? item : item.shortcode;
	const insertComposerEmoji = (item: string | ComposerEmoji) => {
		composerEmojiRecents = [item, ...composerEmojiRecents.filter((recent) => emojiRecentKey(recent) !== emojiRecentKey(item))].slice(0, 12);
		composerInsertRequestId += 1;
		composerInsertRequest = { id: composerInsertRequestId, item };
	};
	const inlineReplyComposerProps = $derived<InlineReplyComposerData | null>(inlineReplyTarget ? {
		targetHandle: inlineReplyTarget.handle,
		targetName: inlineReplyTarget.name,
		targetAvClass: inlineReplyTarget.avClass,
		targetAvBanner: inlineReplyTarget.avBanner,
		targetAvatarUrl: inlineReplyTarget.avatarUrl,
		draft: inlineReplyDraft,
		remaining: inlineReplyRemaining,
		submitting: inlineReplySubmitState === 'submitting',
		error: inlineReplySubmitError,
		spoilerActive: inlineReplySpoilerActive,
		spoilerText: inlineReplySpoilerText,
		poll: inlineReplyPoll,
		pollValid: Boolean(preparedInlineReplyPoll),
		accounts: composerMentionAccounts,
		emojis: composerCustomEmojis,
		uploads: inlineReplyUploads,
		onMentionQuery: searchComposerMentionAccounts,
		onFiles: queueInlineReplyFiles,
		onRemoveUpload: removeInlineReplyUpload,
		onSpoilerToggle: toggleInlineReplySpoiler,
		onSpoilerInput: (value: string) => (inlineReplySpoilerText = value),
		onSpoilerRemove: clearInlineReplySpoiler,
		onPollToggle: toggleInlineReplyPoll,
		onPollChange: (poll: ComposerPollDraft) => (inlineReplyPoll = poll),
		onPollRemove: () => (inlineReplyPoll = null),
		onDraftInput: (value: string) => (inlineReplyDraft = value),
		onCancel: () => clearInlineReply(),
		onSubmit: submitInlineReply
	} : null);
	const threadInlineReplyBinding = $derived(inlineReplyComposerProps ? {
		renderId: inlineReplyTarget?.route === 'thread' ? inlineReplyTarget.renderId : null,
		props: inlineReplyComposerProps
	} : null);
	const clearNotificationLoadPromise = (abort = false) => {
		if (abort) notificationAbortController?.abort();
		notificationLoadPromise = null;
		notificationLoadPromiseKey = '';
		notificationLoadStartedAt = 0;
		notificationAbortController = null;
	};
	const notificationTimestamp = (notification: PleromaNotificationView) => {
		const createdMs = notification.createdAt ? Date.parse(notification.createdAt) : Number.NaN;
		return Number.isFinite(createdMs) ? createdMs : notification.t;
	};
	const mergeNotificationViews = (current: PleromaNotificationView[], incoming: PleromaNotificationView[]) => {
		const byId = new Map<string, PleromaNotificationView>();
		for (const notification of current) byId.set(notification.id, notification);
		for (const notification of incoming) {
			const existing = byId.get(notification.id);
			byId.set(notification.id, existing ? { ...existing, ...notification, read: existing.read || notification.read } : notification);
		}

		return Array.from(byId.values()).sort((left, right) => notificationTimestamp(right) - notificationTimestamp(left));
	};
	const adaptNotificationsForSession = (session: PleromaSession, notifications: PleromaNotification[]) => {
		if (!session.account) return [];
		const notificationSession = { instanceUrl: session.instanceUrl, account: session.account };
		const lastSeenAt = readNotificationLastSeenAt(localStorage, notificationSession);
		return adaptPleromaNotifications(notifications, { lastSeenAt });
	};
	const loadNotifications = (session: PleromaSession, options: { background?: boolean } = {}) => {
		if (!session.account) return Promise.resolve();

		const requestSessionKey = sessionKey(session);
		const notificationLoadFresh = Date.now() - notificationLoadStartedAt < NOTIFICATION_POLL_INTERVAL_MS;
		if (notificationLoadPromise && notificationLoadPromiseKey === requestSessionKey && options.background && notificationLoadFresh) return notificationLoadPromise;
		if (notificationLoadPromise) {
			notificationRequestId += 1;
			clearNotificationLoadPromise(true);
		}
		const abortController = new AbortController();
		const requestId = notificationRequestId + 1;
		notificationRequestId = requestId;
		if (!options.background) notificationState = { status: 'loading' };

		const request = (async () => {
			try {
				const client = createPleromaClient({
					instanceUrl: session.instanceUrl,
					accessToken: session.accessToken,
					fetch: window.fetch.bind(window)
				});
				const notifications = await client.getNotifications({ limit: 40 }, { signal: abortController.signal });
				if (requestId !== notificationRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

				upsertAccountCache(accountsFromPleromaNotifications(notifications));
				const adapted = adaptNotificationsForSession(session, notifications);
				const merged = notificationState.status === 'success' ? mergeNotificationViews(notificationState.data, adapted) : adapted;
				notificationState = merged.length > 0 ? { status: 'success', data: merged } : { status: 'empty' };
			} catch (error) {
				if (requestId !== notificationRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

				const normalized = normalizePleromaRequestError(error);
				if (normalized.reauthRequired) {
					signOutPleroma(localStorage);
					redirectToLanding();
					return;
				}

				if (!options.background || notificationState.status !== 'success') notificationState = { status: 'error', error: normalized };
			}
		})().finally(() => {
			if (notificationLoadPromise === request) clearNotificationLoadPromise();
		});

		notificationLoadPromise = request;
		notificationLoadPromiseKey = requestSessionKey;
		notificationLoadStartedAt = Date.now();
		notificationAbortController = abortController;
		return request;
	};
	const ensureNotifications = (session: PleromaSession) => {
		if (!session.account) return;
		const requestSessionKey = sessionKey(session);
		if (loadedNotificationsKey === requestSessionKey) return;

		loadedNotificationsKey = requestSessionKey;
		void loadNotifications(session, { background: true });
	};
	const ensureForegroundNotifications = (session: PleromaSession) => {
		if (!session.account) return;
		const requestSessionKey = sessionKey(session);
		if (loadedForegroundNotificationsKey === requestSessionKey) return;

		loadedNotificationsKey = requestSessionKey;
		loadedForegroundNotificationsKey = requestSessionKey;
		void loadNotifications(session);
	};
	const hasActiveNotificationStream = (session: PleromaSession) => {
		const requestSessionKey = sessionKey(session);
		return notificationStreamReadyKey === requestSessionKey || homeTimelineStreamReadyKey === requestSessionKey;
	};
	const pollNotifications = () => {
		const session = readPleromaSession(localStorage);
		if (!session) {
			invalidateNotificationRequests();
			return;
		}
		if (!session.account) return;
		if (hasActiveNotificationStream(session)) return;

		void loadNotifications(session, { background: true });
	};
	const applyStreamedNotification = (requestSessionKey: string, notification: PleromaNotification) => {
		const session = currentSession;
		if (!session?.account || !isCurrentSessionRequest(requestSessionKey)) return;

		upsertAccountCache(accountsFromPleromaNotifications([notification]));
		const adapted = adaptNotificationsForSession(session, [notification]);
		const merged = mergeNotificationViews(notificationState.status === 'success' ? notificationState.data : [], adapted);
		notificationState = merged.length > 0 ? { status: 'success', data: merged } : { status: 'empty' };
	};
	const scheduleNotificationStreamReconnect = (session: PleromaSession, requestSessionKey: string) => {
		clearNotificationStreamReconnect();
		notificationStreamReconnectTimer = window.setTimeout(() => {
			notificationStreamReconnectTimer = null;
			if (route === 'home' || !isCurrentSessionRequest(requestSessionKey)) return;
			connectNotificationStreaming(session);
		}, NOTIFICATION_STREAM_RECONNECT_MS);
	};
	const handleNotificationStreamFailure = (session: PleromaSession, requestSessionKey: string) => {
		if (!isCurrentSessionRequest(requestSessionKey) || notificationStreamKey !== requestSessionKey) return;

		closeNotificationStream?.();
		closeNotificationStream = null;
		notificationStreamKey = '';
		notificationStreamReadyKey = '';
		void loadNotifications(session, { background: true });
		if (route !== 'home') scheduleNotificationStreamReconnect(session, requestSessionKey);
	};
	const connectNotificationStreaming = (session: PleromaSession) => {
		if (!session.account || route === 'home') {
			closeNotificationStreaming();
			return;
		}

		const requestSessionKey = sessionKey(session);
		if (notificationStreamKey === requestSessionKey && closeNotificationStream) return;

		closeNotificationStreaming();
		notificationStreamKey = requestSessionKey;
		const stream = openPleromaTimelineStream({
			instanceUrl: session.instanceUrl,
			accessToken: session.accessToken,
			onNotification: (notification) => applyStreamedNotification(requestSessionKey, notification),
			onOpen: () => {
				if (notificationStreamKey === requestSessionKey && isCurrentSessionRequest(requestSessionKey)) notificationStreamReadyKey = requestSessionKey;
			},
			onError: () => handleNotificationStreamFailure(session, requestSessionKey),
			onClose: () => handleNotificationStreamFailure(session, requestSessionKey)
		});
		if (notificationStreamKey === requestSessionKey) closeNotificationStream = stream.close;
		else stream.close();
	};
	const latestNotificationCreatedAt = (notifications: SocialNotificationData[]) => notifications.reduce<string | null>((latest, notification) => {
		if (!notification.createdAt) return latest;
		if (!latest || Date.parse(notification.createdAt) > Date.parse(latest)) return notification.createdAt;
		return latest;
	}, null);
	const markNotificationsRead = () => {
		const session = currentSession;
		if (!session?.account || notificationState.status !== 'success') return;
		const notificationSession = { instanceUrl: session.instanceUrl, account: session.account };

		const latest = latestNotificationCreatedAt(notificationState.data);
		if (!latest) return;
		notificationRequestId += 1;
		clearNotificationLoadPromise(true);
		writeNotificationLastSeenAt(localStorage, notificationSession, latest);
		notificationState = {
			...notificationState,
			data: notificationState.data.map((notification) => ({ ...notification, read: true }))
		};
	};
	const openNotification = (notification: SocialNotificationData) => {
		notificationsMenuOpen = false;
		if (notification.target?.route === 'thread') {
			goto(`/app/thread/${encodeURIComponent(notification.target.statusId)}`);
			return;
		}
		if (notification.target?.route === 'profile') {
			goto(`/app/profiles/${encodeURIComponent(notification.target.accountHandle)}`);
		}
	};
	const queueStreamedHomeStatus = (requestSessionKey: string, status: PleromaStatus) => {
		if (!isCurrentSessionRequest(requestSessionKey)) return;

		upsertAccountCache(accountsFromPleromaStatus(status));
		const posts = adaptPleromaStatuses([status], { timelines: ['home'] });
		if (posts.length === 0) return;

		if (homeTimelineState.status === 'success') {
			homeTimelineState = {
				...homeTimelineState,
				newerPosts: queueNewerTimelineItems(homeTimelineState.newerPosts, homeTimelineState.data, posts),
				newPostsStatus: 'idle'
			};
			return;
		}

		if (homeTimelineState.status === 'empty') {
			homeTimelineState = {
				status: 'success',
				data: [],
				nextCursor: null,
				loadMoreStatus: 'idle',
				newerPosts: posts,
				newPostsStatus: 'idle'
			};
		}
	};
	const scheduleHomeTimelineStreamReconnect = (session: PleromaSession, requestSessionKey: string) => {
		clearHomeTimelineStreamReconnect();
		homeTimelineStreamReconnectTimer = window.setTimeout(() => {
			homeTimelineStreamReconnectTimer = null;
			if (route !== 'home' || !isCurrentSessionRequest(requestSessionKey)) return;
			connectHomeTimelineStreaming(session);
		}, HOME_TIMELINE_STREAM_RECONNECT_MS);
	};
	const handleHomeTimelineStreamFailure = (session: PleromaSession, requestSessionKey: string) => {
		if (!isCurrentSessionRequest(requestSessionKey) || homeTimelineStreamKey !== requestSessionKey) return;

		closeHomeTimelineStream?.();
		closeHomeTimelineStream = null;
		homeTimelineStreamKey = '';
		homeTimelineStreamReadyKey = '';
		if (route !== 'home') return;

		if (session.account) void loadNotifications(session, { background: true });
		void checkHomeTimelineForNewPosts();
		scheduleHomeTimelineStreamReconnect(session, requestSessionKey);
	};
	const connectHomeTimelineStreaming = (session: PleromaSession) => {
		if (route !== 'home') return;

		const requestSessionKey = sessionKey(session);
		if (homeTimelineStreamKey === requestSessionKey && closeHomeTimelineStream) return;

		closeHomeTimelineStreaming();
		homeTimelineStreamKey = requestSessionKey;
		const stream = openPleromaTimelineStream({
			instanceUrl: session.instanceUrl,
			accessToken: session.accessToken,
			onUpdate: (status) => queueStreamedHomeStatus(requestSessionKey, status),
			onNotification: (notification) => applyStreamedNotification(requestSessionKey, notification),
			onOpen: () => {
				if (homeTimelineStreamKey === requestSessionKey && isCurrentSessionRequest(requestSessionKey)) homeTimelineStreamReadyKey = requestSessionKey;
			},
			onError: () => handleHomeTimelineStreamFailure(session, requestSessionKey),
			onClose: () => handleHomeTimelineStreamFailure(session, requestSessionKey)
		});
		if (homeTimelineStreamKey === requestSessionKey) closeHomeTimelineStream = stream.close;
		else stream.close();
	};
	const loadHomeTimeline = async (session: PleromaSession) => {
		const requestSessionKey = sessionKey(session);
		const requestId = homeTimelineRequestId + 1;
		homeTimelineRequestId = requestId;
		homeTimelineState = { status: 'loading' };

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const timelinePage = await client.getHomeTimelinePage();
			if (route !== 'home' || requestId !== homeTimelineRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			upsertAccountCache(accountsFromPleromaStatuses(timelinePage.items));
			const posts = adaptPleromaStatuses(timelinePage.items, { timelines: ['home'] });
			homeTimelineFallbackSinceId = posts[0]?.id ?? null;
			homeTimelineState = posts.length > 0
				? { status: 'success', data: posts, nextCursor: timelinePage.cursors.next, loadMoreStatus: 'idle', newerPosts: [], newPostsStatus: 'idle' }
				: { status: 'empty' };
			connectHomeTimelineStreaming(session);
		} catch (error) {
			if (requestId !== homeTimelineRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			const normalized = normalizePleromaRequestError(error);
			if (normalized.reauthRequired) {
				signOutPleroma(localStorage);
				redirectToLanding();
				return;
			}

			homeTimelineState = { status: 'error', error: normalized };
		}
	};
	const loadThread = async (session: PleromaSession, statusId: string) => {
		const requestSessionKey = sessionKey(session);
		const requestId = threadRequestId + 1;
		threadRequestId = requestId;

		if (!statusId) {
			threadState = {
				status: 'error',
				error: {
					kind: 'request',
					title: 'Thread unavailable',
					message: 'PleromaNet needs a status id to load a thread.',
					retryable: false,
					reauthRequired: false
				}
			};
			return;
		}

		threadState = { status: 'loading' };

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const [status, context] = await Promise.all([
				client.getStatus(statusId),
				client.getStatusContext(statusId)
			]);
			if (route !== 'thread' || requestId !== threadRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			upsertAccountCache(accountsFromPleromaStatuses([status, ...context.ancestors, ...context.descendants]));
			threadState = {
				status: 'success',
				focused: threadPostForRebuild(adaptPleromaStatus(status)),
				ancestors: adaptPleromaStatuses(context.ancestors).map(threadPostForRebuild),
				replies: threadRepliesForRebuild(status.id, adaptPleromaStatuses(context.descendants))
			};
		} catch (error) {
			if (requestId !== threadRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			const normalized = normalizePleromaRequestError(error);
			if (normalized.reauthRequired) {
				signOutPleroma(localStorage);
				redirectToLanding();
				return;
			}

			threadState = { status: 'error', error: normalized };
		}
	};
	const normalizedProfileHandle = (value: string) => value.replace(/^@/, '').trim().toLowerCase();
	const accountMatchesProfileHandle = (account: PleromaStatus['account'], handle: string) => {
		const normalized = normalizedProfileHandle(handle);
		const acct = normalizedProfileHandle(account.acct);
		const username = normalizedProfileHandle(account.username);
		return normalized === account.id.toLowerCase()
			|| normalized === acct
			|| (!acct.includes('@') && normalized === username);
	};
	const resolveProfileAccount = async (client: ReturnType<typeof createPleromaClient>, session: PleromaSession, handle: string) => {
		if (session.account && (!handle || accountMatchesProfileHandle(session.account, handle))) return session.account;
		const cached = getCachedPleromaAccount(accountCache, handle);
		if (cached && accountMatchesProfileHandle(cached, handle)) return cached;
		const matches = await client.searchAccounts({ q: handle, limit: 5, resolve: true });
		const exactMatch = matches.find((account) => accountMatchesProfileHandle(account, handle));
		if (exactMatch) return exactMatch;
		const account = await client.getAccount(handle);
		return account;
	};
	const accountWithFetchedRelationship = async (client: ReturnType<typeof createPleromaClient>, account: PleromaAccount, currentAccountId?: string) => {
		if (currentAccountId && account.id === currentAccountId) return account;
		const [relationship] = await client.getAccountRelationships([account.id]);
		if (!relationship) return account;

		return {
			...account,
			pleroma: {
				...account.pleroma,
				relationship
			}
		};
	};
	const loadProfileRoute = async (session: PleromaSession, handle: string) => {
		const requestSessionKey = sessionKey(session);
		const requestId = profileRouteRequestId + 1;
		profileRouteRequestId = requestId;

		if (!handle && !session.account) {
			profileRouteState = {
				status: 'error',
				error: {
					kind: 'request',
					title: 'Profile unavailable',
					message: 'PleromaNet needs an account handle to load a profile.',
					retryable: false,
					reauthRequired: false
				}
			};
			return;
		}

		profileRouteState = { status: 'loading' };

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const resolvedAccount = await resolveProfileAccount(client, session, handle);
			const currentAccountId = currentSession?.account?.id ?? session.account?.id;
			if (route !== 'profile' || requestId !== profileRouteRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			upsertAccountCache([resolvedAccount]);
			const provisionalProfile = adaptPleromaProfile(resolvedAccount, { instanceUrl: session.instanceUrl, currentAccountId });
			profileRouteState = { status: 'success', data: emptyProfileData(provisionalProfile), timelineStatus: 'loading' };

			const statusPages = (accountId: string) => Promise.all([
				client.getAccountStatusesPage(accountId, { limit: 20, excludeReplies: true }),
				client.getAccountStatusesPage(accountId, { limit: 20 }),
				client.getAccountStatusesPage(accountId, { limit: 18, onlyMedia: true }),
				client.getAccountStatuses(accountId, { limit: 5, pinned: true })
			]);
			let account = resolvedAccount;
			let postsPage: Awaited<ReturnType<typeof client.getAccountStatusesPage>>;
			let repliesPage: Awaited<ReturnType<typeof client.getAccountStatusesPage>>;
			let mediaPage: Awaited<ReturnType<typeof client.getAccountStatusesPage>>;
			let pinnedStatuses: PleromaStatus[];

			if (resolvedAccount.locked) {
				account = await accountWithFetchedRelationship(client, resolvedAccount, currentAccountId);
				if (route !== 'profile' || requestId !== profileRouteRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

				upsertAccountCache([account], { relationship: 'replace' });
				const profile = adaptPleromaProfile(account, { instanceUrl: session.instanceUrl, currentAccountId });
				if (profileLockedForViewer(profile)) {
					profileRouteState = { status: 'success', data: emptyProfileData(profile), timelineStatus: 'ready' };
					return;
				}

				profileRouteState = { status: 'success', data: emptyProfileData(profile), timelineStatus: 'loading' };
				[postsPage, repliesPage, mediaPage, pinnedStatuses] = await statusPages(account.id);
			} else {
				const relationshipPromise = accountWithFetchedRelationship(client, resolvedAccount, currentAccountId);
				const statusesPromise = statusPages(resolvedAccount.id);
				account = await relationshipPromise;
				if (route !== 'profile' || requestId !== profileRouteRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

				upsertAccountCache([account], { relationship: 'replace' });
				const profile = adaptPleromaProfile(account, { instanceUrl: session.instanceUrl, currentAccountId });
				profileRouteState = {
					status: 'success',
					data: profileRouteState.status === 'success'
						? { ...profileRouteState.data, profile }
						: emptyProfileData(profile),
					timelineStatus: 'loading'
				};
				[postsPage, repliesPage, mediaPage, pinnedStatuses] = await statusesPromise;
			}
			if (route !== 'profile' || requestId !== profileRouteRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			upsertAccountCache([account], { relationship: 'replace' });
			const profile = adaptPleromaProfile(account, { instanceUrl: session.instanceUrl, currentAccountId });
			if (profileLockedForViewer(profile)) {
				profileRouteState = { status: 'success', data: emptyProfileData(profile), timelineStatus: 'ready' };
				return;
			}
			upsertAccountCache(accountsFromPleromaStatuses([...postsPage.items, ...repliesPage.items, ...mediaPage.items, ...pinnedStatuses]));
			const posts = adaptPleromaStatuses(postsPage.items).map(profilePostForRebuild);
			const replies = adaptPleromaStatuses(repliesPage.items).map(profilePostForRebuild);
			const mediaStatuses = adaptPleromaStatuses(mediaPage.items);
			const pinned = adaptPleromaStatuses(pinnedStatuses).map(profilePostForRebuild);
			profileRouteState = {
				status: 'success',
				data: {
					profile,
					posts,
					replies,
					pinned,
					media: profileMediaItems(mediaStatuses)
				},
				timelineStatus: 'ready'
			};
		} catch (error) {
			if (requestId !== profileRouteRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			const normalized = normalizePleromaRequestError(error);
			if (normalized.reauthRequired) {
				signOutPleroma(localStorage);
				redirectToLanding();
				return;
			}

			profileRouteState = { status: 'error', error: normalized };
		}
	};
	const loadMoreHomeTimeline = async () => {
		const session = currentSession;
		if (!session || homeTimelineState.status !== 'success' || !homeTimelineState.nextCursor || homeTimelineState.loadMoreStatus === 'loading') return;

		const requestSessionKey = sessionKey(session);
		const requestId = homeTimelineRequestId + 1;
		homeTimelineRequestId = requestId;
		const nextCursor = homeTimelineState.nextCursor;
		homeTimelineState = { ...homeTimelineState, loadMoreStatus: 'loading', loadMoreError: undefined };

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const timelinePage = await client.getHomeTimelinePage(nextCursor);
			if (requestId !== homeTimelineRequestId || !isCurrentSessionRequest(requestSessionKey) || homeTimelineState.status !== 'success') return;

			upsertAccountCache(accountsFromPleromaStatuses(timelinePage.items));
			const posts = adaptPleromaStatuses(timelinePage.items, { timelines: ['home'] });
			homeTimelineState = {
				...homeTimelineState,
				data: mergeTimelineItems(homeTimelineState.data, posts),
				nextCursor: timelinePage.cursors.next,
				loadMoreStatus: 'idle',
				loadMoreError: undefined
			};
		} catch (error) {
			if (requestId !== homeTimelineRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			const normalized = normalizePleromaRequestError(error);
			if (normalized.reauthRequired) {
				signOutPleroma(localStorage);
				redirectToLanding();
				return;
			}

			if (homeTimelineState.status !== 'success') return;
			homeTimelineState = { ...homeTimelineState, loadMoreStatus: 'error', loadMoreError: normalized };
		}
	};
	const checkHomeTimelineForNewPosts = async () => {
		const session = currentSession;
		if (!session || homeTimelineState.status !== 'success' || homeTimelineState.newPostsStatus === 'checking') return;

		const sinceId = homeTimelineFallbackSinceId;

		const requestSessionKey = sessionKey(session);
		const requestId = homeTimelineNewPostsRequestId + 1;
		homeTimelineNewPostsRequestId = requestId;
		homeTimelineState = { ...homeTimelineState, newPostsStatus: 'checking' };

		try {
			const client = createPleromaClient({
				instanceUrl: session.instanceUrl,
				accessToken: session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const timelinePage = await client.getHomeTimelinePage(sinceId ? { sinceId } : undefined);
			if (requestId !== homeTimelineNewPostsRequestId || !isCurrentSessionRequest(requestSessionKey) || homeTimelineState.status !== 'success') return;

			upsertAccountCache(accountsFromPleromaStatuses(timelinePage.items));
			const posts = adaptPleromaStatuses(timelinePage.items, { timelines: ['home'] });
			homeTimelineFallbackSinceId = posts[0]?.id ?? homeTimelineFallbackSinceId;
			if (!sinceId && homeTimelineState.newerPosts.length === 0) {
				homeTimelineState = {
					...homeTimelineState,
					data: mergeTimelineItems(posts, homeTimelineState.data),
					nextCursor: timelinePage.cursors.next,
					newPostsStatus: 'idle'
				};
				return;
			}

			homeTimelineState = {
				...homeTimelineState,
				nextCursor: sinceId ? homeTimelineState.nextCursor : timelinePage.cursors.next,
				newerPosts: queueNewerTimelineItems(homeTimelineState.newerPosts, homeTimelineState.data, posts),
				newPostsStatus: 'idle'
			};
		} catch (error) {
			if (requestId !== homeTimelineNewPostsRequestId || !isCurrentSessionRequest(requestSessionKey)) return;

			const normalized = normalizePleromaRequestError(error);
			if (normalized.reauthRequired) {
				signOutPleroma(localStorage);
				redirectToLanding();
				return;
			}

			if (homeTimelineState.status !== 'success') return;
			homeTimelineState = { ...homeTimelineState, newPostsStatus: 'idle' };
		}
	};
	const showNewHomePosts = () => {
		if (homeTimelineState.status !== 'success' || homeTimelineState.newerPosts.length === 0) return;

		homeTimelineState = {
			...homeTimelineState,
			data: prependTimelineItems(homeTimelineState.data, homeTimelineState.newerPosts),
			newerPosts: []
		};
		window.scrollTo(window.scrollX, 0);
	};
	const retryHomeTimeline = () => {
		if (currentSession) void loadHomeTimeline(currentSession);
	};
	const retryThread = () => {
		if (currentSession) void loadThread(currentSession, threadStatusId);
	};
	const retryProfileRoute = () => {
		if (currentSession) void loadProfileRoute(currentSession, profileRouteHandle);
	};
	const openNotificationsRoute = () => {
		notificationsMenuOpen = false;
		goto('/app/notifications');
	};
	const toggleNotificationsPopover = () => {
		userMenuOpen = false;
		notificationsMenuOpen = !notificationsMenuOpen;
		if (!notificationsMenuOpen) return;

		const session = currentSession;
		if (!session) return;
		if (session.account) {
			if (notificationState.status === 'idle' || notificationState.status === 'error') void loadNotifications(session);
			else ensureNotifications(session);
			return;
		}

		notificationState = { status: 'loading' };
		ensureProfileAccount(session);
	};
	const retryNotifications = () => {
		if (!currentSession) return;
		if (currentSession.account) {
			void loadNotifications(currentSession);
			return;
		}

		loadedProfileAccountKey = '';
		profileAccountLoadError = null;
		notificationState = { status: 'loading' };
		void loadProfileAccount(currentSession);
	};

	onMount(() => {
		const storedTheme = localStorage.getItem('pn-theme');
		if (storedTheme === 'dusk' || storedTheme === 'drive' || storedTheme === 'simoun') applyTheme(storedTheme);
		searchRecents = readSearchRecents();
		mounted = true;

		const triggerHomeTimelineCheck = () => {
			if (route === 'home') void checkHomeTimelineForNewPosts();
		};
		window.addEventListener(HOME_TIMELINE_CHECK_EVENT, triggerHomeTimelineCheck);
		window.addEventListener(NOTIFICATION_POLL_EVENT, pollNotifications);
		const checkInterval = window.setInterval(triggerHomeTimelineCheck, HOME_TIMELINE_FALLBACK_INTERVAL_MS);
		const notificationInterval = window.setInterval(pollNotifications, NOTIFICATION_POLL_INTERVAL_MS);

		return () => {
			invalidateHomeTimelineRequests();
			invalidateProfileRouteRequests();
			invalidateStatusActionRequests();
			invalidateNotificationRequests();
			invalidateSearchRequests();
			invalidateComposerAutocompleteRequests();
			closeHomeTimelineStreaming();
			window.removeEventListener(HOME_TIMELINE_CHECK_EVENT, triggerHomeTimelineCheck);
			window.removeEventListener(NOTIFICATION_POLL_EVENT, pollNotifications);
			window.clearInterval(checkInterval);
			window.clearInterval(notificationInterval);
		};
	});

	$effect(() => {
		const pathname = page.url.pathname;
		if (!mounted) return;
		if (route === 'search') {
			headerSearchDraft = searchQuery;
			searchPageDraft = searchQuery;
		} else {
			clearSearchPageDebounce();
		}

		const session = readSessionOrRedirect();
		if (!session) return;
		ensureProfileAccount(session);
		if (session.account) {
			if (route === 'notifications') ensureForegroundNotifications(session);
			else ensureNotifications(session);
			connectNotificationStreaming(session);
		}
		else if (route === 'notifications' && profileAccountLoadError) notificationState = { status: 'error', error: profileAccountLoadError };
		if (isTimelineRoute(route)) {
			ensureInstanceConfig(session);
			ensureTrends(session);
			ensureComposerCustomEmojis(session);
		}
		if (route === 'search') ensureSearch(session, searchQuery);
		if (pathname.startsWith('/app/home')) {
			const loadKey = `${sessionKey(session)}\n${pathname}`;
			if (loadedHomeTimelineKey !== loadKey) {
				loadedHomeTimelineKey = loadKey;
				void loadHomeTimeline(session);
			}
		} else {
			clearHomeRouteIfLoaded();
		}
		if (pathname.startsWith('/app/thread')) {
			const loadKey = `${sessionKey(session)}\n${threadStatusId}`;
			if (loadedThreadKey !== loadKey) {
				clearInlineReply('thread');
				clearStatusActionErrors('thread');
				expandedThreadReplyIds = {};
				loadedThreadKey = loadKey;
				void loadThread(session, threadStatusId);
			}
		} else {
			clearThreadRouteIfLoaded();
		}
		if (pathname.startsWith('/app/profiles')) {
			const viewerAccountId = currentSession?.account?.id ?? session.account?.id ?? '';
			const loadKey = `${sessionKey(session)}\n${viewerAccountId}\n${profileRouteHandle}`;
			if (loadedProfileRouteKey !== loadKey) {
				clearStatusActionErrors('profile');
				loadedProfileRouteKey = loadKey;
				void loadProfileRoute(session, profileRouteHandle);
			}
		} else {
			clearProfileRouteIfLoaded();
		}
	});
</script>

<svelte:head>
	<title>PleromaNet · App</title>
</svelte:head>

<svelte:window onkeydown={handleWindowKeydown} onpointerdown={handleWindowPointerdown} />

<AttachmentLightboxHost />

{#snippet searchResultsBody()}
	{#if searchState.status === 'idle'}
		<div class="se-empty">
			<h2 class="se-empty-h">Start a search</h2>
			<p class="se-empty-s">Use the field above or the header search box to look up people and posts.</p>
		</div>
	{:else if searchState.status === 'loading'}
		<div class="se-skel" role="status" aria-label="Search status">
			<div class="se-empty-h">Searching “{searchState.query}”</div>
			{#each Array.from({ length: 3 }) as _}
				<div class="se-skel-row" aria-hidden="true">
					<span class="se-skel-av"></span>
					<span>
						<span class="se-skel-line long"></span>
						<span class="se-skel-line mid"></span>
						<span class="se-skel-line short"></span>
					</span>
				</div>
			{/each}
		</div>
	{:else if searchState.status === 'empty'}
		<div class="se-empty" data-testid="search-results">
			<h2 class="se-empty-h">No results for {searchState.query}</h2>
			<p class="se-empty-s">No people or posts matched. Try a shorter query, a handle, or a few words from a post.</p>
		</div>
	{:else if searchState.status === 'error'}
		<div class="se-empty se-error" role="alert">
			<h2 class="se-empty-h">{searchState.error.title}</h2>
			<p class="se-empty-s">{searchState.error.message}</p>
			{#if searchState.error.retryable}
				<Button variant="secondary" onclick={retrySearch}>Retry search</Button>
			{/if}
		</div>
	{:else if visibleSearchResultTotal === 0}
		<div class="se-empty" data-testid="search-results">
			<h2 class="se-empty-h">No {searchTab} results for {searchState.query}</h2>
			<p class="se-empty-s">Switch tabs or widen your query.</p>
		</div>
	{:else if searchState.status === 'success'}
		<div class="se-list" data-testid="search-results">
			{#each visibleSearchAccounts as account (account.id)}
				<div class="se-row se-account-row">
					<a class="se-row-open" href={profileHrefForAccount(account)}>
						<span class="se-row-av" class:av-orb={!account.avatarUrl}>{#if account.avatarUrl}<img class="avatar-img" src={account.avatarUrl} alt={`${account.displayName} avatar`} />{/if}</span>
						<span class="se-row-main">
							<span class="se-row-head">
								<span class="se-row-name"><RichText text={account.displayName} emojis={account.emojis} linkMentions={false} /></span>
								<span class="se-row-acct">{account.handle}</span>
								{#if account.acct.includes('@')}<span class="se-row-tag user">Remote</span>{/if}
							</span>
							{#if account.bio}<span class="se-row-snippet">{account.bio}</span>{/if}
							<span class="se-row-meta"><span>{compactFormatter.format(account.followers)} followers</span><span>{compactFormatter.format(account.posts)} posts</span></span>
						</span>
					</a>
					<button type="button" class="se-follow-btn" class:is-following={searchFollowIsFollowing(account.followState)} disabled={searchFollowDisabled(account)} onclick={(event) => toggleSearchFollow(event, account)}>{searchFollowPending[account.id] ? 'Working...' : searchFollowLabel(account.followState)}</button>
				</div>
			{/each}
			{#each visibleSearchPosts as post (post.id)}
				<button type="button" class="se-row" onclick={() => openThread(post)}>
					<span class="se-row-av" class:av-orb={!post.avatarUrl}>{#if post.avatarUrl}<img class="avatar-img" src={post.avatarUrl} alt={`${post.name} avatar`} />{/if}</span>
					<span class="se-row-main">
						<span class="se-row-head">
							<span class="se-row-name"><RichText text={post.name} emojis={post.nameEmojis} linkMentions={false} /></span>
							<span class="se-row-acct">{post.handle}</span>
							<span class="se-row-time">{post.time}</span>
						</span>
						<span class="se-row-snippet"><RichText text={post.body} emojis={post.bodyEmojis} mentionClass="post-mention-inline" linkMentions={false} /></span>
						<span class="se-row-meta"><span>↩ {post.replies}</span><span>↻ {post.boosts}</span><span>★ {post.favorites}</span></span>
					</span>
				</button>
			{/each}
		</div>
	{/if}
{/snippet}

{#if sessionReady}
	<div class="app-route-shell">
		<header class="app-header" data-testid="app-header">
			<div class="app-header-shell">
				<div class="app-header-inner">
					<div class="app-brand">
						<button type="button" class="menu-btn app-mobile-menu" aria-label="Open navigation menu" onclick={() => (mobileDrawerOpen = true)}>
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
						</button>
						<a href="/app/home" class="brand-core" onclick={closeMobilePanels}>
							<span class="brand-mark"><Icon name="sparkBig" /></span>
							<span class="brand-name">PleromaNet<sup>™</sup></span>
						</a>
						<div class="brand-tag" data-testid="brand-tag">A federated<br />social web</div>
					</div>
					<nav class="app-primary-nav" aria-label="Primary">
						{#each primaryNavItems as item}
							<a href={item.href} class:active={isActive(item)}>{item.label}</a>
						{/each}
					</nav>
					<div class="app-header-spacer"></div>
					<div class="app-header-right">
						<form bind:this={headerSearchForm} class="app-search" role="search" onsubmit={submitHeaderSearch} onfocusin={focusHeaderSearch}>
							<Icon name="search" width={14} height={14} />
							<input bind:this={headerSearchInput} value={headerSearchDraft} type="search" role="combobox" aria-label="Search PleromaNet" placeholder="Search..." aria-autocomplete="list" aria-expanded={headerSearchOpen} aria-controls={headerSearchOpen ? 'header-search-dropdown' : undefined} aria-activedescendant={headerSearchActiveDescendant} oninput={(event) => updateHeaderSearch(event.currentTarget.value)} onkeydown={handleHeaderSearchKeydown} />
							<span class="search-kbd">⌘K</span>
							{#if headerSearchOpen}
								<div id="header-search-dropdown" class="se-dropdown" role="listbox" data-testid="header-search-dropdown">
									{#if !headerSearchDraft.trim()}
										{#if searchRecents.length === 0}
											<div class="se-dd-empty">
												<div class="se-dd-empty-h">Search across PleromaNet</div>
												<div class="se-dd-empty-s">Find people and posts on this instance and across the federation. Hashtags are ignored.</div>
											</div>
										{:else}
											<div class="se-dd-section">
												<div class="se-dd-l"><span>Recent</span><span class="se-dd-l-count">{searchRecents.length}</span><button type="button" class="se-dd-l-see" onclick={clearSearchRecents}>Clear all</button></div>
												{#each searchRecents as recent, i}
													<div id={`header-search-option-${i}`} class="se-recent-row" role="option" aria-selected={headerSearchSelectedIndex === i} class:sel={headerSearchSelectedIndex === i}>
														<button type="button" class="se-recent-pick" onclick={() => pickSearchRecent(recent)}><span class="se-recent-q">{recent}</span></button>
														<button type="button" class="se-recent-x" aria-label={`Remove ${recent} from recent searches`} onclick={() => removeSearchRecent(recent)}>×</button>
													</div>
												{/each}
											</div>
										{/if}
										<div class="se-dd-foot"><span class="se-kbd">↵</span> open · <span class="se-kbd">Esc</span> dismiss<span class="se-dd-foot-r">⌘K from anywhere</span></div>
									{:else if headerSearchState.status === 'loading'}
										<div class="se-dd-empty"><div class="se-dd-empty-h">Searching “{headerSearchState.query}”</div><div class="se-dd-empty-s">Looking through people and posts...</div></div>
									{:else if headerSearchState.status === 'error'}
										<div class="se-dd-empty"><div class="se-dd-empty-h">Search unavailable</div><div class="se-dd-empty-s">{headerSearchState.error.message}</div></div>
									{:else if headerSearchState.status === 'empty' || headerSearchResultTotal === 0}
										<div class="se-dd-empty"><div class="se-dd-empty-h">No matches for “{headerSearchDraft}”</div><div class="se-dd-empty-s">Press ↵ to open the full search and try a wider query.</div></div>
										<div class="se-dd-foot"><span class="se-kbd">↵</span> open · <span class="se-kbd">Esc</span> dismiss</div>
									{:else}
										{#if headerSearchAccounts.length > 0}
											<div class="se-dd-section">
												<div class="se-dd-l"><span>People</span><span class="se-dd-l-count">{headerSearchState.status === 'success' ? headerSearchState.accounts.length : 0}</span><button type="button" class="se-dd-l-see" onclick={() => { rememberSearch(headerSearchDraft); closeHeaderSearch(); submitSearch(headerSearchDraft, 'people'); }}>See all →</button></div>
												{#each headerSearchAccounts as account, i (account.id)}
													<button id={`header-search-option-${i}`} type="button" role="option" aria-selected={headerSearchSelectedIndex === i} class="se-dd-row" class:sel={headerSearchSelectedIndex === i} onclick={() => openSearchAccount(account)}>
														<span class="se-dd-av" class:av-orb={!account.avatarUrl}>{#if account.avatarUrl}<img class="avatar-img" src={account.avatarUrl} alt={`${account.displayName} avatar`} />{/if}</span>
														<span class="se-dd-user"><span class="se-dd-name"><RichText text={account.displayName} emojis={account.emojis} linkMentions={false} /></span><span class="se-dd-acct">{account.handle}</span></span>
														<span class="se-dd-followers">{compactFormatter.format(account.followers)} followers</span>
													</button>
												{/each}
											</div>
										{/if}
										{#if headerSearchPosts.length > 0}
											<div class="se-dd-section">
												<div class="se-dd-l"><span>Posts</span><span class="se-dd-l-count">{headerSearchState.status === 'success' ? headerSearchState.posts.length : 0}</span><button type="button" class="se-dd-l-see" onclick={() => { rememberSearch(headerSearchDraft); closeHeaderSearch(); submitSearch(headerSearchDraft, 'posts'); }}>See all →</button></div>
												{#each headerSearchPosts as post, i (post.id)}
													<button id={`header-search-option-${headerSearchAccounts.length + i}`} type="button" role="option" aria-selected={headerSearchSelectedIndex === headerSearchAccounts.length + i} class="se-dd-row" class:sel={headerSearchSelectedIndex === headerSearchAccounts.length + i} onclick={() => openSearchPost(post)}>
														<span class="se-dd-av" class:av-orb={!post.avatarUrl}>{#if post.avatarUrl}<img class="avatar-img" src={post.avatarUrl} alt={`${post.name} avatar`} />{/if}</span>
														<span class="se-dd-snippet"><RichText text={post.body} emojis={post.bodyEmojis} mentionClass="post-mention-inline" linkMentions={false} /></span>
														<span class="se-dd-snippet-meta">{post.time}</span>
													</button>
												{/each}
											</div>
										{/if}
										<div class="se-dd-foot">Showing top results for <span class="se-dd-query">“{headerSearchDraft}”</span><span class="se-dd-foot-r"><span class="se-kbd">↵</span> view all · <span class="se-kbd">Esc</span> dismiss</span></div>
									{/if}
								</div>
							{/if}
						</form>
						<div class="header-notifs">
							<button type="button" class="icon-btn" aria-label={headerNotificationLabel} aria-expanded={notificationsMenuOpen} aria-controls={notificationsMenuOpen ? 'header-notifications-popover' : undefined} data-bell onclick={toggleNotificationsPopover}>
								<Icon name="bell" width={20} height={20} />
								{#if unreadNotificationCount > 0}<span class="badge">{unreadNotificationCount}</span>{/if}
							</button>
							{#if notificationsMenuOpen}
								<div id="header-notifications-popover" class="header-notifs-pop" data-testid="header-notifications-popover">
									<NotifsPopover
										notifications={notificationItems}
										status={notificationPopoverStatus}
										errorTitle={notificationPopoverError?.title}
										errorMessage={notificationPopoverError?.message}
										onClose={() => (notificationsMenuOpen = false)}
										onSeeAll={openNotificationsRoute}
										onMarkAll={markNotificationsRead}
										onOpen={openNotification}
									/>
								</div>
							{/if}
						</div>
						<button type="button" class="user-chip" aria-label={headerAccountLabel} onclick={() => { notificationsMenuOpen = false; userMenuOpen = !userMenuOpen; }}>
							<span class="user-chip-av" class:av-orb={!headerAccountAvatarUrl}>
								{#if headerAccountAvatarUrl}
									<img class="avatar-img" src={headerAccountAvatarUrl} alt={`${headerAccountName} avatar`} />
								{/if}
							</span>
							<span><RichText text={headerAccountName} emojis={headerAccount?.emojis ?? []} /></span>
							<Icon name="chevDown" width={14} height={14} />
						</button>
						{#if userMenuOpen}
							<div class="user-menu" data-testid="user-menu" role="menu">
								<button type="button" onclick={() => applyTheme('cream')}>Cream</button>
								<button type="button" onclick={() => applyTheme('dusk')}>Dusk</button>
								<button type="button" onclick={() => applyTheme('drive')}>Drive</button>
								<button type="button" onclick={() => applyTheme('simoun')}>Simoun</button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</header>

		<div class="app-shell-grid" class:search-grid={searchShell}>
			<aside class="app-left-sidebar" data-testid="left-sidebar">
				<ProfileMini account={currentSession?.account} instanceUrl={currentSession?.instanceUrl} />
				<div class="card app-side-card">
					<nav class="side-nav" aria-label="App sections">
						{#each navItems as item}
							<a href={item.href} class:active={isActive(item)} class="side-nav-item">
								<span class="ico"><Icon name={item.icon} width={18} height={18} /></span>
								<span>{item.label}</span>
								{#if item.count}<span class="count">{item.count}</span>{/if}
							</a>
						{/each}
					</nav>
					{#if route === 'settings'}
						<div class="side-sub" data-testid="settings-subnav">
							{#each settingsSubnav as item, i}
								<button type="button" class:active={i === 0} class="side-sub-item">{item}</button>
							{/each}
						</div>
					{:else}
						<div hidden data-testid="settings-subnav"></div>
					{/if}
				</div>
			</aside>

			<main class="app-content" data-testid="app-content">
				{#if route === 'home'}
					<section class="card app-feed-card">
						<div class="tabs" role="tablist" aria-label="Timeline sections">
							<a href="/app/home" role="tab" aria-selected="true" class="tab active">Home</a>
							<a href="/app/local" role="tab" aria-selected="false" class="tab">Local</a>
							<a href="/app/federated" role="tab" aria-selected="false" class="tab">Federated</a>
							<span class="tab-spacer"></span>
							<button type="button" class="tab-action" title="Filters"><Icon name="sliders" width={16} height={16} /></button>
						</div>

						<form class="composer" aria-label="Composer" onsubmit={(e) => { e.preventDefault(); submitHomePost(); }} ondragover={handleComposerDragOver} ondragleave={() => { composerDragActive = false; composerDragCount = 0; }} ondrop={handleComposerDrop} onpaste={handleComposerPaste}>
							<span class="composer-av" class:av-orb={!headerAccountAvatarUrl}>
								{#if headerAccountAvatarUrl}
									<img class="avatar-img" src={headerAccountAvatarUrl} alt={`${headerAccountName} avatar`} />
								{/if}
							</span>
							<div>
								<ComposerMentionEditor
									id="home-composer-editor"
									value={composerText}
									onInput={(value) => (composerText = value)}
									onMentionQuery={searchComposerMentionAccounts}
									accounts={composerMentionAccounts}
									emojis={composerCustomEmojis}
									insertRequest={composerInsertRequest}
									onSubmit={submitHomePost}
								/>
								<input bind:this={composerFileInput} class="sr-only" type="file" multiple tabindex="-1" aria-label="Attach media" accept="image/*,audio/*,video/*" onchange={handleComposerFileChange} />
								{#if composerUploads.length > 0}
									<div class="composer-uploads" aria-live="polite">
										{#each composerUploads as upload (upload.localId)}
											<div class="composer-upload-row" class:error={upload.status === 'error'} title={upload.error}>
												<div class={`composer-upload-thumb ${upload.kind}`}>{composerUploadBadge(upload.kind)}</div>
												<div class="composer-upload-meta">
													<div class="composer-upload-name">{upload.name}</div>
													<div class="composer-upload-prog-row">
														<div class="composer-upload-bar" role="progressbar" aria-label={`Upload progress for ${upload.name}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={upload.progress}><span style={`width:${upload.progress}%`}></span></div>
														<span class="composer-upload-pct">{upload.status === 'error' ? 'Error' : `${upload.progress}%`}</span>
													</div>
													{#if upload.error}<div class="composer-upload-error">{upload.error}</div>{/if}
												</div>
												<button type="button" class="composer-upload-rm" aria-label={`Remove ${upload.name}`} onclick={() => removeComposerUpload(upload.localId)}>×</button>
											</div>
										{/each}
									</div>
								{:else}
									<button type="button" class="composer-drop-slot" class:active={composerDragActive} onclick={pickComposerFiles}>
										<Icon name="upload" width={18} height={18} />
										<span>{#if composerDragActive}<strong>Drop to add {composerDragCount} {composerDragCount === 1 ? 'file' : 'files'}</strong> <span class="drop-copy-muted">· photos · audio · video</span>{:else}<strong>Drag &amp; drop</strong> <span class="drop-copy-muted">files to attach</span> <em>· or browse</em>{/if}</span>
										{#if !composerDragActive}<kbd>⌘V to paste</kbd>{/if}
									</button>
								{/if}
								{#if composerSpoilerActive}
									<ComposerCWPanel value={composerSpoilerText} onInput={(value) => (composerSpoilerText = value)} onRemove={clearComposerSpoiler} focusOnMount />
								{/if}
								{#if composerPoll}
									<ComposerPollPanel poll={composerPoll} onPollChange={(poll) => (composerPoll = poll)} onRemove={() => (composerPoll = null)} focusOnMount idPrefix="home-composer-poll" />
								{/if}
								<div class="composer-row">
									<button type="button" class="composer-tool" title="Image" aria-label="Image" onclick={pickComposerFiles}><Icon name="image" width={18} height={18} /></button>
									{#if composerUploads.length > 0}<button type="button" class="composer-tool" title="Add another" aria-label="Add another attachment" onclick={pickComposerFiles}><Icon name="plus" width={14} height={14} /></button>{/if}
									<button type="button" class="composer-tool" class:active={Boolean(composerPoll)} title="Poll" aria-label="Poll" aria-pressed={Boolean(composerPoll)} onclick={toggleComposerPoll}><Icon name="poll" width={18} height={18} /></button>
									<button type="button" class="composer-tool" class:active={composerEmojiPickerOpen} title="Emoji" aria-label="Emoji" aria-pressed={composerEmojiPickerOpen} data-emoji-trigger onclick={toggleComposerEmojiPicker}><Icon name="smile" width={18} height={18} /></button>
									<button type="button" class="composer-tool cw" class:active={composerSpoilerActive} aria-label="Content warning" aria-pressed={composerSpoilerActive} onclick={toggleComposerSpoiler}>CW</button>
									<button type="button" class="composer-tool privacy" aria-label="Privacy Public"><Icon name="globe" width={13} height={13} /><span>Public</span><Icon name="chevDown" width={12} height={12} /></button>
									<span class="composer-spacer"></span>
									<span class="composer-count" class:over-limit={composerRemaining < 0}>{composerRemaining}</span>
									<Button variant="primary" disabled={!canSubmitHomePost} onclick={submitHomePost}>{homePostSubmitState === 'submitting' ? 'Posting...' : 'Post'}</Button>
								</div>
								{#if homePostSubmitError}
									<div class="request-state request-error" role="alert">
										<h2>{homePostSubmitError.title}</h2>
										<p>{homePostSubmitError.message}</p>
									</div>
								{/if}
							</div>
							<EmojiPicker open={composerEmojiPickerOpen} emojis={composerCustomEmojis} recents={composerEmojiRecents} anchor={composerEmojiPickerAnchor} onClose={() => (composerEmojiPickerOpen = false)} onPick={insertComposerEmoji} />
						</form>
						{#each homeStatusActionErrors as actionError (`${actionError.targetId}:${actionError.key}`)}
							<div class="status-action-error" role="alert">
								<strong>{actionError.error.title}</strong>
								<span>{actionError.error.message}</span>
							</div>
						{/each}

						{#if homeTimelineState.status === 'success'}
							<TimelineNewPostsIndicator count={homeTimelineState.newerPosts.length} onActivate={showNewHomePosts} />
						{/if}

						{#if homeTimelineState.status === 'loading'}
							<div class="request-state" role="status" aria-label="Request status">Loading Pleroma data</div>
						{:else if homeTimelineState.status === 'empty'}
							<div class="request-state request-empty">
								<h2>No posts yet</h2>
								<p>Your home timeline is empty. Follow accounts to see posts here.</p>
							</div>
						{:else if homeTimelineState.status === 'error'}
							<div class="request-state request-error">
								<h2>{homeTimelineState.error.title}</h2>
								<p>{homeTimelineState.error.message}</p>
								{#if homeTimelineState.error.retryable && currentSession}
									<Button variant="secondary" onclick={retryHomeTimeline}>Retry request</Button>
								{/if}
							</div>
						{:else if homeTimelineState.status === 'success'}
							<div data-testid="home-timeline-list">
								{#each timelinePosts as post (post.id)}
									<Post {post} replyExpanded={inlineReplyOpenFor('home', post)} replyControlsId={inlineReplyOpenFor('home', post) ? inlineReplyComposerId('home', post) : undefined} onOpen={() => openThread(post)} onAction={(key) => handlePostAction(post, key)} />
									{#if inlineReplyOpenFor('home', post) && inlineReplyComposerProps}
										<InlineReplyComposer
											id={inlineReplyComposerId('home', post)}
											{...inlineReplyComposerProps}
										/>
									{/if}
								{/each}
							</div>
							<TimelineLoadMore
								nextCursor={homeTimelineState.nextCursor}
								loadMoreStatus={homeTimelineState.loadMoreStatus}
								loadMoreError={homeTimelineState.loadMoreError}
								onLoadMore={loadMoreHomeTimeline}
							/>
						{/if}
					</section>
				{:else if route === 'explore'}
					<section class="card app-panel app-explore-panel">
						<div class="app-page-kicker">Explore</div>
						<h1>Explore the network</h1>
						<p>Discover people, topics, and small communities across friendly Pleroma instances.</p>
						<form class="hero-search" role="search" onsubmit={submitExploreSearch}>
							<Icon name="search" width={16} height={16} />
							<input bind:value={exploreSearchDraft} type="search" aria-label="Search topics, people, and posts" placeholder="Search topics, people, and posts" />
							<Button variant="primary" type="submit">Search</Button>
						</form>
						<div class="hero-tags">
							<button type="button" class="tag">#fediverse</button>
							<button type="button" class="tag">#privacy</button>
							<button type="button" class="tag">#music</button>
						</div>
						<div class="explore-artwork" data-testid="explore-artwork"><Icon name="planet" width={58} height={58} /></div>
						<div class="explore-section-title">Suggested topics</div>
						<div class="explore-card-grid">
							{#each ['Small web', 'Pleroma admins', 'Cassette culture'] as topic}
								<article class="explore-card" data-testid="explore-topic-card">
									<strong>{topic}</strong>
									<span>Posts and people from friendly instances.</span>
								</article>
							{/each}
						</div>
						<div class="explore-section-title">Communities</div>
						<div class="explore-card-grid">
							{#each ['Federated CSS Garden', 'Retro Social Club', 'Instance Gardeners'] as community}
								<article class="explore-card explore-community" data-testid="explore-community-card">
									<div><strong>{community}</strong><span>Open community · weekly posts</span></div>
									<button type="button" aria-pressed={joinedCommunities[community] ? 'true' : 'false'} onclick={() => toggleCommunity(community)}>
										{joinedCommunities[community] ? `Joined ${community}` : `Join ${community}`}
									</button>
								</article>
							{/each}
						</div>
						<div class="explore-feed" data-testid="explore-feed">
							<div class="seg" role="tablist" aria-label="Discover feed">
								<button type="button" role="tab" aria-selected={exploreFeed === 'popular'} class:active={exploreFeed === 'popular'} onclick={() => (exploreFeed = 'popular')}>Popular</button>
								<button type="button" role="tab" aria-selected={exploreFeed === 'new'} class:active={exploreFeed === 'new'} onclick={() => (exploreFeed = 'new')}>New</button>
								<button type="button" role="tab" aria-selected={exploreFeed === 'active'} class:active={exploreFeed === 'active'} onclick={() => (exploreFeed = 'active')}>Active</button>
							</div>
							<p>{exploreFeedText}</p>
						</div>
					</section>
				{:else if route === 'search'}
					<section class="search-panel">
						<div class="se-pageframe card" data-testid="search-pageframe">
							<form class="se-bar" role="search" onsubmit={submitSearchPage}>
								<Icon name="search" width={18} height={18} />
								<input class="se-bar-input" value={searchPageDraft} type="search" aria-label="Search this instance and federation" placeholder="Search PleromaNet..." oninput={(event) => updateSearchPageDraft(event.currentTarget.value)} />
								<span class="se-bar-count">{searchResultTotal} {searchResultTotal === 1 ? 'result' : 'results'}</span>
							</form>
							<div class="se-tabs" role="tablist" aria-label="Search result types">
								<button type="button" role="tab" aria-selected={searchTab === 'all'} class="se-tab" class:active={searchTab === 'all'} onclick={() => setSearchTab('all')}>All <span class="se-tab-count">{searchResultTotal}</span></button>
								<button type="button" role="tab" aria-selected={searchTab === 'people'} class="se-tab" class:active={searchTab === 'people'} onclick={() => setSearchTab('people')}>People <span class="se-tab-count">{searchAccounts.length}</span></button>
								<button type="button" role="tab" aria-selected={searchTab === 'posts'} class="se-tab" class:active={searchTab === 'posts'} onclick={() => setSearchTab('posts')}>Posts <span class="se-tab-count">{searchPosts.length}</span></button>
								<span class="se-tabs-spacer"></span>
								<button type="button" class="se-tab-tool" class:on={searchSidebarOpen} aria-expanded={searchSidebarOpen} aria-controls="search-filter-sidebar" onclick={() => (searchSidebarOpen = !searchSidebarOpen)}>{searchSidebarOpen ? 'Hide filters ◂' : 'More filters ▸'}</button>
							</div>
							{#if searchSidebarOpen}
								<div class="se-v2-cols">
									<aside id="search-filter-sidebar" class="se-v2-side" data-testid="search-filter-sidebar">
										<div class="se-v2-side-head"><span class="se-v2-side-h">Filters</span><button type="button" class="se-v2-side-close" title="Close filters" onclick={() => (searchSidebarOpen = false)}>◂</button></div>
										<div class="se-v2-group"><div class="se-v2-group-l">Source</div><div class="se-v2-opt on">Federated</div><div class="se-v2-opt">This instance</div><div class="se-v2-opt">People you follow</div></div>
										<div class="se-v2-group"><div class="se-v2-group-l">Date</div><div class="se-v2-opt">Past 24 hours</div><div class="se-v2-opt on">Past week</div><div class="se-v2-opt">Past month</div><div class="se-v2-opt">All time</div></div>
										<div class="se-v2-group"><label class="se-v2-group-l" for="search-filter-user">From user</label><input id="search-filter-user" class="se-v2-input" placeholder="@user@server" disabled /></div>
										<div class="se-v2-group"><div class="se-v2-group-l">Has media</div><div class="se-v2-opt">Photos</div><div class="se-v2-opt">Audio</div><div class="se-v2-opt">Video</div></div>
										<div class="se-v2-group"><div class="se-v2-group-l">Sort</div><div class="se-v2-opt on">Most relevant</div><div class="se-v2-opt">Newest first</div><div class="se-v2-opt">Most boosted</div></div>
										<button type="button" class="se-v2-clear" disabled>CLEAR ALL</button>
									</aside>
									<div>{@render searchResultsBody()}</div>
								</div>
							{:else}
								{@render searchResultsBody()}
							{/if}
						</div>
					</section>
				{:else if route === 'thread'}
					<section class="card thread-view" data-testid="thread-view">
						<div class="thread-head-title">
							<button type="button" class="thread-back" aria-label="Back to home timeline" onclick={() => goto('/app/home')}><Icon name="arrowL" width={15} height={15} /></button>
							<h1>Thread</h1>
						</div>
						{#each threadStatusActionErrors as actionError (`${actionError.targetId}:${actionError.key}`)}
							<div class="status-action-error" role="alert">
								<strong>{actionError.error.title}</strong>
								<span>{actionError.error.message}</span>
							</div>
						{/each}
						{#if threadState.status === 'loading'}
							<div class="request-state" role="status" aria-label="Request status">Loading thread</div>
						{:else if threadState.status === 'error'}
							<div class="request-state request-error">
								<h2>{threadState.error.title}</h2>
								<p>{threadState.error.message}</p>
								{#if threadState.error.retryable && currentSession}
									<Button variant="secondary" onclick={retryThread}>Retry thread</Button>
								{/if}
							</div>
						{:else if threadState.status === 'success'}
							{#if threadState.ancestors.length > 0}
								<div class="thread-ancestors">
									{#each threadState.ancestors as ancestor (ancestor.id)}
										<div data-testid="thread-ancestor">
											<AncestorPost post={ancestor} replyExpanded={inlineReplyOpenFor('thread', ancestor)} replyControlsId={inlineReplyOpenFor('thread', ancestor) ? inlineReplyComposerId('thread', ancestor) : undefined} onAction={handleThreadPostAction} />
										</div>
										{#if inlineReplyOpenFor('thread', ancestor) && inlineReplyComposerProps}
											<InlineReplyComposer
												id={inlineReplyComposerId('thread', ancestor)}
												{...inlineReplyComposerProps}
											/>
										{/if}
									{/each}
								</div>
							{/if}
							<FocusedPost post={threadState.focused} continuesAbove={threadState.ancestors.length > 0} replyExpanded={inlineReplyOpenFor('thread', threadState.focused)} replyControlsId={inlineReplyOpenFor('thread', threadState.focused) ? inlineReplyComposerId('thread', threadState.focused) : undefined} onAction={handleThreadPostAction} />
							{#if inlineReplyOpenFor('thread', threadState.focused) && inlineReplyComposerProps}
								<InlineReplyComposer
									id={inlineReplyComposerId('thread', threadState.focused)}
									{...inlineReplyComposerProps}
								/>
							{/if}
							<div class="thread-reply-head">
								<div class="thread-reply-count" data-testid="thread-reply-count">{threadReplyCount} {threadReplyCount === 1 ? 'reply' : 'replies'}</div>
								<div class="seg" role="group" aria-label="Reply sort">
									<button type="button" aria-pressed={replySort === 'top'} class:active={replySort === 'top'} onclick={() => (replySort = 'top')}>Top</button>
									<button type="button" aria-pressed={replySort === 'newest'} class:active={replySort === 'newest'} onclick={() => (replySort = 'newest')}>Newest</button>
								</div>
							</div>
							<div class="thread-replies">
								{#each sortedThreadReplyPosts as reply, i (reply.id)}
									<div data-testid="thread-reply">
										<ReplyPost
											post={reply}
											isLast={i === sortedThreadReplyPosts.length - 1}
											nestedReplies={reply.nestedReplies}
											onAction={handleThreadPostAction}
											inlineReply={threadInlineReplyBinding}
											expandedReplyIds={expandedThreadReplyIds}
											onShowNested={showThreadReplyNested}
										/>
									</div>
								{/each}
							</div>
					{/if}
					</section>
				{:else if route === 'profile'}
					<section class="profile-route" data-testid="profile-route">
						{#each profileStatusActionErrors as actionError (`${actionError.targetId}:${actionError.key}`)}
							<div class="status-action-error" role="alert">
								<strong>{actionError.error.title}</strong>
								<span>{actionError.error.message}</span>
							</div>
						{/each}
						{#if profileRouteState.status === 'loading' || profileRouteState.status === 'idle'}
							<div class="card request-state" role="status" aria-label="Request status">Loading profile</div>
						{:else if profileRouteState.status === 'error'}
							<div class="card request-state request-error">
								<h2>{profileRouteState.error.title}</h2>
								<p>{profileRouteState.error.message}</p>
								{#if profileRouteState.error.retryable && currentSession}
									<Button variant="secondary" onclick={retryProfileRoute}>Retry profile</Button>
								{/if}
							</div>
						{:else}
							<ProfileView
								profile={profileRouteState.data.profile}
								posts={profileRouteState.data.posts}
								replies={profileRouteState.data.replies}
								pinned={profileRouteState.data.pinned}
								media={profileRouteState.data.media}
								timelineLoading={profileRouteState.timelineStatus === 'loading'}
								onPostOpen={(post) => openThread(post)}
								onPostAction={handleProfilePostAction}
								onEditProfile={() => goto('/app/settings')}
							/>
						{/if}
					</section>
				{:else if route === 'notifications'}
					<section class="card app-panel notifications-panel">
						<div class="notifications-head">
							<div>
								<div class="app-page-kicker">Notifications</div>
								<h1>Notifications</h1>
								<p>Mentions, follows, favorites, boosts, and Pleroma-specific events from your instance.</p>
							</div>
							<button type="button" class="btn-secondary" disabled={unreadNotificationCount === 0} onclick={markNotificationsRead}>Mark all read</button>
						</div>

						{#if notificationState.status === 'loading' || notificationState.status === 'idle'}
							<div class="request-state" role="status" aria-label="Request status">Loading notifications</div>
						{:else if notificationState.status === 'empty'}
							<div class="request-state request-empty">
								<h2>No notifications</h2>
								<p>Your instance has no notifications for this account yet.</p>
							</div>
						{:else if notificationState.status === 'error'}
							<div class="request-state request-error">
								<h2>{notificationState.error.title}</h2>
								<p>{notificationState.error.message}</p>
								{#if notificationState.error.retryable && currentSession}
									<Button variant="secondary" onclick={retryNotifications}>Retry notifications</Button>
								{/if}
							</div>
						{:else if notificationState.status === 'success'}
							<div class="notifications-list" data-testid="notifications-list">
								{#each notificationState.data as notification (notification.id)}
									<NotifRow n={notification} onOpen={openNotification} />
								{/each}
							</div>
						{/if}
					</section>
				{:else if route === 'settings'}
					<section class="card app-panel settings-panel">
						<div class="crumbs">Settings / Profile</div>
						<h1>Profile settings</h1>
						<p>Manage your profile information and how you appear to others.</p>
						<div class="settings-save-row"><span data-testid="settings-save-state">{settingsSaveState}</span><span>{profileBioCount}</span></div>
						<div class="upload-row" data-testid="avatar-upload-row"><button type="button" class="btn-secondary">Choose avatar</button><span>96×96px recommended</span></div>
						<div class="upload-row" data-testid="banner-upload-row"><button type="button" class="btn-secondary">Choose banner</button><span>Wide image recommended</span></div>
						<div class="field">
							<label class="field-label" for="display-name">Display name</label>
							<input id="display-name" class="input" value={profile.displayName} oninput={(event) => updateProfile('displayName', event.currentTarget.value)} />
						</div>
						<div class="field">
							<label class="field-label" for="username">Username</label>
							<input id="username" class="input" value={profile.username} oninput={(event) => updateProfile('username', event.currentTarget.value)} />
						</div>
						<div class="field">
							<label class="field-label" for="website">Website</label>
							<input id="website" class="input" value={profile.website} oninput={(event) => updateProfile('website', event.currentTarget.value)} />
						</div>
						<div class="field">
							<label class="field-label" for="location">Location</label>
							<input id="location" class="input" value={profile.location} oninput={(event) => updateProfile('location', event.currentTarget.value)} />
						</div>
						<div class="settings-toggles">
							<button type="button" role="switch" aria-label="Discoverable profile" aria-checked={profile.discoverable ? 'true' : 'false'} onclick={() => updateProfile('discoverable', !profile.discoverable)}>Discoverable profile</button>
							<button type="button" role="switch" aria-label="Allow search indexing" aria-checked={profile.indexable ? 'true' : 'false'} onclick={() => updateProfile('indexable', !profile.indexable)}>Allow search indexing</button>
							<button type="button" role="switch" aria-label="Show follower count" aria-checked={profile.showFollowers ? 'true' : 'false'} onclick={() => updateProfile('showFollowers', !profile.showFollowers)}>Show follower count</button>
						</div>
						<div class="settings-actions">
							<button type="button" class="btn-primary" onclick={saveProfile}>Save profile settings</button>
							<button type="button" class="btn-secondary" onclick={resetProfile}>Reset profile settings</button>
						</div>
					</section>
				{:else}
					<section class="card app-panel">
						<div class="app-page-kicker">App route</div>
						<h1>{placeholderHeading}</h1>
						<p>This route is now wired into the guarded app shell and ready for dedicated content.</p>
					</section>
				{/if}
			</main>

			<aside class="app-right-rail" data-testid="right-rail">
				{#if isTimelineRoute(route)}
					<div class="rail-title">Trends &amp; Activity</div>
					<SurfaceCard kind="trends" trendsState={trendsState} />
					<SurfaceCard kind="who-to-follow" />
					<SurfaceCard kind="shortcuts" />
					<SurfaceCard kind="instance-status" instanceState={instanceStatusState} />
				{:else if route === 'explore'}
					<div class="rail-title">Discover</div>
					<div aria-label="Quick search Explore"><SurfaceCard kind="quick-search" /></div>
					<div class="card rail-card"><div class="card-head"><span class="card-title">Known instances</span></div><div class="card-body">pleroma.example · retro.social</div></div>
					<div class="card rail-card"><div class="card-head"><span class="card-title">Discovery mode</span></div><div class="card-body">Popular across friendly instances</div></div>
				{:else if route === 'profile'}
					{#if profileRouteState.status === 'success'}
						<ProfileSideRail profile={profileRouteState.data.profile} pinned={profileRouteState.data.pinned} />
					{:else}
						<div class="card request-state" role="status" aria-label="Profile rail status">Loading profile</div>
					{/if}
				{:else if route === 'settings'}
					<div class="card surface-card surface-profile-preview" data-testid="profile-preview-card">
						<div class="surface-profile-head"><div>Profile preview</div></div>
						<div class="surface-preview-body">
							<div class="surface-preview-name">{profile.displayName}</div>
							<div class="surface-preview-handle">@{profile.username}@pleromanet.social</div>
							<div class="surface-preview-bio">{profile.bio}</div>
							<div class="surface-preview-note">This is how your profile appears to other users.</div>
						</div>
					</div>
					<div class="card surface-card" data-testid="profile-tips-card">
						<div class="card-head surface-head-quiet"><span class="surface-tip-title"><Icon name="info" width={14} height={14} />Profile tips</span></div>
						<div class="surface-tip-list"><div class="surface-tip"><Icon name="image" width={14} height={14} /><span>Your avatar will be shown at 96×96px.</span></div></div>
					</div>
				{:else if route !== 'search'}
					<SurfaceCard kind="profile-preview" />
					<SurfaceCard kind="profile-tips" />
				{/if}
			</aside>
		</div>

		<nav class="mobile-bottom" data-testid="mobile-bottom-nav" aria-label="Mobile app navigation">
			<a href="/app/home" class:active={route === 'home'} class="mob-tab"><Icon name="home" /><span>Home</span></a>
			<a href="/app/explore" class:active={route === 'explore'} class="mob-tab"><Icon name="search" /><span>Explore</span></a>
			<a href="/app/settings" class:active={route === 'settings'} class="mob-tab"><Icon name="gear" /><span>Settings</span></a>
			<button type="button" class="mob-tab" onclick={() => (mobileSheetOpen = true)}><Icon name="list" /><span>More</span></button>
		</nav>

		{#if mobileDrawerOpen}
			<button type="button" class="mobile-drawer-bg open" aria-label="Close navigation menu" onclick={() => (mobileDrawerOpen = false)}></button>
			<aside class="mobile-drawer open" data-testid="mobile-drawer">
				<div class="drawer-head">
					<div class="drawer-brand"><span class="brand-mark"><Icon name="sparkBig" /></span><span class="brand-name">PleromaNet<sup>™</sup></span></div>
					<button type="button" class="drawer-close" aria-label="Close navigation menu" onclick={() => (mobileDrawerOpen = false)}>×</button>
				</div>
				<nav class="side-nav" aria-label="Mobile sections">
					{#each navItems as item}
						<a href={item.href} class:active={isActive(item)} class="side-nav-item" onclick={() => (mobileDrawerOpen = false)}>
							<span class="ico"><Icon name={item.icon} width={18} height={18} /></span>
							<span>{item.label}</span>
							{#if item.count}<span class="count">{item.count}</span>{/if}
						</a>
					{/each}
				</nav>
			</aside>
		{/if}

		{#if mobileSheetOpen}
			<button type="button" class="mobile-sheet-bg open" aria-label="Dismiss details sheet" onclick={() => (mobileSheetOpen = false)}></button>
			<aside class="mobile-sheet open" data-testid="mobile-sheet">
				<div class="sheet-grip"></div>
				<div class="sheet-head"><span class="sheet-title">Details</span><button type="button" class="drawer-close" aria-label="Close details sheet" onclick={() => (mobileSheetOpen = false)}>×</button></div>
				<SurfaceCard kind="shortcuts" />
			</aside>
		{/if}
	</div>
{/if}
