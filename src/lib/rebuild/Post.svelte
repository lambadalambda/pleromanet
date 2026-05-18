<script lang="ts">
	import Avatar from './Avatar.svelte';
	import PostHead from './PostHead.svelte';
	import PostBody from './PostBody.svelte';
	import PostMedia from './PostMedia.svelte';
	import PostBoost from './PostBoost.svelte';
	import PostActions from './PostActions.svelte';
	import QuotedPost from './QuotedPost.svelte';
	import type { PostLike, Attachment, BannerVariant } from './attachments';
	import { openLightbox } from './attachments';
	import type { CustomEmoji } from '$lib/social/types';

	type Props = {
		post: PostLike & {
			id?: string | number;
			actionStatusId?: string;
			threadStatusId?: string;
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
		};
		onAction?: (key: string) => void;
		onOpen?: () => void;
	};

	let { post, onAction, onOpen }: Props = $props();

	const handleLightbox = (idx: number) => {
		if (!post.attachments || !post.attachments.length) return;
		openLightbox(post.attachments as Attachment[], idx, {
			name: post.name,
			handle: post.handle,
			avClass: post.avClass,
			avBanner: post.avBanner,
		});
	};
</script>

{#snippet postContents()}
	<Avatar post={post} />
	<div style="min-width:0">
		<PostHead post={post} />
		<PostBody body={post.body} emojis={post.bodyEmojis} addressees={post.addressees} />
		<QuotedPost quoted={post.quotedPost} />
		<PostMedia post={post} onOpen={handleLightbox} />
		<PostActions post={post} onAction={onAction} />
	</div>
{/snippet}

<PostBoost boostedBy={post.boostedBy}>
	{#if onOpen}
		<div
			class="post"
			data-status-id={post.id}
			data-action-status-id={post.actionStatusId}
			data-thread-status-id={post.threadStatusId}
			role="button"
			tabindex="0"
			onclick={(e) => {
				if ((e.target as HTMLElement).closest('button, a, [data-post-ignore]')) return;
				onOpen?.();
			}}
			onkeydown={(e) => {
				if (e.key !== 'Enter' && e.key !== ' ') return;
				if ((e.target as HTMLElement).closest('button, a, [data-post-ignore]')) return;
				e.preventDefault();
				onOpen?.();
			}}
			style="cursor:pointer"
		>
			{@render postContents()}
		</div>
	{:else}
		<div class="post" data-status-id={post.id} data-action-status-id={post.actionStatusId} data-thread-status-id={post.threadStatusId}>
			{@render postContents()}
		</div>
	{/if}
</PostBoost>
