<script lang="ts">
	import VaporBanner from './VaporBanner.svelte';
	import type { BannerVariant } from './attachments';
	import { profileHref as hrefForProfile } from './profile-links';

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
		profileHref?: string | null;
		children?: import('svelte').Snippet;
		[key: string]: unknown;
	};

	let { post, variant = 'post', avClass, avBanner, avatarUrl, alt, size, className = '', style, profileHref, children, ...rest }: Props = $props();

	let resolvedClass = $derived(post?.avClass ?? avClass ?? '');
	let resolvedBanner: BannerVariant | undefined = $derived(post?.avBanner ?? avBanner);
	let resolvedAvatarUrl = $derived(post?.avatarUrl ?? avatarUrl);
	let resolvedAlt = $derived(alt ?? `${post?.name ?? post?.handle ?? 'User'} avatar`);
	let resolvedHref = $derived(profileHref ?? hrefForProfile(post?.handle));
	let profileLabel = $derived(`Open profile for ${post?.name ?? post?.handle ?? resolvedAlt.replace(/\s+avatar$/i, '')}`);
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

{#snippet avatarContents()}
	{#if resolvedAvatarUrl}
		<img class="avatar-img" src={resolvedAvatarUrl} alt={resolvedAlt} loading="lazy" decoding="async" />
	{:else if resolvedBanner}
		<VaporBanner variant={resolvedBanner} />
	{/if}
	{@render children?.()}
{/snippet}

{#if resolvedHref}
	<a class={cn} style={inlineStyle} href={resolvedHref} aria-label={profileLabel} {...rest}>
		{@render avatarContents()}
	</a>
{:else}
	<div class={cn} style={inlineStyle} {...rest}>
		{@render avatarContents()}
	</div>
{/if}
