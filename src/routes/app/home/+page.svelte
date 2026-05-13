<script lang="ts">
	import { appTimelinePosts } from '$lib/app/fixtures';
	import TimelinePostCard from '$lib/components/TimelinePostCard.svelte';
</script>

<svelte:head><title>PleromaNet · Home</title></svelte:head>

<section class="pn-card app-view-card" aria-labelledby="home-title">
	<div class="app-view-head">
		<div>
			<p class="pn-kicker">Authenticated route</p>
			<h1 id="home-title">Home timeline</h1>
		</div>
		<span class="pn-pill">Fixture-backed</span>
	</div>
	<div class="timeline-list">
		{#each appTimelinePosts as post (post.timelineItemId)}
			<TimelinePostCard {post} />
		{/each}
	</div>
</section>

<style>
	.app-view-card {
		box-shadow: none;
	}

	.app-view-head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid var(--border);
		padding: 18px 16px;
	}

	.app-view-head h1,
	.app-view-head p {
		margin: 0;
	}

	.app-view-head h1 {
		margin-top: 4px;
		font-family: var(--serif);
		font-size: clamp(2rem, 6vw, 3.8rem);
		font-weight: 500;
		letter-spacing: -0.04em;
		line-height: 0.95;
	}
</style>
