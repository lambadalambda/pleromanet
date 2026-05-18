<script lang="ts">
	import Avatar from './Avatar.svelte';
	import type { BoostAttribution } from './attachments';

	type Props = {
		boostedBy?: BoostAttribution;
		children: import('svelte').Snippet;
	};

	let { boostedBy, children }: Props = $props();
</script>

{#if boostedBy}
	<div class="post-boost">
		<div class="post-boost-rail">
			<span class="post-boost-tag">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="9" height="9" aria-hidden="true">
					<path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5" />
				</svg>
				boost
			</span>
			<Avatar variant="post" avClass={boostedBy.avClass} avBanner={boostedBy.avBanner} avatarUrl={boostedBy.avatarUrl} alt={`${boostedBy.name ?? boostedBy.handle ?? 'Booster'} avatar`} className="post-boost-av" />
			<div class="post-boost-name">{boostedBy.name ?? boostedBy.handle}</div>
			{#if boostedBy.handle}
				<div class="post-boost-handle">{boostedBy.handle}</div>
			{/if}
			<div class="post-boost-time">{boostedBy.time ?? ''}</div>
		</div>
		<div class="post-boost-postcol">
			{@render children()}
		</div>
	</div>
{:else}
	{@render children()}
{/if}
