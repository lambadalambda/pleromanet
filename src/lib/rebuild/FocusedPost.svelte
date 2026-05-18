<script lang="ts">
	import Avatar from './Avatar.svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import PostMedia from './PostMedia.svelte';
	import QuotedPost from './QuotedPost.svelte';
	import RichText from './RichText.svelte';
	import VaporBanner from './VaporBanner.svelte';
	import type { CustomEmoji } from '$lib/social/types';
	import { openLightbox } from './attachments';
	import type { Attachment, BannerVariant, PostLike } from './attachments';

	type FocusedThreadPost = PostLike & {
		id?: string | number;
		name?: string;
		nameEmojis?: CustomEmoji[];
		handle?: string;
		avClass?: string;
		avBanner?: BannerVariant;
		body?: string;
		bodyEmojis?: CustomEmoji[];
		addressees?: string[];
		quotedPost?: Record<string, unknown>;
		replies: number;
		boosts: number;
		favs: number;
		bookmarks?: number;
		fullTime?: string;
		source?: string;
		views?: string | null;
		following?: boolean;
		actions: { reply: boolean; boost: boolean; fav: boolean };
	};

	type Props = {
		post: FocusedThreadPost;
		continuesAbove?: boolean;
		onAction?: (id: string | number | undefined, key: string) => void;
	};

	let { post, continuesAbove = false, onAction }: Props = $props();

	const handleLightbox = (idx: number) => {
		if (!post.attachments || !post.attachments.length) return;
		openLightbox(post.attachments as Attachment[], idx, {
			name: post.name,
			handle: post.handle,
			avClass: post.avClass,
			avBanner: post.avBanner
		});
	};
</script>

<article class="focused-post" data-testid="focused-post">
	{#if continuesAbove}
		<div class="thread-line-top"></div>
	{/if}
	<div class="focused-post-head">
		<Avatar post={post} variant="focused" />
		<div style="min-width:0;flex:1">
			<div class="focused-name"><RichText text={post.name} emojis={post.nameEmojis} /></div>
			<div class="focused-handle">{post.handle}</div>
		</div>
		<Button variant="follow" className={post.following ? 'following' : ''}>{post.following ? 'Following' : 'Follow'}</Button>
		<button type="button" class="post-more" aria-label="More"><Icon name="more" width={16} height={16} /></button>
	</div>

	<div class="focused-body"><RichText text={post.body} emojis={post.bodyEmojis} mentionClass="post-mention-inline" /></div>
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
	<PostMedia post={post} onOpen={handleLightbox} />

	<div class="focused-meta">
		<span>{post.fullTime || '4:18 PM · May 11, 2026'}</span>
		<span class="dot">·</span>
		<span>{post.source || 'Pleroma'}</span>
		{#if post.views}
			<span class="dot">·</span>
			<span><strong>{post.views}</strong> views</span>
		{/if}
	</div>

	<div class="focused-actions" data-testid="focused-engagement">
		<button type="button" class="focused-action" aria-pressed={post.actions.reply ? 'true' : 'false'} aria-label={`Reply ${post.replies}`} onclick={() => onAction?.(post.id, 'reply')}>
			<Icon name="reply" />
			<span>Reply</span>
			{#if post.replies > 0}<span class="focused-action-c">{post.replies}</span>{/if}
		</button>
		<button type="button" class="focused-action {post.actions.boost ? 'on' : ''}" aria-pressed={post.actions.boost ? 'true' : 'false'} aria-label={`Boost ${post.boosts + (post.actions.boost ? 1 : 0)}`} onclick={() => onAction?.(post.id, 'boost')}>
			<Icon name="boost" />
			<span>Boost</span>
			{#if post.boosts + (post.actions.boost ? 1 : 0) > 0}<span class="focused-action-c">{post.boosts + (post.actions.boost ? 1 : 0)}</span>{/if}
		</button>
		<button type="button" class="focused-action {post.actions.fav ? 'on' : ''}" aria-pressed={post.actions.fav ? 'true' : 'false'} aria-label={`Favorite ${post.favs + (post.actions.fav ? 1 : 0)}`} onclick={() => onAction?.(post.id, 'fav')}>
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
