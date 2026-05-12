<script lang="ts">
	import TimelinePostCard from '$lib/components/TimelinePostCard.svelte';
	import {
		fetchPublicTimeline,
		getPleromaApiOrigin,
		type PublicTimelineScope
	} from '$lib/pleroma/publicTimeline';
	import type { TimelinePost } from '$lib/social/types';
	import { onMount } from 'svelte';

	type LoadState = 'loading' | 'ready' | 'error';

	const apiOrigin = getPleromaApiOrigin();
	const apiHost = new URL(apiOrigin).host;
	const timelineTabs: Array<{ id: PublicTimelineScope; label: string; description: string }> = [
		{ id: 'local', label: 'Local', description: `Posts from ${apiHost}` },
		{ id: 'federated', label: 'Federated', description: `Public posts visible to ${apiHost}` }
	];

	let activeTimeline = $state<PublicTimelineScope>('local');
	let loadState = $state<LoadState>('loading');
	let timelinePosts = $state<TimelinePost[]>([]);
	let requestToken = 0;

	const activeDescription = $derived(
		timelineTabs.find((tab) => tab.id === activeTimeline)?.description ?? ''
	);

	const loadTimeline = async (timeline: PublicTimelineScope) => {
		activeTimeline = timeline;
		loadState = 'loading';
		const currentRequest = ++requestToken;

		try {
			const posts = await fetchPublicTimeline({ scope: timeline, apiOrigin });

			if (currentRequest !== requestToken) return;
			timelinePosts = posts;
			loadState = 'ready';
		} catch {
			if (currentRequest !== requestToken) return;
			timelinePosts = [];
			loadState = 'error';
		}
	};

	onMount(() => {
		void loadTimeline(activeTimeline);
	});
</script>

<svelte:head>
	<title>{apiHost} public timeline · PleromaNet</title>
	<meta
		name="description"
		content={`Browse the ${apiHost} public Pleroma timeline without signing in.`}
	/>
</svelte:head>

<main class="pn-page public-page">
	<header class="public-header">
		<a class="public-brand" href="/" aria-label="PleromaNet home">
			<span class="brand-mark" aria-hidden="true">
				<svg viewBox="0 0 32 32" fill="none">
					<path
						d="M16 3v9M16 20v9M3 16h9M20 16h9M7 7l5 5M20 20l5 5M25 7l-5 5M12 20l-5 5"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linecap="round"
					/>
					<circle cx="16" cy="16" r="2" fill="currentColor" />
				</svg>
			</span>
			<span class="brand-copy">
				<span class="brand-wordmark">PleromaNet</span>
				<span class="brand-kicker">public preview</span>
			</span>
		</a>
		<nav class="public-nav" aria-label="Public">
			<a href="/">Prototype</a>
			<a href={apiOrigin} rel="noreferrer">Open {apiHost}</a>
			<button type="button">Sign in on your server</button>
		</nav>
	</header>

	<div class="public-shell">
		<section class="public-hero" aria-labelledby="public-title">
			<div>
				<p class="pn-kicker">No login required</p>
				<h1 id="public-title">{apiHost} public timeline</h1>
				<p>
					A first real PleromaNet slice: this page reads the public timeline API directly from
					{apiHost}. Passwords stay on the user's Pleroma server when sign-in lands.
				</p>
			</div>
			<div class="hero-stamp" aria-label={`API target ${apiHost}`}>
				<span>API target</span>
				<strong>{apiHost}</strong>
			</div>
		</section>

		<div class="public-layout">
			<section class="pn-card public-timeline-card" aria-label={`${apiHost} public timeline`}>
				<div class="pn-tabs public-tabs" role="tablist" aria-label="Public timeline scope">
					{#each timelineTabs as tab}
						<button
							class="pn-tab"
							class:active={activeTimeline === tab.id}
							type="button"
							role="tab"
							aria-selected={activeTimeline === tab.id}
							aria-controls="public-timeline-panel"
							onclick={() => loadTimeline(tab.id)}
						>
							{tab.label}
						</button>
					{/each}
				</div>

				<div class="timeline-context">
					<span>{activeDescription}</span>
					<span class="pn-pill">Public API</span>
				</div>

				<div
					id="public-timeline-panel"
					class="public-timeline-list"
					role="tabpanel"
					aria-label={`${activeTimeline} public posts`}
				>
					{#if loadState === 'loading'}
						<div class="timeline-message" role="status">Loading public posts from {apiHost}...</div>
					{:else if loadState === 'error'}
						<div class="timeline-message timeline-message--error" role="alert">
							<p>Could not load the public timeline from {apiHost}.</p>
							<button class="pn-button" type="button" onclick={() => loadTimeline(activeTimeline)}>
								Try again
							</button>
						</div>
					{:else if timelinePosts.length === 0}
						<div class="timeline-message">No public posts came back from {apiHost}.</div>
					{:else}
						{#each timelinePosts as post (post.id)}
							<TimelinePostCard post={post} testId="public-timeline-post" />
						{/each}
					{/if}
				</div>
			</section>

			<aside class="public-rail" aria-label="Public timeline details">
				<div class="pn-card rail-card">
					<div class="pn-card__head">
						<span class="pn-label">Instance</span>
						<span class="pn-pill">Live</span>
					</div>
					<div class="pn-card__body">
						<div class="pn-status-row">
							<span class="pn-status-row__label">Target</span>
							<span class="pn-status-row__value">{apiHost}</span>
						</div>
						<div class="pn-status-row">
							<span class="pn-status-row__label">Auth</span>
							<span class="pn-status-row__value">None</span>
						</div>
					</div>
				</div>

				<div class="pn-card rail-card">
					<div class="pn-card__head">
						<span class="pn-label">Development</span>
					</div>
					<div class="pn-card__body">
						<p>
							Set <code>PUBLIC_PLEROMA_API_BASE_URL</code> to point this page at another
							Pleroma server.
						</p>
					</div>
				</div>
			</aside>
		</div>
	</div>
</main>

<style>
	.public-page {
		min-height: 100vh;
		padding-bottom: 56px;
	}

	.public-header,
	.public-shell {
		width: min(1120px, 100%);
		margin: 0 auto;
		padding-inline: 24px;
	}

	.public-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		padding-block: 18px;
	}

	.public-brand,
	.public-nav,
	.public-hero,
	.hero-stamp,
	.timeline-context {
		display: flex;
		align-items: center;
	}

	.public-brand {
		gap: 12px;
		min-width: 0;
	}

	.brand-mark {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius);
		background: #1c2046;
		color: #dcd1f0;
		flex: 0 0 auto;
	}

	.brand-mark svg {
		width: 28px;
		height: 28px;
	}

	.brand-copy {
		display: grid;
		gap: 2px;
	}

	.brand-wordmark {
		font-family: var(--serif);
		font-size: 28px;
		line-height: 1;
	}

	.brand-kicker,
	.public-nav {
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.public-nav {
		gap: 16px;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.public-nav a:hover {
		color: var(--accent-ink);
	}

	.public-nav button {
		border: 1px solid var(--accent);
		border-radius: 999px;
		background: var(--accent-soft-2);
		color: var(--accent-ink);
		padding: 8px 12px;
		font: inherit;
	}

	.public-shell {
		display: grid;
		gap: 22px;
		padding-top: 8px;
	}

	.public-hero {
		justify-content: space-between;
		gap: 24px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(circle at 78% 24%, var(--accent-soft), transparent 12rem),
			var(--panel);
		padding: 26px;
		overflow: hidden;
	}

	.public-hero h1,
	.public-hero p {
		margin: 0;
	}

	.public-hero h1 {
		margin-top: 8px;
		font-family: var(--serif);
		font-size: clamp(2.35rem, 6vw, 5.25rem);
		font-weight: 500;
		line-height: 0.96;
		letter-spacing: -0.04em;
	}

	.public-hero p:last-child {
		max-width: 62ch;
		margin-top: 14px;
		color: var(--ink-2);
		font-size: 1rem;
	}

	.hero-stamp {
		align-self: stretch;
		min-width: 220px;
		justify-content: center;
		flex-direction: column;
		gap: 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: linear-gradient(180deg, var(--panel-2), var(--accent-soft-2));
		padding: 18px;
		text-align: center;
	}

	.hero-stamp span {
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.hero-stamp strong {
		font-family: var(--serif);
		font-size: 2rem;
		font-weight: 500;
		line-height: 1;
		color: var(--accent-ink);
	}

	.public-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 280px;
		gap: 20px;
		align-items: start;
	}

	.public-timeline-card {
		box-shadow: none;
	}

	.public-tabs {
		padding-inline: 16px;
	}

	.timeline-context {
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid var(--border);
		padding: 12px 16px;
		color: var(--muted);
		font-size: 0.88rem;
	}

	.public-timeline-list {
		display: grid;
	}

	.timeline-message {
		display: grid;
		justify-items: start;
		gap: 12px;
		padding: 28px 16px;
		color: var(--ink-2);
	}

	.timeline-message p {
		margin: 0;
	}

	.timeline-message--error {
		background: color-mix(in srgb, var(--bad) 12%, transparent);
	}

	.public-rail {
		display: grid;
		gap: 16px;
		min-width: 0;
	}

	.rail-card {
		box-shadow: none;
	}

	.rail-card p {
		margin: 0;
		color: var(--ink-2);
	}

	code {
		font-family: var(--mono);
		font-size: 0.82em;
		color: var(--accent-ink);
	}

	@media (max-width: 900px) {
		.public-layout {
			grid-template-columns: 1fr;
		}

		.public-rail {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 720px) {
		.public-header,
		.public-shell {
			padding-inline: 14px;
		}

		.public-header,
		.public-hero {
			align-items: stretch;
			flex-direction: column;
		}

		.public-nav {
			justify-content: flex-start;
		}

		.public-hero {
			padding: 20px;
		}

		.hero-stamp {
			min-width: 0;
		}

		.public-rail {
			grid-template-columns: 1fr;
		}

		.timeline-context {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
