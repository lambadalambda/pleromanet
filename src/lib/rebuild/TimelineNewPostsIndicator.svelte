<script lang="ts">
	import Button from './Button.svelte';

	type Props = {
		count: number;
		onActivate: () => void;
		disabled?: boolean;
	};

	let { count, onActivate, disabled = false }: Props = $props();
</script>

{#if count > 0}
	<div class="timeline-new-posts" aria-live="polite">
		<Button variant="secondary" className="timeline-new-posts-button" onclick={onActivate} {disabled}>
			{count} new posts
		</Button>
	</div>
{/if}
