<script lang="ts">
	import type { AudioAttachment as AudioAtt } from './attachments';
	import { parseDur, fmtDur } from './attachments';

	type Props = {
		audio: AudioAtt;
	};

	let { audio }: Props = $props();
	let playing = $state(false);
	let progress = $state(audio.start ?? 0.32);

	let dur = $derived(audio.duration || '3:42');
	let total = $derived(parseDur(dur));
	let cur = $derived(fmtDur(total * progress));

	$effect(() => {
		if (!playing) return;
		const t = setInterval(() => {
			progress = progress >= 1 ? 0 : progress + 0.005;
		}, 100);
		return () => clearInterval(t);
	});

	let BARS = $derived(Array.from({ length: 56 }, (_, i) => {
		const seed = (audio.title || 'a').length;
		const v =
			Math.sin(i * 0.7 + seed) * 0.5 +
			Math.sin(i * 0.31 + seed * 0.4) * 0.3 +
			Math.cos(i * 1.1) * 0.2;
		return Math.max(0.18, Math.min(1, Math.abs(v) + 0.25));
	}));

	let playedIdx = $derived(Math.floor(progress * BARS.length));

	const seek = (e: MouseEvent) => {
		const el = e.currentTarget as HTMLElement;
		const r = el.getBoundingClientRect();
		const p = (e.clientX - r.left) / r.width;
		progress = Math.max(0, Math.min(1, p));
	};
</script>

<div class="post-audio" onclick={(e) => e.stopPropagation()}>
	<button
		class="pa-cover"
		onclick={() => (playing = !playing)}
		aria-label={playing ? 'Pause' : 'Play'}
	>
		{#if audio.cover}
			<img src={audio.cover} alt="" class="pa-cover-img" />
		{/if}
		<span class="pa-cover-icon">
			{#if playing}
				<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-left:1px"><path d="M7 5l12 7-12 7V5z"/></svg>
			{/if}
		</span>
	</button>
	<div class="pa-bars" onclick={seek}>
		{#each BARS as h, i}
			<span class="pa-bar {i <= playedIdx ? 'played' : ''}" style="height:{h * 100}%"></span>
		{/each}
	</div>
	<div class="pa-meta">
		<div class="pa-text">
			<span class="pa-title">{audio.title}</span>
			{#if audio.byline}
				<span class="pa-by"> · {audio.byline}</span>
			{/if}
		</div>
		<span class="pa-time">{cur} / {dur}</span>
	</div>
</div>
