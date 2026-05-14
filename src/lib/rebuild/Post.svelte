<script lang="ts">
	import Avatar from './Avatar.svelte';
	import PostHead from './PostHead.svelte';
	import PostBody from './PostBody.svelte';
	import PostMedia from './PostMedia.svelte';
	import PostActions from './PostActions.svelte';
	import type { PostLike, Attachment } from './attachments';
	import { openLightbox } from './attachments';

	type Props = {
		post: PostLike & {
			id?: string;
			name?: string;
			handle?: string;
			time?: string;
			avClass?: string;
			avBanner?: string;
			body?: string;
			addressees?: string[];
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

<div
	class="post"
	onclick={(e) => {
		if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
		onOpen?.();
	}}
	style="cursor: {onOpen ? 'pointer' : 'default'}"
>
	<Avatar post={post} />
	<div style="min-width:0">
		<PostHead post={post} />
		<PostBody body={post.body} addressees={post.addressees} />
		<PostMedia post={post} onOpen={handleLightbox} />
		<PostActions post={post} onAction={onAction} />
	</div>
</div>
