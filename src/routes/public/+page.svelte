<script lang="ts">
	import { env } from '$env/dynamic/public';
	import RequestState from '$lib/components/RequestState.svelte';
	import TimelinePostCard from '$lib/components/TimelinePostCard.svelte';
	import { createPleromaClient } from '$lib/pleroma/client';
	import { adaptPleromaStatuses, normalizePleromaRequestError, type PleromaRequestState, type PleromaStatusView } from '$lib/pleroma/ui';
	import { onMount } from 'svelte';

	type PublicTimeline = 'local' | 'federated';

	const instanceUrl = env.PUBLIC_PLEROMA_INSTANCE_URL || 'https://pleroma.social';
	const tabs: Array<{ id: PublicTimeline; label: string }> = [
		{ id: 'local', label: 'Local' },
		{ id: 'federated', label: 'Federated' }
	];

	let activeTimeline = $state<PublicTimeline>('local');
	let timelineState = $state<PleromaRequestState<PleromaStatusView[]>>({ status: 'loading' });
	let loadVersion = 0;
	const posts = $derived(timelineState.status === 'success' ? timelineState.data : []);

	const loadTimeline = async (timeline: PublicTimeline = activeTimeline) => {
		const version = loadVersion + 1;
		loadVersion = version;
		activeTimeline = timeline;
		timelineState = { status: 'loading' };

		try {
			const client = createPleromaClient({ instanceUrl, fetch: window.fetch.bind(window) });
			const statuses = timeline === 'local' ? await client.getLocalTimeline({ limit: 20 }) : await client.getFederatedTimeline({ limit: 20 });
			if (version !== loadVersion) return;
			const adapted = adaptPleromaStatuses(statuses, { timelines: [timeline === 'local' ? 'local' : 'federated'] });
			timelineState = adapted.length > 0 ? { status: 'success', data: adapted } : { status: 'empty' };
		} catch (error) {
			if (version !== loadVersion) return;
			timelineState = { status: 'error', error: normalizePleromaRequestError(error) };
		}
	};

	onMount(() => {
		void loadTimeline('local');
	});
</script>

<svelte:head>
	<title>PleromaNet · Public timeline</title>
	<meta name="description" content="Browse a public Pleroma timeline without signing in." />
</svelte:head>

<main class="pn-page public-page">
	<div class="public-shell">
		<header class="public-header">
			<a class="public-brand" href="/">PleromaNet<sup>TM</sup></a>
			<a class="pn-button pn-button--ghost" href="/#oauth">Sign in</a>
		</header>

		<section class="public-hero" aria-labelledby="public-title">
			<p class="pn-kicker">Anonymous Pleroma API slice</p>
			<h1 id="public-title">Public timeline</h1>
			<p>
				Browse public Pleroma posts before signing in. This route uses the same API client and
				UI adapters as authenticated routes, but sends no OAuth token.
			</p>
		</section>

		<section class="pn-card public-timeline-card" aria-label="Public timeline browser">
			<div class="pn-tabs" role="tablist" aria-label="Public timeline kind">
				{#each tabs as tab}
					<button
						id={`public-tab-${tab.id}`}
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

			<div id="public-timeline-panel" role="tabpanel" aria-labelledby={`public-tab-${activeTimeline}`}>
				<RequestState
					state={timelineState}
					emptyTitle="No public posts yet"
					emptyMessage="This Pleroma timeline returned no statuses for this slice."
					onRetry={() => loadTimeline()}
				>
					<div class="public-timeline-list" data-testid="public-timeline-list">
						{#each posts as post (post.timelineItemId)}
							<TimelinePostCard {post} />
						{/each}
					</div>
				</RequestState>
			</div>
		</section>
	</div>
</main>

<style>
	.public-page {
		min-height: 100vh;
		background:
			radial-gradient(circle at 14% 12%, var(--accent-soft-2), transparent 32rem),
			var(--bg);
	}

	.public-shell {
		width: min(980px, 100%);
		margin: 0 auto;
		padding: 22px 24px 56px;
	}

	.public-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 28px;
	}

	.public-brand {
		font-family: var(--serif);
		font-size: 1.8rem;
		line-height: 1;
	}

	.public-brand sup {
		font-family: var(--sans);
		font-size: 0.62rem;
		color: var(--muted);
	}

	.public-hero {
		display: grid;
		gap: 12px;
		margin-bottom: 22px;
	}

	.public-hero h1,
	.public-hero p {
		margin: 0;
	}

	.public-hero h1 {
		font-family: var(--serif);
		font-size: clamp(2.8rem, 10vw, 6rem);
		font-weight: 500;
		letter-spacing: -0.05em;
		line-height: 0.9;
	}

	.public-hero p:not(.pn-kicker) {
		max-width: 62ch;
		color: var(--ink-2);
		font-size: 1rem;
	}

	.public-timeline-card {
		overflow: hidden;
	}

	.public-timeline-list {
		display: grid;
	}

	@media (max-width: 720px) {
		.public-shell {
			padding-inline: 12px;
		}

		.public-header {
			align-items: flex-start;
		}
	}
</style>
