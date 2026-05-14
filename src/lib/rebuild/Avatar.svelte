<script lang="ts">
	import VaporBanner from './VaporBanner.svelte';

	type AvatarVariant = 'post' | 'focused' | 'notif' | 'compose';
	type BannerVariant = 'sunset' | 'pixel-window' | 'city' | 'space';

	type PostLike = { avClass?: string; avBanner?: BannerVariant };

	type Props = {
		post?: PostLike;
		variant?: AvatarVariant;
		avClass?: string;
		avBanner?: BannerVariant;
		size?: number;
		className?: string;
		style?: string;
		children?: import('svelte').Snippet;
		[key: string]: unknown;
	};

	let { post, variant = 'post', avClass, avBanner, size, className = '', style, children, ...rest }: Props = $props();

	let resolvedClass = $derived(post?.avClass ?? avClass ?? '');
	let resolvedBanner: BannerVariant | undefined = $derived(post?.avBanner ?? avBanner);

	const baseClass = (v: AvatarVariant) =>
		v === 'focused'
			? 'focused-av'
			: v === 'notif'
				? 'notif-av'
				: v === 'compose'
					? 'composer-av'
					: 'post-av';

	const variantSize = (v: AvatarVariant, s?: number) =>
		s ?? (v === 'notif' ? 28 : undefined);

	let cn = $derived(`${baseClass(variant)} ${resolvedClass} ${className}`.trim());
	let sz = $derived(variantSize(variant, size));
	let inlineStyle = $derived(
		sz != null
			? `width:${sz}px;height:${sz}px;${style ?? ''}`
			: (style ?? undefined)
	);
</script>

<div class={cn} style={inlineStyle} {...rest}>
	{#if resolvedBanner}
		<VaporBanner variant={resolvedBanner} />
	{/if}
	{@render children?.()}
</div>
