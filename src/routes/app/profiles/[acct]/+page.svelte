<script lang="ts">
	import { page } from '$app/state';
	import { pleromaFixtures } from '$lib/pleroma/fixtures';

	const acct = $derived(page.params.acct ?? pleromaFixtures.account.acct);
</script>

<svelte:head><title>PleromaNet · Profile</title></svelte:head>

<section class="pn-card profile-route" aria-labelledby="profile-title">
	<div class="profile-banner pn-vapor-banner pn-vapor-banner--window"></div>
	<div class="profile-body">
		<p class="pn-kicker">Profile route</p>
		<h1 id="profile-title">quiet admin</h1>
		<p>@{acct}</p>
		<p>keeping the lights low</p>
		<div class="profile-stats"><span>128 followers</span><span>64 following</span><span>512 posts</span></div>
	</div>
</section>

<style>
	.profile-route { box-shadow: none; overflow: hidden; }
	.profile-banner { min-height: 160px; border-width: 0 0 1px; border-radius: 0; }
	.profile-body { display: grid; gap: 8px; padding: 20px 16px; }
	.profile-body h1, .profile-body p { margin: 0; }
	.profile-body h1 { font-family: var(--serif); font-size: clamp(2.4rem, 7vw, 4.8rem); font-weight: 500; letter-spacing: -0.04em; line-height: 0.95; }
	.profile-stats { display: flex; gap: 12px; flex-wrap: wrap; color: var(--accent-ink); font-weight: 700; }
</style>
