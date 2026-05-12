<svelte:head>
	<title>PleromaNet · Coming soon</title>
	<meta
		name="description"
		content="PleromaNet is a Pleroma frontend in progress. Real app surfaces and mockups are separated while development continues."
	/>
</svelte:head>

<main class="pn-page landing-page">
	<section class="landing-card" aria-labelledby="landing-title">
		<p class="pn-kicker">PleromaNet</p>
		<h1 id="landing-title">A quieter Pleroma frontend is coming soon.</h1>
		<p class="landing-copy">
			The real app surface is intentionally empty while we replace the design prototype with
			working Pleroma flows. Open the mockup to inspect the fake UI work, or review the design
			system primitives in isolation.
		</p>
		<div class="landing-actions" aria-label="Available sections">
			<a class="pn-button pn-button--primary" href="/mockup">Open mockup</a>
			<a class="pn-button pn-button--ghost" href="/design-system">Design system</a>
		</div>
		<div class="status-grid" aria-label="Project status">
			<div>
				<span>Real</span>
				<strong>/</strong>
				<p>Coming-soon placeholder only.</p>
			</div>
			<div>
				<span>Fake</span>
				<strong>/mockup</strong>
				<p>Signed-in prototype and mocked interactions.</p>
			</div>
		</div>
	</section>
</main>

<style>
	.landing-page {
		display: grid;
		place-items: center;
		min-height: 100vh;
		padding: 24px;
	}

	.landing-card {
		width: min(760px, 100%);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(circle at 84% 18%, var(--accent-soft), transparent 15rem),
			var(--panel);
		box-shadow: var(--shadow-soft);
		padding: clamp(24px, 6vw, 48px);
	}

	.landing-card h1,
	.landing-card p {
		margin: 0;
	}

	.landing-card h1 {
		margin-top: 10px;
		font-family: var(--serif);
		font-size: clamp(2.75rem, 8vw, 6rem);
		font-weight: 500;
		line-height: 0.94;
		letter-spacing: -0.05em;
	}

	.landing-copy {
		max-width: 58ch;
		margin-top: 18px;
		color: var(--ink-2);
		font-size: 1rem;
	}

	.landing-actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin-top: 28px;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		margin-top: 30px;
	}

	.status-grid div {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-2);
		padding: 14px;
	}

	.status-grid span {
		font-family: var(--mono);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.status-grid strong {
		display: block;
		margin-top: 6px;
		font-family: var(--serif);
		font-size: 1.7rem;
		font-weight: 500;
		line-height: 1;
		color: var(--accent-ink);
	}

	.status-grid p {
		margin-top: 8px;
		color: var(--ink-2);
	}

	@media (max-width: 560px) {
		.status-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
