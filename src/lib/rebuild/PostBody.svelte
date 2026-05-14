<script lang="ts">
	const POSTBODY_MENTION_RE = /@[\w.]+(?:@[\w.]+)?/g;

	const renderBodyText = (text: string): (string | { key: string; text: string })[] => {
		if (!text) return [text];
		const out: (string | { key: string; text: string })[] = [];
		let lastIdx = 0;
		let match: RegExpExecArray | null;
		let key = 0;
		POSTBODY_MENTION_RE.lastIndex = 0;
		while ((match = POSTBODY_MENTION_RE.exec(text)) !== null) {
			if (match.index > lastIdx) out.push(text.slice(lastIdx, match.index));
			out.push({ key: 'm' + key++, text: match[0] });
			lastIdx = match.index + match[0].length;
		}
		if (lastIdx < text.length) out.push(text.slice(lastIdx));
		return out;
	};

	type Props = {
		body?: string;
		addressees?: string[];
		className?: string;
	};

	let { body = '', addressees, className = '' }: Props = $props();
	let parts = $derived(renderBodyText(body));
</script>

<div class="post-body {className}">
	{#each parts as part}
		{#if typeof part === 'string'}
			{part}
		{:else}
			<a class="post-mention-inline">{part.text}</a>
		{/if}
	{/each}
</div>
{#if addressees && addressees.length > 0}
	<div class="post-pinged">
		<span class="post-pinged-l">Pinged</span>
		<span class="post-pinged-list">
			{#each addressees as a}
				<a class="post-pinged-chip">{a}</a>
			{/each}
		</span>
	</div>
{/if}
