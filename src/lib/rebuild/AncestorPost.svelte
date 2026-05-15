<script lang="ts">
	import Avatar from './Avatar.svelte';
	import PostActions from './PostActions.svelte';
	import PostBody from './PostBody.svelte';
	import PostHead from './PostHead.svelte';
	import PostMedia from './PostMedia.svelte';
	import QuotedPost from './QuotedPost.svelte';
	import type { CustomEmoji } from '$lib/social/types';
	import type { BannerVariant, PostLike } from './attachments';

	type ThreadPost = PostLike & {
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
	};

	type Props = {
		post: ThreadPost;
		onAction?: (id: string | number | undefined, key: string) => void;
	};

	let { post, onAction }: Props = $props();
</script>

<div class="post post-ancestor">
	<div class="thread-line-wrap">
		<Avatar post={post} />
		<div class="thread-line" data-testid="thread-line"></div>
	</div>
	<div style="min-width:0">
		<PostHead post={post} />
		<PostBody body={post.body} emojis={post.bodyEmojis} addressees={post.addressees} />
		<QuotedPost quoted={post.quotedPost} />
		<PostMedia post={post} />
		<PostActions post={post} onAction={(key) => onAction?.(post.id, key)} />
	</div>
</div>
