<script lang="ts">
	import Icon from './Icon.svelte';
	import Toggle from './Toggle.svelte';

	type Props = {
		autoInsertAtTop: boolean;
		onAutoInsertChange: (value: boolean) => void;
		fitImages: boolean;
		onFitImagesChange: (value: boolean) => void;
		showAutoInsert?: boolean;
		settingsLabel?: string;
	};

	let { autoInsertAtTop, onAutoInsertChange, fitImages, onFitImagesChange, showAutoInsert = true, settingsLabel = 'Timeline settings' }: Props = $props();
	let open = $state(false);
	let root = $state<HTMLDivElement | null>(null);
	let trigger = $state<HTMLButtonElement | null>(null);
	const componentId = $props.id();
	const popoverId = `${componentId}-settings-popover`;

	const close = (restoreFocus = false) => {
		open = false;
		if (restoreFocus) trigger?.focus();
	};
	const handleWindowPointerdown = (event: PointerEvent) => {
		if (open && event.target instanceof Node && !root?.contains(event.target)) close();
	};
	const handleWindowKeydown = (event: KeyboardEvent) => {
		if (open && event.key === 'Escape') close(true);
	};
</script>

<svelte:window onpointerdown={handleWindowPointerdown} onkeydown={handleWindowKeydown} />

<div class="timeline-settings" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		class="tab-action"
		class:active={open}
		aria-label={settingsLabel}
		aria-expanded={open}
		aria-controls={open ? popoverId : undefined}
		onclick={() => (open = !open)}
	>
		<Icon name="sliders" width={16} height={16} />
	</button>
	{#if open}
		<div id={popoverId} class="timeline-settings-popover" role="region" aria-label={settingsLabel}>
			<div class="timeline-settings-heading">{settingsLabel}</div>
			{#if showAutoInsert}
				<div class="timeline-settings-row">
					<div class="timeline-settings-copy">
						<div class="timeline-settings-label">Auto-add new posts</div>
						<div class="timeline-settings-description">Insert incoming posts automatically while you are at the top.</div>
					</div>
					<Toggle checked={autoInsertAtTop} onchange={onAutoInsertChange} ariaLabel="Automatically add new posts at the top" />
				</div>
			{/if}
			<div class="timeline-settings-row">
				<div class="timeline-settings-copy">
					<div class="timeline-settings-label">Fit images</div>
					<div class="timeline-settings-description">Show complete images without cropping their edges in timelines and threads.</div>
				</div>
				<Toggle checked={fitImages} onchange={onFitImagesChange} ariaLabel="Fit images" />
			</div>
		</div>
	{/if}
</div>
