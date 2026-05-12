<div class="brand-mark" aria-hidden="true">
	<svg viewBox="0 0 24 24" fill="none" focusable="false">
		<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round" />
		<path d="M18.5 14.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" />
	</svg>
</div>

<style>
	.brand-mark {
		display: grid;
		width: 34px;
		height: 34px;
		place-items: center;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(circle at 28% 24%, var(--accent-soft), transparent 52%),
			var(--panel-2);
		color: var(--accent-ink);
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
	}

	.brand-mark svg {
		width: 20px;
		height: 20px;
	}
</style>
