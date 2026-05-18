<script lang="ts">
	type Props = {
		addressees?: string[];
		focused?: boolean;
	};

	let { addressees = [], focused = false }: Props = $props();
	let parent = $derived(addressees[0]);
	let cc = $derived(addressees.slice(1));

	const shortHandle = (address: string) => {
		const trimmed = address.trim();
		if (!trimmed.startsWith('@')) return trimmed;

		const domainAt = trimmed.indexOf('@', 1);
		return domainAt === -1 ? trimmed : trimmed.slice(0, domainAt);
	};
</script>

{#if parent}
	<div class="post-pinged {focused ? 'focused-pinged' : ''}">
		<span class="post-pinged-l">Replying to</span>
		<span class="post-pinged-list">
			<span class="post-pinged-chip-parent" title={parent}>
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="10" height="10" aria-hidden="true">
					<path d="M6 4L2 8l4 4" />
					<path d="M2 8h7a4 4 0 014 4v1" />
				</svg>
				<span class="post-pinged-handle">{shortHandle(parent)}</span>
			</span>
			{#if cc.length > 0}
				<span class="post-pinged-also">· also</span>
			{/if}
			{#each cc as address}
				<span class="post-pinged-chip" title={address}>{shortHandle(address)}</span>
			{/each}
		</span>
	</div>
{/if}
