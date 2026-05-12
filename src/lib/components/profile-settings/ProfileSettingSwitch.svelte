<script lang="ts">
	type Props = {
		label: string;
		description: string;
		checked: boolean;
		onToggle: () => void;
	};

	let { label, description, checked, onToggle }: Props = $props();
</script>

<div class="switch-row">
	<div>
		<h3>{label}</h3>
		<p>{description}</p>
	</div>
	<button class="switch" type="button" role="switch" aria-label={label} aria-checked={checked} onclick={onToggle}>
		<span aria-hidden="true"></span>
	</button>
</div>

<style>
	.switch-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 16px;
		border-top: 1px solid var(--border);
		padding: 13px 0;
	}

	.switch-row:first-child {
		border-top: 0;
		padding-top: 0;
	}

	h3,
	p {
		margin: 0;
	}

	h3 {
		font-size: 0.95rem;
		font-weight: 650;
	}

	p {
		margin-top: 4px;
		color: var(--ink-2);
		font-size: 0.86rem;
	}

	.switch {
		position: relative;
		width: 52px;
		height: 32px;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		background: var(--bg);
		padding: 3px;
	}

	.switch span {
		display: block;
		width: 24px;
		height: 24px;
		border-radius: 999px;
		background: var(--muted-2);
		transition: transform 120ms ease, background 120ms ease;
	}

	.switch[aria-checked='true'] {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.switch[aria-checked='true'] span {
		background: var(--accent-ink);
		transform: translateX(18px);
	}

	@media (max-width: 520px) {
		.switch {
			min-height: 42px;
			width: 64px;
		}

		.switch span {
			width: 34px;
			height: 34px;
		}

		.switch[aria-checked='true'] span {
			transform: translateX(20px);
		}
	}
</style>
