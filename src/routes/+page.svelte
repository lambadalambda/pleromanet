<script lang="ts">
	import { browser } from '$app/environment';
	import Composer from '$lib/components/Composer.svelte';
	import TimelinePostCard from '$lib/components/TimelinePostCard.svelte';
	import PnIcon from '$lib/PnIcon.svelte';
	import type { ActionState, PostAction, ReplySort, ThreadPost, TimelinePost, TimelineView } from '$lib/social/types';
	import { onMount, tick } from 'svelte';

	type View = 'home' | 'local' | 'federated' | 'thread' | 'explore' | 'settings' | 'about';
	type Theme = 'cream' | 'dusk' | 'drive' | 'simoun';
	type SidebarIcon = 'home' | 'users' | 'globe' | 'bell' | 'message' | 'bookmark' | 'list' | 'gear';
	type FollowSuggestion = {
		id: string;
		name: string;
		handle: string;
		avatar: 'anime' | 'pc' | 'grad';
	};

	const primaryNav: Array<{ id: View; label: string }> = [
		{ id: 'home', label: 'Home' },
		{ id: 'local', label: 'Local' },
		{ id: 'federated', label: 'Federated' },
		{ id: 'explore', label: 'Explore' },
		{ id: 'about', label: 'About' }
	];

	const sidebarNav: Array<{
		id: View | 'notifications' | 'messages' | 'bookmarks' | 'lists';
		label: string;
		icon: SidebarIcon;
		count?: string;
		target?: View;
	}> = [
		{ id: 'home', label: 'Home', icon: 'home', target: 'home' },
		{ id: 'local', label: 'Local', icon: 'users', target: 'local' },
		{ id: 'federated', label: 'Federated', icon: 'globe', target: 'federated' },
		{ id: 'notifications', label: 'Notifications', icon: 'bell', count: '3' },
		{ id: 'messages', label: 'Messages', icon: 'message' },
		{ id: 'bookmarks', label: 'Bookmarks', icon: 'bookmark' },
		{ id: 'lists', label: 'Lists', icon: 'list' },
		{ id: 'settings', label: 'Settings', icon: 'gear', target: 'settings' }
	];

	const settingsTabs = [
		'Profile',
		'Appearance',
		'Notifications',
		'Filters',
		'Federation',
		'Account',
		'Import / Export',
		'Development'
	];

	const themeOptions: Array<{ id: Theme; label: string }> = [
		{ id: 'cream', label: 'Cream' },
		{ id: 'dusk', label: 'Dusk' },
		{ id: 'drive', label: 'Drive' },
		{ id: 'simoun', label: 'Simoun' }
	];
	const privacyOptions = ['Public', 'Unlisted', 'Followers'] as const;

	const timelineTabs: Array<{ id: TimelineView; label: string }> = [
		{ id: 'home', label: 'Home' },
		{ id: 'local', label: 'Local' },
		{ id: 'federated', label: 'Federated' }
	];

	const mockTimelinePosts: TimelinePost[] = [
		{
			id: 'post-soft-css',
			timelines: ['home', 'local'],
			name: 'soft.hertz',
			handle: '@soft.hertz@kolektiva.social',
			time: '8m',
			body: 'quiet CSS can still be expressive when the spacing carries the voice.',
			avatar: 'grad-3',
			replies: 4,
			boosts: 12,
			favorites: 28,
			actions: { reply: false, boost: false, favorite: false }
		},
		{
			id: 'post-federated-gardens',
			timelines: ['home', 'federated'],
			name: 'datagram',
			handle: '@datagram@retro.social',
			time: '21m',
			body: 'Federated timelines feel best when they preserve context without shouting about it.',
			avatar: 'pc',
			media: 'city',
			replies: 2,
			boosts: 7,
			favorites: 16,
			actions: { reply: false, boost: false, favorite: false }
		},
		{
			id: 'post-local-composer',
			timelines: ['home', 'local'],
			name: 'nyan.binary',
			handle: '@nyan@catgirl.cloud',
			time: '42m',
			body: 'Local mutuals are comparing composer affordances and somehow the GIF button is winning.',
			avatar: 'orb',
			replies: 6,
			boosts: 4,
			favorites: 22,
			actions: { reply: false, boost: false, favorite: false }
		}
	];

	const trends = [
		{ rank: 1, tag: '#fediverse', count: '12.4K' },
		{ rank: 2, tag: '#IndieWeb', count: '6,213' },
		{ rank: 3, tag: '#pleroma', count: '5,105' },
		{ rank: 4, tag: '#vaporwave', count: '3,901' },
		{ rank: 5, tag: '#selfhosted', count: '2,844' }
	];

	const suggestions: FollowSuggestion[] = [
		{ id: 'nyan', name: 'nyan.binary', handle: '@nyan@catgirl.cloud', avatar: 'anime' },
		{
			id: 'datagram',
			name: 'datagram',
			handle: '@datagram@a-very-long-retro-instance-name.social',
			avatar: 'pc'
		},
		{ id: 'soft', name: 'soft.hertz', handle: '@soft.hertz@kolektiva.social', avatar: 'grad' }
	];

	const shortcuts = [
		{ label: 'Compose new post', key: 'N' },
		{ label: 'Direct messages', key: 'M' },
		{ label: 'Bookmarks', key: 'B' },
		{ label: 'Lists', key: 'L' },
		{ label: 'User settings', key: 'S' }
	];

	const threadAncestors: ThreadPost[] = [
		{
			id: 'ancestor-gridwave',
			name: 'gridwave',
			handle: '@gridwave@retro.social',
			time: '5h',
			body: 'anyone else feel like the web got a little too loud lately?',
			avatar: 'pc',
			replies: 18,
			boosts: 42,
			favorites: 210,
			actions: { reply: false, boost: false, favorite: false }
		}
	];

	const mockThreadReplies: ThreadPost[] = [
		{
			id: 'reply-datagram',
			name: 'datagram',
			handle: '@datagram@retro.social',
			time: '34m',
			body: 'we used to log off. when did that stop being a thing.',
			avatar: 'pc',
			replies: 4,
			boosts: 12,
			favorites: 64,
			actions: { reply: false, boost: false, favorite: false },
			nestedReplies: [
				{
					id: 'reply-orbit',
					name: 'orbit',
					handle: '@orbit@spacebear.net',
					time: '20m',
					body: 'around the time the algorithm replaced the timeline.',
					avatar: 'orb',
					replies: 0,
					boosts: 5,
					favorites: 22,
					actions: { reply: false, boost: false, favorite: false }
				}
			]
		},
		{
			id: 'reply-nyan',
			name: 'nyan.binary',
			handle: '@nyan@catgirl.cloud',
			time: '12m',
			body: 'this is the energy i needed today.',
			avatar: 'orb',
			replies: 2,
			boosts: 3,
			favorites: 18,
			actions: { reply: false, boost: false, favorite: false },
			nestedReplies: [
				{
					id: 'reply-dreambyte',
					name: 'dreambyte',
					handle: '@dreambyte@pleromanet.social',
					time: '8m',
					body: 'saving this thread for later.',
					avatar: 'grad-1',
					replies: 0,
					boosts: 0,
					favorites: 4,
					actions: { reply: false, boost: false, favorite: false }
				}
			]
		},
		{
			id: 'reply-soft',
			name: 'soft.hertz',
			handle: '@soft.hertz@kolektiva.social',
			time: '22m',
			body: 'touched grass too. recommend the slow internet diet.',
			avatar: 'grad-3',
			replies: 0,
			boosts: 7,
			favorites: 31,
			actions: { reply: false, boost: false, favorite: false }
		}
	];
	const cloneThreadPost = (post: ThreadPost): ThreadPost => ({
		...post,
		actions: { ...post.actions },
		nestedReplies: post.nestedReplies?.map(cloneThreadPost)
	});
	const createMockThreadReplies = () => mockThreadReplies.map(cloneThreadPost);

	let activeView = $state<View>('home');
	let userMenuOpen = $state(false);
	let drawerOpen = $state(false);
	let sheetOpen = $state(false);
	let privacyMenuOpen = $state(false);
	let theme = $state<Theme>('cream');
	let composerText = $state('');
	let composerPrivacy = $state<(typeof privacyOptions)[number]>('Public');
	let previousTimeline = $state<TimelineView>('home');
	let threadPostId = $state<string | null>(null);
	let threadOpenerPostId = $state<string | null>(null);
	let replyDraft = $state('');
	let replySort = $state<ReplySort>('top');
	let expandedReplyIds = $state<Record<string, boolean>>({});
	let threadRepliesByPostId = $state<Record<string, ThreadPost[]>>({});
	let timelinePosts = $state<TimelinePost[]>(
		mockTimelinePosts.map((post) => ({
			...post,
			timelines: [...post.timelines],
			actions: { ...post.actions }
		}))
	);
	let following = $state<Record<string, boolean>>({});

	const isTheme = (value: string | null): value is Theme =>
		value === 'cream' || value === 'dusk' || value === 'drive' || value === 'simoun';
	const isTimelineView = (view: View): view is TimelineView =>
		view === 'home' || view === 'local' || view === 'federated';
	const actionCount = (post: { replies: number; boosts: number; favorites: number; actions: ActionState }, action: PostAction) => {
		const base = action === 'reply' ? post.replies : action === 'boost' ? post.boosts : post.favorites;

		return base + (post.actions[action] ? 1 : 0);
	};
	const replyAgeMinutes = (time: string) => {
		if (time === 'now') return -1;

		const value = Number.parseInt(time, 10);
		if (!Number.isFinite(value)) return Number.MAX_SAFE_INTEGER;
		if (time.endsWith('m')) return value;
		if (time.endsWith('h')) return value * 60;
		if (time.endsWith('d')) return value * 1_440;

		return Number.MAX_SAFE_INTEGER;
	};

	const viewTitle = $derived(
		activeView === 'settings'
			? 'Profile settings'
			: activeView === 'thread'
				? 'Thread'
			: `${activeView.slice(0, 1).toUpperCase()}${activeView.slice(1)} timeline`
	);
	const activeTimeline = $derived(isTimelineView(activeView) ? activeView : previousTimeline);
	const visibleTimelinePosts = $derived(
		timelinePosts.filter((post) => post.timelines.includes(activeTimeline))
	);
	const focusedThreadPost = $derived(timelinePosts.find((post) => post.id === threadPostId) ?? timelinePosts[0]);
	const threadReplies = $derived(threadPostId ? (threadRepliesByPostId[threadPostId] ?? []) : []);
	const sortedThreadReplies = $derived(
		replySort === 'newest'
			? [...threadReplies].sort((first, second) => replyAgeMinutes(first.time) - replyAgeMinutes(second.time))
			: threadReplies
	);
	const replyRemainingCharacters = $derived(500 - replyDraft.length);
	const remainingCharacters = $derived(500 - composerText.length);
	const canPost = $derived(composerText.trim().length > 0 && remainingCharacters >= 0);
	const canReply = $derived(replyDraft.trim().length > 0 && replyRemainingCharacters >= 0);

	const railTitle = $derived(
		activeView === 'explore'
			? 'Discover'
			: activeView === 'settings'
				? 'Profile Preview'
				: 'Trends & Activity'
	);

	const selectView = (view: View) => {
		if (isTimelineView(view)) {
			previousTimeline = view;
			threadPostId = null;
			threadOpenerPostId = null;
			replyDraft = '';
			expandedReplyIds = {};
		}

		activeView = view;
		drawerOpen = false;
		sheetOpen = false;
		privacyMenuOpen = false;
	};
	const focusAfterUpdate = async (id: string) => {
		if (!browser) return;

		await tick();
		document.getElementById(id)?.focus();
	};
	const ensureThreadReplies = (postId: string) => {
		if (threadRepliesByPostId[postId]) return;

		threadRepliesByPostId = { ...threadRepliesByPostId, [postId]: createMockThreadReplies() };
	};
	const openThread = (postId: string) => {
		ensureThreadReplies(postId);
		previousTimeline = activeTimeline;
		threadPostId = postId;
		threadOpenerPostId = postId;
		activeView = 'thread';
		drawerOpen = false;
		sheetOpen = false;
		privacyMenuOpen = false;
		expandedReplyIds = {};
		if (browser) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			void focusAfterUpdate('thread-back');
		}
	};
	const closeThread = () => {
		const openerPostId = threadOpenerPostId;

		activeView = previousTimeline;
		threadPostId = null;
		threadOpenerPostId = null;
		replyDraft = '';
		expandedReplyIds = {};
		if (openerPostId) void focusAfterUpdate(`thread-opener-${openerPostId}`);
	};
	const publishPost = () => {
		const body = composerText.trim();

		if (!body || body.length > 500) return;

		timelinePosts = [
			{
				id: `local-${Date.now()}`,
				timelines: [activeTimeline],
				name: 'dreambyte',
				handle: '@dreambyte@pleromanet.social',
				time: 'now',
				body,
				avatar: 'grad-1',
				replies: 0,
				boosts: 0,
				favorites: 0,
				actions: { reply: false, boost: false, favorite: false }
			},
			...timelinePosts
		];
		composerText = '';
	};
	const togglePostAction = (postId: string, action: PostAction) => {
		timelinePosts = timelinePosts.map((post) =>
			post.id === postId
				? { ...post, actions: { ...post.actions, [action]: !post.actions[action] } }
				: post
		);
	};
	const updateThreadReplyAction = (
		replies: ThreadPost[],
		replyId: string,
		action: PostAction
	): ThreadPost[] =>
		replies.map((reply) => ({
			...reply,
			actions:
				reply.id === replyId
					? { ...reply.actions, [action]: !reply.actions[action] }
					: reply.actions,
			nestedReplies: reply.nestedReplies
				? updateThreadReplyAction(reply.nestedReplies, replyId, action)
				: reply.nestedReplies
		}));
	const toggleThreadReplyAction = (replyId: string, action: PostAction) => {
		if (!threadPostId) return;

		threadRepliesByPostId = {
			...threadRepliesByPostId,
			[threadPostId]: updateThreadReplyAction(threadReplies, replyId, action)
		};
	};
	const toggleFollow = (id: string) => {
		following = { ...following, [id]: !following[id] };
	};
	const toggleNestedReplies = (id: string) => {
		expandedReplyIds = { ...expandedReplyIds, [id]: !expandedReplyIds[id] };
	};
	const submitThreadReply = () => {
		if (!canReply || !threadPostId) return;

		threadRepliesByPostId = {
			...threadRepliesByPostId,
			[threadPostId]: [
				{
					id: `reply-${Date.now()}`,
					name: 'dreambyte',
					handle: '@dreambyte@pleromanet.social',
					time: 'now',
					body: replyDraft.trim(),
					avatar: 'grad-1',
					replies: 0,
					boosts: 0,
					favorites: 0,
					actions: { reply: false, boost: false, favorite: false }
				},
				...threadReplies
			]
		};
		replyDraft = '';
	};

	const closeOverlays = () => {
		userMenuOpen = false;
		drawerOpen = false;
		sheetOpen = false;
		privacyMenuOpen = false;
	};

	onMount(() => {
		const savedTheme = localStorage.getItem('pn-theme');

		if (isTheme(savedTheme)) {
			theme = savedTheme;
		}

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeOverlays();
		};

		document.addEventListener('keydown', handleKeydown);

		return () => document.removeEventListener('keydown', handleKeydown);
	});

	$effect(() => {
		if (!browser) return;

		document.documentElement.dataset.theme = theme;
		localStorage.setItem('pn-theme', theme);
	});
</script>

<svelte:head>
	<title>PleromaNet</title>
	<meta
		name="description"
		content="PleromaNet is a reduced, refined SvelteKit frontend for Pleroma."
	/>
</svelte:head>

<main class="pn-page app-shell-page">
	<header class="app-header" data-testid="app-header">
		<div class="app-header__inner">
			<div class="app-brand">
				<button
					class="mobile-menu-button"
					type="button"
					aria-label="Open navigation menu"
					onclick={() => (drawerOpen = true)}
				>
					<span></span>
					<span></span>
					<span></span>
				</button>
				<div class="brand-mark" aria-hidden="true">
					<svg viewBox="0 0 32 32" fill="none">
						<path
							d="M16 3v9M16 20v9M3 16h9M20 16h9M7 7l5 5M20 20l5 5M25 7l-5 5M12 20l-5 5"
							stroke="currentColor"
							stroke-width="1.4"
							stroke-linecap="round"
						/>
						<circle cx="16" cy="16" r="2" fill="currentColor" />
					</svg>
				</div>
				<div class="brand-wordmark">PleromaNet<sup>™</sup></div>
				<div class="brand-tag">A federated<br />social web</div>
			</div>

			<nav class="primary-nav" aria-label="Primary">
				{#each primaryNav as item}
					<button
						class:active={activeView === item.id}
						type="button"
						aria-current={activeView === item.id ? 'page' : undefined}
						onclick={() => selectView(item.id)}
					>
						{item.label}
					</button>
				{/each}
			</nav>

			<div class="header-actions">
				<label class="header-search">
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.5" />
						<path d="m16 16 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
					<input type="search" aria-label="Search PleromaNet" placeholder="Search..." />
					<span class="keyboard-hint">⌘K</span>
				</label>
				<button class="notify-button" type="button" aria-label="Notifications">
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15L6 17z"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linejoin="round"
						/>
						<path d="M10 21h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
					<span>3</span>
				</button>
				<button
					class="user-chip"
					type="button"
					aria-label="dreambyte account menu"
					aria-expanded={userMenuOpen}
					onclick={() => (userMenuOpen = !userMenuOpen)}
				>
					<span class="mini-avatar" aria-hidden="true"></span>
					<span>dreambyte</span>
				</button>
			</div>
		</div>
	</header>

	{#if userMenuOpen}
		<button class="user-menu-scrim" type="button" aria-label="Close user menu" onclick={closeOverlays}></button>
		<div class="user-menu" data-testid="user-menu">
			<div class="user-menu__head">
				<span class="pn-avatar" aria-hidden="true"></span>
				<div>
					<div class="user-menu__name">dreambyte</div>
					<div class="user-menu__handle">@dreambyte@pleromanet.social</div>
				</div>
			</div>
			<div class="user-menu__stats">
				<div><strong>1,248</strong><span>Posts</span></div>
				<div><strong>312</strong><span>Following</span></div>
				<div><strong>1,921</strong><span>Followers</span></div>
			</div>
			<div class="user-menu__section">
				<button type="button" onclick={() => selectView('settings')}>View profile</button>
				<button type="button">Bookmarks</button>
				<button type="button">Favorites</button>
				<button type="button">Lists</button>
			</div>
			<div class="user-menu__section">
				<div class="pn-label">Appearance</div>
				<div class="theme-swatches">
					{#each themeOptions as option}
						<button
							class:active={theme === option.id}
							type="button"
							aria-pressed={theme === option.id}
							onclick={() => (theme = option.id)}
						>
							<span class={`swatch swatch--${option.id}`} aria-hidden="true"></span>
							{option.label}
						</button>
					{/each}
				</div>
			</div>
			<div class="user-menu__section">
				<button type="button" onclick={() => selectView('settings')}>Settings</button>
				<button type="button">Keyboard shortcuts</button>
				<button type="button">About this instance</button>
				<button class="danger" type="button">Sign out</button>
			</div>
		</div>
	{/if}

	<div class="app-shell">
		<div class="app-layout">
			<aside class="left-sidebar" data-testid="left-sidebar">
				<div class="pn-card profile-card" data-testid="profile-mini">
					<div class="profile-card__banner pn-vapor-banner pn-vapor-banner--window"></div>
					<div class="profile-card__body">
						<h2>dreambyte</h2>
						<p>@dreambyte@pleromanet.social</p>
						<p>living in a soft world</p>
					</div>
					<div class="profile-card__stats">
						<div><span>Posts</span><strong>1,248</strong></div>
						<div><span>Following</span><strong>312</strong></div>
						<div><span>Followers</span><strong>1,921</strong></div>
					</div>
				</div>

				<nav class="pn-card side-nav" aria-label="Sidebar">
					{#each sidebarNav as item}
						<button
							class:active={activeView === item.id}
							type="button"
							aria-current={activeView === item.id ? 'page' : undefined}
							onclick={() => (item.target ? selectView(item.target) : undefined)}
						>
							<span class="nav-glyph" aria-hidden="true"><PnIcon name={item.icon} /></span>
							<span>{item.label}</span>
							{#if item.count}
								<span class="nav-count">{item.count}</span>
							{:else if activeView === item.id}
								<span class="nav-grip" aria-hidden="true"><PnIcon name="grip" /></span>
							{/if}
						</button>
					{/each}
					{#if activeView === 'settings'}
						<div class="settings-subnav" data-testid="settings-subnav">
							{#each settingsTabs as tab}
								<button type="button" class:active={tab === 'Profile'}>{tab}</button>
							{/each}
						</div>
					{/if}
				</nav>

				<div class="pn-card footer-card">
					<div>PLEROMANET™ 0.0.1</div>
					<p>Docs · API · About</p>
				</div>
			</aside>

			<section class="center-column" aria-label="Current view">
				{#if isTimelineView(activeView)}
					<div class="pn-card timeline-card">
						<h1 class="sr-only">{viewTitle}</h1>
						<div class="pn-tabs timeline-tabs" role="tablist" aria-label="Timeline sections">
							{#each timelineTabs as tab}
								<button
									id={`timeline-tab-${tab.id}`}
									class="pn-tab"
									class:active={activeTimeline === tab.id}
									type="button"
									role="tab"
									aria-selected={activeTimeline === tab.id}
									aria-controls="timeline-panel"
									onclick={() => selectView(tab.id)}
								>
									{tab.label}
								</button>
							{/each}
							<span class="tab-spacer"></span>
							<button class="tab-action" type="button" aria-label="Timeline filters">
								<span aria-hidden="true"></span>
							</button>
						</div>

						<Composer
							label="Composer"
							textareaLabel="Post text"
							placeholder="What's on your mind?"
							submitLabel="Post"
							value={composerText}
							submitEnabled={canPost}
							privacy={composerPrivacy}
							privacyOptions={privacyOptions}
							privacyMenuOpen={privacyMenuOpen}
							onValueChange={(value) => (composerText = value)}
							onPrivacyMenuOpenChange={(open) => (privacyMenuOpen = open)}
							onPrivacyChange={(value) => {
								composerPrivacy = value;
								privacyMenuOpen = false;
							}}
							onSubmit={publishPost}
						/>

						<div
							id="timeline-panel"
							class="timeline-list"
							role="tabpanel"
							aria-labelledby={`timeline-tab-${activeTimeline}`}
							aria-label={`${activeTimeline} posts`}
						>
							{#each visibleTimelinePosts as post (post.id)}
								<TimelinePostCard post={post} onAction={togglePostAction} onOpenThread={openThread} />
							{/each}
						</div>
					</div>
				{:else if activeView === 'thread' && focusedThreadPost}
					<div class="pn-card thread-card" data-testid="thread-view">
						<header class="thread-head">
							<button
								id="thread-back"
								class="thread-back"
								type="button"
								aria-label={`Back to ${previousTimeline} timeline`}
								onclick={closeThread}
							>
								<span aria-hidden="true">←</span>
							</button>
							<h1>Thread</h1>
							<button class="tab-action" type="button" aria-label="Refresh thread">
								<span aria-hidden="true"></span>
							</button>
							<button class="post-more" type="button" aria-label="More thread actions">
								<span class="post-action-icon"><PnIcon name="more" /></span>
							</button>
						</header>

						<div class="thread-ancestors">
							{#each threadAncestors as ancestor}
								<article class="timeline-post thread-post thread-ancestor" data-testid="thread-ancestor">
									<div class="thread-line-wrap">
										<div class={`timeline-avatar timeline-avatar--${ancestor.avatar}`} aria-hidden="true"></div>
										<div class="thread-line" data-testid="thread-line"></div>
									</div>
									<div class="post-content">
										<div class="post-head">
											<span class="post-name">{ancestor.name}</span>
											<span class="post-handle">{ancestor.handle}</span>
											<span class="post-time">{ancestor.time}</span>
										</div>
										<p class="post-body">{ancestor.body}</p>
									</div>
								</article>
							{/each}
						</div>

						<article class="focused-post" data-testid="focused-post">
							<div class="thread-line-top" aria-hidden="true"></div>
							<div class="focused-post-head">
								<div class={`timeline-avatar focused-avatar timeline-avatar--${focusedThreadPost.avatar}`} aria-hidden="true"></div>
								<div class="focused-author">
									<div class="focused-name">{focusedThreadPost.name}</div>
									<div class="focused-handle">{focusedThreadPost.handle}</div>
								</div>
								<button class="follow-button" type="button">Follow</button>
								<button class="post-more" type="button" aria-label="More post actions">
									<span class="post-action-icon"><PnIcon name="more" /></span>
								</button>
							</div>

							<div class="focused-body">{focusedThreadPost.body}</div>
							{#if focusedThreadPost.media}
								<div class={`post-media focused-media post-media--${focusedThreadPost.media}`} role="img" aria-label="Attached media"></div>
							{/if}

							<div class="focused-meta">
								<span>4:18 PM · May 11, 2026</span>
								<span class="meta-dot">·</span>
								<span>PleromaNet™ Web</span>
								<span class="meta-dot">·</span>
								<span><strong>12.4K</strong> views</span>
							</div>

							<div class="focused-engagement" data-testid="focused-engagement">
								<span><strong>{actionCount(focusedThreadPost, 'boost')}</strong> Boosts</span>
								<span><strong>{actionCount(focusedThreadPost, 'favorite')}</strong> Favorites</span>
								<span><strong>24</strong> Bookmarks</span>
							</div>

							<div class="focused-actions">
								<button class="focused-action" type="button" aria-label="Reply to focused post">
									<span class="post-action-icon"><PnIcon name="reply" /></span>
									<span>Reply</span>
								</button>
								<button
									class="focused-action"
									class:active={focusedThreadPost.actions.boost}
									type="button"
									aria-label="Boost focused post"
									aria-pressed={focusedThreadPost.actions.boost}
									onclick={() => togglePostAction(focusedThreadPost.id, 'boost')}
								>
									<span class="post-action-icon"><PnIcon name="boost" /></span>
									<span>Boost</span>
								</button>
								<button
									class="focused-action"
									class:active={focusedThreadPost.actions.favorite}
									type="button"
									aria-label="Favorite focused post"
									aria-pressed={focusedThreadPost.actions.favorite}
									onclick={() => togglePostAction(focusedThreadPost.id, 'favorite')}
								>
									<span class="post-action-icon"><PnIcon name="favorite" /></span>
									<span>Favorite</span>
								</button>
								<button class="focused-action" type="button" aria-label="Save focused post">
									<span class="post-action-icon"><PnIcon name="bookmark" /></span>
									<span>Save</span>
								</button>
							</div>
						</article>

						<Composer
							variant="reply"
							label="Reply composer"
							textareaLabel="Reply text"
							placeholder={`Reply to ${focusedThreadPost.handle}...`}
							submitLabel="Reply"
							value={replyDraft}
							submitEnabled={canReply}
							countTestId="reply-composer-count"
							showGif={false}
							showPoll={false}
							privacyMode="button"
							privacyButtonLabel="Reply visibility"
							onValueChange={(value) => (replyDraft = value)}
							onSubmit={submitThreadReply}
						/>

						<div class="thread-reply-head">
							<div class="thread-reply-count" data-testid="thread-reply-count">
								<span class="post-action-icon"><PnIcon name="reply" /></span>
								<span>{threadReplies.length} replies</span>
							</div>
							<div class="thread-sort" role="group" aria-label="Reply sort">
								<button
									class:active={replySort === 'top'}
									type="button"
									aria-pressed={replySort === 'top'}
									onclick={() => (replySort = 'top')}
								>
									Top
								</button>
								<button
									class:active={replySort === 'newest'}
									type="button"
									aria-pressed={replySort === 'newest'}
									onclick={() => (replySort = 'newest')}
								>
									Newest
								</button>
							</div>
						</div>

						<div class="thread-replies">
							{#each sortedThreadReplies as reply}
								{@const nestedReplies = reply.nestedReplies ?? []}
								<article class="timeline-post thread-post thread-reply" data-testid="thread-reply">
									<div class="thread-line-wrap">
										<div class={`timeline-avatar timeline-avatar--${reply.avatar}`} aria-hidden="true"></div>
										{#if nestedReplies.length > 0}<div class="thread-line" aria-hidden="true"></div>{/if}
									</div>
									<div class="post-content">
										<div class="post-head">
											<span class="post-name">{reply.name}</span>
											<span class="post-handle">{reply.handle}</span>
											<span class="post-time">{reply.time}</span>
										</div>
										<p class="post-body">{reply.body}</p>
										<div class="post-actions">
											<button
												class="post-action"
												class:active={reply.actions.reply}
												type="button"
												aria-label={`Reply ${actionCount(reply, 'reply')}`}
												aria-pressed={reply.actions.reply}
												onclick={() => toggleThreadReplyAction(reply.id, 'reply')}
											>
												<span class="post-action-icon"><PnIcon name="reply" /></span><span>{actionCount(reply, 'reply')}</span>
											</button>
											<button
												class="post-action post-action--boost"
												class:active={reply.actions.boost}
												type="button"
												aria-label={`Boost ${actionCount(reply, 'boost')}`}
												aria-pressed={reply.actions.boost}
												onclick={() => toggleThreadReplyAction(reply.id, 'boost')}
											>
												<span class="post-action-icon"><PnIcon name="boost" /></span><span>{actionCount(reply, 'boost')}</span>
											</button>
											<button
												class="post-action post-action--favorite"
												class:active={reply.actions.favorite}
												type="button"
												aria-label={`Favorite ${actionCount(reply, 'favorite')}`}
												aria-pressed={reply.actions.favorite}
												onclick={() => toggleThreadReplyAction(reply.id, 'favorite')}
											>
												<span class="post-action-icon"><PnIcon name="favorite" /></span><span>{actionCount(reply, 'favorite')}</span>
											</button>
										</div>
										{#if nestedReplies.length > 0}
											<button
												class="show-replies"
												type="button"
												aria-expanded={!!expandedReplyIds[reply.id]}
												aria-controls={`nested-${reply.id}`}
												onclick={() => toggleNestedReplies(reply.id)}
											>
												<span class="show-replies-line" aria-hidden="true"></span>
												{expandedReplyIds[reply.id] ? 'Hide' : 'Show'} {nestedReplies.length} {nestedReplies.length === 1 ? 'reply' : 'replies'}
											</button>
										{/if}
									</div>
								</article>
								{#if nestedReplies.length > 0 && expandedReplyIds[reply.id]}
									<div class="nested-replies" id={`nested-${reply.id}`}>
										{#each nestedReplies as nestedReply}
											<article class="timeline-post thread-post thread-reply nested-reply">
												<div class={`timeline-avatar timeline-avatar--${nestedReply.avatar}`} aria-hidden="true"></div>
												<div class="post-content">
													<div class="post-head">
														<span class="post-name">{nestedReply.name}</span>
														<span class="post-handle">{nestedReply.handle}</span>
														<span class="post-time">{nestedReply.time}</span>
													</div>
													<p class="post-body">{nestedReply.body}</p>
												</div>
											</article>
										{/each}
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{:else}
					<div class="pn-card view-card">
						<div class="view-card__body">
							<p class="pn-kicker">Signed-in shell</p>
							<h1>{viewTitle}</h1>
							<p>
								This placeholder keeps the center column intentionally light while the next slices
								fill in explore, settings, and signed-out flows.
							</p>
						</div>
					</div>
				{/if}
			</section>

			<aside class="right-rail" data-testid="right-rail">
				{#if isTimelineView(activeView) || activeView === 'thread'}
					<div class="pn-card rail-card trends-card">
						<div class="pn-card__head">
							<span class="pn-label">Trends & Activity</span>
							<span class="rail-icon" aria-hidden="true">↗</span>
						</div>
						<div class="trend-list">
							{#each trends as trend}
								<button class="trend-item" type="button">
									<span class="trend-rank">{trend.rank}</span>
									<span>
										<span class="trend-tag">{trend.tag}</span>
										<span class="trend-meta">{trend.count} posts</span>
									</span>
								</button>
							{/each}
						</div>
						<button class="card-foot" type="button">View all trends →</button>
					</div>

					<div class="pn-card rail-card">
						<div class="pn-card__head">
							<span class="pn-label">Who to follow</span>
							<span class="rail-icon" aria-hidden="true">+</span>
						</div>
						<div class="suggestion-list">
							{#each suggestions as suggestion}
								<div class="suggestion">
									<div class={`suggest-avatar suggest-avatar--${suggestion.avatar}`} aria-hidden="true"></div>
									<div class="suggestion-copy" data-testid="suggestion-copy">
										<div class="suggestion-name">{suggestion.name}</div>
										<div class="suggestion-handle" data-testid="suggestion-handle">{suggestion.handle}</div>
									</div>
									<button
										class="follow-button"
										class:following={following[suggestion.id]}
										type="button"
										onclick={() => toggleFollow(suggestion.id)}
									>
										{following[suggestion.id] ? 'Following' : 'Follow'}
									</button>
								</div>
							{/each}
						</div>
						<button class="card-foot" type="button">View more suggestions →</button>
					</div>

					<div class="pn-card rail-card">
						<div class="pn-card__head">
							<span class="pn-label">Shortcuts</span>
							<span class="rail-icon" aria-hidden="true">⌁</span>
						</div>
						<div class="shortcut-list">
							{#each shortcuts as shortcut}
								<button class="shortcut" type="button">
									<span class="shortcut-dot" aria-hidden="true"></span>
									<span>{shortcut.label}</span>
									<span class="shortcut-key">{shortcut.key}</span>
								</button>
							{/each}
						</div>
					</div>

					<div class="pn-card rail-card">
						<div class="pn-card__head">
							<span class="pn-label">Instance status</span>
							<span class="pn-pill">Live</span>
						</div>
						<div class="status-list">
							<div class="rail-status-row">
								<span>pleromanet.social</span>
								<span class="pn-pill">All systems normal</span>
							</div>
							<div class="rail-status-row">
								<span>Uptime</span>
								<strong>30d 12h 42m</strong>
							</div>
							<div class="rail-status-row">
								<span>Users</span>
								<strong>2,487</strong>
							</div>
						</div>
					</div>
				{:else}
					<div class="pn-card rail-card">
						<div class="pn-card__head">
							<span class="pn-label">{railTitle}</span>
							<span class="pn-pill">Live</span>
						</div>
						<div class="pn-card__body">
							<div class="pn-status-row">
								<span class="pn-status-row__label">pleromanet.social</span>
								<span class="pn-status-row__value">Online</span>
							</div>
							<div class="pn-status-row">
								<span class="pn-status-row__label">Users</span>
								<span class="pn-status-row__value">2,487</span>
							</div>
							<div class="rail-link">#fediverse · 12.4K posts</div>
							<div class="rail-link">nyan.binary · suggested</div>
						</div>
					</div>
				{/if}
			</aside>
		</div>
	</div>

	{#if drawerOpen}
		<button class="mobile-overlay" type="button" aria-label="Dismiss navigation overlay" onclick={closeOverlays}></button>
		<aside class="mobile-drawer" data-testid="mobile-drawer">
			<div class="mobile-panel-head">
				<span class="pn-label">Navigation</span>
				<button type="button" aria-label="Close navigation menu" onclick={closeOverlays}>Close</button>
			</div>
			<div class="mobile-profile">dreambyte · @pleromanet.social</div>
			<nav class="mobile-nav" aria-label="Mobile drawer">
				{#each sidebarNav as item}
					<button type="button" onclick={() => (item.target ? selectView(item.target) : undefined)}>
						{item.label}
					</button>
				{/each}
			</nav>
		</aside>
	{/if}

	{#if sheetOpen}
		<button class="mobile-overlay" type="button" aria-label="Dismiss details overlay" onclick={closeOverlays}></button>
		<aside class="mobile-sheet" data-testid="mobile-sheet">
			<div class="sheet-grip" aria-hidden="true"></div>
			<div class="mobile-panel-head">
				<span class="pn-label">{railTitle}</span>
				<button type="button" aria-label="Close details sheet" onclick={closeOverlays}>Close</button>
			</div>
			<div class="pn-card__body">
				<div class="pn-status-row">
					<span class="pn-status-row__label">pleromanet.social</span>
					<span class="pn-status-row__value">Online</span>
				</div>
				<div class="rail-link">#fediverse · 12.4K posts</div>
				<div class="rail-link">Compose shortcut · N</div>
			</div>
		</aside>
	{/if}

	<nav class="mobile-bottom-nav" data-testid="mobile-bottom-nav" aria-label="Mobile primary">
		<button
			type="button"
			class:active={activeView === 'home'}
			aria-current={activeView === 'home' ? 'page' : undefined}
			onclick={() => selectView('home')}
		>
			Home
		</button>
		<button
			type="button"
			class:active={activeView === 'explore'}
			aria-current={activeView === 'explore' ? 'page' : undefined}
			onclick={() => selectView('explore')}
		>
			Explore
		</button>
		<button type="button">Alerts</button>
		<button
			type="button"
			class:active={activeView === 'settings'}
			aria-current={activeView === 'settings' ? 'page' : undefined}
			onclick={() => selectView('settings')}
		>
			Settings
		</button>
		<button type="button" onclick={() => (sheetOpen = true)}>More</button>
	</nav>
</main>

<style>
	.app-shell-page {
		min-height: 100vh;
		background: var(--bg);
	}

	.app-header {
		z-index: 20;
		border-bottom: 1px solid var(--border);
		background: var(--panel);
	}

	.app-header__inner,
	.app-shell {
		width: 100%;
		max-width: 1280px;
		margin: 0 auto;
		padding-inline: 24px;
	}

	.app-header__inner {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 32px;
		align-items: center;
		padding-block: 14px;
	}

	.app-shell-page .pn-card {
		box-shadow: none;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.app-brand,
	.header-actions,
	.user-chip,
	.header-search,
	.primary-nav,
	.mobile-panel-head {
		display: flex;
		align-items: center;
	}

	.app-brand {
		gap: 14px;
		min-width: 0;
	}

	.brand-mark {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: var(--radius);
		background: #1c2046;
		color: #dcd1f0;
		flex: 0 0 auto;
	}

	.brand-mark svg {
		width: 30px;
		height: 30px;
	}

	.brand-wordmark {
		font-family: var(--serif);
		font-size: 32px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.01em;
		white-space: nowrap;
	}

	.brand-wordmark sup {
		font-family: var(--sans);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0;
		margin-left: 2px;
		color: var(--muted);
	}

	.brand-tag {
		border-left: 1px solid var(--border);
		padding-left: 14px;
		margin-left: 4px;
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		line-height: 1.4;
		text-transform: uppercase;
		color: var(--muted);
	}

	.primary-nav {
		justify-self: center;
		gap: 28px;
	}

	.primary-nav button,
	.side-nav button,
	.mobile-nav button,
	.mobile-bottom-nav button,
	.user-menu button {
		border: 0;
		background: transparent;
	}

	.primary-nav button {
		border-bottom: 2px solid transparent;
		padding: 6px 0;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.primary-nav button:hover {
		color: var(--ink-2);
	}

	.primary-nav button.active {
		border-bottom-color: var(--accent);
		color: var(--ink);
	}

	.header-actions {
		justify-content: flex-end;
		gap: 14px;
	}

	.header-search {
		gap: 8px;
		width: 220px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
		padding: 7px 10px;
		color: var(--muted);
	}

	.header-search svg {
		width: 16px;
		height: 16px;
	}

	.header-search:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft-2);
	}

	.header-search input {
		min-width: 0;
		width: 100%;
		border: 0;
		background: transparent;
		outline: 0;
		font-size: 13px;
	}

	.header-search input::placeholder {
		color: var(--muted-2);
	}

	.keyboard-hint {
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--panel);
		padding: 1px 4px;
		font-family: var(--mono);
		font-size: 10px;
	}

	.notify-button {
		position: relative;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--ink-2);
	}

	.notify-button:hover {
		background: var(--bg);
	}

	.notify-button svg {
		width: 20px;
		height: 20px;
	}

	.notify-button span {
		position: absolute;
		top: -2px;
		right: -2px;
		display: grid;
		place-items: center;
		min-width: 16px;
		height: 16px;
		border: 2px solid var(--panel);
		border-radius: 999px;
		background: var(--accent);
		color: white;
		padding: 0 4px;
		font-size: 10px;
		font-weight: 600;
	}

	.mobile-menu-button {
		position: relative;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel);
		color: var(--ink);
	}

	.user-chip {
		gap: 8px;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: transparent;
		padding: 4px 10px 4px 4px;
		font-size: 13px;
		font-weight: 500;
	}

	.user-chip:hover {
		background: var(--bg);
	}

	.mini-avatar {
		width: 28px;
		height: 28px;
		border-radius: 999px;
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
	}

	.user-menu-scrim {
		position: fixed;
		inset: 0;
		z-index: 29;
		border: 0;
		background: transparent;
	}

	.user-menu {
		position: fixed;
		top: 70px;
		right: max(24px, calc((100vw - 1280px) / 2 + 24px));
		z-index: 30;
		width: 320px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--panel);
		box-shadow: 0 10px 32px rgba(28, 32, 70, 0.18), 0 2px 6px rgba(28, 32, 70, 0.06);
		overflow: hidden;
	}

	.user-menu__head {
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
	}

	.user-menu__head {
		display: flex;
		gap: 12px;
		align-items: center;
		background: linear-gradient(180deg, var(--accent-soft-2), transparent);
	}

	.user-menu__head .pn-avatar {
		width: 44px;
		height: 44px;
		border-radius: var(--radius);
		flex: 0 0 auto;
	}

	.user-menu__name {
		font-family: var(--serif);
		font-size: 20px;
		font-weight: 500;
		line-height: 1;
	}

	.user-menu__handle {
		margin-top: 3px;
		color: var(--accent-ink);
		font-size: 12px;
	}

	.user-menu__stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-bottom: 1px solid var(--border);
	}

	.user-menu__stats div {
		display: grid;
		gap: 4px;
		border-right: 1px solid var(--border);
		padding: 10px 8px;
		text-align: center;
	}

	.user-menu__stats div:last-child {
		border-right: 0;
	}

	.user-menu__stats strong {
		font-family: var(--serif);
		font-size: 18px;
		line-height: 1;
		color: var(--accent-ink);
	}

	.user-menu__stats span {
		font-family: var(--mono);
		font-size: 9px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.user-menu__section {
		display: grid;
		gap: 0;
		border-bottom: 1px solid var(--border);
		padding: 6px 0;
	}

	.user-menu__section:last-child {
		border-bottom: 0;
	}

	.user-menu__section .pn-label {
		padding: 6px 16px 4px;
		font-size: 9.5px;
	}

	.user-menu__section button {
		width: 100%;
		padding: 8px 16px;
		text-align: left;
		font-size: 13px;
		color: var(--ink-2);
	}

	.user-menu__section button:hover,
	.user-menu__section button.active {
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	.user-menu__section .danger {
		color: var(--bad);
	}

	.theme-swatches {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
		margin: 0;
		padding: 4px 12px 8px;
	}

	.theme-swatches button {
		display: grid;
		justify-items: center;
		gap: 6px;
		border: 1px solid var(--border);
		background: var(--panel-2);
		font-size: 11px;
		text-align: center;
	}

	.swatch {
		width: 30px;
		height: 30px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.swatch--cream {
		background: linear-gradient(135deg, #f5f1e8 50%, #a48bd9 50%);
	}

	.swatch--dusk {
		background: linear-gradient(135deg, #221a3a 50%, #e7a8c9 50%);
	}

	.swatch--drive {
		background: linear-gradient(135deg, #07091a 50%, #7dc4be 50%);
	}

	.swatch--simoun {
		background: linear-gradient(135deg, #061f3d 50%, #ff8438 50%);
	}

	.app-shell {
		padding-block: 20px 76px;
	}

	.app-layout {
		display: grid;
		grid-template-columns: 240px minmax(0, 1fr) 280px;
		gap: 20px;
		align-items: start;
	}

	.left-sidebar,
	.right-rail {
		display: grid;
		gap: 16px;
		min-width: 0;
	}

	.profile-card__banner {
		height: 110px;
		min-height: 0;
		border: 0;
		border-bottom: 1px solid var(--border);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
	}

	.profile-card__body {
		padding: 14px 16px 4px;
	}

	.profile-card h2,
	.profile-card p {
		margin: 0;
	}

	.profile-card h2 {
		font-family: var(--serif);
		font-size: 24px;
		font-weight: 500;
		line-height: 1;
	}

	.profile-card p:first-of-type {
		margin-top: 4px;
		color: var(--accent-ink);
		font-size: 13px;
	}

	.profile-card p:last-of-type {
		margin-top: 12px;
		color: var(--ink-2);
		font-size: 13px;
	}

	.profile-card__stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid var(--border);
	}

	.profile-card__stats div {
		display: grid;
		gap: 3px;
		border-right: 1px solid var(--border);
		padding: 12px 8px;
		text-align: center;
	}

	.profile-card__stats div:last-child {
		border-right: 0;
	}

	.profile-card__stats span {
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.profile-card__stats strong {
		font-family: var(--serif);
		font-size: 22px;
		line-height: 1;
		color: var(--accent-ink);
	}

	.side-nav {
		padding: 6px 0;
	}

	.side-nav button,
	.mobile-nav button {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 14px;
		border-left: 3px solid transparent;
		color: var(--ink-2);
		font-size: 14px;
		text-align: left;
	}

	.side-nav button.active,
	.side-nav button:hover {
		background: var(--bg);
	}

	.side-nav button.active {
		background: var(--accent-soft-2);
		border-left-color: var(--accent);
		color: var(--ink);
	}

	.mobile-nav button:hover {
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	.nav-glyph {
		width: 18px;
		height: 18px;
		color: var(--muted);
		flex: 0 0 auto;
	}

	.side-nav button.active .nav-glyph {
		color: var(--accent-ink);
	}

	.nav-count {
		margin-left: auto;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent-ink);
		padding: 1px 7px;
		font-size: 11px;
		font-weight: 600;
	}

	.nav-grip {
		width: 14px;
		height: 14px;
		margin-left: auto;
		color: var(--muted-2);
	}

	.settings-subnav {
		border-top: 1px solid var(--border);
		padding: 4px 0 4px 50px;
	}

	.settings-subnav button {
		display: block;
		width: 100%;
		padding: 6px 14px 6px 0;
		border-left: 0;
		font-size: 13px;
		color: var(--muted);
	}

	.settings-subnav button.active,
	.settings-subnav button:hover {
		background: transparent;
		color: var(--accent-ink);
	}

	.settings-subnav button.active {
		font-weight: 600;
	}

	.footer-card {
		padding: 14px 16px;
		font-family: var(--mono);
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	.footer-card p {
		margin: 8px 0 0;
		font-family: var(--sans);
		letter-spacing: 0;
		color: var(--accent-ink);
	}

	.center-column {
		min-width: 0;
	}

	.timeline-card {
		overflow: hidden;
	}

	.timeline-tabs {
		padding-inline: 16px;
	}

	.tab-spacer {
		flex: 1 1 auto;
	}

	.tab-action {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--muted);
	}

	.tab-action:hover {
		background: var(--bg);
		color: var(--ink);
	}

	.tab-action span {
		width: 16px;
		height: 16px;
		border-top: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		position: relative;
	}

	.tab-action span::before {
		content: '';
		position: absolute;
		inset: 5px 2px auto;
		border-top: 2px solid currentColor;
	}

	.post-action,
	.post-more,
	.trend-item,
	.card-foot,
	.follow-button,
	.shortcut {
		border: 0;
		background: transparent;
	}

	.timeline-list {
		display: grid;
	}

	.timeline-post {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr);
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding: 16px;
	}

	.timeline-post:last-child {
		border-bottom: 0;
	}

	.timeline-post:hover {
		background: rgba(164, 139, 217, 0.03);
	}

	.post-content {
		min-width: 0;
	}

	.timeline-avatar {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
		overflow: hidden;
	}

	.timeline-avatar--grad-1 {
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
	}

	.timeline-avatar--grad-2 {
		background: linear-gradient(135deg, #1a4a4a, #4a8a8a, #a8d5d5);
	}

	.timeline-avatar--grad-3 {
		background: linear-gradient(135deg, #4a2a4a, #8a4a8a, #d8a8d8);
	}

	.timeline-avatar--orb {
		background: radial-gradient(circle at 35% 35%, #6b4d8e, #1a1538 68%);
	}

	.timeline-avatar--pc {
		background: linear-gradient(180deg, #e0d5c2 0 30%, #1a1538 30% 72%, #b8a890 72%);
	}

	.timeline-post .timeline-avatar {
		width: 48px;
		height: 48px;
	}

	.post-head {
		display: flex;
		align-items: baseline;
		gap: 6px;
		font-size: 13.5px;
		flex-wrap: wrap;
	}

	.post-name {
		font-weight: 600;
		color: var(--ink);
	}

	.post-handle {
		color: var(--accent-ink);
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.post-time {
		margin-left: auto;
		font-family: var(--mono);
		font-size: 12px;
		color: var(--muted);
	}

	.post-body {
		margin: 6px 0 0;
		color: var(--ink-2);
		font-size: 14px;
		white-space: pre-wrap;
	}

	.post-media {
		position: relative;
		margin-top: 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: linear-gradient(180deg, #1d1840 0%, #533c7a 40%, #d889a0 75%, #f3c191 100%);
		aspect-ratio: 16 / 8;
		overflow: hidden;
	}

	.post-media::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 18%;
		width: 86px;
		height: 86px;
		border-radius: 50%;
		background: radial-gradient(circle, #ffd1a8 0 35%, #f78fb3 60%, transparent 70%);
		transform: translateX(-50%);
	}

	.post-media::after {
		content: '';
		position: absolute;
		inset: 55% 0 0;
		background:
			repeating-linear-gradient(0deg, transparent 0 18px, rgba(255, 255, 255, 0.18) 18px 19px),
			repeating-linear-gradient(90deg, transparent 0 14px, rgba(255, 255, 255, 0.18) 14px 15px);
		transform: perspective(140px) rotateX(58deg);
		transform-origin: top;
	}

	.post-media--city {
		background: linear-gradient(180deg, #0c0a28 0%, #2a1f4a 30%, #6b4d8e 60%, #d889a0 100%);
	}

	.post-media--space {
		background: radial-gradient(ellipse at 30% 30%, #2a1f4a 0%, #0c0a1a 70%);
	}

	.post-actions {
		display: flex;
		align-items: center;
		gap: 18px;
		margin-top: 12px;
		flex-wrap: wrap;
	}

	.post-action {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border-radius: var(--radius);
		color: var(--muted);
		padding: 4px 6px;
		font-size: 12.5px;
		font-variant-numeric: tabular-nums;
	}

	.post-action:hover,
	.post-action.active {
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	.post-action--boost.active {
		color: #6fa97a;
	}

	.post-action--favorite.active {
		color: #e0a13f;
	}

	.post-action-icon {
		width: 16px;
		height: 16px;
		flex: 0 0 auto;
	}

	.post-more {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		margin-left: auto;
		border-radius: var(--radius);
		color: var(--muted-2);
		font-size: 12px;
		letter-spacing: 0.08em;
	}

	.post-more:hover {
		background: var(--bg);
		color: var(--ink);
	}

	.thread-card {
		overflow: hidden;
	}

	.thread-head {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 6px;
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel) 92%, transparent);
		backdrop-filter: blur(10px);
		padding: 10px 12px;
	}

	.thread-head h1 {
		flex: 1;
		margin: 0 60px 0 0;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.16em;
		line-height: 1;
		text-align: center;
		text-transform: uppercase;
		color: var(--ink);
	}

	.thread-back,
	.focused-action,
	.thread-sort button,
	.show-replies {
		border: 0;
		background: transparent;
	}

	.thread-back {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius);
		color: var(--ink-2);
		font-size: 18px;
	}

	.thread-back:hover {
		background: var(--bg);
		color: var(--ink);
	}

	.thread-ancestors {
		padding-top: 4px;
	}

	.thread-post {
		border-bottom: 0;
		padding-bottom: 6px;
	}

	.thread-reply {
		border-bottom: 1px solid var(--border);
		padding-bottom: 14px;
	}

	.thread-line-wrap {
		position: relative;
		display: flex;
		align-items: center;
		flex-direction: column;
	}

	.thread-line {
		width: 2px;
		min-height: 16px;
		flex: 1 1 auto;
		border-radius: 1px;
		background: var(--border);
		margin-top: 8px;
	}

	.focused-post {
		position: relative;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		background: var(--panel-2);
		padding: 18px 20px 14px;
	}

	.thread-ancestors + .focused-post {
		border-top: 0;
	}

	.thread-line-top {
		position: absolute;
		top: 0;
		left: 44px;
		width: 2px;
		height: 14px;
		background: var(--border);
	}

	.focused-post-head {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.focused-avatar {
		width: 56px;
		height: 56px;
		flex: 0 0 auto;
	}

	.focused-author {
		min-width: 0;
		flex: 1 1 auto;
	}

	.focused-name {
		font-family: var(--serif);
		font-size: 20px;
		font-weight: 500;
		line-height: 1.1;
		color: var(--ink);
	}

	.focused-handle {
		margin-top: 2px;
		color: var(--accent-ink);
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.focused-body {
		margin-top: 16px;
		color: var(--ink);
		font-size: 17px;
		line-height: 1.55;
		letter-spacing: -0.005em;
		white-space: pre-wrap;
	}

	.focused-media {
		aspect-ratio: 16 / 9;
	}

	.focused-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: 16px;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		padding: 12px 0;
		font-family: var(--mono);
		font-size: 12.5px;
		color: var(--muted);
	}

	.focused-meta strong {
		color: var(--ink);
		font-weight: 600;
	}

	.meta-dot {
		color: var(--muted-2);
	}

	.focused-engagement {
		display: flex;
		gap: 24px;
		border-bottom: 1px solid var(--border);
		padding: 12px 0;
		color: var(--ink-2);
		font-size: 13px;
		flex-wrap: wrap;
	}

	.focused-engagement strong {
		margin-right: 4px;
		font-family: var(--serif);
		font-size: 17px;
		font-weight: 600;
		color: var(--ink);
	}

	.focused-actions {
		display: flex;
		justify-content: space-around;
		gap: 4px;
		padding-top: 8px;
	}

	.focused-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		flex: 1 1 0;
		border-radius: var(--radius);
		padding: 8px 14px;
		color: var(--muted);
		font-size: 13px;
	}

	.focused-action:hover,
	.focused-action.active {
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	.thread-reply-head {
		display: flex;
		align-items: center;
		gap: 8px;
		border-bottom: 1px solid var(--border);
		background: var(--panel);
		padding: 12px 20px;
	}

	.thread-reply-count {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.thread-sort {
		display: inline-flex;
		margin-left: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
		padding: 2px;
	}

	.thread-sort button {
		border-radius: 3px;
		padding: 4px 12px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.04em;
	}

	.thread-sort button.active {
		background: var(--panel);
		color: var(--ink);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.thread-replies {
		padding-top: 4px;
	}

	.show-replies {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin-top: 10px;
		padding: 6px 0;
		color: var(--accent-ink);
		font-size: 12.5px;
		font-weight: 500;
	}

	.show-replies:hover {
		text-decoration: underline;
	}

	.show-replies-line {
		width: 28px;
		height: 1px;
		background: var(--accent);
		opacity: 0.6;
	}

	.nested-replies {
		border-left: 2px solid var(--border);
		margin-left: 28px;
		padding-left: 56px;
	}

	.nested-reply {
		grid-template-columns: 40px minmax(0, 1fr);
		padding-left: 4px;
	}

	.nested-reply .timeline-avatar {
		width: 40px;
		height: 40px;
	}

	.view-card__body {
		display: grid;
		gap: 12px;
		padding: 22px 24px 26px;
	}

	.view-card h1,
	.view-card p {
		margin: 0;
	}

	.view-card h1 {
		font-family: var(--serif);
		font-size: clamp(2rem, 4vw, 3.4rem);
		font-weight: 500;
		line-height: 1;
	}

	.view-card p:not(.pn-kicker) {
		max-width: 58ch;
		color: var(--ink-2);
	}

	.placeholder-composer {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 10px;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		background: var(--panel-2);
		padding: 14px;
		color: var(--muted);
	}

	.rail-card {
		box-shadow: none;
	}

	.rail-icon {
		color: var(--muted);
		font-family: var(--mono);
		font-size: 0.9rem;
	}

	.trend-list,
	.suggestion-list,
	.shortcut-list,
	.status-list {
		padding: 4px 0;
	}

	.trend-item {
		display: grid;
		grid-template-columns: 18px minmax(0, 1fr);
		align-items: baseline;
		gap: 10px;
		width: 100%;
		padding: 9px 16px;
		text-align: left;
	}

	.trend-item:hover,
	.shortcut:hover {
		background: var(--bg);
	}

	.trend-rank {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--muted);
	}

	.trend-tag,
	.trend-meta {
		display: block;
	}

	.trend-tag {
		font-size: 13.5px;
		font-weight: 500;
		color: var(--ink);
	}

	.trend-meta {
		margin-top: 2px;
		font-family: var(--mono);
		font-size: 10.5px;
		letter-spacing: 0.04em;
		color: var(--muted);
	}

	.card-foot {
		display: block;
		width: 100%;
		border-top: 1px solid var(--border);
		padding: 10px 16px;
		color: var(--accent-ink);
		font-size: 12.5px;
		text-align: left;
	}

	.card-foot:hover {
		background: var(--bg);
	}

	.suggestion {
		display: grid;
		grid-template-columns: 36px minmax(0, 1fr) auto;
		align-items: center;
		gap: 10px;
		padding: 10px 16px;
	}

	.suggestion-copy {
		min-width: 0;
	}

	.suggest-avatar {
		width: 36px;
		height: 36px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.suggest-avatar--anime {
		background: radial-gradient(circle at 50% 30%, #f0c2dc 0 18%, #2a2050 19% 50%, #1a1538 70%);
	}

	.suggest-avatar--pc {
		background: linear-gradient(180deg, #2a1f4a, #533c7a 55%, #d889a0);
	}

	.suggest-avatar--grad {
		background: linear-gradient(135deg, #4a2a4a, #8a4a8a, #d8a8d8);
	}

	.suggestion-name,
	.suggestion-handle {
		display: block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.suggestion-name {
		font-size: 13px;
		font-weight: 600;
		line-height: 1.1;
	}

	.suggestion-handle {
		margin-top: 2px;
		font-size: 11.5px;
		color: var(--muted);
	}

	.follow-button {
		border: 1px solid var(--accent);
		border-radius: 14px;
		padding: 4px 12px;
		color: var(--accent-ink);
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
	}

	.follow-button:hover {
		background: var(--accent-soft);
	}

	.follow-button.following {
		background: var(--accent);
		color: white;
	}

	.shortcut {
		display: grid;
		grid-template-columns: 16px minmax(0, 1fr) auto;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 8px 16px;
		color: var(--ink-2);
		font-size: 13px;
		text-align: left;
	}

	.shortcut-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--muted);
	}

	.shortcut-key {
		min-width: 18px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--bg);
		padding: 1px 5px;
		font-family: var(--mono);
		font-size: 10px;
		color: var(--muted);
		text-align: center;
	}

	.rail-status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		min-width: 0;
		padding: 10px 16px;
		font-size: 13px;
	}

	.rail-status-row + .rail-status-row {
		border-top: 1px solid var(--border);
	}

	.rail-status-row span:first-child {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		color: var(--ink-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rail-status-row span:first-child::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #6fa97a;
		box-shadow: 0 0 0 3px rgba(111, 169, 122, 0.18);
		flex: 0 0 auto;
	}

	.rail-status-row strong {
		font-family: var(--mono);
		font-size: 11.5px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.rail-link {
		border-top: 1px solid var(--border);
		padding-top: 10px;
		color: var(--accent-ink);
		font-size: 0.88rem;
	}

	.mobile-menu-button,
	.mobile-bottom-nav {
		display: none;
	}

	.mobile-menu-button span {
		width: 16px;
		height: 1.5px;
		border-radius: 1px;
		background: currentColor;
	}

	.mobile-overlay {
		position: fixed;
		inset: 0;
		z-index: 40;
		border: 0;
		background: rgba(31, 35, 71, 0.42);
	}

	.mobile-drawer,
	.mobile-sheet {
		position: fixed;
		z-index: 41;
		border: 1px solid var(--border);
		background: var(--panel);
		box-shadow: 0 18px 48px rgba(31, 35, 71, 0.22);
	}

	.mobile-drawer {
		top: 0;
		bottom: 0;
		left: 0;
		width: min(290px, 86vw);
		overflow-y: auto;
	}

	.mobile-sheet {
		left: 0;
		right: 0;
		bottom: 0;
		max-height: 80vh;
		border-radius: 14px 14px 0 0;
		overflow-y: auto;
	}

	.mobile-panel-head {
		justify-content: space-between;
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding: 14px 16px;
	}

	.mobile-panel-head button {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-2);
		padding: 5px 9px;
		font-size: 0.82rem;
	}

	.mobile-profile {
		border-bottom: 1px solid var(--border);
		padding: 14px 16px;
		color: var(--accent-ink);
	}

	.sheet-grip {
		width: 42px;
		height: 4px;
		border-radius: 999px;
		background: var(--border-strong);
		margin: 8px auto 2px;
	}

	.mobile-bottom-nav {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 19;
		grid-template-columns: repeat(5, 1fr);
		border-top: 1px solid var(--border);
		background: var(--panel);
		padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
		box-shadow: 0 -2px 12px rgba(31, 35, 71, 0.08);
	}

	.mobile-bottom-nav button {
		display: grid;
		gap: 3px;
		place-items: center;
		border-radius: var(--radius);
		padding: 8px 4px;
		font-family: var(--mono);
		font-size: 0.62rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.mobile-bottom-nav button.active,
	.mobile-bottom-nav button:hover {
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	@media (max-width: 1179px) {
		.app-layout {
			grid-template-columns: 220px minmax(0, 1fr);
		}

		.right-rail {
			display: none;
		}
	}

	@media (max-width: 880px) {
		.app-header__inner,
		.app-shell {
			padding-inline: 14px;
		}

		.app-header__inner {
			grid-template-columns: 1fr auto;
			gap: 12px;
		}

		.mobile-menu-button {
			display: grid;
		}

		.brand-mark {
			width: 38px;
			height: 38px;
		}

		.brand-mark svg {
			width: 24px;
			height: 24px;
		}

		.brand-wordmark {
			font-size: 1.5rem;
		}

		.brand-tag,
		.primary-nav,
		.header-search,
		.user-chip > span:last-child {
			display: none;
		}

		.header-actions {
			gap: 8px;
		}

		.user-chip {
			padding: 2px;
		}

		.user-menu {
			top: 58px;
			right: 12px;
			width: min(320px, calc(100vw - 24px));
		}

		.app-shell {
			padding-top: 14px;
			padding-bottom: 92px;
		}

		.app-layout {
			grid-template-columns: minmax(0, 1fr);
		}

		.left-sidebar,
		.right-rail {
			display: none;
		}

		.view-card__body {
			padding: 18px 16px 22px;
		}

		.timeline-tabs {
			padding-inline: 8px;
			overflow-x: auto;
			scrollbar-width: none;
		}

		.timeline-tabs::-webkit-scrollbar {
			display: none;
		}

		.timeline-post {
			grid-template-columns: 40px minmax(0, 1fr);
			gap: 10px;
			padding: 14px;
		}

		.timeline-post .timeline-avatar {
			width: 40px;
			height: 40px;
		}

		.post-actions {
			gap: 6px;
		}

		.thread-head h1 {
			margin-right: 30px;
		}

		.focused-post {
			padding: 16px 14px 12px;
		}

		.thread-line-top {
			left: 34px;
		}

		.focused-avatar {
			width: 44px;
			height: 44px;
		}

		.focused-name {
			font-size: 17px;
		}

		.focused-body {
			font-size: 16px;
		}

		.focused-meta {
			font-size: 11px;
		}

		.focused-engagement {
			gap: 14px;
			font-size: 12.5px;
		}

		.focused-engagement strong {
			font-size: 15px;
		}

		.focused-action {
			padding: 10px 6px;
		}

		.focused-action span:not(.post-action-icon) {
			display: none;
		}

		.nested-replies {
			margin-left: 14px;
			padding-left: 28px;
		}

		.placeholder-composer {
			align-items: flex-start;
		}

		.mobile-bottom-nav {
			display: grid;
		}
	}

	@media (max-width: 480px) {
		.app-header__inner,
		.app-shell {
			padding-inline: 8px;
		}

		.notify-button {
			display: none;
		}

		.pn-tabs {
			padding-inline: 6px;
		}

		.pn-tab {
			padding-inline: 10px;
			font-size: 0.82rem;
		}

		.post-time {
			margin-left: 0;
		}
	}
</style>
