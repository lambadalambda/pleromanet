<script lang="ts">
	import PnIcon from '$lib/PnIcon.svelte';
	import type { PostAction, SocialPost } from '$lib/social/types';
	import TimelineAvatar from './TimelineAvatar.svelte';

	type Props = {
		post: SocialPost;
		onAction?: (postId: string, action: PostAction) => void;
		onOpenThread?: (postId: string) => void;
		testId?: string;
	};

	let { post, onAction, onOpenThread, testId = 'timeline-post' }: Props = $props();
	const actionStatusId = $derived(post.actionStatusId ?? post.id);
	const threadStatusId = $derived(post.threadStatusId ?? post.id);

	const actionCount = (action: PostAction) => {
		const base = action === 'reply' ? post.replies : action === 'boost' ? post.boosts : post.favorites;

		return base + (post.actions[action] ? 1 : 0);
	};
</script>

<article class="timeline-post" data-testid={testId}>
	<TimelineAvatar variant={post.avatar} />
	<div class="post-content">
		<div class="post-head">
			<span class="post-name">{post.name}</span>
			<span class="post-handle">{post.handle}</span>
			<span class="post-time">{post.time}</span>
		</div>
		{#if onOpenThread}
			<button
				id={`thread-opener-${post.id}`}
				class="post-body post-body-button"
				type="button"
				aria-describedby={`thread-link-${post.id}`}
				onclick={() => onOpenThread?.(threadStatusId)}
			>
				{post.body}
				<span id={`thread-link-${post.id}`} class="sr-only">Open thread</span>
			</button>
		{:else}
			<p class="post-body">{post.body}</p>
		{/if}
		{#if post.media}
			<div class={`post-media post-media--${post.media}`} role="img" aria-label="Attached media"></div>
		{/if}
		<div class="post-actions">
			<button
				class="post-action"
				class:active={post.actions.reply}
				type="button"
				aria-label={`Reply ${actionCount('reply')}`}
				aria-pressed={post.actions.reply}
				onclick={() => onAction?.(actionStatusId, 'reply')}
			>
				<span class="post-action-icon" data-testid="post-action-reply-icon"><PnIcon name="reply" /></span>
				<span>{actionCount('reply')}</span>
			</button>
			<button
				class="post-action post-action--boost"
				class:active={post.actions.boost}
				type="button"
				aria-label={`Boost ${actionCount('boost')}`}
				aria-pressed={post.actions.boost}
				onclick={() => onAction?.(actionStatusId, 'boost')}
			>
				<span class="post-action-icon" data-testid="post-action-boost-icon"><PnIcon name="boost" /></span>
				<span>{actionCount('boost')}</span>
			</button>
			<button
				class="post-action post-action--favorite"
				class:active={post.actions.favorite}
				type="button"
				aria-label={`Favorite ${actionCount('favorite')}`}
				aria-pressed={post.actions.favorite}
				onclick={() => onAction?.(actionStatusId, 'favorite')}
			>
				<span class="post-action-icon" data-testid="post-action-favorite-icon"><PnIcon name="favorite" /></span>
				<span>{actionCount('favorite')}</span>
			</button>
			<button class="post-more" type="button" aria-label="More actions">
				<span class="post-action-icon"><PnIcon name="more" /></span>
			</button>
		</div>
	</div>
</article>

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

	.timeline-post {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr);
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding: 16px;
	}

	.timeline-post:last-child {
		border-bottom: 0;
	}

	.timeline-post:hover {
		background: rgba(164, 139, 217, 0.03);
	}

	.post-content {
		min-width: 0;
	}

	.post-head {
		display: flex;
		align-items: baseline;
		gap: 6px;
		font-size: 13.5px;
		flex-wrap: wrap;
	}

	.post-name {
		font-weight: 600;
		color: var(--ink);
	}

	.post-handle {
		color: var(--accent-ink);
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.post-time {
		margin-left: auto;
		font-family: var(--mono);
		font-size: 12px;
		color: var(--muted);
	}

	.post-body {
		margin: 6px 0 0;
		color: var(--ink-2);
		font-size: 14px;
		white-space: pre-wrap;
	}

	.post-body-button {
		display: block;
		width: 100%;
		border: 0;
		background: transparent;
		padding: 0;
		text-align: left;
		cursor: pointer;
	}

	.post-body-button:hover {
		color: var(--ink);
	}

	.post-media {
		position: relative;
		margin-top: 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: linear-gradient(180deg, #1d1840 0%, #533c7a 40%, #d889a0 75%, #f3c191 100%);
		aspect-ratio: 16 / 8;
		overflow: hidden;
	}

	.post-media::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 18%;
		width: 86px;
		height: 86px;
		border-radius: 50%;
		background: radial-gradient(circle, #ffd1a8 0 35%, #f78fb3 60%, transparent 70%);
		transform: translateX(-50%);
	}

	.post-media::after {
		content: '';
		position: absolute;
		inset: 55% 0 0;
		background:
			repeating-linear-gradient(0deg, transparent 0 18px, rgba(255, 255, 255, 0.18) 18px 19px),
			repeating-linear-gradient(90deg, transparent 0 14px, rgba(255, 255, 255, 0.18) 14px 15px);
		transform: perspective(140px) rotateX(58deg);
		transform-origin: top;
	}

	.post-media--city {
		background: linear-gradient(180deg, #0c0a28 0%, #2a1f4a 30%, #6b4d8e 60%, #d889a0 100%);
	}

	.post-media--space {
		background: radial-gradient(ellipse at 30% 30%, #2a1f4a 0%, #0c0a1a 70%);
	}

	.post-actions {
		display: flex;
		align-items: center;
		gap: 18px;
		margin-top: 12px;
		flex-wrap: wrap;
	}

	.post-action,
	.post-more {
		border: 0;
		background: transparent;
	}

	.post-action {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border-radius: var(--radius);
		color: var(--muted);
		padding: 4px 6px;
		font-size: 12.5px;
		font-variant-numeric: tabular-nums;
	}

	.post-action:hover,
	.post-action.active {
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	.post-action--boost.active {
		color: #6fa97a;
	}

	.post-action--favorite.active {
		color: #e0a13f;
	}

	.post-action-icon {
		width: 16px;
		height: 16px;
		flex: 0 0 auto;
	}

	.post-more {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		margin-left: auto;
		border-radius: var(--radius);
		color: var(--muted-2);
		font-size: 12px;
		letter-spacing: 0.08em;
	}

	.post-more:hover {
		background: var(--bg);
		color: var(--ink);
	}

	@media (max-width: 480px) {
		.timeline-post {
			grid-template-columns: 48px minmax(0, 1fr);
			padding: 14px;
		}

		.post-actions {
			gap: 6px;
		}

		.post-time {
			margin-left: 0;
		}
	}
</style>
