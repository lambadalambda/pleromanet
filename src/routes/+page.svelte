<script lang="ts">
	import { browser } from '$app/environment';
	import PnIcon from '$lib/PnIcon.svelte';
	import { onMount } from 'svelte';

	type View = 'home' | 'local' | 'federated' | 'explore' | 'settings' | 'about';
	type Theme = 'cream' | 'dusk' | 'drive';
	type SidebarIcon = 'home' | 'users' | 'globe' | 'bell' | 'message' | 'bookmark' | 'list' | 'gear';

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
		{ id: 'drive', label: 'Drive' }
	];

	let activeView = $state<View>('home');
	let userMenuOpen = $state(false);
	let drawerOpen = $state(false);
	let sheetOpen = $state(false);
	let theme = $state<Theme>('cream');

	const isTheme = (value: string | null): value is Theme =>
		value === 'cream' || value === 'dusk' || value === 'drive';

	const viewTitle = $derived(
		activeView === 'settings'
			? 'Profile settings'
			: `${activeView.slice(0, 1).toUpperCase()}${activeView.slice(1)} timeline`
	);

	const railTitle = $derived(
		activeView === 'explore'
			? 'Discover'
			: activeView === 'settings'
				? 'Profile Preview'
				: 'Trends & Activity'
	);

	const selectView = (view: View) => {
		activeView = view;
		drawerOpen = false;
		sheetOpen = false;
	};

	const closeOverlays = () => {
		userMenuOpen = false;
		drawerOpen = false;
		sheetOpen = false;
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
				<div class="pn-card view-card">
					<div class="pn-tabs" aria-label="Timeline sections">
						<button
							class="pn-tab"
							class:active={activeView === 'home'}
							type="button"
							aria-current={activeView === 'home' ? 'page' : undefined}
							onclick={() => selectView('home')}
						>
							Home
						</button>
						<button
							class="pn-tab"
							class:active={activeView === 'local'}
							type="button"
							aria-current={activeView === 'local' ? 'page' : undefined}
							onclick={() => selectView('local')}
						>
							Local
						</button>
						<button
							class="pn-tab"
							class:active={activeView === 'federated'}
							type="button"
							aria-current={activeView === 'federated' ? 'page' : undefined}
							onclick={() => selectView('federated')}
						>
							Federated
						</button>
					</div>
					<div class="view-card__body">
						<p class="pn-kicker">Signed-in shell</p>
						<h1>{viewTitle}</h1>
						<p>
							This placeholder keeps the center column intentionally light. Timelines, composer,
							and post interactions land in the next slice.
						</p>
						<div class="placeholder-composer">
							<span class="pn-avatar" aria-hidden="true"></span>
							<div>Composer shell reserved for issue 04.</div>
						</div>
					</div>
				</div>
			</section>

			<aside class="right-rail" data-testid="right-rail">
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
		grid-template-columns: repeat(3, 1fr);
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
	}
</style>
