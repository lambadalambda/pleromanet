<script lang="ts">
	import { focusedThreadPost } from '$lib/app/fixtures';
	import Composer from '$lib/components/Composer.svelte';
	import TimelinePostCard from '$lib/components/TimelinePostCard.svelte';
	import { page } from '$app/state';

	let replyDraft = $state('');
	const routeId = $derived(page.params.id ?? focusedThreadPost.id);
</script>

<svelte:head><title>PleromaNet · Thread</title></svelte:head>

<section class="pn-card thread-card" data-testid="thread-view" aria-labelledby="thread-title">
	<header class="thread-head">
		<a class="thread-back" href="/app/home" aria-label="Back to home timeline">←</a>
		<div>
			<p class="pn-kicker">Status {routeId}</p>
			<h1 id="thread-title">Thread</h1>
		</div>
	</header>
	<div class="thread-body">
		<TimelinePostCard post={focusedThreadPost} testId="focused-post" />
		<Composer
			variant="reply"
			label="Reply composer"
			textareaLabel="Reply text"
			placeholder={`Reply to ${focusedThreadPost.handle}...`}
			submitLabel="Reply"
			value={replyDraft}
			submitEnabled={replyDraft.trim().length > 0}
			countTestId="reply-composer-count"
			showGif={false}
			showPoll={false}
			privacyMode="button"
			privacyButtonLabel="Reply visibility"
			onValueChange={(value) => (replyDraft = value)}
			onSubmit={() => (replyDraft = '')}
		/>
		<div class="thread-reply-count" data-testid="thread-reply-count">3 replies</div>
	</div>
</section>

<style>
	.thread-card { box-shadow: none; }
	.thread-head { display: flex; align-items: center; gap: 14px; border-bottom: 1px solid var(--border); padding: 16px; }
	.thread-head h1, .thread-head p { margin: 0; }
	.thread-head h1 { font-family: var(--serif); font-size: clamp(2rem, 6vw, 3.8rem); font-weight: 500; line-height: 0.95; }
	.thread-back { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--panel-2); }
	.thread-body { display: grid; }
	.thread-reply-count { border-top: 1px solid var(--border); padding: 14px 16px; color: var(--accent-ink); font-weight: 700; }
</style>
