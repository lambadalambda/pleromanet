<svelte:head>
	<title>PleromaNet</title>
	<meta
		name="description"
		content="PleromaNet is a reduced, refined SvelteKit frontend for Pleroma."
	/>
</svelte:head>

<main>
	<p class="eyebrow">PleromaNet</p>
	<h1>PleromaNet</h1>
	<p>A quieter frontend for Pleroma is taking shape.</p>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			Inter,
			system-ui,
			-apple-system,
			sans-serif;
		background: #f5f1e8;
		color: #1f2347;
	}

	main {
		min-height: 100vh;
		display: grid;
		place-content: center;
		gap: 0.75rem;
		padding: 2rem;
		text-align: center;
	}

	h1,
	p {
		margin: 0;
	}

	h1 {
		font-family: Georgia, serif;
		font-size: clamp(3rem, 10vw, 6rem);
		font-weight: 400;
		letter-spacing: -0.04em;
	}

	.eyebrow {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #6b52a3;
	}
</style>
