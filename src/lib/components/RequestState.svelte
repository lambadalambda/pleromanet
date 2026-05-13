<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PleromaRequestState } from '$lib/pleroma/ui';

	type Props = {
		state: PleromaRequestState<unknown>;
		onRetry?: () => void;
		children?: Snippet;
		loadingTitle?: string;
		emptyTitle?: string;
		emptyMessage?: string;
		authActionHref?: string;
		authActionLabel?: string;
	};

	let {
		state,
		onRetry,
		children,
		loadingTitle = 'Loading Pleroma data',
		emptyTitle = 'Nothing to show yet',
		emptyMessage = 'There is no Pleroma data for this view yet.',
		authActionHref = '/#oauth',
		authActionLabel = 'Return to sign in'
	}: Props = $props();

	const canRetry = $derived(state.status === 'error' && state.error.retryable && Boolean(onRetry));
</script>

{#if state.status === 'loading'}
	<div class="request-state request-state--loading" role="status" aria-label="Request status" data-testid="request-state-loading">
		<span class="request-state__pulse" aria-hidden="true"></span>
		<div>
			<div class="request-state__title">{loadingTitle}</div>
			<p class="request-state__message">Waiting for a response from the Pleroma API.</p>
		</div>
	</div>
{:else if state.status === 'empty'}
	<div class="request-state" data-testid="request-state-empty">
		<div class="request-state__title">{emptyTitle}</div>
		<p class="request-state__message">{emptyMessage}</p>
	</div>
{:else if state.status === 'error'}
	<div class="request-state request-state--error" role="alert" data-testid="request-state-error">
		<div>
			<div class="request-state__title">{state.error.title}</div>
			<p class="request-state__message">{state.error.message}</p>
			{#if state.error.reauthRequired}
				<p class="request-state__message request-state__message--auth">Return to sign in when a real guarded route exists.</p>
			{/if}
		</div>
		<div class="request-state__actions">
			{#if canRetry}
				<button class="pn-button pn-button--primary" type="button" onclick={() => onRetry?.()}>Retry request</button>
			{/if}
			{#if state.error.reauthRequired}
				<a class="pn-button pn-button--primary" href={authActionHref}>{authActionLabel}</a>
			{/if}
		</div>
	</div>
{:else if state.status === 'success'}
	<div class="request-state request-state--success" data-testid="request-state-success">
		{@render children?.()}
	</div>
{:else}
	<div class="request-state" data-testid="request-state-idle">
		<div class="request-state__title">Ready when a request starts</div>
	</div>
{/if}

<style>
	.request-state {
		display: grid;
		gap: 12px;
		min-width: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-2);
		padding: 14px;
	}

	.request-state--loading {
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
	}

	.request-state--error {
		border-color: var(--warn);
		background: color-mix(in srgb, var(--warn) 12%, var(--panel-2));
	}

	.request-state--success {
		padding: 0;
		background: transparent;
	}

	.request-state__pulse {
		width: 12px;
		height: 12px;
		border-radius: 999px;
		background: var(--accent);
		box-shadow: 0 0 0 5px var(--accent-soft);
	}

	.request-state__title {
		font-weight: 700;
		color: var(--ink);
	}

	.request-state__message {
		margin: 3px 0 0;
		color: var(--ink-2);
	}

	.request-state__message--auth {
		color: var(--accent-ink);
	}

	.request-state__actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
</style>
