<script lang="ts">
	type Props = {
		title: string;
		description: string;
		buttonLabel: string;
		preview: 'avatar' | 'banner';
		testId?: string;
	};

	let { title, description, buttonLabel, preview, testId }: Props = $props();
</script>

<div class="upload-row" data-testid={testId}>
	<div class={`upload-preview upload-preview--${preview}`} aria-hidden="true"></div>
	<div class="upload-copy">
		<h3>{title}</h3>
		<p>{description}</p>
	</div>
	<button class="pn-button" type="button">{buttonLabel}</button>
</div>

<style>
	.upload-row {
		display: grid;
		grid-template-columns: 72px minmax(0, 1fr) auto;
		align-items: center;
		gap: 14px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--panel-2);
		padding: 12px;
	}

	.upload-preview {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
		overflow: hidden;
	}

	.upload-preview--avatar {
		width: 58px;
		height: 58px;
		border-radius: 999px;
	}

	.upload-preview--banner {
		width: 72px;
		height: 48px;
		background: linear-gradient(180deg, #1d1840 0%, #533c7a 45%, #d889a0 78%, #f3c191 100%);
	}

	.upload-copy {
		min-width: 0;
	}

	h3,
	p {
		margin: 0;
	}

	h3 {
		font-family: var(--serif);
		font-size: 1.25rem;
		font-weight: 500;
		line-height: 1;
	}

	p {
		margin-top: 5px;
		color: var(--ink-2);
		font-size: 0.86rem;
	}

	@media (max-width: 520px) {
		.upload-row {
			grid-template-columns: 56px minmax(0, 1fr);
		}

		.upload-preview--avatar {
			width: 48px;
			height: 48px;
		}

		.upload-preview--banner {
			width: 56px;
			height: 42px;
		}

		button {
			grid-column: 1 / -1;
			min-height: 42px;
		}
	}
</style>
