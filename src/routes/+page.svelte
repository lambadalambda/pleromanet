<script lang="ts">
	import { goto } from '$app/navigation';
	import SignedOutLanding from '$lib/components/signed-out/SignedOutLanding.svelte';
	import { getPleromaAuthContext } from '$lib/pleroma/auth';
	import { onMount } from 'svelte';

	const auth = getPleromaAuthContext();

	onMount(() => {
		if (auth.refresh().status === 'authenticated') void goto('/app/home', { replaceState: true });
	});
</script>

<svelte:head>
	<title>PleromaNet · Federated social web</title>
	<meta
		name="description"
		content="PleromaNet is an OAuth-first Pleroma frontend for a quieter corner of the federated social web."
	/>
</svelte:head>

<SignedOutLanding />
