<script lang="ts">
	import Avatar from './Avatar.svelte';
	import ComposerMentionEditor, { type ComposerEmoji, type ComposerMentionAccount } from './ComposerMentionEditor.svelte';
	import Icon from './Icon.svelte';
	import type { PleromaRequestErrorView } from '$lib/pleroma/ui';
	import type { BannerVariant } from './attachments';

export type InlineReplyUpload = {
	localId: string;
	name: string;
	kind: 'photo' | 'audio' | 'video' | 'file';
	progress: number;
	status: 'uploading' | 'uploaded' | 'error';
	error?: string;
};

	type Props = {
		id?: string;
		targetHandle: string;
		targetName?: string;
		targetAvClass?: string;
		targetAvBanner?: BannerVariant;
		targetAvatarUrl?: string | null;
		draft: string;
		remaining: number;
		submitting?: boolean;
		error?: PleromaRequestErrorView | null;
		accounts?: ComposerMentionAccount[];
		emojis?: ComposerEmoji[];
		uploads?: InlineReplyUpload[];
		onMentionQuery?: (query: string) => void;
		onFiles?: (files: FileList | File[]) => void;
		onRemoveUpload?: (localId: string) => void;
		onDraftInput: (value: string) => void;
		onCancel: () => void;
		onSubmit: () => void;
	};

	let {
		id,
		targetHandle,
		targetName,
		targetAvClass,
		targetAvBanner,
		targetAvatarUrl,
		draft,
		remaining,
		submitting = false,
		error = null,
		accounts = [],
		emojis = [],
		uploads = [],
		onMentionQuery,
		onFiles,
		onRemoveUpload,
		onDraftInput,
		onCancel,
		onSubmit
	}: Props = $props();
	let fileInput = $state<HTMLInputElement | null>(null);
	let dragActive = $state(false);
	let dragCount = $state(0);
	let formLabel = $derived(`Inline reply to ${targetHandle}`);
	let avatarAlt = $derived(`${targetName || targetHandle} avatar`);
	let targetAvatar = $derived({
		name: targetName,
		handle: targetHandle,
		avClass: targetAvClass,
		avBanner: targetAvBanner,
		avatarUrl: targetAvatarUrl
	});
	let uploadsPending = $derived(uploads.some((upload) => upload.status === 'uploading'));
	let hasUploadedMedia = $derived(uploads.some((upload) => upload.status === 'uploaded'));
	let mediaEnabled = $derived(Boolean(onFiles));
	let canSubmit = $derived((Boolean(draft.trim()) || hasUploadedMedia) && remaining >= 0 && !submitting && !uploadsPending);

	const uploadBadge = (kind: InlineReplyUpload['kind']) => kind === 'audio' ? 'WAV' : kind === 'video' ? 'MP4' : kind === 'photo' ? 'IMG' : 'FILE';
	const pickFiles = () => {
		if (submitting) return;
		fileInput?.click();
	};
	const handleFileChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		if (!submitting && input.files) onFiles?.(input.files);
		input.value = '';
	};
	const handleDragOver = (event: DragEvent) => {
		if (submitting || !onFiles || !event.dataTransfer?.types.includes('Files')) return;
		event.preventDefault();
		dragActive = true;
		dragCount = Math.max(1, event.dataTransfer.items.length || event.dataTransfer.files.length || 1);
	};
	const handleDragLeave = () => {
		dragActive = false;
		dragCount = 0;
	};
	const handleDrop = (event: DragEvent) => {
		if (submitting || !event.dataTransfer?.files.length || !onFiles) return;
		event.preventDefault();
		dragActive = false;
		dragCount = 0;
		onFiles(event.dataTransfer.files);
	};
	const handlePaste = (event: ClipboardEvent) => {
		const files = Array.from(event.clipboardData?.files ?? []);
		if (submitting || files.length === 0 || !onFiles) return;
		event.preventDefault();
		onFiles(files);
	};

</script>

<form {id} class="thread-inline-reply" aria-label={formLabel} onsubmit={(event) => { event.preventDefault(); onSubmit(); }} onpaste={handlePaste} ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop}>
	<Avatar
		post={targetAvatar}
		alt={avatarAlt}
		size={32}
		className="thread-inline-reply-av"
	/>
	<div class="thread-inline-reply-main">
		<div class="thread-inline-reply-addr">
			<span>Replying to</span>
			<span class="thread-inline-reply-addr-chip">
				<Icon name="reply" width={10} height={10} />
				{targetHandle}
			</span>
		</div>
		<ComposerMentionEditor
			value={draft}
			onInput={onDraftInput}
			ariaLabel="Reply text"
			placeholder={`Reply to ${targetHandle}...`}
			disabled={submitting}
			autoFocus
			{accounts}
			{emojis}
			{onMentionQuery}
			onSubmit={onSubmit}
		/>
		{#if mediaEnabled}
			<input bind:this={fileInput} class="sr-only" type="file" multiple tabindex="-1" aria-label="Attach reply media" accept="image/*,audio/*,video/*" onchange={handleFileChange} />
		{/if}
		{#if uploads.length > 0}
			<div class="composer-uploads thread-inline-reply-uploads" aria-live="polite">
				{#each uploads as upload (upload.localId)}
					<div class="composer-upload-row" class:error={upload.status === 'error'} title={upload.error}>
						<div class={`composer-upload-thumb ${upload.kind}`}>{uploadBadge(upload.kind)}</div>
						<div class="composer-upload-meta">
							<div class="composer-upload-name">{upload.name}</div>
							<div class="composer-upload-prog-row">
								<div class="composer-upload-bar" role="progressbar" aria-label={`Upload progress for ${upload.name}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={upload.progress}><span style={`width:${upload.progress}%`}></span></div>
								<span class="composer-upload-pct">{upload.status === 'error' ? 'Error' : `${upload.progress}%`}</span>
							</div>
							{#if upload.error}<div class="composer-upload-error">{upload.error}</div>{/if}
						</div>
						<button type="button" class="composer-upload-rm" aria-label={`Remove ${upload.name}`} disabled={submitting} onclick={() => onRemoveUpload?.(upload.localId)}>×</button>
					</div>
				{/each}
			</div>
		{:else if mediaEnabled}
			<button type="button" class="composer-drop-slot thread-inline-reply-drop" class:active={dragActive} disabled={submitting} onclick={pickFiles}>
				<Icon name="upload" width={16} height={16} />
				<span>{#if dragActive}<strong>Drop to add {dragCount} {dragCount === 1 ? 'file' : 'files'}</strong> <span class="drop-copy-muted">· photos · audio · video</span>{:else}<strong>Drag &amp; drop</strong> <span class="drop-copy-muted">files to attach</span> <em>· or browse</em>{/if}</span>
			</button>
		{/if}
		<div class="thread-inline-reply-row">
			<button type="button" class="thread-inline-reply-tool" title="Image" aria-label="Image" disabled={!mediaEnabled || submitting} onclick={pickFiles}><Icon name="image" width={16} height={16} /></button>
			<button type="button" class="thread-inline-reply-tool" title="Emoji" aria-label="Emoji"><Icon name="smile" width={16} height={16} /></button>
			<button type="button" class="thread-inline-reply-tool" title="Poll" aria-label="Poll"><Icon name="poll" width={16} height={16} /></button>
			<button type="button" class="thread-inline-reply-cw" aria-label="Content warning">CW</button>
			<span class="thread-inline-reply-spacer"></span>
			<button type="button" class="thread-inline-reply-cancel" disabled={submitting} onclick={onCancel}>Cancel</button>
			<span class="thread-inline-reply-count" class:over-limit={remaining < 0}>{remaining}</span>
			<button type="submit" class="thread-inline-reply-submit" disabled={!canSubmit}>{submitting ? 'Replying...' : 'Reply'}</button>
		</div>
		{#if error}
			<div class="status-action-error inline-reply-error" role="alert">
				<strong>{error.title}</strong>
				<span>{error.message}</span>
			</div>
		{/if}
	</div>
</form>
