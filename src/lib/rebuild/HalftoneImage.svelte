<script lang="ts">
	import { defaultHalftoneOptions, halftonePaletteForTheme, renderHalftone, type HalftoneOptions } from './halftone';
	import { THEME_CHANGE_EVENT } from '$lib/theme';

	type Props = {
		src: string;
		alt?: string;
		width?: number;
		height?: number;
		options?: Partial<HalftoneOptions>;
	};

	let { src, alt = '', width = 320, height = 240, options = {} }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let treatmentState = $state<'idle' | 'ready' | 'fallback'>('idle');
	let palette = $state(halftonePaletteForTheme('cream'));
	let renderId = 0;

	$effect(() => {
		const updatePalette = () => {
			const theme = document.body.dataset.theme ?? 'cream';
			if (theme === 'custom') {
				const styles = getComputedStyle(document.documentElement);
				palette = { fg: styles.getPropertyValue('--accent').trim(), bg: styles.getPropertyValue('--bg').trim() };
				return;
			}
			palette = halftonePaletteForTheme(theme);
		};
		updatePalette();
		const observer = new MutationObserver(updatePalette);
		observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
		window.addEventListener(THEME_CHANGE_EVENT, updatePalette);
		return () => {
			observer.disconnect();
			window.removeEventListener(THEME_CHANGE_EVENT, updatePalette);
		};
	});

	$effect(() => {
		const target = canvas;
		const requestId = ++renderId;
		const resolved: HalftoneOptions = { ...defaultHalftoneOptions(palette), ...options };
		if (!target) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		target.width = Math.round(width * dpr);
		target.height = Math.round(height * dpr);

		void renderHalftone(target, src, { ...resolved, cellSize: resolved.cellSize * dpr }).then((rendered) => {
			if (requestId !== renderId) return;
			treatmentState = rendered ? 'ready' : 'fallback';
		});
	});
</script>

<div class="halftone-media" data-halftone-state={treatmentState} style={`width:${width}px;height:${height}px`}>
	<img class="halftone-original" {src} {alt} loading="lazy" decoding="async" width={width} height={height} />
	<canvas bind:this={canvas} class="halftone-canvas" class:ready={treatmentState === 'ready'} style={`width:${width}px;height:${height}px`} aria-hidden="true"></canvas>
</div>
