<script lang="ts">
	import type { CustomEmoji } from '$lib/social/types';
	import { renderBodyText } from './mentions';

	type Props = {
		text?: string;
		emojis?: CustomEmoji[];
		mentionClass?: string;
	};

	let { text = '', emojis = [], mentionClass = '' }: Props = $props();
	let parts = $derived(renderBodyText(text, emojis));
</script>

{#each parts as part, i (typeof part === 'string' ? `t${i}` : part.key)}
	{#if typeof part === 'string'}
		{part}
	{:else if part.kind === 'emoji'}
		<img class="custom-emoji" src={part.url} alt={`:${part.shortcode}:`} title={`:${part.shortcode}:`} loading="lazy" decoding="async" />
	{:else}
		<span class={mentionClass}>{part.text}</span>
	{/if}
{/each}
