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
		gap: 14px;
		border-bottom: 1px solid var(--border);
		padding: 16px 0;
	}

	.switch-row:first-child {
		padding-top: 0;
	}

	.switch-row:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}

	h3,
	p {
		margin: 0;
	}

	h3 {
		font-size: 14px;
		font-weight: 500;
	}

	p {
		margin-top: 4px;
		color: var(--muted);
		font-size: 12.5px;
	}

	.switch {
		position: relative;
		width: 40px;
		height: 22px;
		border: 0;
		border-radius: 12px;
		background: var(--border-strong);
		padding: 0;
	}

	.switch span {
		position: absolute;
		top: 2px;
		left: 2px;
		display: block;
		width: 18px;
		height: 18px;
		border-radius: 999px;
		background: white;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
		transition: left 120ms ease;
	}

	.switch[aria-checked='true'] {
		background: var(--accent);
	}

	.switch[aria-checked='true'] span {
		left: 20px;
	}

	@media (max-width: 520px) {
		.switch {
			min-height: 42px;
			width: 64px;
			padding: 0;
		}

		.switch span {
			width: 34px;
			height: 34px;
			top: 4px;
			left: 4px;
		}

		.switch[aria-checked='true'] span {
			left: 26px;
		}
	}
</style>
