<script lang="ts">
	import Avatar from './Avatar.svelte';
	import ComposerMentionEditor, { type ComposerEmoji, type ComposerMentionAccount } from './ComposerMentionEditor.svelte';
	import Icon from './Icon.svelte';
	import type { PleromaRequestErrorView } from '$lib/pleroma/ui';
	import type { BannerVariant } from './attachments';

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
		onMentionQuery?: (query: string) => void;
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
		onMentionQuery,
		onDraftInput,
		onCancel,
		onSubmit
	}: Props = $props();
	let formLabel = $derived(`Inline reply to ${targetHandle}`);
	let avatarAlt = $derived(`${targetName || targetHandle} avatar`);
	let targetAvatar = $derived({
		name: targetName,
		handle: targetHandle,
		avClass: targetAvClass,
		avBanner: targetAvBanner,
		avatarUrl: targetAvatarUrl
	});
	let canSubmit = $derived(Boolean(draft.trim()) && remaining >= 0 && !submitting);

</script>

<form {id} class="thread-inline-reply" aria-label={formLabel} onsubmit={(event) => { event.preventDefault(); onSubmit(); }}>
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
		<div class="thread-inline-reply-row">
			<button type="button" class="thread-inline-reply-tool" title="Image" aria-label="Image"><Icon name="image" width={16} height={16} /></button>
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
