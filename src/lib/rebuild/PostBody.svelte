<script lang="ts">
	import type { CustomEmoji } from '$lib/social/types';
	import PostPinged from './PostPinged.svelte';
	import RichText from './RichText.svelte';

	type Props = {
		body?: string;
		emojis?: CustomEmoji[];
		addressees?: string[];
		className?: string;
	};

	let { body = '', emojis = [], addressees, className = '' }: Props = $props();
</script>

<div class="post-body {className}">
	<RichText text={body} {emojis} mentionClass="post-mention-inline" linkUrls />
</div>
<PostPinged {addressees} />
