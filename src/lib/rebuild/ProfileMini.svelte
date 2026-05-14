<script lang="ts">
	import NowPlayingLine from './NowPlayingLine.svelte';
	import VaporBanner from './VaporBanner.svelte';

	const stats = [
		{ label: 'Posts', value: '1,248' },
		{ label: 'Following', value: '312' },
		{ label: 'Followers', value: '1,921' },
	];
</script>

<div class="card" data-testid="profile-mini">
	<div class="profile-mini-banner">
		<VaporBanner variant="pixel-window" />
	</div>
	<div class="profile-mini-info">
		<div class="profile-mini-name">dreambyte</div>
		<div class="profile-mini-handle">@dreambyte@pleroma.social</div>
		<div class="profile-mini-bio">living in a soft world</div>
		<NowPlayingLine playing track="pacific hour" artist="neon.cassette" tint="#a48bd9" />
	</div>
	<div class="stat-row">
		{#each stats as stat}
			<div class="stat">
				<div class="stat-label">{stat.label}</div>
				<div class="stat-value">{stat.value}</div>
			</div>
		{/each}
	</div>
</div>
