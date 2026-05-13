<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AppShell from '$lib/components/app/AppShell.svelte';
	import { getPleromaAuthContext } from '$lib/pleroma/auth';
	import { onMount } from 'svelte';

	let { children } = $props();
	let allowed = $state(false);
	const auth = getPleromaAuthContext();
	const path = $derived(page.url.pathname);
	let mounted = false;

	const validateAuth = () => {
		const state = auth.refresh();
		if (state.status !== 'authenticated') {
			allowed = false;
			void goto('/', { replaceState: true });
			return;
		}

		allowed = true;
	};

	onMount(() => {
		mounted = true;
		validateAuth();
		const unsubscribe = auth.state.subscribe((state) => {
			if (mounted && state.status !== 'authenticated') {
				allowed = false;
				void goto('/', { replaceState: true });
			}
		});

		return () => {
			mounted = false;
			unsubscribe();
		};
	});

	$effect(() => {
		path;
		if (mounted) validateAuth();
	});
</script>

{#if allowed}
	<AppShell {path}>
		{@render children()}
	</AppShell>
{/if}
