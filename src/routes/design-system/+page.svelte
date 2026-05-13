<script lang="ts">
	import { browser } from '$app/environment';
	import Composer from '$lib/components/Composer.svelte';
	import RequestState from '$lib/components/RequestState.svelte';
	import TimelinePostCard from '$lib/components/TimelinePostCard.svelte';
	import { pleromaFixtures } from '$lib/pleroma/fixtures';
	import { adaptPleromaStatus, normalizePleromaRequestError, type PleromaRequestState } from '$lib/pleroma/ui';
	import type { PostAction, TimelinePost } from '$lib/social/types';
	import { onMount } from 'svelte';

	type Theme = 'cream' | 'dusk' | 'drive' | 'simoun';

	const themeOptions: Array<{ id: Theme; label: string }> = [
		{ id: 'cream', label: 'Cream' },
		{ id: 'dusk', label: 'Dusk' },
		{ id: 'drive', label: 'Drive' },
		{ id: 'simoun', label: 'Simoun' }
	];
	const privacyOptions = ['Public', 'Unlisted', 'Followers'] as const;
	const adaptedFixturePost = adaptPleromaStatus(pleromaFixtures.status);
	let componentComposerText = $state('component seams make real data easier to wire.');
	let componentPrivacy = $state<(typeof privacyOptions)[number]>('Public');
	let componentPrivacyMenuOpen = $state(false);
	let componentPost = $state<TimelinePost>({
		id: 'design-system-post',
		timelines: ['home'],
		name: 'component.bot',
		handle: '@component@pleromanet.social',
		time: 'now',
		body: 'this is the same post card the app timeline renders, shown here with fake data.',
		avatar: 'orb',
		media: 'space',
		replies: 2,
		boosts: 7,
		favorites: 42,
		actions: { reply: false, boost: true, favorite: false }
	});

	let theme = $state<Theme>('cream');
	let retryCount = $state(0);
	let requestState = $state<PleromaRequestState<typeof adaptedFixturePost>>({ status: 'success', data: adaptedFixturePost });
	const requestStatePost = $derived(requestState.status === 'success' ? requestState.data : adaptedFixturePost);

	const isTheme = (value: string | null): value is Theme =>
		value === 'cream' || value === 'dusk' || value === 'drive' || value === 'simoun';

	const setTheme = (nextTheme: Theme) => {
		theme = nextTheme;
	};
	const toggleComponentPostAction = (_postId: string, action: PostAction) => {
		componentPost = {
			...componentPost,
			actions: { ...componentPost.actions, [action]: !componentPost.actions[action] }
		};
	};
	const clearComponentComposer = () => {
		componentComposerText = '';
	};
	const showLoadingRequestState = () => {
		requestState = { status: 'loading' };
	};
	const showEmptyRequestState = () => {
		requestState = { status: 'empty' };
	};
	const showRetryableErrorState = () => {
		requestState = {
			status: 'error',
			error: normalizePleromaRequestError({ kind: 'network', path: '/api/v1/timelines/home', message: 'offline', cause: null })
		};
	};
	const showAuthRequiredState = () => {
		requestState = { status: 'error', error: normalizePleromaRequestError({ kind: 'unauthenticated', message: 'OAuth token required' }) };
	};
	const showSuccessRequestState = () => {
		requestState = { status: 'success', data: adaptedFixturePost };
	};
	const retryRequestState = () => {
		retryCount += 1;
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

			<article class="pn-card component-card" data-testid="primitive-composer">
				<div class="pn-card__head">
					<span class="pn-label">Composer component</span>
				</div>
				<Composer
					label="Component composer"
					textareaLabel="Component post text"
					placeholder="Draft a component preview..."
					submitLabel="Post"
					value={componentComposerText}
					privacy={componentPrivacy}
					privacyOptions={privacyOptions}
					privacyMenuOpen={componentPrivacyMenuOpen}
					onValueChange={(value) => (componentComposerText = value)}
					onPrivacyMenuOpenChange={(open) => (componentPrivacyMenuOpen = open)}
					onPrivacyChange={(value) => {
						componentPrivacy = value;
						componentPrivacyMenuOpen = false;
					}}
					onSubmit={clearComponentComposer}
				/>
			</article>

			<article class="pn-card" data-testid="primitive-post-actions">
				<div class="pn-card__head">
					<span class="pn-label">Timeline post component</span>
				</div>
				<TimelinePostCard post={componentPost} onAction={toggleComponentPostAction} />
			</article>

			<article class="pn-card" data-testid="primitive-pleroma-fixture">
				<div class="pn-card__head">
					<span class="pn-label">Pleroma fixture adapter</span>
					<span class="pn-pill">Typed API data</span>
				</div>
				<TimelinePostCard post={adaptedFixturePost} testId="fixture-adapted-post" />
			</article>

			<article class="pn-card request-state-card" data-testid="primitive-request-state">
				<div class="pn-card__head">
					<span class="pn-label">Request states</span>
					<span class="pn-pill">Retry count {retryCount}</span>
				</div>
				<div class="request-state-controls" aria-label="Request state demos">
					<button class="pn-button pn-button--ghost" type="button" onclick={showLoadingRequestState}>Show loading</button>
					<button class="pn-button pn-button--ghost" type="button" onclick={showEmptyRequestState}>Show empty</button>
					<button class="pn-button pn-button--ghost" type="button" onclick={showRetryableErrorState}>Show retryable error</button>
					<button class="pn-button pn-button--ghost" type="button" onclick={showAuthRequiredState}>Show auth required</button>
					<button class="pn-button pn-button--ghost" type="button" onclick={showSuccessRequestState}>Show success</button>
				</div>
				<div class="pn-card__body">
					<RequestState
						state={requestState}
						emptyTitle="No statuses yet"
						emptyMessage="This fixture-backed timeline returned no posts."
						onRetry={retryRequestState}
					>
						<p class="request-state-success-copy">Adapted fixture content loaded</p>
						<TimelinePostCard post={requestStatePost} testId="request-state-success-post" />
					</RequestState>
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

	.request-state-card {
		grid-column: span 2;
	}

	.request-state-controls {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		border-bottom: 1px solid var(--border);
		padding: 12px 16px;
	}

	.request-state-success-copy {
		margin: 0;
		padding: 14px 16px 0;
		color: var(--accent-ink);
		font-weight: 700;
	}

	.profile-name {
		font-family: var(--serif);
		font-size: 1.55rem;
		line-height: 1;
	}

	.profile-handle {
		color: var(--accent-ink);
	}

	.profile-handle {
		margin-top: 3px;
		font-size: 0.85rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 980px) {
		.primitive-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.request-state-card {
			grid-column: auto;
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
