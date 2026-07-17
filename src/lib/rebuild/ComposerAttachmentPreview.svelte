<script lang="ts">
	import { composerUploadBadge, type ComposerUpload } from './composer';

	type Props = {
		upload: ComposerUpload;
		disabled?: boolean;
		onRemove?: (localId: string) => void;
		onAltText?: (localId: string, description: string) => void;
	};

	let { upload, disabled = false, onRemove, onAltText }: Props = $props();
	let previewKind = $derived.by<ComposerUpload['kind']>(() => {
		if (upload.status !== 'uploaded') return upload.kind;
		const mediaType = upload.media.type.toLowerCase();
		if (mediaType === 'image') return 'photo';
		if (mediaType === 'video' || mediaType === 'gifv') return 'video';
		if (mediaType === 'audio') return 'audio';
		return upload.kind;
	});
	let imageUrl = $derived(upload.status === 'uploaded' && previewKind === 'photo' ? upload.media.preview_url || upload.media.url || null : null);
	let videoUrl = $derived(upload.status === 'uploaded' && previewKind === 'video' ? upload.media.url || null : null);
	let videoPoster = $derived(upload.status === 'uploaded' && previewKind === 'video' ? upload.media.preview_url || null : null);
	let audioUrl = $derived(upload.status === 'uploaded' && previewKind === 'audio' ? upload.media.url || null : null);
	let imageAlt = $derived(upload.status === 'uploaded' && upload.media.description?.trim() ? upload.media.description : `Preview of ${upload.name}`);
	const waveform = [38, 62, 46, 78, 54, 88, 68, 42, 72, 58, 84, 48, 66, 36, 74, 52, 82, 44, 64, 34];
</script>

<article
	class="composer-upload-row"
	class:error={upload.status === 'error'}
	class:uploaded={upload.status === 'uploaded'}
	data-testid="composer-attachment"
	aria-label={`${upload.name}, ${previewKind} attachment`}
	title={upload.error}
>
	<div class={`composer-upload-preview ${previewKind}`}>
		{#if previewKind === 'photo' && imageUrl}
			<img class="composer-upload-media" src={imageUrl} alt={imageAlt} />
		{:else if previewKind === 'video' && videoUrl}
			<!-- svelte-ignore a11y_media_has_caption -- user uploads do not have a caption track before posting -->
			<video class="composer-upload-media" src={videoUrl} poster={videoPoster ?? undefined} preload="metadata" controls playsinline aria-label={`Preview video ${upload.name}`}></video>
		{:else if previewKind === 'video' && videoPoster}
			<div class="composer-upload-unavailable">
				<img class="composer-upload-media" src={videoPoster} alt={imageAlt} />
				<span>Video preview unavailable</span>
			</div>
		{:else if previewKind === 'audio'}
			<div class="composer-upload-audio-art">
				<div class="composer-upload-wave" aria-hidden="true">
					{#each waveform as height}<span style={`height:${height}%`}></span>{/each}
				</div>
				<span>{upload.status === 'uploaded' && !audioUrl ? 'Media preview unavailable' : 'Audio attachment'}</span>
			</div>
		{:else}
			<div class="composer-upload-fallback" data-testid="composer-attachment-fallback">
				<strong>{composerUploadBadge(previewKind)}</strong>
				<span>{upload.status === 'uploading' ? 'Preparing preview' : upload.status === 'error' ? 'Preview unavailable' : 'Media preview unavailable'}</span>
			</div>
		{/if}
		<span class="composer-upload-kind">{composerUploadBadge(previewKind)}</span>
	</div>

	<div class="composer-upload-meta">
		<div class="composer-upload-head">
			<div class="composer-upload-name" title={upload.name}>{upload.name}</div>
			<button type="button" class="composer-upload-rm" aria-label={`Remove ${upload.name}`} disabled={disabled || !onRemove} onclick={() => onRemove?.(upload.localId)}>×</button>
		</div>
		<div class="composer-upload-prog-row">
			<div class="composer-upload-bar" role="progressbar" aria-label={`Upload progress for ${upload.name}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={upload.progress}><span style={`width:${upload.progress}%`}></span></div>
			<span class="composer-upload-pct">{upload.status === 'error' ? 'Error' : `${upload.progress}%`}</span>
		</div>
		{#if upload.error}<div class="composer-upload-error">{upload.error}</div>{/if}
		{#if previewKind === 'audio' && audioUrl}
			<audio class="composer-upload-audio" src={audioUrl} preload="metadata" controls aria-label={`Preview audio ${upload.name}`}></audio>
		{/if}
		{#if upload.status === 'uploaded' && onAltText}
			<label class="composer-upload-alt-wrap">
				<span>Alt text</span>
				<input class="composer-upload-alt" type="text" placeholder="Describe for screen readers" aria-label={`Alt text for ${upload.name}`} value={upload.media.description ?? ''} {disabled} onchange={(event) => onAltText(upload.localId, event.currentTarget.value)} />
			</label>
		{/if}
	</div>
</article>
