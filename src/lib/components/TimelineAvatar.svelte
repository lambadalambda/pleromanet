<script lang="ts">
	import type { AvatarVariant } from '$lib/social/types';

	type AvatarSize = 'sm' | 'md' | 'composer';
	type Props = {
		variant?: AvatarVariant;
		size?: AvatarSize;
		src?: string;
	};

	let { variant = 'grad-1', size = 'md', src }: Props = $props();
</script>

<div class={`timeline-avatar timeline-avatar--${variant} timeline-avatar--${size}`} aria-hidden="true">
	{#if src}
		<img src={src} alt="" loading="lazy" referrerpolicy="no-referrer" />
	{/if}
</div>

<style>
	.timeline-avatar {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
		overflow: hidden;
	}

	.timeline-avatar img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.timeline-avatar--grad-1 {
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
	}

	.timeline-avatar--grad-2 {
		background: linear-gradient(135deg, #1a4a4a, #4a8a8a, #a8d5d5);
	}

	.timeline-avatar--grad-3 {
		background: linear-gradient(135deg, #4a2a4a, #8a4a8a, #d8a8d8);
	}

	.timeline-avatar--orb {
		background: radial-gradient(circle at 35% 35%, #6b4d8e, #1a1538 68%);
	}

	.timeline-avatar--pc {
		background: linear-gradient(180deg, #e0d5c2 0 30%, #1a1538 30% 72%, #b8a890 72%);
	}

	.timeline-avatar--sm {
		width: 40px;
		height: 40px;
	}

	.timeline-avatar--md {
		width: 48px;
		height: 48px;
	}

	.timeline-avatar--composer {
		width: 44px;
		height: 44px;
	}
</style>
