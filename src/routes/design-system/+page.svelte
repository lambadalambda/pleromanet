<script lang="ts">
	import VaporBanner from '$lib/rebuild/VaporBanner.svelte';

	const bannerVariants = ['sunset', 'pixel-window', 'city', 'space'] as const;
</script>

<svelte:head>
	<title>PleromaNet · Design System Rebuild</title>
</svelte:head>

<main class="design-system-reset">
	<header class="design-system-reset__header">
		<p class="eyebrow">Canonical component port</p>
		<h1>Design System</h1>
		<p>Starting from scratch. First component: <code>VaporBanner</code>.</p>
	</header>

	<section class="banner-grid" aria-label="VaporBanner variants">
		{#each bannerVariants as variant}
			<article class="banner-card">
				<div class="banner-frame">
					<VaporBanner {variant} />
				</div>
				<h2>{variant}</h2>
			</article>
		{/each}
	</section>
</main>

<style>
	.design-system-reset {
		min-height: 100vh;
		padding: 32px 24px 56px;
		background: var(--bg);
		color: var(--ink);
	}

	.design-system-reset__header {
		display: grid;
		gap: 8px;
		margin: 0 auto 28px;
		max-width: 1100px;
	}

	.eyebrow {
		margin: 0;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-family: var(--serif);
		font-size: clamp(2.2rem, 5vw, 4.4rem);
		font-weight: 500;
		line-height: 0.95;
	}

	p {
		max-width: 58ch;
		color: var(--ink-2);
	}

	.banner-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 18px;
		max-width: 1100px;
		margin: 0 auto;
	}

	.banner-card {
		display: grid;
		gap: 10px;
		padding: 14px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--panel);
	}

	.banner-frame {
		aspect-ratio: 16 / 7;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	h2 {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
	}

	@media (max-width: 720px) {
		.design-system-reset {
			padding-inline: 14px;
		}

		.banner-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
