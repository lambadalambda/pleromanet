<script lang="ts">
	import type { CustomEmoji } from '$lib/social/types';
	import RichText from './RichText.svelte';

	type Props = {
		name?: string;
		nameEmojis?: CustomEmoji[];
		handle?: string;
		time?: string;
		post?: { name?: string; nameEmojis?: CustomEmoji[]; handle?: string; time?: string };
	};

	let { name, nameEmojis, handle, time, post }: Props = $props();
	let n = $derived(name ?? post?.name);
	let emojis = $derived(nameEmojis ?? post?.nameEmojis ?? []);
	let h = $derived(handle ?? post?.handle);
	let t = $derived(time ?? post?.time);
</script>

<div class="post-head">
	<span class="post-name" title={n}><RichText text={n} {emojis} /></span>
	<span class="post-handle" title={h}>{h}</span>
	<span class="post-time">{t}</span>
</div>
