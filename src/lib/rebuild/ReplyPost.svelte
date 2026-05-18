<script lang="ts">
	import Avatar from './Avatar.svelte';
	import PostActions from './PostActions.svelte';
	import PostBody from './PostBody.svelte';
	import PostHead from './PostHead.svelte';
	import PostMedia from './PostMedia.svelte';
	import QuotedPost from './QuotedPost.svelte';
	import type { CustomEmoji } from '$lib/social/types';
	import { openLightbox } from './attachments';
	import type { Attachment, BannerVariant, PostLike } from './attachments';

	type ThreadReply = PostLike & {
		id?: string | number;
		name?: string;
		nameEmojis?: CustomEmoji[];
		handle?: string;
		time?: string;
		avClass?: string;
		avBanner?: BannerVariant;
		body?: string;
		bodyEmojis?: CustomEmoji[];
		addressees?: string[];
		quotedPost?: Record<string, unknown>;
		replies: number;
		boosts: number;
		favs: number;
		actions: { reply: boolean; boost: boolean; fav: boolean };
		nestedReplies?: ThreadReply[];
	};

	type Props = {
		post: ThreadReply;
		isLast?: boolean;
		nestedReplies?: ThreadReply[];
		onAction?: (id: string | number | undefined, key: string) => void;
	};

	let { post, isLast = false, nestedReplies = [], onAction }: Props = $props();
	let showNested = $state(false);

	const handleLightbox = (target: ThreadReply, idx: number) => {
		if (!target.attachments || !target.attachments.length) return;
		openLightbox(target.attachments as Attachment[], idx, {
			name: target.name,
			handle: target.handle,
			avClass: target.avClass,
			avBanner: target.avBanner
		});
	};
</script>

<div class="post post-reply {isLast && nestedReplies.length === 0 ? 'post-reply-last' : ''}">
	<div class="thread-line-wrap">
		<Avatar post={post} />
		{#if nestedReplies.length > 0 && !isLast}
			<div class="thread-line"></div>
		{/if}
	</div>
	<div style="min-width:0">
		<PostHead post={post} />
		<PostBody body={post.body} emojis={post.bodyEmojis} addressees={post.addressees} />
		<QuotedPost quoted={post.quotedPost} />
		<PostMedia post={post} onOpen={(idx) => handleLightbox(post, idx)} />
		<PostActions post={post} onAction={(key) => onAction?.(post.id, key)} />
		{#if nestedReplies.length > 0 && !showNested}
			<button type="button" class="show-replies" onclick={() => (showNested = true)}>
				<span class="show-replies-line"></span>
				Show {nestedReplies.length} {nestedReplies.length === 1 ? 'reply' : 'replies'} →
			</button>
		{/if}
	</div>
</div>

{#if showNested && nestedReplies.length > 0}
	<div class="nested-replies">
		{#each nestedReplies as reply, i}
			<div class="post post-reply {i === nestedReplies.length - 1 ? 'post-reply-last' : ''}">
				<div class="thread-line-wrap">
					<Avatar post={reply} />
				</div>
				<div style="min-width:0">
					<PostHead post={reply} />
					<PostBody body={reply.body} emojis={reply.bodyEmojis} addressees={reply.addressees} />
					<QuotedPost quoted={reply.quotedPost} />
					<PostMedia post={reply} onOpen={(idx) => handleLightbox(reply, idx)} />
					<PostActions post={reply} onAction={(key) => onAction?.(reply.id, key)} />
				</div>
			</div>
		{/each}
	</div>
{/if}
