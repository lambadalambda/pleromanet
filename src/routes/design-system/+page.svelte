<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	type Theme = 'cream' | 'dusk' | 'drive';

	const themeOptions: Array<{ id: Theme; label: string }> = [
		{ id: 'cream', label: 'Cream' },
		{ id: 'dusk', label: 'Dusk' },
		{ id: 'drive', label: 'Drive' }
	];

	let theme = $state<Theme>('cream');

	const isTheme = (value: string | null): value is Theme =>
		value === 'cream' || value === 'dusk' || value === 'drive';

	const setTheme = (nextTheme: Theme) => {
		theme = nextTheme;
	};

	onMount(() => {
		const savedTheme = localStorage.getItem('pn-theme');

		if (isTheme(savedTheme)) {
			theme = savedTheme;
		}
	});

	$effect(() => {
		if (!browser) return;

		document.documentElement.dataset.theme = theme;
		localStorage.setItem('pn-theme', theme);
	});
</script>

<svelte:head>
	<title>Design System - PleromaNet</title>
</svelte:head>

<main class="pn-page design-system-page">
	<div class="pn-shell">
		<header class="design-system-header">
			<div>
				<p class="pn-kicker">PleromaNet UI</p>
				<h1 class="pn-title">Design System</h1>
				<p class="pn-copy">
					Reduced fediverse interface primitives with warm panels, deep ink, lavender accents,
					and soft vaporwave image treatment.
				</p>
			</div>

			<div class="theme-switcher" aria-label="Theme selector">
				{#each themeOptions as option}
					<button
						type="button"
						class="pn-button pn-button--ghost"
						aria-pressed={theme === option.id}
						onclick={() => setTheme(option.id)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</header>

		<section class="primitive-grid" data-testid="primitive-grid" aria-label="Design primitives">
			<article class="pn-card" data-testid="primitive-card">
				<div class="pn-card__head">
					<span class="pn-label">Cards</span>
					<span class="pn-pill">Quiet chrome</span>
				</div>
				<div class="pn-card__body">
					<p>
						Panels use warm off-white surfaces, one-pixel borders, compact radii, and enough
						contrast to hold dense social UI without turning into a dashboard.
					</p>
					<button class="pn-button pn-button--primary" type="button">Primary action</button>
				</div>
				<div class="pn-card__foot">Footer links keep the same quiet rhythm.</div>
			</article>

			<article class="pn-card" data-testid="primitive-tabs">
				<div class="pn-tabs" role="tablist" aria-label="Timeline tabs">
					<button class="pn-tab" type="button" role="tab" aria-selected="true">Home</button>
					<button class="pn-tab" type="button" role="tab" aria-selected="false">Local</button>
					<button class="pn-tab" type="button" role="tab" aria-selected="false">Federated</button>
				</div>
				<div class="pn-card__body">
					<div class="sample-row">
						<button class="pn-icon-button" type="button" aria-label="Search">
							<svg class="pn-spark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.5" />
								<path d="m16 16 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
							</svg>
						</button>
						<button class="pn-button" type="button">Secondary</button>
						<button class="pn-button pn-button--ghost" type="button">Ghost</button>
					</div>
				</div>
			</article>

			<article class="pn-card" data-testid="primitive-form">
				<div class="pn-card__head">
					<span class="pn-label">Forms</span>
				</div>
				<div class="pn-card__body">
					<div class="pn-form">
						<label class="pn-field">
							<span class="pn-label">Display name</span>
							<input class="pn-input" value="dreambyte" aria-label="Display name" />
						</label>
						<label class="pn-field">
							<span class="pn-label">Bio</span>
							<textarea class="pn-textarea" aria-label="Bio">living in a soft world</textarea>
						</label>
					</div>
				</div>
			</article>

			<article class="pn-card" data-testid="primitive-status">
				<div class="pn-card__head">
					<span class="pn-label">Status rows</span>
					<span class="pn-pill">All systems normal</span>
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
				</div>
			</article>

			<article class="pn-card visual-card" data-testid="primitive-vapor-banner">
				<div class="pn-vapor-banner pn-vapor-banner--window" aria-label="Vaporwave banner"></div>
				<div class="pn-card__body">
					<div class="sample-row sample-row--profile">
						<div class="pn-avatar" aria-hidden="true"></div>
						<div>
							<div class="profile-name">dreambyte</div>
							<div class="profile-handle">@dreambyte@pleromanet.social</div>
						</div>
					</div>
				</div>
			</article>

			<article class="pn-card" data-testid="primitive-post-actions">
				<div class="pn-card__head">
					<span class="pn-label">Post actions</span>
				</div>
				<div class="pn-card__body">
					<div class="sample-row sample-row--profile">
						<div class="pn-avatar pn-avatar--orb" aria-hidden="true"></div>
						<p class="post-copy">the internet can wait.</p>
					</div>
					<div class="pn-post-actions">
						<button class="pn-post-action" type="button">
							<svg
								class="pn-post-action__icon"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
								focusable="false"
								data-testid="post-action-reply-icon"
							>
								<path
									d="M9 8H6v3M6 8c0 5 4 8 9 8h4M19 16l-3 3M19 16l-3-3"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
							<span>2</span>
						</button>
						<button class="pn-post-action" type="button" aria-pressed="true">
							<svg
								class="pn-post-action__icon"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
								focusable="false"
								data-testid="post-action-boost-icon"
							>
								<path
									d="M4 8l3-3 3 3M7 5v9a2 2 0 0 0 2 2h7M20 16l-3 3-3-3M17 19v-9a2 2 0 0 0-2-2H8"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
							<span>7</span>
						</button>
						<button class="pn-post-action" type="button">
							<svg
								class="pn-post-action__icon"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
								focusable="false"
								data-testid="post-action-favorite-icon"
							>
								<path
									d="M12 3l2.6 5.8 6.4.6-4.8 4.4 1.4 6.2L12 16.8 6.4 20l1.4-6.2L3 9.4l6.4-.6L12 3z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linejoin="round"
								/>
							</svg>
							<span>42</span>
						</button>
						<button class="pn-post-action" type="button" aria-label="More actions">
							<svg
								class="pn-post-action__icon"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
								focusable="false"
							>
								<circle cx="6" cy="12" r="1.5" fill="currentColor" />
								<circle cx="12" cy="12" r="1.5" fill="currentColor" />
								<circle cx="18" cy="12" r="1.5" fill="currentColor" />
							</svg>
						</button>
					</div>
				</div>
			</article>
		</section>
	</div>
</main>

<style>
	.design-system-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 24px;
		align-items: end;
		margin-bottom: 24px;
	}

	.pn-kicker,
	.pn-title,
	.pn-copy {
		margin: 0;
	}

	.pn-title {
		margin-top: 10px;
	}

	.pn-copy {
		margin-top: 14px;
	}

	.theme-switcher,
	.sample-row {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.primitive-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 18px;
	}

	.visual-card {
		padding: 12px;
	}

	.visual-card .pn-card__body {
		padding-inline: 4px;
		padding-bottom: 4px;
	}

	.sample-row--profile {
		flex-wrap: nowrap;
		min-width: 0;
	}

	.profile-name {
		font-family: var(--serif);
		font-size: 1.55rem;
		line-height: 1;
	}

	.profile-handle,
	.post-copy {
		color: var(--accent-ink);
	}

	.profile-handle {
		margin-top: 3px;
		font-size: 0.85rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.post-copy {
		margin: 0;
	}

	@media (max-width: 980px) {
		.primitive-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.design-system-header {
			grid-template-columns: 1fr;
			align-items: start;
		}

		.primitive-grid {
			grid-template-columns: 1fr;
		}

		.theme-switcher {
			width: 100%;
		}
	}
</style>
