<script lang="ts">
	import { getContext, tick } from 'svelte';
	import Avatar from './Avatar.svelte';
	import PostPingedLine from './PostPinged.svelte';
	import { profileHref } from './profile-links';
	import RelativeTime from './RelativeTime.svelte';
	import { replyPreviewLoaderContext, type ReplyPreview, type ReplyPreviewLoader } from './reply-preview';

	type Props = {
		addressees?: string[];
		parentStatusId?: string | null;
		focused?: boolean;
		staticMode?: boolean;
	};

	let { addressees = [], parentStatusId = null, focused = false, staticMode = false }: Props = $props();
	let parent = $derived(addressees[0]);
	let cc = $derived(addressees.slice(1));
	const loadReplyPreview = getContext<ReplyPreviewLoader | undefined>(replyPreviewLoaderContext);
	let canPreview = $derived(Boolean(!staticMode && parentStatusId && loadReplyPreview));
	let previewOpen = $state(false);
	let previewState = $state<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
	let preview = $state<ReplyPreview | null>(null);
	let loadedParentStatusId = $state<string | null>(null);
	let replyContext = $state<HTMLElement | null>(null);
	let previewCard = $state<HTMLDivElement | null>(null);
	let previewStyle = $state('');
	const componentId = $props.id();
	const previewId = `${componentId}-reply-preview`;

	const shortHandle = (address: string) => {
		const trimmed = address.trim();
		if (!trimmed.startsWith('@')) return trimmed;

		const domainAt = trimmed.indexOf('@', 1);
		return domainAt === -1 ? trimmed : trimmed.slice(0, domainAt);
	};
	const positionPreview = async () => {
		await tick();
		if (!previewOpen || !replyContext || !previewCard) return;

		const gap = 8;
		const viewportPadding = 12;
		const anchorBounds = replyContext.getBoundingClientRect();
		const previewBounds = previewCard.getBoundingClientRect();
		const left = Math.min(
			Math.max(anchorBounds.left, viewportPadding),
			Math.max(viewportPadding, window.innerWidth - previewBounds.width - viewportPadding)
		);
		const preferredTop = anchorBounds.bottom + gap + previewBounds.height <= window.innerHeight - viewportPadding
			? anchorBounds.bottom + gap
			: anchorBounds.top - gap - previewBounds.height;
		const maximumTop = Math.max(viewportPadding, window.innerHeight - previewBounds.height - viewportPadding);
		const top = Math.min(Math.max(preferredTop, viewportPadding), maximumTop);
		previewStyle = `left:${Math.round(left)}px;top:${Math.round(top)}px`;
	};
	const openPreview = async (event: MouseEvent | FocusEvent) => {
		if (!parentStatusId || !loadReplyPreview) return;
		replyContext = event.currentTarget as HTMLElement;
		previewOpen = true;
		void positionPreview();
		if (loadedParentStatusId === parentStatusId) return;

		const requestedStatusId = parentStatusId;
		previewState = 'loading';
		preview = null;
		const result = await loadReplyPreview(requestedStatusId);
		if (parentStatusId !== requestedStatusId) return;
		loadedParentStatusId = requestedStatusId;
		preview = result;
		previewState = result ? 'ready' : 'unavailable';
		void positionPreview();
	};
	const closePreview = () => {
		previewOpen = false;
	};
	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape') return;
		closePreview();
	};

	$effect(() => {
		if (!previewOpen) return;
		const reposition = () => void positionPreview();
		window.addEventListener('resize', reposition);
		window.addEventListener('scroll', reposition, true);
		return () => {
			window.removeEventListener('resize', reposition);
			window.removeEventListener('scroll', reposition, true);
		};
	});
</script>

{#snippet parentChipContents()}
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="10" height="10" aria-hidden="true">
		<path d="M6 4L2 8l4 4" />
		<path d="M2 8h7a4 4 0 014 4v1" />
	</svg>
	<span class="post-pinged-handle">{shortHandle(parent)}</span>
{/snippet}

{#if parent}
	<div class="post-pinged {focused ? 'focused-pinged' : ''}" role="group" aria-label="Reply context">
		{#if canPreview}
			<button class="post-pinged-l" type="button" aria-expanded={previewOpen} aria-controls={previewOpen ? previewId : undefined} aria-describedby={previewOpen ? previewId : undefined} onmouseenter={openPreview} onmouseleave={closePreview} onfocus={openPreview} onblur={closePreview} onkeydown={handleKeydown} onclick={openPreview}>Replying to</button>
		{:else}
			<span class="post-pinged-l">Replying to</span>
		{/if}
		<span class="post-pinged-list">
			{#if staticMode}
				<span class="post-pinged-chip-parent" title={parent}>{@render parentChipContents()}</span>
			{:else}
				<a class="post-pinged-chip-parent" title={parent} aria-label={`Open profile for ${parent}`} aria-describedby={previewOpen ? previewId : undefined} href={profileHref(parent) ?? undefined} onmouseenter={openPreview} onmouseleave={closePreview} onfocus={openPreview} onblur={closePreview} onkeydown={handleKeydown}>{@render parentChipContents()}</a>
			{/if}
			{#if cc.length > 0}
				<span class="post-pinged-also">· also</span>
			{/if}
			{#each cc as address}
				{#if staticMode}
					<span class="post-pinged-chip" title={address}>{shortHandle(address)}</span>
				{:else}
					<a class="post-pinged-chip" title={address} aria-label={`Open profile for ${address}`} href={profileHref(address) ?? undefined}>{shortHandle(address)}</a>
				{/if}
			{/each}
		</span>
		{#if previewOpen}
			<div bind:this={previewCard} id={previewId} class="reply-preview" role="tooltip" aria-live="polite" style={previewStyle}>
				{#if previewState === 'ready' && preview}
					<div class="reply-preview-head">
						<Avatar avatarUrl={preview.avatarUrl} avClass={preview.avClass} alt={`${preview.name} avatar`} size={36} variant="plain" element="span" profileHref="" className="reply-preview-avatar" />
						<div class="reply-preview-identity">
							<strong>{preview.name}</strong>
							<span>{preview.handle}</span>
						</div>
						<time datetime={preview.createdAt}><RelativeTime createdAt={preview.createdAt} fallback={preview.time} /></time>
					</div>
					{#if preview.cw}
						<div class="reply-preview-cw">Content warning: {preview.cw}</div>
					{:else}
						<div class="reply-preview-body">{preview.body || 'Media post'}</div>
					{/if}
					{#if preview.replyingTo !== undefined}
						<PostPingedLine addressees={[preview.replyingTo ?? 'a parent post']} staticMode />
					{/if}
				{:else if previewState === 'unavailable'}
					<div class="reply-preview-state">Parent post unavailable</div>
				{:else}
					<div class="reply-preview-state">Loading parent post…</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
