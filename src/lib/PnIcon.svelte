<script lang="ts">
	type IconName =
		| 'home'
		| 'users'
		| 'globe'
		| 'search'
		| 'image'
		| 'poll'
		| 'smile'
		| 'chevron-down'
		| 'bell'
		| 'message'
		| 'bookmark'
		| 'list'
		| 'gear'
		| 'grip'
		| 'reply'
		| 'boost'
		| 'favorite'
		| 'more';

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
{:else if name === 'search'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.5" />
		<path d="m16 16 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === 'image'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5" />
		<circle cx="9" cy="10" r="1.5" fill="currentColor" />
		<path d="m7 17 4-4 3 3 3-4 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{:else if name === 'poll'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M6 19V9M12 19V5M18 19v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === 'smile'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" />
		<circle cx="9" cy="10" r="1" fill="currentColor" />
		<circle cx="15" cy="10" r="1" fill="currentColor" />
		<path d="M8.5 14c.8 1 2 1.5 3.5 1.5s2.7-.5 3.5-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === 'chevron-down'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M7 10.5 12 15l5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
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
{:else if name === 'reply'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
		<path d="M9 8H6v3M6 8c0 5 4 8 9 8h4M19 16l-3 3M19 16l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{:else if name === 'boost'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
		<path d="M4 8l3-3 3 3M7 5v9a2 2 0 0 0 2 2h7M20 16l-3 3-3-3M17 19v-9a2 2 0 0 0-2-2H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{:else if name === 'favorite'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
		<path d="M12 3l2.6 5.8 6.4.6-4.8 4.4 1.4 6.2L12 16.8 6.4 20l1.4-6.2L3 9.4l6.4-.6L12 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
	</svg>
{:else if name === 'more'}
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
		<circle cx="6" cy="12" r="1.5" fill="currentColor" />
		<circle cx="12" cy="12" r="1.5" fill="currentColor" />
		<circle cx="18" cy="12" r="1.5" fill="currentColor" />
	</svg>
{/if}

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
