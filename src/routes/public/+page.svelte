<script lang="ts">
	import AttachmentLightboxHost from '$lib/rebuild/AttachmentLightboxHost.svelte';
	import Button from '$lib/rebuild/Button.svelte';
	import Icon from '$lib/rebuild/Icon.svelte';
	import Post from '$lib/rebuild/Post.svelte';
	import { createPleromaClient } from '$lib/pleroma/client';
	import { adaptPleromaStatuses, normalizePleromaRequestError, type PleromaRequestErrorView, type PleromaStatusView } from '$lib/pleroma/ui';
	import { env } from '$env/dynamic/public';
	import type { BannerVariant, PostLike } from '$lib/rebuild/attachments';
	import type { TimelineCursor } from '$lib/pleroma/types';
	import type { SocialPost } from '$lib/social/types';
	import { onMount } from 'svelte';

	type PublicView = 'local' | 'federated';
	type RebuildPost = PostLike & {
		id: string | number;
		actionStatusId?: string;
		threadStatusId?: string;
		name: string;
		handle: string;
		time: string;
		avClass?: string;
		avBanner?: BannerVariant;
		avatarUrl?: string | null;
		body: string;
		replies: number;
		boosts: number;
		favs: number;
		actions: { reply: boolean; boost: boolean; fav: boolean };
	};
	type PublicTimelineState =
		| { status: 'idle' }
		| { status: 'loading' }
		| { status: 'empty' }
		| { status: 'error'; error: PleromaRequestErrorView }
		| {
			status: 'success';
			data: PleromaStatusView[];
			nextCursor: TimelineCursor | null;
			loadMoreStatus: 'idle' | 'loading' | 'error';
			loadMoreError?: PleromaRequestErrorView;
		};

	let view = $state<PublicView>('local');
	let timelineState = $state<PublicTimelineState>({ status: 'idle' });
	let requestId = 0;

	const instanceUrl = env.PUBLIC_PLEROMA_INSTANCE_URL ?? 'https://pleroma.social';
	const avatarClass = (avatar: SocialPost['avatar']) =>
		avatar === 'pc' ? 'av-pixel-pc' :
		avatar === 'orb' ? 'av-orb' :
		avatar === 'grad-1' ? 'av-grad-1' :
		avatar === 'grad-2' ? 'av-grad-2' :
		avatar === 'grad-3' ? 'av-grad-3' :
		'av-anime';
	const postForRebuild = (post: PleromaStatusView): RebuildPost => ({
		id: post.id,
		actionStatusId: post.actionStatusId,
		threadStatusId: post.threadStatusId,
		name: post.name,
		handle: post.handle,
		time: post.time,
		avClass: avatarClass(post.avatar),
		avatarUrl: post.avatarUrl,
		body: post.body,
		media: post.media,
		attachments: post.attachments,
		quotedPost: post.quotedPost,
		replies: post.replies,
		boosts: post.boosts,
		favs: post.favorites,
		actions: {
			reply: post.actions.reply,
			boost: post.actions.boost,
			fav: post.actions.favorite
		}
	});
	const mergeTimelinePosts = (current: PleromaStatusView[], next: PleromaStatusView[]) => {
		const seen = new Set(current.map((post) => post.id));
		return [
			...current,
			...next.filter((post) => {
				if (seen.has(post.id)) return false;
				seen.add(post.id);
				return true;
			})
		];
	};
	const posts = $derived(timelineState.status === 'success' ? timelineState.data.map(postForRebuild) : []);

	const loadTimeline = async (nextView = view) => {
		const nextRequestId = requestId + 1;
		requestId = nextRequestId;
		timelineState = { status: 'loading' };

		try {
			const client = createPleromaClient({ instanceUrl, fetch: window.fetch.bind(window) });
			const timelinePage = nextView === 'local' ? await client.getLocalTimelinePage() : await client.getFederatedTimelinePage();
			if (nextRequestId !== requestId) return;

			const adapted = adaptPleromaStatuses(timelinePage.items, { timelines: [nextView] });
			timelineState = adapted.length > 0
				? { status: 'success', data: adapted, nextCursor: timelinePage.cursors.next, loadMoreStatus: 'idle' }
				: { status: 'empty' };
		} catch (error) {
			if (nextRequestId !== requestId) return;
			timelineState = { status: 'error', error: normalizePleromaRequestError(error) };
		}
	};
	const loadMoreTimeline = async () => {
		if (timelineState.status !== 'success' || !timelineState.nextCursor || timelineState.loadMoreStatus === 'loading') return;

		const nextRequestId = requestId + 1;
		requestId = nextRequestId;
		const requestView = view;
		const nextCursor = timelineState.nextCursor;
		timelineState = { ...timelineState, loadMoreStatus: 'loading', loadMoreError: undefined };

		try {
			const client = createPleromaClient({ instanceUrl, fetch: window.fetch.bind(window) });
			const timelinePage = requestView === 'local' ? await client.getLocalTimelinePage(nextCursor) : await client.getFederatedTimelinePage(nextCursor);
			if (nextRequestId !== requestId || timelineState.status !== 'success') return;

			const adapted = adaptPleromaStatuses(timelinePage.items, { timelines: [requestView] });
			timelineState = {
				...timelineState,
				data: mergeTimelinePosts(timelineState.data, adapted),
				nextCursor: timelinePage.cursors.next,
				loadMoreStatus: 'idle',
				loadMoreError: undefined
			};
		} catch (error) {
			if (nextRequestId !== requestId || timelineState.status !== 'success') return;
			timelineState = { ...timelineState, loadMoreStatus: 'error', loadMoreError: normalizePleromaRequestError(error) };
		}
	};
	const selectView = (nextView: PublicView) => {
		view = nextView;
		void loadTimeline(nextView);
	};

	onMount(() => {
		void loadTimeline();
	});
</script>

<svelte:head>
	<title>PleromaNet · Public Timeline</title>
</svelte:head>

<AttachmentLightboxHost />

<main class="public-route-shell">
	<section class="card public-panel">
		<div class="app-page-kicker">PleromaNet public</div>
		<h1>Public timeline</h1>
		<p>Read local and federated public posts without signing in.</p>
		<div class="tabs" role="tablist" aria-label="Public timeline sections">
			<button type="button" role="tab" aria-selected={view === 'local'} class="tab" class:active={view === 'local'} onclick={() => selectView('local')}>Local</button>
			<button type="button" role="tab" aria-selected={view === 'federated'} class="tab" class:active={view === 'federated'} onclick={() => selectView('federated')}>Federated</button>
		</div>

		{#if timelineState.status === 'loading'}
			<div class="request-state" role="status" aria-label="Request status">Loading Pleroma data</div>
		{:else if timelineState.status === 'empty'}
			<div class="request-state request-empty">
				<h2>No public posts yet</h2>
				<p>This Pleroma timeline returned no statuses for this slice.</p>
			</div>
		{:else if timelineState.status === 'error'}
			<div class="request-state request-error">
				<h2>{timelineState.error.title}</h2>
				<p>{timelineState.error.message}</p>
				{#if timelineState.error.retryable}
					<Button variant="secondary" onclick={() => loadTimeline()}>Retry request</Button>
				{/if}
			</div>
		{:else if timelineState.status === 'success'}
			<div data-testid="public-timeline-list">
				{#each posts as post (post.id)}
					<Post {post} onAction={() => {}} />
				{/each}
			</div>
			{#if timelineState.loadMoreStatus === 'loading'}
				<div class="request-state request-pagination" role="status" aria-label="Timeline pagination status">Loading older posts</div>
			{:else if timelineState.loadMoreStatus === 'error' && timelineState.loadMoreError}
				<div class="request-state request-error request-pagination">
					<h2>{timelineState.loadMoreError.title}</h2>
					<p>{timelineState.loadMoreError.message}</p>
					{#if timelineState.loadMoreError.retryable}
						<Button variant="secondary" onclick={loadMoreTimeline}>Retry load more</Button>
					{/if}
				</div>
			{:else if timelineState.nextCursor}
				<div class="request-state request-pagination">
					<Button variant="secondary" onclick={loadMoreTimeline}>Load more</Button>
				</div>
			{:else}
				<div class="request-state request-empty request-pagination">
					<h2>No older posts</h2>
					<p>You have reached the end of this loaded timeline.</p>
				</div>
			{/if}
		{/if}
	</section>
	<a class="public-home-link" href="/"><Icon name="arrowL" width={14} height={14} />Back to sign in</a>
</main>
