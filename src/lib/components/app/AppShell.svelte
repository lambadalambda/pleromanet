<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount, type Snippet } from 'svelte';
	import { appShortcuts, appTrends, followSuggestions } from '$lib/app/fixtures';
	import PnIcon from '$lib/PnIcon.svelte';
	import ProfilePreviewCard from '$lib/components/profile-settings/ProfilePreviewCard.svelte';
	import ProfileTipsCard from '$lib/components/profile-settings/ProfileTipsCard.svelte';
	import { profileSettingsPreview } from '$lib/components/profile-settings/store';
	import { createDefaultProfileSettings, type ProfileSettings } from '$lib/components/profile-settings/types';
	import { getPleromaAuthContext } from '$lib/pleroma/auth';

	type NavIcon = 'home' | 'users' | 'globe' | 'search' | 'bell' | 'gear';

	type NavItem = {
		label: string;
		href: string;
		section: string;
		icon: NavIcon;
		count?: string;
	};

	type Props = {
		path: string;
		children: Snippet;
	};

	type Theme = 'cream' | 'dusk' | 'drive' | 'simoun';

	let { path, children }: Props = $props();
	let drawerOpen = $state(false);
	let sheetOpen = $state(false);
	let userMenuOpen = $state(false);
	let following = $state<Record<string, boolean>>({});
	let previewProfile = $state<ProfileSettings>(createDefaultProfileSettings());
	let theme = $state<Theme>('cream');
	const auth = getPleromaAuthContext();

	const primaryNav: NavItem[] = [
		{ label: 'Home', href: '/app/home', section: 'home', icon: 'home' },
		{ label: 'Public', href: '/app/public', section: 'public', icon: 'globe' },
		{ label: 'Local', href: '/app/local', section: 'local', icon: 'users' },
		{ label: 'Federated', href: '/app/federated', section: 'federated', icon: 'globe' },
		{ label: 'Explore', href: '/app/explore', section: 'explore', icon: 'search' },
		{ label: 'Settings', href: '/app/settings', section: 'settings', icon: 'gear' }
	];
	const sidebarNav: NavItem[] = [
		{ label: 'Home', href: '/app/home', section: 'home', icon: 'home' },
		{ label: 'Public', href: '/app/public', section: 'public', icon: 'globe' },
		{ label: 'Local', href: '/app/local', section: 'local', icon: 'users' },
		{ label: 'Federated', href: '/app/federated', section: 'federated', icon: 'globe' },
		{ label: 'Notifications', href: '/app/notifications', section: 'notifications', icon: 'bell', count: '3' },
		{ label: 'Explore', href: '/app/explore', section: 'explore', icon: 'search' },
		{ label: 'Settings', href: '/app/settings', section: 'settings', icon: 'gear' }
	];
	const settingsTabs = ['Profile', 'Appearance', 'Notifications', 'Filters', 'Federation', 'Account', 'Import / Export', 'Development'];
	const mobileNav: NavItem[] = [
		{ label: 'Home', href: '/app/home', section: 'home', icon: 'home' },
		{ label: 'Explore', href: '/app/explore', section: 'explore', icon: 'search' },
		{ label: 'Alerts', href: '/app/notifications', section: 'notifications', icon: 'bell' },
		{ label: 'Settings', href: '/app/settings', section: 'settings', icon: 'gear' }
	];
	const themeOptions: Array<{ id: Theme; label: string }> = [
		{ id: 'cream', label: 'Cream' },
		{ id: 'dusk', label: 'Dusk' },
		{ id: 'drive', label: 'Drive' },
		{ id: 'simoun', label: 'Simoun' }
	];
	const profileHref = '/app/profiles/quietadmin@pleroma.example';
	const isTheme = (value: string | null): value is Theme =>
		value === 'cream' || value === 'dusk' || value === 'drive' || value === 'simoun';

	const section = $derived(
		path.startsWith('/app/explore')
			? 'explore'
			: path.startsWith('/app/settings')
				? 'settings'
				: path.startsWith('/app/notifications')
					? 'notifications'
					: path.startsWith('/app/public')
						? 'public'
						: path.startsWith('/app/local')
							? 'local'
							: path.startsWith('/app/federated')
								? 'federated'
								: path.startsWith('/app/thread')
									? 'thread'
									: path.startsWith('/app/profiles')
										? 'profiles'
										: 'home'
	);
	const railTitle = $derived(section === 'explore' ? 'Discover' : section === 'settings' ? 'Profile Preview' : 'Trends & Activity');
	const isActive = (item: NavItem) => section === item.section;
	const closeOverlays = () => {
		userMenuOpen = false;
		drawerOpen = false;
		sheetOpen = false;
	};
	const followLink = async (href: string) => {
		closeOverlays();
		await goto(href);
	};
	const toggleFollow = (id: string) => {
		following = { ...following, [id]: !following[id] };
	};
	const signOut = () => {
		closeOverlays();
		auth.signOut();
		void goto('/', { replaceState: true });
	};

	onMount(() => {
		const unsubscribePreview = profileSettingsPreview.subscribe((value) => {
			previewProfile = value;
		});

		try {
			const savedTheme = localStorage.getItem('pn-theme');
			if (isTheme(savedTheme)) theme = savedTheme;
		} catch {
			// Theme persistence should not break the shell.
		}

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeOverlays();
		};

		document.addEventListener('keydown', handleKeydown);

		return () => {
			unsubscribePreview();
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	$effect(() => {
		if (!browser) return;

		document.documentElement.dataset.theme = theme;

		try {
			localStorage.setItem('pn-theme', theme);
		} catch {
			// Theme persistence should not break the shell.
		}
	});
</script>

<main class="pn-page app-shell-page">
	<header class="app-header" data-testid="app-header">
		<div class="app-header__inner">
			<div class="app-brand">
				<button class="mobile-menu-button" type="button" aria-label="Open navigation menu" onclick={() => (drawerOpen = true)}>
					<span></span><span></span><span></span>
				</button>
				<a class="brand-mark" href="/app/home" aria-label="PleromaNet home">
					<svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
						<path d="M16 3v9M16 20v9M3 16h9M20 16h9M7 7l5 5M20 20l5 5M25 7l-5 5M12 20l-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
						<circle cx="16" cy="16" r="2" fill="currentColor" />
					</svg>
				</a>
				<div class="brand-wordmark">PleromaNet<sup>TM</sup></div>
				<div class="brand-tag">A federated<br />social web</div>
			</div>

			<nav class="primary-nav" aria-label="Primary">
				{#each primaryNav as item}
					<a class:active={isActive(item)} href={item.href} aria-current={isActive(item) ? 'page' : undefined}>{item.label}</a>
				{/each}
			</nav>

			<div class="header-actions">
				<label class="header-search">
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
						<circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.5" />
						<path d="m16 16 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
					<input type="search" aria-label="Search PleromaNet" placeholder="Search..." />
					<span class="keyboard-hint">⌘K</span>
				</label>
				<a class="notify-button" href="/app/notifications" aria-label="Notifications">
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
						<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15L6 17z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
						<path d="M10 21h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
					<span class="notify-badge">3</span>
				</a>
				<button
					class="user-chip"
					type="button"
					aria-label="quiet admin account menu"
					aria-expanded={userMenuOpen}
					onclick={() => (userMenuOpen = !userMenuOpen)}
				>
					<span class="mini-avatar" aria-hidden="true"></span>
					<span class="user-chip__label">quiet admin</span>
					<svg class="user-chip__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
						<path d="M7 10.5 12 15l5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
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
					<div class="user-menu__name">quiet admin</div>
					<div class="user-menu__handle">@quietadmin@pleroma.example</div>
				</div>
			</div>
			<div class="user-menu__stats">
				<div><strong>1,248</strong><span>Posts</span></div>
				<div><strong>312</strong><span>Following</span></div>
				<div><strong>1,921</strong><span>Followers</span></div>
			</div>
			<div class="user-menu__section">
				<button type="button" onclick={() => void followLink(profileHref)}>View profile</button>
				<button type="button">Bookmarks</button>
				<button type="button">Favorites</button>
				<button type="button">Lists</button>
			</div>
			<div class="user-menu__section">
				<div class="pn-label">Appearance</div>
				<div class="theme-swatches">
					{#each themeOptions as option}
						<button class:active={theme === option.id} type="button" aria-pressed={theme === option.id} onclick={() => (theme = option.id)}>
							<span class={`swatch swatch--${option.id}`} aria-hidden="true"></span>
							{option.label}
						</button>
					{/each}
				</div>
			</div>
			<div class="user-menu__section">
				<button type="button" onclick={() => void followLink('/app/settings')}>Settings</button>
				<button type="button">Keyboard shortcuts</button>
				<button type="button">About this instance</button>
				<button class="danger" type="button" onclick={signOut}>Sign out</button>
			</div>
		</div>
	{/if}

	<div class="app-shell">
		<div class="app-layout" class:settings-layout={section === 'settings'}>
			<aside class="left-sidebar" data-testid="left-sidebar">
				<div class="pn-card profile-card" data-testid="profile-mini">
					<div class="profile-card__banner pn-vapor-banner pn-vapor-banner--window"></div>
					<div class="profile-card__body">
						<h2>quiet admin</h2>
						<p>@quietadmin@pleroma.example</p>
						<p>keeping the lights low</p>
					</div>
					<div class="profile-card__stats">
						<div><span>Posts</span><strong>1,248</strong></div>
						<div><span>Following</span><strong>312</strong></div>
						<div><span>Followers</span><strong>1,921</strong></div>
					</div>
				</div>

				<nav class="pn-card side-nav" aria-label="Sidebar">
					{#each sidebarNav as item}
						<a class:active={isActive(item)} href={item.href} aria-current={isActive(item) ? 'page' : undefined}>
							<span class="nav-glyph" aria-hidden="true"><PnIcon name={item.icon} /></span>
							<span>{item.label}</span>
							{#if item.count}
								<span class="nav-count">{item.count}</span>
							{:else if isActive(item)}
								<span class="nav-grip" aria-hidden="true"><PnIcon name="grip" /></span>
							{/if}
						</a>
					{/each}
					{#if section === 'settings'}
						<div class="settings-subnav" data-testid="settings-subnav">
							{#each settingsTabs as tab}
								<button class:active={tab === 'Profile'} type="button">{tab}</button>
							{/each}
						</div>
					{/if}
				</nav>
			</aside>

			<section class="center-column" data-testid="app-content" aria-label="Current view">
				{@render children()}
			</section>

			<aside class="right-rail" data-testid="right-rail">
				{#if section === 'explore'}
					<div class="pn-card rail-card explore-rail-search">
						<div class="pn-card__head"><span class="pn-label">Discover</span><span class="rail-icon" aria-hidden="true">⌕</span></div>
						<div class="pn-card__body">
							<label class="rail-search">
								<span>Quick search</span>
								<input type="search" aria-label="Quick search Explore" placeholder="Search the network" />
							</label>
							<div class="rail-link rail-link--stacked">#pleroma · active now</div>
							<div class="rail-link rail-link--stacked">Federated CSS Garden · featured</div>
						</div>
					</div>

					<div class="pn-card rail-card">
						<div class="pn-card__head"><span class="pn-label">Who to follow</span><span class="rail-icon" aria-hidden="true">+</span></div>
						<div class="suggestion-list">
							{#each followSuggestions as suggestion}
								{@const isFollowing = !!following[suggestion.id]}
								<div class="suggestion">
									<div class={`suggest-avatar suggest-avatar--${suggestion.avatar}`} aria-hidden="true"></div>
									<div class="suggestion-copy">
										<div class="suggestion-name">{suggestion.name}</div>
										<div class="suggestion-handle">{suggestion.handle}</div>
									</div>
									<button class="follow-button" class:following={isFollowing} type="button" onclick={() => toggleFollow(suggestion.id)}>
										{isFollowing ? 'Following' : 'Follow'}
									</button>
								</div>
							{/each}
						</div>
					</div>

					<div class="pn-card rail-card">
						<div class="pn-card__head"><span class="pn-label">Shortcuts</span><span class="rail-icon" aria-hidden="true">⌁</span></div>
						<div class="shortcut-list">
							<button class="shortcut" type="button"><span class="shortcut-dot" aria-hidden="true"></span><span>Search focused tag</span><span class="shortcut-key">/</span></button>
							<button class="shortcut" type="button"><span class="shortcut-dot" aria-hidden="true"></span><span>Open featured community</span><span class="shortcut-key">J</span></button>
							<button class="shortcut" type="button"><span class="shortcut-dot" aria-hidden="true"></span><span>Cycle discover feed</span><span class="shortcut-key">F</span></button>
						</div>
					</div>

					<div class="pn-card rail-card">
						<div class="pn-card__head"><span class="pn-label">Instance status</span><span class="status-pill status-pill--accent">Expanded</span></div>
						<div class="status-list">
							<div class="rail-status-row"><span>Known instances</span><strong>34</strong></div>
							<div class="rail-status-row"><span>Trending tags</span><strong>18</strong></div>
							<div class="rail-status-row"><span>Discovery mode</span><strong>Curated</strong></div>
						</div>
					</div>
				{:else if section === 'settings'}
					<ProfilePreviewCard profile={previewProfile} />
					<ProfileTipsCard />
				{:else}
					<div class="pn-card rail-card trends-card">
						<div class="pn-card__head"><span class="pn-label">Trends & Activity</span><span class="rail-icon" aria-hidden="true">↗</span></div>
						<div class="trend-list">
							{#each appTrends as trend}
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
						<div class="pn-card__head"><span class="pn-label">Who to follow</span><span class="rail-icon" aria-hidden="true">+</span></div>
						<div class="suggestion-list">
							{#each followSuggestions as suggestion}
								{@const isFollowing = !!following[suggestion.id]}
								<div class="suggestion">
									<div class={`suggest-avatar suggest-avatar--${suggestion.avatar}`} aria-hidden="true"></div>
									<div class="suggestion-copy">
										<div class="suggestion-name">{suggestion.name}</div>
										<div class="suggestion-handle">{suggestion.handle}</div>
									</div>
									<button class="follow-button" class:following={isFollowing} type="button" onclick={() => toggleFollow(suggestion.id)}>
										{isFollowing ? 'Following' : 'Follow'}
									</button>
								</div>
							{/each}
						</div>
						<button class="card-foot" type="button">View more suggestions →</button>
					</div>

					<div class="pn-card rail-card">
						<div class="pn-card__head"><span class="pn-label">Shortcuts</span><span class="rail-icon" aria-hidden="true">⌁</span></div>
						<div class="shortcut-list">
							{#each appShortcuts as shortcut}
								<button class="shortcut" type="button">
									<span class="shortcut-dot" aria-hidden="true"></span>
									<span>{shortcut.label}</span>
									<span class="shortcut-key">{shortcut.key}</span>
								</button>
							{/each}
						</div>
					</div>

					<div class="pn-card rail-card">
						<div class="pn-card__head"><span class="pn-label">Instance status</span><span class="status-pill status-pill--accent">Live</span></div>
						<div class="status-list">
							<div class="rail-status-row rail-status-row--health"><span>pleromanet.social</span><span class="status-pill status-pill--good">All systems normal</span></div>
							<div class="rail-status-row"><span>Uptime</span><strong>30d 12h 42m</strong></div>
							<div class="rail-status-row"><span>Users</span><strong>2,487</strong></div>
						</div>
					</div>
				{/if}
			</aside>
		</div>
	</div>

	{#if drawerOpen}
		<button class="mobile-overlay" type="button" aria-label="Dismiss navigation overlay" onclick={closeOverlays}></button>
		<aside class="mobile-drawer" data-testid="mobile-drawer">
			<div class="mobile-panel-head"><span class="pn-label">Navigation</span><button type="button" onclick={closeOverlays}>Close</button></div>
			<div class="mobile-profile">quiet admin · @pleroma.example</div>
			<nav class="mobile-nav" aria-label="Mobile drawer">
				{#each sidebarNav as item}
					<a href={item.href} onclick={(event) => { event.preventDefault(); void followLink(item.href); }}>{item.label}</a>
				{/each}
			</nav>
		</aside>
	{/if}

	{#if sheetOpen}
		<button class="mobile-overlay" type="button" aria-label="Dismiss details overlay" onclick={closeOverlays}></button>
		<aside class="mobile-sheet" data-testid="mobile-sheet">
			<div class="sheet-grip" aria-hidden="true"></div>
			<div class="mobile-panel-head"><span class="pn-label">{railTitle}</span><button type="button" aria-label="Close details sheet" onclick={closeOverlays}>Close</button></div>
			<div class="pn-card__body">
				<div class="pn-status-row"><span class="pn-status-row__label">pleroma.example</span><span class="pn-status-row__value">Online</span></div>
				<div class="rail-link">#smallweb · 24 posts</div>
			</div>
		</aside>
	{/if}

	<nav class="mobile-bottom-nav" data-testid="mobile-bottom-nav" aria-label="Mobile primary">
		{#each mobileNav as item}
			<a class:active={isActive(item)} href={item.href} aria-current={isActive(item) ? 'page' : undefined}>{item.label}</a>
		{/each}
		<button type="button" onclick={() => (sheetOpen = true)}>More</button>
	</nav>
</main>

<style>
	.app-shell-page {
		min-height: 100vh;
		background: var(--bg);
	}

	.app-header {
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
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 32px;
		align-items: center;
		padding-block: 14px;
	}

	.app-brand,
	.primary-nav,
	.header-actions,
	.user-chip,
	.header-search,
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
		display: grid;
		align-content: center;
		min-height: 48px;
		border-left: 1px solid var(--border);
		padding-left: 14px;
		padding-right: 12px;
		margin-left: 4px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		line-height: 1.4;
		text-transform: uppercase;
	}

	.primary-nav {
		justify-content: center;
		gap: 22px;
	}

	.primary-nav a,
	.side-nav a,
	.mobile-nav a,
	.mobile-bottom-nav a,
	.mobile-bottom-nav button {
		border: 0;
		background: transparent;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.primary-nav a {
		border-bottom: 2px solid transparent;
		padding-block: 6px;
	}

	.primary-nav a.active,
	.side-nav a.active,
	.mobile-bottom-nav a.active {
		color: var(--accent-ink);
	}

	.primary-nav a.active {
		border-bottom-color: var(--accent);
	}

	.header-actions {
		justify-content: flex-end;
		gap: 12px;
	}

	.header-search {
		gap: 8px;
		width: 204px;
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

	.notify-badge {
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

	.user-chip__chevron {
		width: 14px;
		height: 14px;
		color: var(--muted);
		transition: transform 0.15s;
	}

	.user-chip[aria-expanded='true'] .user-chip__chevron {
		transform: rotate(180deg);
	}

	.mini-avatar,
	.pn-avatar {
		width: 28px;
		height: 28px;
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
		flex: 0 0 auto;
	}

	.mini-avatar {
		border-radius: 999px;
	}

	.pn-avatar {
		width: 44px;
		height: 44px;
		border-radius: var(--radius);
	}

	.suggest-avatar {
		width: 36px;
		height: 36px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		flex: 0 0 auto;
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

	.user-menu button {
		border: 0;
		background: transparent;
	}

	.user-menu__head {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
		background: linear-gradient(180deg, var(--accent-soft-2), transparent);
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
		padding: 8px 4px;
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
		background: linear-gradient(135deg, #2a1f4a 50%, #e7a8c9 50%);
	}

	.swatch--drive {
		background: linear-gradient(135deg, #0c0a28 50%, #7dc4be 50%);
	}

	.swatch--simoun {
		background: linear-gradient(135deg, #061f3d 50%, #ff8438 50%);
	}

	.app-shell {
		padding-top: 18px;
		padding-bottom: 42px;
	}

	.app-layout {
		display: grid;
		grid-template-columns: 240px minmax(0, 1fr) 320px;
		gap: 18px;
		align-items: start;
	}

	.left-sidebar,
	.right-rail {
		display: grid;
		gap: 14px;
	}

	.center-column {
		min-width: 0;
	}

	.profile-card,
	.rail-card,
	.side-nav {
		box-shadow: none;
	}

	.profile-card__banner {
		min-height: 110px;
		border-width: 0 0 1px;
		border-radius: 0;
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
		font-size: 1.5rem;
	}

	.profile-card__body p:first-of-type {
		margin-top: 4px;
		color: var(--accent-ink);
		font-size: 13px;
	}

	.profile-card__body p:last-of-type {
		margin: 12px 0 4px;
		color: var(--ink-2);
		font-size: 13px;
	}

	.profile-card__stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid var(--border);
		margin-top: 14px;
	}

	.profile-card__stats div {
		padding: 12px 8px;
		border-right: 1px solid var(--border);
	}

	.profile-card__stats div:last-child {
		border-right: 0;
	}

	.profile-card__stats span {
		display: block;
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.profile-card__stats strong {
		display: block;
		margin-top: 2px;
		font-family: var(--serif);
		font-size: 22px;
		font-weight: 500;
		line-height: 1;
		color: var(--accent-ink);
	}

	.side-nav {
		padding: 6px 0;
	}

	.side-nav a {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 14px;
		font-family: var(--sans);
		font-size: 14px;
		font-weight: 400;
		letter-spacing: 0;
		line-height: 1.2;
		text-transform: none;
		color: var(--ink-2);
		border-left: 3px solid transparent;
		text-align: left;
		position: relative;
	}

	.side-nav a.active,
	.side-nav a:hover {
		background: var(--accent-soft-2);
	}

	.side-nav a.active {
		border-left-color: var(--accent);
		color: var(--ink);
	}

	.mobile-nav a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		border-radius: var(--radius);
		padding: 10px;
		font-family: var(--sans);
		font-size: 14px;
		font-weight: 400;
		letter-spacing: 0;
		text-transform: none;
		color: var(--ink-2);
	}

	.mobile-nav a:hover {
		background: var(--accent-soft-2);
	}

	.nav-glyph {
		width: 18px;
		height: 18px;
		flex: 0 0 auto;
		color: var(--muted);
	}

	.side-nav a.active .nav-glyph {
		color: var(--accent-ink);
	}

	.nav-count {
		margin-left: auto;
		border-radius: 10px;
		background: var(--accent-soft);
		color: var(--accent-ink);
		font-size: 11px;
		font-weight: 600;
		padding: 1px 7px;
	}

	.nav-grip {
		margin-left: auto;
		width: 14px;
		height: 14px;
		color: var(--muted-2);
	}

	.settings-subnav {
		padding: 4px 0 4px 50px;
		border-top: 1px solid var(--border);
		margin-top: 0;
	}

	.settings-subnav button {
		display: block;
		width: 100%;
		padding: 6px 14px 6px 0;
		font-size: 13px;
		text-align: left;
		background: transparent;
		color: var(--muted);
	}

	.settings-subnav button:hover {
		color: var(--ink);
	}

	.settings-subnav button.active {
		color: var(--accent-ink);
		font-weight: 600;
	}

	.rail-card {
		box-shadow: none;
	}

	.rail-icon {
		color: var(--muted);
		font-family: var(--mono);
		font-size: 0.9rem;
	}

	.rail-search {
		display: grid;
		gap: 7px;
	}

	.rail-search span {
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.rail-search input {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-2);
		padding: 10px 11px;
		outline: 0;
	}

	.rail-search input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft-2);
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		flex: 0 0 auto;
		white-space: nowrap;
		border-radius: 999px;
		background: transparent;
		font-family: var(--mono);
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-pill--accent {
		border: 1px solid var(--accent);
		padding: 3px 10px;
		color: var(--accent-ink);
		font-size: 11px;
		letter-spacing: 0.08em;
	}

	.status-pill--good {
		border: 1px solid #c2dcc5;
		padding: 2px 9px;
		color: var(--good-ink);
		font-size: 10.5px;
		letter-spacing: 0.06em;
	}

	.trend-list,
	.suggestion-list,
	.shortcut-list,
	.status-list {
		display: grid;
		padding: 4px 0;
	}

	.trend-item {
		display: grid;
		grid-template-columns: 18px minmax(0, 1fr);
		align-items: baseline;
		gap: 10px;
		width: 100%;
		border: 0;
		background: transparent;
		padding: 9px 16px;
		font: inherit;
		text-align: left;
	}

	.trend-item:hover,
	.shortcut:hover,
	.card-foot:hover {
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
		border: 0;
		border-top: 1px solid var(--border);
		background: transparent;
		padding: 10px 16px;
		color: var(--accent-ink);
		font-size: 12.5px;
		text-align: left;
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
		background: transparent;
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
		border: 0;
		background: transparent;
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
		flex: 1 1 auto;
		min-width: 0;
		color: var(--ink-2);
		font-size: 12.5px;
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

	.rail-status-row--health {
		align-items: center;
	}

	.rail-link {
		color: var(--accent-ink);
		font-size: 0.88rem;
	}

	.rail-link--stacked {
		border-top: 1px solid var(--border);
		padding-top: 10px;
	}

	.mobile-menu-button,
	.mobile-bottom-nav {
		display: none;
	}

	.mobile-menu-button {
		place-items: center;
		width: 34px;
		height: 34px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel);
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
	}

	.mobile-bottom-nav a,
	.mobile-bottom-nav button {
		display: grid;
		place-items: center;
		border-radius: var(--radius);
		padding: 8px 4px;
	}

	.mobile-bottom-nav a.active,
	.mobile-bottom-nav a:hover,
	.mobile-bottom-nav button:hover {
		background: var(--accent-soft-2);
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
			grid-template-columns: minmax(0, 1fr) auto;
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
		.user-chip__label {
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

		.mobile-bottom-nav {
			display: grid;
		}
	}

	@media (max-width: 480px) {
		.app-header__inner,
		.app-shell {
			padding-inline: 8px;
		}
	}
</style>
