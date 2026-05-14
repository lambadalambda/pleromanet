<script lang="ts">
	import Icon from './Icon.svelte';

	type Props = {
		post: {
			replies: number;
			boosts: number;
			favs: number;
			actions: { reply: boolean; boost: boolean; fav: boolean };
		};
		onAction?: (key: string) => void;
	};

	let { post, onAction }: Props = $props();
</script>

<div class="post-actions">
	<button
		class="post-action reply {post.actions.reply ? 'on' : ''}"
		onclick={() => onAction?.('reply')}
	>
		<Icon name="reply" /> {post.replies}
	</button>
	<button
		class="post-action boost {post.actions.boost ? 'on' : ''}"
		onclick={() => onAction?.('boost')}
	>
		<Icon name="boost" /> {post.boosts + (post.actions.boost ? 1 : 0)}
	</button>
	<button
		class="post-action fav {post.actions.fav ? 'on' : ''}"
		onclick={() => onAction?.('fav')}
	>
		<Icon name="star" fill={post.actions.fav ? 'currentColor' : 'none'} /> {post.favs + (post.actions.fav ? 1 : 0)}
	</button>
	<button class="post-more" title="More">
		<Icon name="more" width={16} height={16} />
	</button>
</div>
