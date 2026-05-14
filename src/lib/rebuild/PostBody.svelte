<script lang="ts">
	import { renderBodyText } from './mentions';

	type Props = {
		body?: string;
		addressees?: string[];
		className?: string;
	};

	let { body = '', addressees, className = '' }: Props = $props();
	let parts = $derived(renderBodyText(body));
</script>

<div class="post-body {className}">
	{#each parts as part (typeof part === 'string' ? part : part.key)}
		{#if typeof part === 'string'}
			{part}
		{:else}
			<span class="post-mention-inline">{part.text}</span>
		{/if}
	{/each}
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
