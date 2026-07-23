<script lang="ts">
	import { tick } from 'svelte';
	import type { Attachment, PhotoAttachment } from './attachments';
	import { seekVideoPreviewFrame } from './videoPreview';
	type Props = {
		attachments?: Attachment[];
		hidden?: boolean;
		fallback?: string;
		fallbackItems?: string[];
	};

	let { attachments = [], hidden = false, fallback = '', fallbackItems = [] }: Props = $props();
	let mediaAttachments = $derived(attachments.filter((attachment) => attachment.kind !== 'poll'));
	let shownAttachments = $derived(mediaAttachments.slice(0, 3));
	let shownFallbackItems = $derived(fallbackItems.slice(0, Math.max(0, 3 - shownAttachments.length)));
	let totalItems = $derived(mediaAttachments.length + fallbackItems.length);
	let remaining = $derived(Math.max(0, totalItems - shownAttachments.length - shownFallbackItems.length));
	type PhotoTarget = { photo: PhotoAttachment; anchor: HTMLElement };
	type PhotoModality = 'hover' | 'focus';
	let hoveredPhoto = $state<PhotoTarget | null>(null);
	let focusedPhoto = $state<PhotoTarget | null>(null);
	let activeModality = $state<PhotoModality | null>(null);
	let activePhoto = $derived(
		activeModality === 'focus' ? focusedPhoto ?? hoveredPhoto :
		activeModality === 'hover' ? hoveredPhoto ?? focusedPhoto :
		hoveredPhoto ?? focusedPhoto
	);
	let fullPhoto = $derived(activePhoto?.photo ?? null);
	let fullPhotoAnchor = $derived(activePhoto?.anchor ?? null);
	let previewElement = $state<HTMLDivElement | null>(null);
	let fullPhotoElement = $state<HTMLDivElement | null>(null);
	let fullPhotoStyle = $state('left:-9999px;top:-9999px;visibility:hidden');
	const componentId = $props.id();
	const fullPhotoId = `${componentId}-full-image`;

	const attachmentIsCw = (attachment: Attachment) => attachment.kind !== 'poll' && attachment.cw === true;

	const attachmentFallback = (attachment: Attachment) => {
		if (attachmentIsCw(attachment)) return 'Content warning media';
		if (attachment.kind === 'photo') return '[image]';
		if (attachment.kind === 'video') return '[video]';
		if (attachment.kind === 'audio') return '[audio clip]';
		return '[attachment]';
	};
	const attachmentLabel = (attachment: Attachment) => {
		if (attachmentIsCw(attachment)) return 'Media hidden by a content warning';
		if (attachment.kind === 'photo') return attachment.alt || 'Image preview';
		if (attachment.kind === 'video') return attachment.title ? `Video preview: ${attachment.title}` : 'Video preview';
		if (attachment.kind === 'audio') return attachment.title ? `Audio attachment: ${attachment.title}` : 'Audio attachment';
		return 'Attachment';
	};
	let previewLabel = $derived([...shownAttachments.map(attachmentLabel), ...shownFallbackItems].join('; '));
	const seekVideo = (event: Event) => {
		if (event.currentTarget instanceof HTMLVideoElement) seekVideoPreviewFrame(event.currentTarget);
	};
	const revealVideoFrame = (event: Event) => {
		if (!(event.currentTarget instanceof HTMLVideoElement)) return;
		if (event.currentTarget.currentTime > 0 && event.currentTarget.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			event.currentTarget.classList.add('ready');
			event.currentTarget.closest('.compact-media-item')?.classList.add('ready');
		}
	};
	const markMediaReady = (event: Event) => {
		if (event.currentTarget instanceof HTMLElement) event.currentTarget.closest('.compact-media-item')?.classList.add('ready');
	};
	const removeFailedMedia = (event: Event) => {
		if (event.currentTarget instanceof HTMLElement) event.currentTarget.remove();
	};
	const portal = (node: HTMLElement) => {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	};
	const positionFullPhoto = async () => {
		await tick();
		if (!fullPhoto || !fullPhotoAnchor || !fullPhotoElement) return;

		const gap = 10;
		const padding = 12;
		const visualViewport = window.visualViewport;
		const viewportLeft = visualViewport?.offsetLeft ?? 0;
		const viewportTop = visualViewport?.offsetTop ?? 0;
		const viewportWidth = visualViewport?.width ?? window.innerWidth;
		const viewportHeight = visualViewport?.height ?? window.innerHeight;
		const viewportRight = viewportLeft + viewportWidth;
		const viewportBottom = viewportTop + viewportHeight;
		const previewWidth = Math.max(1, Math.min(420, viewportWidth - padding * 2));
		const previewHeight = Math.max(1, Math.min(320, viewportHeight * 0.45, viewportHeight - padding * 2));
		const photo = fullPhoto;
		const anchorElement = fullPhotoAnchor;
		fullPhotoStyle = `left:-9999px;top:-9999px;visibility:hidden;--compact-media-full-width:${Math.round(previewWidth)}px;--compact-media-full-height:${Math.round(previewHeight)}px`;
		await tick();
		if (fullPhoto !== photo || fullPhotoAnchor !== anchorElement || !fullPhotoElement) return;

		const anchor = anchorElement.getBoundingClientRect();
		const floating = fullPhotoElement.getBoundingClientRect();
		const minimumLeft = viewportLeft + padding;
		const minimumTop = viewportTop + padding;
		const maximumLeft = Math.max(minimumLeft, viewportRight - floating.width - padding);
		const maximumTop = Math.max(minimumTop, viewportBottom - floating.height - padding);
		const fitsRight = anchor.right + gap + floating.width <= viewportRight - padding;
		const fitsLeft = anchor.left - gap - floating.width >= minimumLeft;
		let left: number;
		let top: number;

		if (fitsRight || fitsLeft) {
			left = fitsRight ? anchor.right + gap : anchor.left - gap - floating.width;
			top = anchor.top + (anchor.height - floating.height) / 2;
		} else {
			left = anchor.left + (anchor.width - floating.width) / 2;
			const fitsBelow = anchor.bottom + gap + floating.height <= viewportBottom - padding;
			top = fitsBelow ? anchor.bottom + gap : anchor.top - gap - floating.height;
		}

		fullPhotoStyle = `left:${Math.round(Math.min(Math.max(left, minimumLeft), maximumLeft))}px;top:${Math.round(Math.min(Math.max(top, minimumTop), maximumTop))}px;--compact-media-full-width:${Math.round(previewWidth)}px;--compact-media-full-height:${Math.round(previewHeight)}px`;
	};
	const photoTarget = (event: MouseEvent | FocusEvent, photo: PhotoAttachment): PhotoTarget | null =>
		event.currentTarget instanceof HTMLElement ? { photo, anchor: event.currentTarget } : null;
	const hoverFullPhoto = (event: MouseEvent, photo: PhotoAttachment) => {
		hoveredPhoto = photoTarget(event, photo);
		activeModality = 'hover';
	};
	const focusFullPhoto = (event: MouseEvent | FocusEvent, photo: PhotoAttachment) => {
		focusedPhoto = photoTarget(event, photo);
		activeModality = 'focus';
	};
	const leaveFullPhoto = () => {
		hoveredPhoto = null;
		if (activeModality === 'hover') activeModality = focusedPhoto ? 'focus' : null;
	};
	const blurFullPhoto = () => {
		focusedPhoto = null;
		if (activeModality === 'focus') activeModality = hoveredPhoto ? 'hover' : null;
	};
	const hideFullPhoto = () => {
		hoveredPhoto = null;
		focusedPhoto = null;
		activeModality = null;
	};
	const visiblePhotoFor = (target: PhotoTarget | null) => {
		if (!target || hidden) return null;
		return shownAttachments.find((attachment): attachment is PhotoAttachment =>
			attachment.kind === 'photo' && attachment.src === target.photo.src && !attachmentIsCw(attachment)
		) ?? null;
	};
	const anchorForPhoto = (photo: PhotoAttachment) =>
		[...(previewElement?.querySelectorAll<HTMLElement>('.compact-media-image-trigger') ?? [])]
			.find((element) => element.dataset.fullImageSrc === photo.src) ?? null;
	const reconcileActiveModality = () => {
		if (activeModality === 'hover' && !hoveredPhoto) activeModality = focusedPhoto ? 'focus' : null;
		if (activeModality === 'focus' && !focusedPhoto) activeModality = hoveredPhoto ? 'hover' : null;
	};
	const handlePhotoKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape') return;
		event.stopPropagation();
		hideFullPhoto();
	};
	const sampleVideoWhenVisible = (node: HTMLVideoElement) => {
		const load = () => {
			const src = node.dataset.src;
			if (!src || node.src) return;
			node.preload = 'metadata';
			node.src = src;
			node.load();
		};
		if (!('IntersectionObserver' in window)) {
			load();
			return;
		}

		const observer = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			observer.disconnect();
			load();
		}, { rootMargin: '160px' });
		observer.observe(node);
		return { destroy: () => observer.disconnect() };
	};

	$effect(() => {
		const photo = fullPhoto;
		if (!photo || !fullPhotoAnchor) return;
		fullPhotoStyle = 'left:-9999px;top:-9999px;visibility:hidden';
		void positionFullPhoto();
		const reposition = () => void positionFullPhoto();
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') hideFullPhoto();
		};
		const visualViewport = window.visualViewport;
		window.addEventListener('resize', reposition);
		window.addEventListener('scroll', reposition, true);
		window.addEventListener('keydown', handleEscape);
		visualViewport?.addEventListener('resize', reposition);
		visualViewport?.addEventListener('scroll', reposition);
		return () => {
			window.removeEventListener('resize', reposition);
			window.removeEventListener('scroll', reposition, true);
			window.removeEventListener('keydown', handleEscape);
			visualViewport?.removeEventListener('resize', reposition);
			visualViewport?.removeEventListener('scroll', reposition);
		};
	});

	$effect(() => {
		const hoveredTarget = hoveredPhoto;
		const focusedTarget = focusedPhoto;
		if (hoveredTarget) {
			const nextPhoto = visiblePhotoFor(hoveredTarget);
			if (!nextPhoto) hoveredPhoto = null;
			else if (nextPhoto !== hoveredTarget.photo) hoveredPhoto = { ...hoveredTarget, photo: nextPhoto };
		}
		if (focusedTarget) {
			const nextPhoto = visiblePhotoFor(focusedTarget);
			if (!nextPhoto) focusedPhoto = null;
			else if (nextPhoto !== focusedTarget.photo) focusedPhoto = { ...focusedTarget, photo: nextPhoto };
		}
		reconcileActiveModality();
	});

	$effect(() => {
		const hoveredTarget = hoveredPhoto;
		const focusedTarget = focusedPhoto;
		if (!hoveredTarget && !focusedTarget) return;
		void (async () => {
			await tick();
			if (hoveredTarget && hoveredPhoto === hoveredTarget) {
				const anchor = anchorForPhoto(hoveredTarget.photo);
				hoveredPhoto = anchor?.matches(':hover') ? (anchor === hoveredTarget.anchor ? hoveredTarget : { ...hoveredTarget, anchor }) : null;
			}
			if (focusedTarget && focusedPhoto === focusedTarget) {
				const anchor = anchorForPhoto(focusedTarget.photo);
				focusedPhoto = anchor && document.activeElement === anchor ? (anchor === focusedTarget.anchor ? focusedTarget : { ...focusedTarget, anchor }) : null;
			}
			reconcileActiveModality();
		})();
	});
</script>

{#if hidden && totalItems > 0}
	<div class="compact-media-preview compact-media-hidden" role="note">Sensitive media</div>
{:else if shownAttachments.length > 0 || shownFallbackItems.length > 0}
	<div bind:this={previewElement} class="compact-media-preview" role="group" aria-label={previewLabel}>
		{#each shownAttachments as attachment, index}
			<div class="compact-media-item {attachment.kind}" role={attachment.kind === 'photo' && !attachmentIsCw(attachment) ? undefined : 'img'} aria-label={attachment.kind === 'photo' && !attachmentIsCw(attachment) ? undefined : attachmentLabel(attachment)}>
				{#if !attachmentIsCw(attachment) && attachment.kind === 'photo'}
					<button
						type="button"
						class="compact-media-image-trigger"
						data-full-image-src={attachment.src}
						aria-label={`View full image: ${attachmentLabel(attachment)}`}
						aria-expanded={fullPhoto === attachment}
						aria-controls={fullPhoto === attachment ? fullPhotoId : undefined}
						onmouseenter={(event) => hoverFullPhoto(event, attachment)}
						onmouseleave={leaveFullPhoto}
						onfocus={(event) => focusFullPhoto(event, attachment)}
						onblur={blurFullPhoto}
						onclick={(event) => event.stopPropagation()}
						onkeydown={handlePhotoKeydown}
					>
						<span class="compact-media-item-fallback">{attachmentFallback(attachment)}</span>
						<img src={attachment.previewUrl ?? attachment.src} alt={attachment.alt || 'Image preview'} loading="lazy" decoding="async" onload={markMediaReady} onerror={removeFailedMedia} />
					</button>
				{:else}
					<span class="compact-media-item-fallback">{attachmentFallback(attachment)}</span>
				{/if}
				{#if !attachmentIsCw(attachment) && attachment.kind === 'video' && attachment.src}
					<div class="compact-media-video-frame">
						{#if attachment.posterUrl}
							<img class="compact-media-video-poster" src={attachment.posterUrl} alt="" loading="lazy" decoding="async" onload={markMediaReady} onerror={removeFailedMedia} />
						{/if}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video use:sampleVideoWhenVisible data-src={attachment.src} muted playsinline preload="none" aria-hidden="true" tabindex="-1" onloadedmetadata={seekVideo} onloadeddata={revealVideoFrame} onseeked={revealVideoFrame}></video>
						<span class="compact-media-play" aria-hidden="true">▶</span>
					</div>
				{:else if !attachmentIsCw(attachment) && attachment.kind === 'video' && attachment.posterUrl}
					<img src={attachment.posterUrl} alt={attachment.title || 'Video preview'} loading="lazy" decoding="async" onload={markMediaReady} onerror={removeFailedMedia} />
				{/if}
				{#if remaining > 0 && shownFallbackItems.length === 0 && index === shownAttachments.length - 1}
					<span class="compact-media-more">+{remaining}</span>
				{/if}
			</div>
		{/each}
		{#each shownFallbackItems as fallbackItem, index}
			<div class="compact-media-item attachment" role="img" aria-label={fallbackItem}>
				<span class="compact-media-item-fallback">{fallbackItem}</span>
				{#if remaining > 0 && index === shownFallbackItems.length - 1}
					<span class="compact-media-more">+{remaining}</span>
				{/if}
			</div>
		{/each}
	</div>
{:else if fallback}
	<div class="compact-media-preview compact-media-fallback">{fallback}</div>
{/if}

{#if fullPhoto}
	<div
		use:portal
		bind:this={fullPhotoElement}
		id={fullPhotoId}
		class="compact-media-full-image"
		style={fullPhotoStyle}
		role="img"
		aria-label={`Full image: ${attachmentLabel(fullPhoto)}`}
	>
		<img src={fullPhoto.src} alt="" onload={() => positionFullPhoto()} onerror={hideFullPhoto} />
	</div>
{/if}
