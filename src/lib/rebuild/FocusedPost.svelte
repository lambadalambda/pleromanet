<script lang="ts">
	import Avatar from './Avatar.svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import QuotedPost from './QuotedPost.svelte';
	import VaporBanner from './VaporBanner.svelte';
	import type { BannerVariant, PostLike } from './attachments';

	type FocusedThreadPost = PostLike & {
		id?: string | number;
		name?: string;
		handle?: string;
		avClass?: string;
		avBanner?: BannerVariant;
		body?: string;
		addressees?: string[];
		quotedPost?: Record<string, unknown>;
		replies: number;
		boosts: number;
		favs: number;
		bookmarks?: number;
		fullTime?: string;
		source?: string;
		views?: string;
		following?: boolean;
		actions: { reply: boolean; boost: boolean; fav: boolean };
	};

	type Props = {
		post: FocusedThreadPost;
		continuesAbove?: boolean;
		onAction?: (id: string | number | undefined, key: string) => void;
	};

	let { post, continuesAbove = false, onAction }: Props = $props();
</script>

<article class="focused-post">
	{#if continuesAbove}
		<div class="thread-line-top"></div>
	{/if}
	<div class="focused-post-head">
		<Avatar post={post} variant="focused" />
		<div style="min-width:0;flex:1">
			<div class="focused-name">{post.name}</div>
			<div class="focused-handle">{post.handle}</div>
		</div>
		<Button variant="follow" className={post.following ? 'following' : ''}>{post.following ? 'Following' : 'Follow'}</Button>
		<button type="button" class="post-more" aria-label="More"><Icon name="more" width={16} height={16} /></button>
	</div>

	<div class="focused-body">{post.body}</div>
	<QuotedPost quoted={post.quotedPost} />
	{#if post.addressees && post.addressees.length > 0}
		<div class="post-pinged focused-pinged">
			<span class="post-pinged-l">Pinged</span>
			<span class="post-pinged-list">
				{#each post.addressees as address}
					<span class="post-pinged-chip">{address}</span>
				{/each}
			</span>
		</div>
	{/if}

	{#if post.media}
		<div class="focused-media">
			<VaporBanner variant={post.media} />
		</div>
	{/if}

	<div class="focused-meta">
		<span>{post.fullTime || '4:18 PM · May 11, 2026'}</span>
		<span class="dot">·</span>
		<span>{post.source || 'PleromaNet™ Web'}</span>
		<span class="dot">·</span>
		<span><strong>{post.views || '12.4K'}</strong> views</span>
	</div>

	<div class="focused-actions">
		<button type="button" class="focused-action" onclick={() => onAction?.(post.id, 'reply')}>
			<Icon name="reply" />
			<span>Reply</span>
			{#if post.replies > 0}<span class="focused-action-c">{post.replies}</span>{/if}
		</button>
		<button type="button" class="focused-action {post.actions.boost ? 'on' : ''}" onclick={() => onAction?.(post.id, 'boost')}>
			<Icon name="boost" />
			<span>Boost</span>
			{#if post.boosts + (post.actions.boost ? 1 : 0) > 0}<span class="focused-action-c">{post.boosts + (post.actions.boost ? 1 : 0)}</span>{/if}
		</button>
		<button type="button" class="focused-action {post.actions.fav ? 'on' : ''}" onclick={() => onAction?.(post.id, 'fav')}>
			<Icon name="star" fill={post.actions.fav ? 'currentColor' : 'none'} />
			<span>Favorite</span>
			{#if post.favs + (post.actions.fav ? 1 : 0) > 0}<span class="focused-action-c">{post.favs + (post.actions.fav ? 1 : 0)}</span>{/if}
		</button>
		<button type="button" class="focused-action">
			<Icon name="bookmark" />
			<span>Save</span>
			{#if (post.bookmarks || 0) > 0}<span class="focused-action-c">{post.bookmarks}</span>{/if}
		</button>
		<button type="button" class="focused-action">
			<Icon name="ext" />
			<span>Share</span>
		</button>
	</div>
</article>
