<svelte:head>
	<title>PleromaNet · Design System Rebuild</title>
</svelte:head>

<main class="reset-home">
	<h1>PleromaNet Svelte Rebuild</h1>
	<p>The canonical Claude handoff is now the source of truth.</p>
	<a href="/design-system">Open design system rebuild</a>
</main>

<style>
	.reset-home {
		display: grid;
		place-content: center;
		gap: 12px;
		min-height: 100vh;
		padding: 24px;
		background: var(--bg);
		color: var(--ink);
	}

	h1,
	p {
		margin: 0;
	}

	h1 {
		font-family: var(--serif);
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 500;
	}

	a {
		color: var(--accent-ink);
	}
</style>
