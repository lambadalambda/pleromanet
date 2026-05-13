<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { appTimelinePosts, focusedThreadPost, initialThreadReplies, threadAncestors } from '$lib/app/fixtures';
	import Composer from '$lib/components/Composer.svelte';
	import TimelineAvatar from '$lib/components/TimelineAvatar.svelte';
	import PnIcon from '$lib/PnIcon.svelte';
	import type { PostAction, ReplySort, ThreadPost } from '$lib/social/types';

	const cloneThreadPost = (post: ThreadPost): ThreadPost => ({
		...post,
		actions: { ...post.actions },
		nestedReplies: post.nestedReplies?.map(cloneThreadPost)
	});

	const createFocusedThreadPost = (threadId: string): ThreadPost => {
		const basePost =
			appTimelinePosts.find((post) => (post.threadStatusId ?? post.id) === threadId || post.id === threadId) ??
			focusedThreadPost;

		return {
			...basePost,
			replies: 4,
			boosts: 12,
			favorites: 28,
			actions: { ...basePost.actions },
			fullTime: '4:18 PM · May 11, 2026',
			source: 'PleromaNet™ Web',
			views: '12.4K',
			bookmarks: 24
		};
	};

	const createThreadReplies = () => initialThreadReplies.map(cloneThreadPost);
	const actionCount = (
		post: { replies: number; boosts: number; favorites: number; actions: Record<PostAction, boolean> },
		action: PostAction
	) => {
		const base = action === 'reply' ? post.replies : action === 'boost' ? post.boosts : post.favorites;

		return base + (post.actions[action] ? 1 : 0);
	};
	const replyAgeMinutes = (time: string) => {
		if (time === 'now') return -1;

		const value = Number.parseInt(time, 10);
		if (!Number.isFinite(value)) return Number.MAX_SAFE_INTEGER;
		if (time.endsWith('m')) return value;
		if (time.endsWith('h')) return value * 60;

		return Number.MAX_SAFE_INTEGER;
	};
	const updateReplyById = (
		replies: ThreadPost[],
		targetId: string,
		update: (reply: ThreadPost) => ThreadPost
	): ThreadPost[] =>
		replies.map((reply) => {
			if (reply.id === targetId) return update(reply);
			if (!reply.nestedReplies) return reply;

			return { ...reply, nestedReplies: updateReplyById(reply.nestedReplies, targetId, update) };
	});

	const routeId = $derived(page.params.id ?? focusedThreadPost.id);
	let focusedPost = $state<ThreadPost>(createFocusedThreadPost(focusedThreadPost.id));
	let replyDraft = $state('');
	let replySort = $state<ReplySort>('top');
	let expandedReplyIds = $state<Record<string, boolean>>({});
	let threadReplies = $state<ThreadPost[]>(createThreadReplies());
	const sortedThreadReplies = $derived.by(() => {
		const replies = [...threadReplies];
		if (replySort === 'newest') {
			return replies.sort((left, right) => replyAgeMinutes(left.time) - replyAgeMinutes(right.time));
		}

		return replies;
	});

	const toggleFocusedAction = (action: PostAction) => {
		focusedPost = {
			...focusedPost,
			actions: { ...focusedPost.actions, [action]: !focusedPost.actions[action] }
		};
	};
	const toggleThreadReplyAction = (id: string, action: PostAction) => {
		threadReplies = updateReplyById(threadReplies, id, (reply) => ({
			...reply,
			actions: { ...reply.actions, [action]: !reply.actions[action] }
		}));
	};
	const toggleNestedReplies = (id: string) => {
		expandedReplyIds = { ...expandedReplyIds, [id]: !expandedReplyIds[id] };
	};
	const submitThreadReply = () => {
		const body = replyDraft.trim();
		if (body.length === 0) return;

		threadReplies = [
			{
				id: `reply-${threadReplies.length + 1}`,
				name: 'quiet admin',
				handle: '@quietadmin@pleroma.example',
				time: 'now',
				body,
				avatar: 'grad-1',
				replies: 0,
				boosts: 0,
				favorites: 0,
				actions: { reply: false, boost: false, favorite: false }
			},
			...threadReplies
		];
		replyDraft = '';
	};

	$effect(() => {
		const threadId = routeId;
		focusedPost = createFocusedThreadPost(threadId);
		threadReplies = createThreadReplies();
		replyDraft = '';
		replySort = 'top';
		expandedReplyIds = {};
	});
</script>

<svelte:head><title>PleromaNet · Thread</title></svelte:head>

<section class="pn-card thread-card" data-testid="thread-view" aria-labelledby="thread-title">
	<header class="thread-head">
		<button class="thread-back" type="button" aria-label="Back to home timeline" onclick={() => void goto('/app/home')}>
			<span aria-hidden="true">←</span>
		</button>
		<h1 id="thread-title">Thread</h1>
		<button class="tab-action" type="button" aria-label="Refresh thread">
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
				<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
		<button class="post-more" type="button" aria-label="More thread actions">
			<span class="post-action-icon"><PnIcon name="more" /></span>
		</button>
	</header>

	<div class="thread-ancestors">
		{#each threadAncestors as ancestor}
			<article class="thread-post thread-ancestor" data-testid="thread-ancestor">
				<div class="thread-line-wrap">
					<TimelineAvatar variant={ancestor.avatar} />
					<div class="thread-line" data-testid="thread-line"></div>
				</div>
				<div class="post-content">
					<div class="post-head">
						<span class="post-name">{ancestor.name}</span>
						<span class="post-handle">{ancestor.handle}</span>
						<span class="post-time">{ancestor.time}</span>
					</div>
					<p class="post-body">{ancestor.body}</p>
					<div class="post-actions">
						<button class="post-action" type="button" aria-label={`Reply ${actionCount(ancestor, 'reply')}`}>
							<span class="post-action-icon"><PnIcon name="reply" /></span><span>{actionCount(ancestor, 'reply')}</span>
						</button>
						<button class="post-action post-action--boost" type="button" aria-label={`Boost ${actionCount(ancestor, 'boost')}`}>
							<span class="post-action-icon"><PnIcon name="boost" /></span><span>{actionCount(ancestor, 'boost')}</span>
						</button>
						<button class="post-action post-action--favorite" type="button" aria-label={`Favorite ${actionCount(ancestor, 'favorite')}`}>
							<span class="post-action-icon"><PnIcon name="favorite" /></span><span>{actionCount(ancestor, 'favorite')}</span>
						</button>
						<button class="post-more" type="button" aria-label="More reply actions">
							<span class="post-action-icon"><PnIcon name="more" /></span>
						</button>
					</div>
				</div>
			</article>
		{/each}
	</div>

	<article class="focused-post" data-testid="focused-post">
		<div class="thread-line-top" aria-hidden="true"></div>
		<div class="focused-post-head">
			<TimelineAvatar variant={focusedPost.avatar} size="lg" />
			<div class="focused-author">
				<div class="focused-name">{focusedPost.name}</div>
				<div class="focused-handle">{focusedPost.handle}</div>
			</div>
			<button class="follow-button" type="button">Follow</button>
			<button class="post-more" type="button" aria-label="More focused post actions">
				<span class="post-action-icon"><PnIcon name="more" /></span>
			</button>
		</div>

		<div class="focused-body">{focusedPost.body}</div>

		{#if focusedPost.media}
			<div class={`post-media focused-media post-media--${focusedPost.media}`} role="img" aria-label="Attached media"></div>
		{/if}

		<div class="focused-meta">
			<span>{focusedPost.fullTime}</span>
			<span class="meta-dot">·</span>
			<span>{focusedPost.source}</span>
			<span class="meta-dot">·</span>
			<span><strong>{focusedPost.views}</strong> views</span>
		</div>

		<div class="focused-engagement" data-testid="focused-engagement">
			<span><strong>{actionCount(focusedPost, 'boost')}</strong> Boosts</span>
			<span><strong>{actionCount(focusedPost, 'favorite')}</strong> Favorites</span>
			<span><strong>{focusedPost.bookmarks}</strong> Bookmarks</span>
		</div>

		<div class="focused-actions">
			<button class="focused-action" type="button" aria-label="Reply to focused post">
				<span class="post-action-icon"><PnIcon name="reply" /></span>
				<span>Reply</span>
			</button>
			<button class="focused-action" class:active={focusedPost.actions.boost} type="button" aria-label="Boost focused post" aria-pressed={focusedPost.actions.boost} onclick={() => toggleFocusedAction('boost')}>
				<span class="post-action-icon"><PnIcon name="boost" /></span>
				<span>Boost</span>
			</button>
			<button class="focused-action" class:active={focusedPost.actions.favorite} type="button" aria-label="Favorite focused post" aria-pressed={focusedPost.actions.favorite} onclick={() => toggleFocusedAction('favorite')}>
				<span class="post-action-icon"><PnIcon name="favorite" /></span>
				<span>Favorite</span>
			</button>
			<button class="focused-action" type="button" aria-label="Save focused post">
				<span class="post-action-icon"><PnIcon name="bookmark" /></span>
				<span>Save</span>
			</button>
		</div>
	</article>

	<Composer
		variant="reply"
		label="Reply composer"
		textareaLabel="Reply text"
		placeholder={`Reply to ${focusedPost.handle}...`}
		submitLabel="Reply"
		value={replyDraft}
		submitEnabled={replyDraft.trim().length > 0}
		countTestId="reply-composer-count"
		showGif={false}
		showPoll={false}
		privacyMode="button"
		privacyButtonLabel="Reply visibility"
		onValueChange={(value) => (replyDraft = value)}
		onSubmit={submitThreadReply}
	/>

	<div class="thread-reply-head">
		<div class="thread-reply-count" data-testid="thread-reply-count">
			<span class="post-action-icon"><PnIcon name="reply" /></span>
			<span>{threadReplies.length} replies</span>
		</div>
		<div class="thread-sort" role="group" aria-label="Reply sort">
			<button class:active={replySort === 'top'} type="button" aria-pressed={replySort === 'top'} onclick={() => (replySort = 'top')}>Top</button>
			<button class:active={replySort === 'newest'} type="button" aria-pressed={replySort === 'newest'} onclick={() => (replySort = 'newest')}>Newest</button>
		</div>
	</div>

	<div class="thread-replies">
		{#each sortedThreadReplies as reply}
			{@const nestedReplies = reply.nestedReplies ?? []}
			<article class="thread-post thread-reply" data-testid="thread-reply">
				<div class="thread-line-wrap">
					<TimelineAvatar variant={reply.avatar} />
					{#if nestedReplies.length > 0}<div class="thread-line" aria-hidden="true"></div>{/if}
				</div>
				<div class="post-content">
					<div class="post-head">
						<span class="post-name">{reply.name}</span>
						<span class="post-handle">{reply.handle}</span>
						<span class="post-time">{reply.time}</span>
					</div>
					<p class="post-body">{reply.body}</p>
					<div class="post-actions">
						<button class="post-action" class:active={reply.actions.reply} type="button" aria-label={`Reply ${actionCount(reply, 'reply')}`} aria-pressed={reply.actions.reply} onclick={() => toggleThreadReplyAction(reply.id, 'reply')}>
							<span class="post-action-icon"><PnIcon name="reply" /></span><span>{actionCount(reply, 'reply')}</span>
						</button>
						<button class="post-action post-action--boost" class:active={reply.actions.boost} type="button" aria-label={`Boost ${actionCount(reply, 'boost')}`} aria-pressed={reply.actions.boost} onclick={() => toggleThreadReplyAction(reply.id, 'boost')}>
							<span class="post-action-icon"><PnIcon name="boost" /></span><span>{actionCount(reply, 'boost')}</span>
						</button>
						<button class="post-action post-action--favorite" class:active={reply.actions.favorite} type="button" aria-label={`Favorite ${actionCount(reply, 'favorite')}`} aria-pressed={reply.actions.favorite} onclick={() => toggleThreadReplyAction(reply.id, 'favorite')}>
							<span class="post-action-icon"><PnIcon name="favorite" /></span><span>{actionCount(reply, 'favorite')}</span>
						</button>
						<button class="post-more" type="button" aria-label="More reply actions">
							<span class="post-action-icon"><PnIcon name="more" /></span>
						</button>
					</div>
					{#if nestedReplies.length > 0}
						<button class="show-replies" type="button" aria-expanded={!!expandedReplyIds[reply.id]} aria-controls={`nested-${reply.id}`} onclick={() => toggleNestedReplies(reply.id)}>
							<span class="show-replies-line" aria-hidden="true"></span>
							{expandedReplyIds[reply.id] ? 'Hide' : 'Show'} {nestedReplies.length} {nestedReplies.length === 1 ? 'reply' : 'replies'}
						</button>
					{/if}
				</div>
			</article>
			{#if nestedReplies.length > 0 && expandedReplyIds[reply.id]}
				<div class="nested-replies" id={`nested-${reply.id}`}>
					{#each nestedReplies as nestedReply}
						<article class="nested-reply">
							<TimelineAvatar variant={nestedReply.avatar} size="sm" />
							<div class="post-content">
								<div class="post-head">
									<span class="post-name">{nestedReply.name}</span>
									<span class="post-handle">{nestedReply.handle}</span>
									<span class="post-time">{nestedReply.time}</span>
								</div>
								<p class="post-body">{nestedReply.body}</p>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
</section>

<style>
	.thread-card {
		overflow: hidden;
		box-shadow: none;
	}

	.thread-head {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 6px;
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel) 92%, transparent);
		backdrop-filter: blur(10px);
		padding: 10px 12px;
	}

	.thread-head h1 {
		flex: 1;
		margin: 0 60px 0 0;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.16em;
		line-height: 1;
		text-align: center;
		text-transform: uppercase;
		color: var(--ink);
	}

	.thread-back,
	.focused-action,
	.thread-sort button,
	.show-replies,
	.tab-action,
	.post-action,
	.post-more {
		border: 0;
		background: transparent;
	}

	.thread-back {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius);
		color: var(--ink-2);
		font-size: 18px;
	}

	.thread-back:hover,
	.tab-action:hover,
	.post-more:hover {
		background: var(--bg);
		color: var(--ink);
	}

	.tab-action,
	.post-more {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius);
		color: var(--muted-2);
	}

	.tab-action svg,
	.post-action-icon {
		width: 16px;
		height: 16px;
		flex: 0 0 auto;
	}

	.thread-ancestors {
		padding-top: 4px;
	}

	.thread-post {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr);
		gap: 12px;
		padding: 16px 16px 6px;
	}

	.thread-reply {
		border-bottom: 1px solid var(--border);
		padding-bottom: 14px;
	}

	.thread-line-wrap {
		position: relative;
		display: flex;
		align-items: center;
		flex-direction: column;
	}

	.thread-line {
		width: 2px;
		min-height: 16px;
		flex: 1 1 auto;
		border-radius: 1px;
		background: var(--border);
		margin-top: 8px;
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

	.focused-post {
		position: relative;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		background: var(--panel-2);
		padding: 18px 20px 14px;
	}

	.thread-line-top {
		position: absolute;
		top: 0;
		left: 44px;
		width: 2px;
		height: 14px;
		background: var(--border);
	}

	.focused-post-head {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.focused-author {
		min-width: 0;
		flex: 1 1 auto;
	}

	.focused-name {
		font-family: var(--serif);
		font-size: 20px;
		font-weight: 500;
		line-height: 1.1;
		color: var(--ink);
	}

	.focused-handle {
		margin-top: 2px;
		color: var(--accent-ink);
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.follow-button {
		border: 1px solid var(--accent);
		border-radius: 14px;
		background: transparent;
		padding: 4px 12px;
		color: var(--accent-ink);
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
	}

	.follow-button:hover {
		background: var(--accent-soft);
	}

	.focused-body {
		margin-top: 16px;
		color: var(--ink);
		font-size: 17px;
		line-height: 1.55;
		letter-spacing: -0.005em;
		white-space: pre-wrap;
	}

	.focused-media {
		aspect-ratio: 16 / 9;
	}

	.focused-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: 16px;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		padding: 12px 0;
		font-family: var(--mono);
		font-size: 12.5px;
		color: var(--muted);
	}

	.focused-meta strong {
		color: var(--ink);
		font-weight: 600;
	}

	.meta-dot {
		color: var(--muted-2);
	}

	.focused-engagement {
		display: flex;
		gap: 24px;
		border-bottom: 1px solid var(--border);
		padding: 12px 0;
		color: var(--ink-2);
		font-size: 13px;
		flex-wrap: wrap;
	}

	.focused-engagement strong {
		margin-right: 4px;
		font-family: var(--serif);
		font-size: 17px;
		font-weight: 600;
		color: var(--ink);
	}

	.focused-actions {
		display: flex;
		justify-content: space-around;
		gap: 4px;
		padding-top: 8px;
	}

	.focused-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		flex: 1 1 0;
		border-radius: var(--radius);
		padding: 8px 14px;
		color: var(--muted);
		font-size: 13px;
	}

	.focused-action:hover,
	.focused-action.active {
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	.thread-reply-head {
		display: flex;
		align-items: center;
		gap: 8px;
		border-bottom: 1px solid var(--border);
		background: var(--panel);
		padding: 12px 20px;
	}

	.thread-reply-count {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.thread-sort {
		display: inline-flex;
		margin-left: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
		padding: 2px;
	}

	.thread-sort button {
		border-radius: 3px;
		padding: 4px 12px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.04em;
	}

	.thread-sort button.active {
		background: var(--panel);
		color: var(--ink);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.thread-replies {
		padding-top: 4px;
	}

	.show-replies {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin-top: 10px;
		padding: 6px 0;
		color: var(--accent-ink);
		font-size: 12.5px;
		font-weight: 500;
	}

	.show-replies:hover {
		text-decoration: underline;
	}

	.show-replies-line {
		width: 28px;
		height: 1px;
		background: var(--accent);
		opacity: 0.6;
	}

	.nested-replies {
		border-left: 2px solid var(--border);
		margin-left: 28px;
		padding-left: 56px;
	}

	.nested-reply {
		display: grid;
		grid-template-columns: 40px minmax(0, 1fr);
		gap: 12px;
		padding: 16px 0 6px 4px;
	}

	@media (max-width: 880px) {
		.thread-head h1 {
			margin-right: 30px;
		}

		.focused-post {
			padding: 16px 14px 12px;
		}

		.thread-line-top {
			left: 34px;
		}
	}

	@media (max-width: 560px) {
		.thread-post,
		.nested-reply {
			grid-template-columns: 40px minmax(0, 1fr);
			gap: 10px;
			padding-left: 14px;
			padding-right: 14px;
		}

		.thread-reply-head {
			align-items: flex-start;
			flex-direction: column;
			padding: 12px 14px;
		}

		.thread-sort {
			margin-left: 0;
		}

		.focused-actions,
		.focused-engagement {
			flex-direction: column;
		}

		.nested-replies {
			margin-left: 18px;
			padding-left: 18px;
		}
	}
</style>
