<script lang="ts">
	import VaporBanner from './VaporBanner.svelte';
	import type { BannerVariant } from './attachments';

	type AvatarVariant = 'post' | 'focused' | 'notif' | 'compose';

	type PostLike = { avClass?: string; avBanner?: BannerVariant; avatarUrl?: string | null; name?: string; handle?: string };

	type Props = {
		post?: PostLike;
		variant?: AvatarVariant;
		avClass?: string;
		avBanner?: BannerVariant;
		avatarUrl?: string | null;
		alt?: string;
		size?: number;
		className?: string;
		style?: string;
		children?: import('svelte').Snippet;
		[key: string]: unknown;
	};

	let { post, variant = 'post', avClass, avBanner, avatarUrl, alt, size, className = '', style, children, ...rest }: Props = $props();

	let resolvedClass = $derived(post?.avClass ?? avClass ?? '');
	let resolvedBanner: BannerVariant | undefined = $derived(post?.avBanner ?? avBanner);
	let resolvedAvatarUrl = $derived(post?.avatarUrl ?? avatarUrl);
	let resolvedAlt = $derived(alt ?? `${post?.name ?? post?.handle ?? 'User'} avatar`);
	let placeholderClass = $derived(resolvedAvatarUrl ? '' : resolvedClass);

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

	let cn = $derived(`${baseClass(variant)} ${placeholderClass} ${className}`.trim());
	let sz = $derived(variantSize(variant, size));
	let inlineStyle = $derived(
		sz != null
			? `width:${sz}px;height:${sz}px;${style ?? ''}`
			: (style ?? undefined)
	);
</script>

<div class={cn} style={inlineStyle} {...rest}>
	{#if resolvedAvatarUrl}
		<img class="avatar-img" src={resolvedAvatarUrl} alt={resolvedAlt} loading="lazy" decoding="async" />
	{:else if resolvedBanner}
		<VaporBanner variant={resolvedBanner} />
	{/if}
	{@render children?.()}
</div>
