<script lang="ts">
	import Avatar from './Avatar.svelte';
	import InlineReplyComposer from './InlineReplyComposer.svelte';
	import PostActions from './PostActions.svelte';
	import PostBoost from './PostBoost.svelte';
	import PostBody from './PostBody.svelte';
	import PostCW from './PostCW.svelte';
	import PostHead from './PostHead.svelte';
	import PostMedia from './PostMedia.svelte';
	import QuotedPost from './QuotedPost.svelte';
	import ReplyPostBranch from './ReplyPost.svelte';
	import type { CustomEmoji } from '$lib/social/types';
	import type { PleromaRequestErrorView } from '$lib/pleroma/ui';
	import { normalizeRenderableAttachments, openLightbox } from './attachments';
	import type { BannerVariant, PostLike } from './attachments';

	type ThreadReply = PostLike & {
		id?: string | number;
		name?: string;
		nameEmojis?: CustomEmoji[];
		handle?: string;
		time?: string;
		avClass?: string;
		avBanner?: BannerVariant;
		body?: string;
		bodyEmojis?: CustomEmoji[];
		addressees?: string[];
		quotedPost?: Record<string, unknown>;
		replies: number;
		boosts: number;
		favs: number;
		actions: { reply: boolean; boost: boolean; fav: boolean };
		nestedReplies?: ThreadReply[];
	};

	type Props = {
		post: ThreadReply;
		isLast?: boolean;
		nestedReplies?: ThreadReply[];
		onAction?: (id: string | number | undefined, key: string) => void;
		inlineReplyRenderId?: string | null;
		inlineReplyTargetHandle?: string;
		inlineReplyTargetName?: string;
		inlineReplyTargetAvClass?: string;
		inlineReplyTargetAvBanner?: BannerVariant;
		inlineReplyTargetAvatarUrl?: string | null;
		inlineReplyDraft?: string;
		inlineReplyRemaining?: number;
		inlineReplySubmitting?: boolean;
		inlineReplyError?: PleromaRequestErrorView | null;
		expandedReplyIds?: Record<string, boolean>;
		onInlineReplyDraftInput?: (value: string) => void;
		onInlineReplyCancel?: () => void;
		onInlineReplySubmit?: () => void;
		onShowNested?: (id: string | number | undefined) => void;
	};

	let {
		post,
		isLast = false,
		nestedReplies = [],
		onAction,
		inlineReplyRenderId = null,
		inlineReplyTargetHandle = '',
		inlineReplyTargetName = '',
		inlineReplyTargetAvClass,
		inlineReplyTargetAvBanner,
		inlineReplyTargetAvatarUrl,
		inlineReplyDraft = '',
		inlineReplyRemaining = 0,
		inlineReplySubmitting = false,
		inlineReplyError = null,
		expandedReplyIds = {},
		onInlineReplyDraftInput,
		onInlineReplyCancel,
		onInlineReplySubmit,
		onShowNested
	}: Props = $props();

	const handleLightbox = (target: ThreadReply, idx: number) => {
		const attachments = normalizeRenderableAttachments(target);
		if (!attachments.length) return;
		openLightbox(attachments, idx, {
			name: target.name,
			handle: target.handle,
			avClass: target.avClass,
			avBanner: target.avBanner
		});
	};
	const inlineReplyOpenFor = (target: ThreadReply) => inlineReplyRenderId === String(target.id);
	const nestedRepliesOpenFor = (target: ThreadReply) => target.id != null && Boolean(expandedReplyIds[String(target.id)]);
</script>

<PostBoost boostedBy={post.boostedBy}>
	<div class="post post-reply {isLast && nestedReplies.length === 0 ? 'post-reply-last' : ''}">
		<div class="thread-line-wrap">
			<Avatar post={post} />
			{#if nestedReplies.length > 0 && !isLast}
				<div class="thread-line"></div>
			{/if}
		</div>
		<div style="min-width:0">
			<PostHead post={post} />
			<PostCW post={post}>
				<PostBody body={post.body} emojis={post.bodyEmojis} addressees={post.addressees} />
				<QuotedPost quoted={post.quotedPost} />
				<PostMedia post={post} onOpen={(idx) => handleLightbox(post, idx)} />
			</PostCW>
			<PostActions post={post} onAction={(key) => onAction?.(post.id, key)} />
			{#if nestedReplies.length > 0 && !nestedRepliesOpenFor(post)}
				<button type="button" class="show-replies" onclick={() => onShowNested?.(post.id)}>
					<span class="show-replies-line"></span>
					Show {nestedReplies.length} {nestedReplies.length === 1 ? 'reply' : 'replies'} →
				</button>
			{/if}
		</div>
	</div>
	{#if inlineReplyOpenFor(post)}
		<InlineReplyComposer
			targetHandle={inlineReplyTargetHandle}
			targetName={inlineReplyTargetName}
			targetAvClass={inlineReplyTargetAvClass}
			targetAvBanner={inlineReplyTargetAvBanner}
			targetAvatarUrl={inlineReplyTargetAvatarUrl}
			draft={inlineReplyDraft}
			remaining={inlineReplyRemaining}
			submitting={inlineReplySubmitting}
			error={inlineReplyError}
			onDraftInput={(value) => onInlineReplyDraftInput?.(value)}
			onCancel={() => onInlineReplyCancel?.()}
			onSubmit={() => onInlineReplySubmit?.()}
		/>
	{/if}
</PostBoost>

{#if nestedRepliesOpenFor(post) && nestedReplies.length > 0}
	<div class="nested-replies">
		{#each nestedReplies as reply, i}
			<ReplyPostBranch
				post={reply}
				isLast={i === nestedReplies.length - 1}
				nestedReplies={reply.nestedReplies}
				onAction={onAction}
				inlineReplyRenderId={inlineReplyRenderId}
				inlineReplyTargetHandle={inlineReplyTargetHandle}
				inlineReplyTargetName={inlineReplyTargetName}
				inlineReplyTargetAvClass={inlineReplyTargetAvClass}
				inlineReplyTargetAvBanner={inlineReplyTargetAvBanner}
				inlineReplyTargetAvatarUrl={inlineReplyTargetAvatarUrl}
				inlineReplyDraft={inlineReplyDraft}
				inlineReplyRemaining={inlineReplyRemaining}
				inlineReplySubmitting={inlineReplySubmitting}
				inlineReplyError={inlineReplyError}
				expandedReplyIds={expandedReplyIds}
				onInlineReplyDraftInput={onInlineReplyDraftInput}
				onInlineReplyCancel={onInlineReplyCancel}
				onInlineReplySubmit={onInlineReplySubmit}
				onShowNested={onShowNested}
			/>
		{/each}
	</div>
{/if}
