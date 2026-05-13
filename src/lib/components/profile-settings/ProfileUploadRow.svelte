<script lang="ts">
	type Props = {
		title: string;
		description: string;
		buttonLabel: string;
		preview: 'avatar' | 'banner';
		testId?: string;
	};

	let { title: _title, description, buttonLabel, preview, testId }: Props = $props();
</script>

<div class="upload-wrap" data-testid={testId}>
	<div class="upload-row">
		<div class={`upload-preview upload-preview--${preview}`} aria-hidden="true"></div>
		<button class="upload-button" type="button">{buttonLabel}</button>
	</div>
	<p class="upload-help">{description}</p>
</div>

<style>
	.upload-wrap {
		display: grid;
		gap: 14px;
	}

	.upload-row {
		display: flex;
		align-items: center;
		gap: 14px;
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

	.upload-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-2);
		padding: 7px 14px;
		color: var(--ink-2);
		font-size: 13px;
	}

	.upload-button:hover {
		border-color: var(--accent);
		color: var(--accent-ink);
	}

	.upload-help {
		margin: 0;
		color: var(--muted);
		font-size: 12px;
	}

	@media (max-width: 560px) {
		.upload-row {
			align-items: flex-start;
			flex-direction: column;
		}

		.upload-button {
			min-height: 42px;
		}
	}
</style>
