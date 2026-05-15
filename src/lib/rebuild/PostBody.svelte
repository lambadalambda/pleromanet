<script lang="ts">
	import type { CustomEmoji } from '$lib/social/types';
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
	<RichText text={body} {emojis} mentionClass="post-mention-inline" />
</div>
{#if addressees && addressees.length > 0}
	<div class="post-pinged">
		<span class="post-pinged-l">Pinged</span>
		<span class="post-pinged-list">
			{#each addressees as a}
				<span class="post-pinged-chip">{a}</span>
			{/each}
		</span>
	</div>
{/if}
