<script lang="ts">
	import { goto } from '$app/navigation';
	import Composer from '$lib/components/Composer.svelte';
	import RequestState from '$lib/components/RequestState.svelte';
	import TimelinePostCard from '$lib/components/TimelinePostCard.svelte';
	import { getPleromaAuthContext } from '$lib/pleroma/auth';
	import { createPleromaClient } from '$lib/pleroma/client';
	import {
		adaptPleromaStatuses,
		normalizePleromaRequestError,
		type PleromaRequestState,
		type PleromaStatusView
	} from '$lib/pleroma/ui';
	import { onMount } from 'svelte';

	const auth = getPleromaAuthContext();
	const privacyOptions = ['Public', 'Unlisted', 'Followers'] as const;
	const timelineTabs = [
		{ id: 'home', label: 'Home', href: '/app/home' },
		{ id: 'local', label: 'Local', href: '/app/local' },
		{ id: 'federated', label: 'Federated', href: '/app/federated' }
	] as const;

	let composerText = $state('');
	let composerPrivacy = $state<(typeof privacyOptions)[number]>('Public');
	let privacyMenuOpen = $state(false);
	let timelineState = $state<PleromaRequestState<PleromaStatusView[]>>({ status: 'loading' });
	let loadVersion = 0;
	const posts = $derived(timelineState.status === 'success' ? timelineState.data : []);

	const loadTimeline = async () => {
		const version = loadVersion + 1;
		loadVersion = version;
		timelineState = { status: 'loading' };

		const authState = auth.refresh();
		if (authState.status !== 'authenticated') {
			timelineState = { status: 'idle' };
			void goto('/');
			return;
		}

		try {
			const client = createPleromaClient({
				instanceUrl: authState.session.instanceUrl,
				accessToken: authState.session.accessToken,
				fetch: window.fetch.bind(window)
			});
			const statuses = await client.getHomeTimeline({ limit: 20 });
			if (version !== loadVersion) return;
			const adapted = adaptPleromaStatuses(statuses, { timelines: ['home'] });
			timelineState = adapted.length > 0 ? { status: 'success', data: adapted } : { status: 'empty' };
		} catch (error) {
			if (version !== loadVersion) return;
			const failure = auth.handleAuthFailure(error);
			if (failure.handled) {
				void goto(failure.redirectTo, { replaceState: true });
				return;
			}

			timelineState = { status: 'error', error: normalizePleromaRequestError(error) };
		}
	};

	const clearComposer = () => {
		composerText = '';
		privacyMenuOpen = false;
	};

	onMount(() => {
		void loadTimeline();
	});
</script>

<svelte:head><title>PleromaNet · Home</title></svelte:head>

<section class="pn-card timeline-card" data-testid="home-timeline" aria-labelledby="home-timeline-title">
	<h1 id="home-timeline-title" class="sr-only">Home timeline</h1>
	<div class="pn-tabs timeline-tabs" role="tablist" aria-label="Timeline sections">
		{#each timelineTabs as tab}
			<button
				id={`timeline-tab-${tab.id}`}
				class="pn-tab"
				class:active={tab.id === 'home'}
				type="button"
				role="tab"
				aria-selected={tab.id === 'home'}
				aria-controls="home-timeline-panel"
				onclick={() => {
					if (tab.id !== 'home') void goto(tab.href);
				}}
			>
				{tab.label}
			</button>
		{/each}
		<span class="tab-spacer"></span>
		<button class="tab-action" type="button" aria-label="Timeline filters">
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
				<path d="M6 8h12M9 12h6M11 16h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			</svg>
		</button>
	</div>

	<Composer
		label="Composer"
		textareaLabel="Post text"
		placeholder="What's on your mind?"
		submitLabel="Post"
		value={composerText}
		privacy={composerPrivacy}
		privacyOptions={privacyOptions}
		privacyMenuOpen={privacyMenuOpen}
		onValueChange={(value) => (composerText = value)}
		onPrivacyMenuOpenChange={(open) => (privacyMenuOpen = open)}
		onPrivacyChange={(value) => {
			composerPrivacy = value;
			privacyMenuOpen = false;
		}}
		onSubmit={clearComposer}
	/>

	<div id="home-timeline-panel" class="timeline-panel" role="tabpanel" aria-labelledby="timeline-tab-home">
		<RequestState
			state={timelineState}
			emptyTitle="No posts yet"
			emptyMessage="Your home timeline is empty. Follow accounts to see posts here."
			onRetry={() => loadTimeline()}
		>
			<div class="timeline-list" data-testid="home-timeline-list">
				{#each posts as post (post.timelineItemId)}
					<TimelinePostCard {post} />
				{/each}
			</div>
		</RequestState>
	</div>
</section>

<style>
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

	.timeline-card {
		overflow: hidden;
		box-shadow: none;
	}

	.timeline-tabs {
		padding-inline: 8px;
	}

	.tab-spacer {
		flex: 1;
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

	.tab-action svg {
		width: 16px;
		height: 16px;
	}

	.timeline-panel :global(.request-state) {
		border: 0;
		border-radius: 0;
		background: transparent;
	}

	.timeline-panel :global(.request-state--loading),
	.timeline-panel :global(.request-state--error),
	.timeline-panel :global(.request-state[data-testid='request-state-empty']),
	.timeline-panel :global(.request-state[data-testid='request-state-idle']) {
		padding: 18px 20px 20px;
	}

	.timeline-panel :global(.request-state--success) {
		padding: 0;
	}

	.timeline-list {
		display: grid;
	}

	@media (max-width: 880px) {
		.timeline-tabs {
			overflow-x: auto;
			scrollbar-width: none;
		}

		.timeline-tabs::-webkit-scrollbar {
			display: none;
		}
	}
</style>
