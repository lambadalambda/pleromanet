<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AttachmentLightboxHost from '$lib/rebuild/AttachmentLightboxHost.svelte';
	import Button from '$lib/rebuild/Button.svelte';
	import Icon from '$lib/rebuild/Icon.svelte';
	import Post from '$lib/rebuild/Post.svelte';
	import ProfileMini from '$lib/rebuild/ProfileMini.svelte';
	import SurfaceCard from '$lib/rebuild/SurfaceCard.svelte';
	import TimelineLoadMore from '$lib/rebuild/TimelineLoadMore.svelte';
	import TimelineNewPostsIndicator from '$lib/rebuild/TimelineNewPostsIndicator.svelte';
	import { createPleromaClient } from '$lib/pleroma/client';
	import { readPleromaSession, signOutPleroma } from '$lib/pleroma/session';
	import { openPleromaTimelineStream } from '$lib/pleroma/streaming';
	import {
		mergeTimelineItems,
		prependTimelineItems,
		queueNewerTimelineItems,
		type PaginatedTimelineBaseState,
		type PaginatedTimelineSuccess
	} from '$lib/pleroma/timeline-state';
	import { adaptPleromaStatuses, normalizePleromaRequestError, type PleromaRequestErrorView, type PleromaStatusView } from '$lib/pleroma/ui';
	import type { BannerVariant, PostLike } from '$lib/rebuild/attachments';
	import type { IconName } from '$lib/rebuild/icons';
	import type { PleromaSession, PleromaStatus } from '$lib/pleroma/types';
	import type { SocialPost } from '$lib/social/types';
	import { onMount, tick } from 'svelte';

	type AppRoute = 'home' | 'local' | 'federated' | 'public' | 'thread' | 'profile' | 'notifications' | 'explore' | 'settings';
	type NavItem = { route: AppRoute; label: string; icon: IconName; href: string; count?: number };
	type ThemeName = 'cream' | 'dusk' | 'drive' | 'simoun';
	type ExploreFeed = 'popular' | 'new' | 'active';
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
	type ThreadReply = {
		id: string;
		name: string;
		body: string;
		boosts: number;
		favorites: number;
		boosted: boolean;
		favorited: boolean;
	};
	type RebuildPost = PostLike & {
		id: string | number;
		actionStatusId?: string;
		threadStatusId?: string;
		name: string;
		handle: string;
		time: string;
		avClass?: string;
		avBanner?: BannerVariant;
		avatarUrl?: string | null;
		body: string;
		replies: number;
		boosts: number;
		favs: number;
		addressees?: string[];
		copyJson?: unknown;
		actions: { reply: boolean; boost: boolean; fav: boolean };
	};
	type HomeTimelineSuccess = PaginatedTimelineSuccess<PleromaStatusView, PleromaRequestErrorView> & {
		newerPosts: PleromaStatusView[];
		newPostsStatus: 'idle' | 'checking';
	};
	type HomeTimelineState = PaginatedTimelineBaseState<PleromaRequestErrorView> | HomeTimelineSuccess;
	const HOME_TIMELINE_CHECK_EVENT = 'pleromanet:check-home-timeline';
	const HOME_TIMELINE_FALLBACK_INTERVAL_MS = 60_000;
	const HOME_TIMELINE_STREAM_RECONNECT_MS = HOME_TIMELINE_FALLBACK_INTERVAL_MS;
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
	let homeTimelineState = $state<HomeTimelineState>({ status: 'idle' });
	let localHomePosts = $state<RebuildPost[]>([]);
	let composerText = $state('');
	let mobileDrawerOpen = $state(false);
	let mobileSheetOpen = $state(false);
	let userMenuOpen = $state(false);
	let exploreFeed = $state<ExploreFeed>('popular');
	let joinedCommunities = $state<Record<string, boolean>>({});
	let settingsSaveState = $state('Saved');
	let profile = $state<ProfileSettings>({ ...defaultProfile });
	let savedProfile = $state<ProfileSettings>({ ...defaultProfile });
	let replyDraft = $state('');
	let replySort = $state<ReplySort>('top');
	let nestedReplyOpen = $state(false);
	let threadReplies = $state<ThreadReply[]>([
		{ id: 'logoff', name: 'packet ghost', body: 'we used to log off. when did that stop being a thing.', boosts: 12, favorites: 64, boosted: false, favorited: false },
		{ id: 'garden', name: 'gridwave', body: 'the timeline is still worth defending.', boosts: 4, favorites: 21, boosted: false, favorited: false },
		{ id: 'energy', name: 'lumen', body: 'this is the energy i needed today.', boosts: 7, favorites: 39, boosted: false, favorited: false }
	]);
	let homeTimelineRequestId = 0;
	let homeTimelineNewPostsRequestId = 0;
	let loadedHomeTimelineKey = '';
	let homeTimelineFallbackSinceId: string | null = null;
	let homeTimelineStreamKey = '';
	let closeHomeTimelineStream: (() => void) | null = null;
	let homeTimelineStreamReconnectTimer: number | null = null;
	const sessionKey = (session: PleromaSession | null) => session ? `${session.instanceUrl}\n${session.accessToken}\n${session.createdAt}` : '';
	const invalidateHomeTimelineRequests = () => {
		homeTimelineRequestId += 1;
		homeTimelineNewPostsRequestId += 1;
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
	};

	const navItems: NavItem[] = [
		{ route: 'home', label: 'Home', icon: 'home', href: '/app/home' },
		{ route: 'local', label: 'Local', icon: 'users', href: '/app/local' },
		{ route: 'federated', label: 'Federated', icon: 'globe', href: '/app/federated' },
		{ route: 'explore', label: 'Explore', icon: 'search', href: '/app/explore' },
		{ route: 'notifications', label: 'Notifications', icon: 'bell', href: '/app/notifications', count: 3 },
		{ route: 'settings', label: 'Settings', icon: 'gear', href: '/app/settings' },
	];
	const primaryNavItems = navItems.filter((item) => item.route === 'home' || item.route === 'explore' || item.route === 'settings');
	const timelineRoutes: AppRoute[] = ['home', 'local', 'federated', 'public', 'thread'];
	const settingsSubnav = ['Profile', 'Appearance', 'Notifications', 'Filters', 'Federation', 'Account', 'Import / Export', 'Development'];

	const avatarClass = (avatar: SocialPost['avatar']) =>
		avatar === 'pc' ? 'av-pixel-pc' :
		avatar === 'orb' ? 'av-orb' :
		avatar === 'grad-1' ? 'av-grad-1' :
		avatar === 'grad-2' ? 'av-grad-2' :
		avatar === 'grad-3' ? 'av-grad-3' :
		'av-anime';

	const postForRebuild = (post: SocialPost): RebuildPost => ({
		id: post.id,
		actionStatusId: post.actionStatusId,
		threadStatusId: post.threadStatusId,
		name: post.name,
		handle: post.handle,
		time: post.time,
		avClass: avatarClass(post.avatar),
		avatarUrl: post.avatarUrl,
		body: post.body,
		media: post.media,
		attachments: post.attachments,
		addressees: post.addressees,
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
	});
	const route = $derived<AppRoute>(
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
	const composerRemaining = $derived(500 - composerText.length);
	const timelinePosts = $derived([
		...localHomePosts,
		...(homeTimelineState.status === 'success' ? homeTimelineState.data.map(postForRebuild) : [])
	]);
	const profileBioCount = $derived(`${profile.bio.length} / 160`);
	const replyRemaining = $derived(500 - replyDraft.length);
	const sortedThreadReplies = $derived(replySort === 'newest' ? [...threadReplies].reverse() : threadReplies);
	const exploreFeedText = $derived(
		exploreFeed === 'popular' ? 'Popular across friendly instances' :
		exploreFeed === 'new' ? 'Fresh instance dispatches' :
		'Most replied threads'
	);
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
	const toggleCommunity = (community: string) => {
		joinedCommunities = { ...joinedCommunities, [community]: !joinedCommunities[community] };
	};
	const toggleReplyAction = (id: string, action: 'boost' | 'favorite') => {
		threadReplies = threadReplies.map((reply) => {
			if (reply.id !== id) return reply;
			if (action === 'boost') {
				const boosted = !reply.boosted;
				return { ...reply, boosted, boosts: reply.boosts + (boosted ? 1 : -1) };
			}

			const favorited = !reply.favorited;
			return { ...reply, favorited, favorites: reply.favorites + (favorited ? 1 : -1) };
		});
	};
	const submitReply = () => {
		const body = replyDraft.trim();
		if (!body) return;

		threadReplies = [
			...threadReplies,
			{ id: `local-${Date.now()}`, name: 'quiet admin', body, boosts: 0, favorites: 0, boosted: false, favorited: false }
		];
		replyDraft = '';
	};
	const submitHomePost = () => {
		const body = composerText.trim();
		if (!body) return;

		localHomePosts = [
			{
				id: `local-${Date.now()}`,
				name: 'quiet admin',
				handle: '@quietadmin@pleroma.example',
				time: 'now',
				avClass: 'av-orb',
				body,
				replies: 0,
				boosts: 0,
				favs: 0,
				actions: { reply: false, boost: false, fav: false }
			},
			...localHomePosts
		];
		composerText = '';
	};
	const handlePostAction = (postId: string | number, key: string) => {
		if (key !== 'reply' && key !== 'boost' && key !== 'fav') return;

		localHomePosts = localHomePosts.map((post) => {
			if (post.id !== postId) return post;
			const actionKey = key;
			const active = !post.actions[actionKey];
			return {
				...post,
				replies: key === 'reply' ? post.replies + (active ? 1 : -1) : post.replies,
				actions: { ...post.actions, [actionKey]: active }
			};
		});

		if (homeTimelineState.status !== 'success') return;
		homeTimelineState = {
			...homeTimelineState,
			data: homeTimelineState.data.map((post) => {
				if (post.id !== postId) return post;
				if (key === 'reply') {
					const reply = !post.actions.reply;
					return { ...post, replies: post.replies + (reply ? 1 : -1), actions: { ...post.actions, reply } };
				}

				if (key === 'boost') return { ...post, actions: { ...post.actions, boost: !post.actions.boost } };
				return { ...post, actions: { ...post.actions, favorite: !post.actions.favorite } };
			})
		};
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
		if (event.key !== 'Escape') return;
		userMenuOpen = false;
		mobileDrawerOpen = false;
		mobileSheetOpen = false;
	};
	const redirectToLanding = () => {
		invalidateHomeTimelineRequests();
		closeHomeTimelineStreaming();
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
			closeHomeTimelineStreaming();
			loadedHomeTimelineKey = '';
			homeTimelineFallbackSinceId = null;
			currentSession = session;
		}
		sessionReady = true;
		return session;
	};
	const queueStreamedHomeStatus = (requestSessionKey: string, status: PleromaStatus) => {
		if (!isCurrentSessionRequest(requestSessionKey)) return;

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
		if (route !== 'home') return;

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
	const showNewHomePosts = async () => {
		if (homeTimelineState.status !== 'success' || homeTimelineState.newerPosts.length === 0) return;

		const beforeHeight = document.documentElement.scrollHeight;
		const beforeScrollY = window.scrollY;
		homeTimelineState = {
			...homeTimelineState,
			data: prependTimelineItems(homeTimelineState.data, homeTimelineState.newerPosts),
			newerPosts: []
		};
		await tick();

		const heightDelta = document.documentElement.scrollHeight - beforeHeight;
		if (heightDelta > 0) window.scrollTo(window.scrollX, beforeScrollY + heightDelta);
	};
	const retryHomeTimeline = () => {
		if (currentSession) void loadHomeTimeline(currentSession);
	};

	onMount(() => {
		const storedTheme = localStorage.getItem('pn-theme');
		if (storedTheme === 'dusk' || storedTheme === 'drive' || storedTheme === 'simoun') applyTheme(storedTheme);
		mounted = true;

		const triggerHomeTimelineCheck = () => {
			if (route === 'home') void checkHomeTimelineForNewPosts();
		};
		window.addEventListener(HOME_TIMELINE_CHECK_EVENT, triggerHomeTimelineCheck);
		const checkInterval = window.setInterval(triggerHomeTimelineCheck, HOME_TIMELINE_FALLBACK_INTERVAL_MS);

		return () => {
			invalidateHomeTimelineRequests();
			closeHomeTimelineStreaming();
			window.removeEventListener(HOME_TIMELINE_CHECK_EVENT, triggerHomeTimelineCheck);
			window.clearInterval(checkInterval);
		};
	});

	$effect(() => {
		const pathname = page.url.pathname;
		if (!mounted) return;

		const session = readSessionOrRedirect();
		if (!session) return;
		if (pathname.startsWith('/app/home')) {
			const loadKey = `${sessionKey(session)}\n${pathname}`;
			if (loadedHomeTimelineKey !== loadKey) {
				loadedHomeTimelineKey = loadKey;
				void loadHomeTimeline(session);
			}
		} else {
			invalidateHomeTimelineRequests();
			loadedHomeTimelineKey = '';
			closeHomeTimelineStreaming();
		}
	});
</script>

<svelte:head>
	<title>PleromaNet · App</title>
</svelte:head>

<svelte:window onkeydown={handleWindowKeydown} />

<AttachmentLightboxHost />

{#if sessionReady}
	<div class="app-route-shell">
		<header class="app-header" data-testid="app-header">
			<div class="app-header-inner">
				<button type="button" class="menu-btn app-mobile-menu" aria-label="Open navigation menu" onclick={() => (mobileDrawerOpen = true)}>
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
				</button>
				<a href="/app/home" class="app-brand" onclick={closeMobilePanels}>
					<span class="brand-mark"><Icon name="sparkBig" /></span>
					<span class="brand-name">PleromaNet<sup>™</sup></span>
				</a>
				<nav class="app-primary-nav" aria-label="Primary">
					{#each primaryNavItems as item}
						<a href={item.href} class:active={isActive(item)}>{item.label}</a>
					{/each}
				</nav>
				<label class="app-search">
					<Icon name="search" width={15} height={15} />
					<input type="search" aria-label="Search PleromaNet" placeholder="Search PleromaNet" />
				</label>
				<button type="button" class="user-chip" aria-label="quiet admin account menu" onclick={() => (userMenuOpen = !userMenuOpen)}>
					<span class="notif-av av-orb"></span>
					<span>quiet admin</span>
					<Icon name="chevDown" width={12} height={12} />
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
		</header>

		<div class="app-shell-grid">
			<aside class="app-left-sidebar" data-testid="left-sidebar">
				<ProfileMini />
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

						<form class="composer" aria-label="Composer" onsubmit={(e) => { e.preventDefault(); submitHomePost(); }}>
							<span class="composer-av"><span class="av-orb"></span></span>
							<div>
								<textarea class="composer-input" aria-label="Post text" placeholder="What's on your mind?" bind:value={composerText}></textarea>
								<div class="composer-row">
									<button type="button" class="composer-tool" title="Image" aria-label="Image"><Icon name="image" width={18} height={18} /></button>
									<button type="button" class="composer-tool" title="Poll" aria-label="Poll"><Icon name="poll" width={18} height={18} /></button>
									<button type="button" class="composer-tool" title="Emoji" aria-label="Emoji"><Icon name="smile" width={18} height={18} /></button>
									<button type="button" class="composer-tool cw" aria-label="Content warning">CW</button>
									<button type="button" class="composer-tool privacy" aria-label="Privacy Public"><Icon name="globe" width={13} height={13} /><span>Public</span><Icon name="chevDown" width={12} height={12} /></button>
									<span class="composer-spacer"></span>
									<span class="composer-count">{composerRemaining}</span>
									<Button variant="primary" disabled={!composerText.trim()} onclick={submitHomePost}>Post</Button>
								</div>
							</div>
						</form>

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
									<Post {post} onAction={(key) => handlePostAction(post.id, key)} />
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
						<label class="hero-search">
							<Icon name="search" width={16} height={16} />
							<input type="search" aria-label="Search topics, people, and posts" placeholder="Search topics, people, and posts" />
							<Button variant="primary">Search</Button>
						</label>
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
				{:else if route === 'thread'}
					<section class="card thread-view" data-testid="thread-view">
						<div class="thread-head-title">
							<button type="button" class="thread-back" aria-label="Back to home timeline" onclick={() => goto('/app/home')}><Icon name="arrowL" width={15} height={15} /></button>
							<h1>Thread</h1>
						</div>
						<article class="thread-ancestor" data-testid="thread-ancestor">
							<div class="thread-line" data-testid="thread-line"></div>
							<strong>gridwave</strong>
							<p>the best interfaces leave enough room for people to breathe.</p>
						</article>
						<article class="focused-post" data-testid="focused-post">
							<div class="focused-name">quiet admin</div>
							<p class="focused-body">quiet CSS can still carry the voice.</p>
							<div class="focused-meta">4:18 PM · May 11, 2026 · PleromaNet™ Web · 12.4K views</div>
							<div class="focused-engagement" data-testid="focused-engagement"><strong>12 Boosts</strong><strong>28 Favorites</strong></div>
						</article>
						<form class="thread-reply-composer" aria-label="Thread reply" onsubmit={(event) => { event.preventDefault(); submitReply(); }}>
							<span class="composer-av"><span class="av-orb"></span></span>
							<div>
								<textarea class="composer-input" aria-label="Reply text" placeholder="Reply to quiet admin" bind:value={replyDraft}></textarea>
								<div class="composer-row"><span data-testid="reply-composer-count">{replyRemaining}</span><span class="composer-spacer"></span><Button variant="primary" disabled={!replyDraft.trim()} onclick={submitReply}>Reply</Button></div>
							</div>
						</form>
						<div class="thread-reply-head">
							<div class="thread-reply-count" data-testid="thread-reply-count">{threadReplies.length} replies</div>
							<div class="seg" role="group" aria-label="Reply sort">
								<button type="button" aria-pressed={replySort === 'top'} class:active={replySort === 'top'} onclick={() => (replySort = 'top')}>Top</button>
								<button type="button" aria-pressed={replySort === 'newest'} class:active={replySort === 'newest'} onclick={() => (replySort = 'newest')}>Newest</button>
							</div>
						</div>
						<div class="thread-replies">
							{#each sortedThreadReplies as reply (reply.id)}
								<article class="post post-reply" data-testid="thread-reply">
									<div class="post-av av-grad-3"></div>
									<div>
										<strong>{reply.name}</strong>
										<p>{reply.body}</p>
										<div class="focused-actions">
											<button type="button" class="focused-action" class:active={reply.boosted} aria-pressed={reply.boosted ? 'true' : 'false'} onclick={() => toggleReplyAction(reply.id, 'boost')}>Boost {reply.boosts}</button>
											<button type="button" class="focused-action" class:active={reply.favorited} aria-pressed={reply.favorited ? 'true' : 'false'} onclick={() => toggleReplyAction(reply.id, 'favorite')}>Favorite {reply.favorites}</button>
										</div>
										{#if reply.id === 'logoff'}
											<button type="button" class="show-replies" onclick={() => (nestedReplyOpen = true)}>Show 1 reply</button>
											{#if nestedReplyOpen}<div class="nested-replies">around the time the algorithm replaced the timeline.</div>{/if}
										{/if}
									</div>
								</article>
							{/each}
						</div>
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
					<SurfaceCard kind="trends" />
					<SurfaceCard kind="who-to-follow" />
					<SurfaceCard kind="shortcuts" />
					<SurfaceCard kind="instance-status" />
				{:else if route === 'explore'}
					<div class="rail-title">Discover</div>
					<div aria-label="Quick search Explore"><SurfaceCard kind="quick-search" /></div>
					<div class="card rail-card"><div class="card-head"><span class="card-title">Known instances</span></div><div class="card-body">pleroma.example · retro.social</div></div>
					<div class="card rail-card"><div class="card-head"><span class="card-title">Discovery mode</span></div><div class="card-body">Popular across friendly instances</div></div>
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
				{:else}
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
