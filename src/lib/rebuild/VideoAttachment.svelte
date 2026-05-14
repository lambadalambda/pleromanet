<script lang="ts">
	import VaporBanner from './VaporBanner.svelte';
	import type { VideoAttachment as VideoAtt } from './attachments';
	import { parseDur, fmtDur } from './attachments';

	type Props = {
		video: VideoAtt;
	};

	let { video }: Props = $props();
	let playing = $state(false);
	let muted = $state(true);
	let progress = $state(video.start ?? 0.18);

	let dur = $derived(video.duration || '2:14');
	let total = $derived(parseDur(dur));
	let cur = $derived(fmtDur(total * progress));

	$effect(() => {
		if (!playing) return;
		const t = setInterval(() => {
			progress = progress >= 1 ? 0 : progress + 0.008;
		}, 80);
		return () => clearInterval(t);
	});
</script>

<div class="post-video" onclick={(e) => e.stopPropagation()}>
	<div class="pv-frame">
		<VaporBanner variant={video.poster || 'sunset'} />
		<div class="pv-scrim {playing ? 'on' : ''}"></div>
		{#if !playing}
			<button class="pv-play" onclick={() => (playing = true)} aria-label="Play">
				<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style="margin-left:3px"><path d="M7 5l12 7-12 7V5z"/></svg>
			</button>
		{/if}
		<div class="pv-chip pv-chip-tl">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="11" height="11"><path d="M15 8l5-3v14l-5-3M3 7h12v10H3z" stroke-linejoin="round"/></svg>
			<span>VIDEO</span>
		</div>
		<div class="pv-chip pv-chip-tr">{dur}</div>
		{#if video.cc}
			<div class="pv-chip pv-chip-bl">CC</div>
		{/if}
		<div class="pv-controls">
			<button class="pv-ctrl" onclick={() => (playing = !playing)}>
				{#if playing}
					<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M7 5l12 7-12 7V5z"/></svg>
				{/if}
			</button>
			<div class="pv-time">{cur} <span>/ {dur}</span></div>
			<div class="pv-scrub">
				<div class="pv-scrub-bar"><div class="pv-scrub-fill" style="width:{progress * 100}%"></div></div>
			</div>
			<button class="pv-ctrl" onclick={() => (muted = !muted)} title={muted ? 'Unmute' : 'Mute'}>
				{#if muted}
					<svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 5L6 9H3v6h3l5 4V5zM16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 5L6 9H3v6h3l5 4V5zM15 9a4 4 0 010 6M18 6a8 8 0 010 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
				{/if}
			</button>
			<button class="pv-ctrl" title="Fullscreen">
				<svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</button>
		</div>
	</div>
	{#if video.caption}
		<div class="pv-caption">{video.caption}</div>
	{/if}
</div>
