<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { appTrends, followSuggestions } from '$lib/app/fixtures';

	type NavItem = {
		label: string;
		href: string;
		section: string;
		count?: string;
	};

	type Props = {
		path: string;
		children: Snippet;
	};

	let { path, children }: Props = $props();
	let drawerOpen = $state(false);
	let sheetOpen = $state(false);

	const primaryNav: NavItem[] = [
		{ label: 'Home', href: '/app/home', section: 'home' },
		{ label: 'Public', href: '/app/public', section: 'public' },
		{ label: 'Local', href: '/app/local', section: 'local' },
		{ label: 'Federated', href: '/app/federated', section: 'federated' },
		{ label: 'Explore', href: '/app/explore', section: 'explore' },
		{ label: 'Settings', href: '/app/settings', section: 'settings' }
	];
	const sidebarNav: NavItem[] = [
		{ label: 'Home', href: '/app/home', section: 'home' },
		{ label: 'Public', href: '/app/public', section: 'public' },
		{ label: 'Local', href: '/app/local', section: 'local' },
		{ label: 'Federated', href: '/app/federated', section: 'federated' },
		{ label: 'Notifications', href: '/app/notifications', section: 'notifications', count: '3' },
		{ label: 'Explore', href: '/app/explore', section: 'explore' },
		{ label: 'Settings', href: '/app/settings', section: 'settings' }
	];
	const settingsTabs = ['Profile', 'Appearance', 'Notifications', 'Filters', 'Federation', 'Account'];
	const mobileNav = [
		{ label: 'Home', href: '/app/home', section: 'home' },
		{ label: 'Explore', href: '/app/explore', section: 'explore' },
		{ label: 'Alerts', href: '/app/notifications', section: 'notifications' },
		{ label: 'Settings', href: '/app/settings', section: 'settings' }
	];

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
		drawerOpen = false;
		sheetOpen = false;
	};
	const followLink = async (href: string) => {
		closeOverlays();
		await goto(href);
	};
</script>

<main class="pn-page app-shell-page">
	<header class="app-header" data-testid="app-header">
		<div class="app-header__inner">
			<div class="app-brand">
				<button class="mobile-menu-button" type="button" aria-label="Open navigation menu" onclick={() => (drawerOpen = true)}>
					<span></span><span></span><span></span>
				</button>
				<a class="brand-mark" href="/app/home" aria-label="PleromaNet home">PN</a>
				<div>
					<div class="brand-wordmark">PleromaNet<sup>TM</sup></div>
					<div class="brand-tag">A federated social web</div>
				</div>
			</div>

			<nav class="primary-nav" aria-label="Primary">
				{#each primaryNav as item}
					<a class:active={isActive(item)} href={item.href} aria-current={isActive(item) ? 'page' : undefined}>{item.label}</a>
				{/each}
			</nav>

			<div class="header-actions">
				<label class="header-search">
					<span aria-hidden="true">⌕</span>
					<input type="search" aria-label="Search PleromaNet" placeholder="Search..." />
				</label>
				<a class="notify-button" href="/app/notifications" aria-label="Notifications"><span>3</span></a>
				<a class="user-chip" href="/app/profiles/quietadmin@pleroma.example" aria-label="quiet admin profile">
					<span class="mini-avatar" aria-hidden="true"></span>
					<span>quiet admin</span>
				</a>
			</div>
		</div>
	</header>

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
				</div>

				<nav class="pn-card side-nav" aria-label="Sidebar">
					{#each sidebarNav as item}
						<a class:active={isActive(item)} href={item.href} aria-current={isActive(item) ? 'page' : undefined}>
							<span>{item.label}</span>
							{#if item.count}<span class="nav-count">{item.count}</span>{/if}
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
					<div class="pn-card rail-card">
						<div class="pn-card__head"><span class="pn-label">Discover</span><span class="pn-pill">Curated</span></div>
						<div class="pn-card__body">
							<div class="rail-link">#pleroma · active now</div>
							<div class="rail-link">Federated CSS Garden · featured</div>
						</div>
					</div>
				{:else if section === 'settings'}
					<div class="pn-card rail-card">
						<div class="pn-card__head"><span class="pn-label">Profile Preview</span></div>
						<div class="pn-card__body"><p>Profile changes preview in this rail on wider screens.</p></div>
					</div>
				{:else}
					<div class="pn-card rail-card">
						<div class="pn-card__head"><span class="pn-label">Trends & Activity</span><span class="pn-pill">Live</span></div>
						<div class="trend-list">
							{#each appTrends as trend}
								<a class="trend-item" href="/app/explore"><span>{trend.tag}</span><small>{trend.count}</small></a>
							{/each}
						</div>
					</div>
				{/if}

				<div class="pn-card rail-card">
					<div class="pn-card__head"><span class="pn-label">Who to follow</span></div>
					<div class="suggestion-list">
						{#each followSuggestions as suggestion}
							<div class="suggestion">
								<div class="suggest-avatar" aria-hidden="true"></div>
								<div class="suggestion-copy">
									<div class="suggestion-name">{suggestion.name}</div>
									<div class="suggestion-handle">{suggestion.handle}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
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
		gap: 24px;
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
		gap: 12px;
		min-width: 0;
	}

	.brand-mark {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--panel);
		font-family: var(--mono);
		font-weight: 800;
	}

	.brand-wordmark {
		font-family: var(--serif);
		font-size: 1.85rem;
		line-height: 1;
	}

	.brand-wordmark sup,
	.brand-tag {
		color: var(--muted);
		font-family: var(--mono);
		font-size: 0.62rem;
		letter-spacing: 0.08em;
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
		width: 220px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
		padding: 7px 10px;
	}

	.header-search input {
		min-width: 0;
		width: 100%;
		border: 0;
		background: transparent;
		outline: 0;
	}

	.notify-button {
		display: grid;
		place-items: center;
		min-width: 32px;
		height: 32px;
		border-radius: var(--radius);
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	.user-chip {
		gap: 8px;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 4px 10px 4px 4px;
	}

	.mini-avatar,
	.suggest-avatar {
		width: 28px;
		height: 28px;
		border-radius: 999px;
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
		flex: 0 0 auto;
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
		min-height: 90px;
		border-width: 0 0 1px;
		border-radius: 0;
	}

	.profile-card__body {
		padding: 14px 16px;
	}

	.profile-card h2,
	.profile-card p {
		margin: 0;
	}

	.profile-card h2 {
		font-family: var(--serif);
		font-size: 1.5rem;
	}

	.profile-card p {
		color: var(--muted);
	}

	.side-nav {
		padding: 8px;
	}

	.side-nav a,
	.mobile-nav a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		border-radius: var(--radius);
		padding: 10px;
	}

	.side-nav a.active,
	.side-nav a:hover,
	.mobile-nav a:hover {
		background: var(--accent-soft-2);
	}

	.nav-count {
		border-radius: 999px;
		background: var(--accent-soft);
		padding: 1px 7px;
	}

	.settings-subnav {
		display: grid;
		gap: 4px;
		border-top: 1px solid var(--border);
		margin-top: 6px;
		padding-top: 8px;
	}

	.settings-subnav button {
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--muted);
		padding: 7px 10px;
		text-align: left;
	}

	.settings-subnav button.active {
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	.trend-list,
	.suggestion-list {
		display: grid;
	}

	.trend-item,
	.suggestion {
		display: flex;
		gap: 10px;
		align-items: center;
		border-top: 1px solid var(--border);
		padding: 12px 14px;
	}

	.trend-item:first-child,
	.suggestion:first-child {
		border-top: 0;
	}

	.trend-item {
		justify-content: space-between;
	}

	.trend-item small,
	.suggestion-handle,
	.rail-link {
		color: var(--muted);
	}

	.suggestion-copy {
		min-width: 0;
	}

	.suggestion-handle {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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

		.brand-wordmark {
			font-size: 1.45rem;
		}

		.brand-tag,
		.primary-nav,
		.header-search,
		.user-chip > span:last-child {
			display: none;
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
