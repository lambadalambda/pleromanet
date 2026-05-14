<script lang="ts">
	import type { PhotoAttachment } from './attachments';

	type Props = {
		photos: PhotoAttachment[];
		onOpen?: (i: number) => void;
	};

	let { photos, onOpen }: Props = $props();
	let n = $derived(Math.min(photos.length, 4));
	let revealed = $state<Record<number, boolean>>({});

	const handleClick = (i: number, p: PhotoAttachment) => {
		if (p.cw && !revealed[i]) {
			revealed = { ...revealed, [i]: true };
			return;
		}
		onOpen?.(i);
	};
</script>

<div class="post-photos n{n}" onclick={(e) => e.stopPropagation()}>
	{#each photos.slice(0, 4) as p, i}
		<div
			class="ph{p.cw && !revealed[i] ? ' cw' : ''}"
			onclick={() => handleClick(i, p)}
		>
			<img src={p.src} alt={p.alt || ''} loading="lazy" />
			<span class="ph-tag"><em>duotone</em> · hover for raw</span>
		</div>
	{/each}
</div>
