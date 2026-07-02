<script lang="ts">
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';
	import PostCW from './PostCW.svelte';
	import PostMedia from './PostMedia.svelte';
	import PostPinged from './PostPinged.svelte';
	import PostReactions from './PostReactions.svelte';
	import QuotedPost from './QuotedPost.svelte';
	import RichText from './RichText.svelte';
	import { profileHref } from './profile-links';
	import VaporBanner from './VaporBanner.svelte';
	import type { CustomEmoji } from '$lib/social/types';
	import { normalizeRenderableAttachments, openLightbox } from './attachments';
	import type { BannerVariant, PostLike } from './attachments';
	import type { PleromaReactionView } from '$lib/pleroma/ui';

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
		reactions?: PleromaReactionView[];
		replies: number;
		boosts: number;
		favs: number;
		bookmarks?: number;
		fullTime?: string;
		source?: string;
		views?: string | null;
		actions: { reply: boolean; boost: boolean; fav: boolean };
	};

	type Props = {
		post: FocusedThreadPost;
		continuesAbove?: boolean;
		replyExpanded?: boolean;
		replyControlsId?: string;
		onAction?: (id: string | number | undefined, key: string) => void;
	};

	let { post, continuesAbove = false, replyExpanded, replyControlsId, onAction }: Props = $props();
	let href = $derived(profileHref(post.handle));

	const handleLightbox = (idx: number) => {
		const attachments = normalizeRenderableAttachments(post);
		if (!attachments.length) return;
		openLightbox(attachments, idx, {
			name: post.name,
			nameEmojis: post.nameEmojis,
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
			<div class="focused-name"><RichText text={post.name} emojis={post.nameEmojis} linkMentions={false} /></div>
			{#if href}
				<a class="focused-handle" href={href}>{post.handle}</a>
			{:else}
				<div class="focused-handle">{post.handle}</div>
			{/if}
		</div>
		<button type="button" class="post-more" aria-label="More"><Icon name="more" width={16} height={16} /></button>
	</div>

	<PostCW post={post}>
		<div class="focused-body"><RichText text={post.body} emojis={post.bodyEmojis} mentionClass="post-mention-inline" linkUrls /></div>
		<QuotedPost quoted={post.quotedPost} />
		<PostPinged addressees={post.addressees} focused />

		{#if post.media}
			<div class="focused-media">
				<VaporBanner variant={post.media} />
			</div>
		{/if}
		<PostMedia post={post} onOpen={handleLightbox} />
	</PostCW>

	<PostReactions reactions={post.reactions} onToggle={onAction ? (reaction) => onAction(post.id, `reaction:${reaction.name}`) : undefined} />

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
		<button type="button" class="focused-action" aria-expanded={replyExpanded} aria-controls={replyControlsId} aria-label={`Reply ${post.replies}`} onclick={() => onAction?.(post.id, 'reply')}>
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
