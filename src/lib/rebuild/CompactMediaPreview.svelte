<script lang="ts">
	import type { Attachment } from './attachments';
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
</script>

{#if hidden && totalItems > 0}
	<div class="compact-media-preview compact-media-hidden" role="note">Sensitive media</div>
{:else if shownAttachments.length > 0 || shownFallbackItems.length > 0}
	<div class="compact-media-preview" role="group" aria-label={previewLabel}>
		{#each shownAttachments as attachment, index}
			<div class="compact-media-item {attachment.kind}" role="img" aria-label={attachmentLabel(attachment)}>
				<span class="compact-media-item-fallback">{attachmentFallback(attachment)}</span>
				{#if !attachmentIsCw(attachment) && attachment.kind === 'photo'}
					<img src={attachment.previewUrl ?? attachment.src} alt={attachment.alt || 'Image preview'} loading="lazy" decoding="async" onload={markMediaReady} onerror={removeFailedMedia} />
				{:else if !attachmentIsCw(attachment) && attachment.kind === 'video' && attachment.src}
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
