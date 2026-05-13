<script lang="ts">
	import { goto } from '$app/navigation';
	import RequestState from '$lib/components/RequestState.svelte';
	import TimelinePostCard from '$lib/components/TimelinePostCard.svelte';
	import { getPleromaAuthContext } from '$lib/pleroma/auth';
	import { createPleromaClient } from '$lib/pleroma/client';
	import { adaptPleromaStatuses, normalizePleromaRequestError, type PleromaRequestState, type PleromaStatusView } from '$lib/pleroma/ui';
	import { onMount } from 'svelte';

	const auth = getPleromaAuthContext();

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
			const client = createPleromaClient({ instanceUrl: authState.session.instanceUrl, accessToken: authState.session.accessToken, fetch: window.fetch.bind(window) });
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

	onMount(() => {
		void loadTimeline();
	});
</script>

<svelte:head><title>PleromaNet · Home</title></svelte:head>

<div class="home-view" data-testid="home-timeline">
	<h1 data-testid="app-content-heading" class="pn-title">Home timeline</h1>
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

<style>
	.home-view {
		overflow: hidden;
	}

	.timeline-list {
		display: grid;
	}
</style>
