<script lang="ts">
	type IconName =
		| 'home'
		| 'users'
		| 'globe'
		| 'bell'
		| 'message'
		| 'bookmark'
		| 'list'
		| 'gear'
		| 'grip';

	let { name }: { name: IconName } = $props();
</script>

{#if name === 'home'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
	</svg>
{:else if name === 'users'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="9" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5" />
		<circle cx="17" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
		<path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 19c0-2 2-3.5 4-3.5s2.5 1 2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === 'globe'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" />
		<path d="M4 12h16M12 4c2.5 3 2.5 13 0 16M12 4c-2.5 3-2.5 13 0 16" stroke="currentColor" stroke-width="1.5" />
	</svg>
{:else if name === 'bell'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15L6 17z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
		<path d="M10 21h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === 'message'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 6h16v11H8l-4 3V6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
	</svg>
{:else if name === 'bookmark'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M6 4h12v17l-6-4-6 4V4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
	</svg>
{:else if name === 'list'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === 'gear'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" />
		<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === 'grip'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="9" cy="6" r="1" fill="currentColor" />
		<circle cx="15" cy="6" r="1" fill="currentColor" />
		<circle cx="9" cy="12" r="1" fill="currentColor" />
		<circle cx="15" cy="12" r="1" fill="currentColor" />
		<circle cx="9" cy="18" r="1" fill="currentColor" />
		<circle cx="15" cy="18" r="1" fill="currentColor" />
	</svg>
{/if}

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
