<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from './icons';

	type Props = {
		visibility?: string;
		context?: 'post' | 'reply';
	};

	let { visibility, context = 'post' }: Props = $props();
	let details = $derived.by((): { label: string; icon: IconName } | null => {
		if (!visibility) return null;
		if (visibility === 'public') return { label: 'Public', icon: 'globe' };
		if (visibility === 'unlisted') return { label: 'Unlisted', icon: 'globe' };
		if (visibility === 'private') return { label: 'Followers only', icon: 'lock' };
		if (visibility === 'direct') return { label: 'Direct', icon: 'msg' };
		return { label: visibility.charAt(0).toUpperCase() + visibility.slice(1), icon: 'lock' };
	});
	let accessibilityLabel = $derived(details ? `${context === 'reply' ? 'Reply visibility' : 'Visibility'}: ${details.label}` : '');
</script>

{#if details}
	<span class="post-visibility" class:reply-visibility={context === 'reply'} aria-label={accessibilityLabel} title={accessibilityLabel}>
		<Icon name={details.icon} width={11} height={11} />
		<span>{details.label}</span>
	</span>
{/if}
