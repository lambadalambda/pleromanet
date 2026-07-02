<script lang="ts">
	import Icon from './Icon.svelte';

	type Props = {
		post: {
			replies: number;
			boosts: number;
			favs: number;
			copyJson?: unknown;
			bookmarked?: boolean;
			own?: boolean;
			authorHandle?: string;
			statusUrl?: string;
			actions: { reply: boolean; boost: boolean; fav: boolean };
		};
		disabledActions?: { reply?: boolean; boost?: boolean; fav?: boolean };
		replyExpanded?: boolean;
		replyControlsId?: string;
		canManage?: boolean;
		onAction?: (key: string) => void;
		onReact?: (anchor: HTMLElement) => void;
	};

	let { post, disabledActions = {}, replyExpanded, replyControlsId, canManage = false, onAction, onReact }: Props = $props();
	let menuOpen = $state(false);
	let confirmDelete = $state(false);
	let copyStatus = $state('');

	const closeMenu = () => {
		menuOpen = false;
		confirmDelete = false;
	};
	const runAction = (key: string) => {
		closeMenu();
		onAction?.(key);
	};

	const writeClipboard = async (text: string) => {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return;
		}

		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.left = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		const copied = document.execCommand('copy');
		textarea.remove();
		if (!copied) throw new Error('copy failed');
	};

	const copyPostJson = async () => {
		try {
			await writeClipboard(JSON.stringify(post.copyJson ?? post, null, 2));
			copyStatus = 'Copied post JSON';
			closeMenu();
		} catch {
			copyStatus = 'Copy failed';
		}
	};
</script>

<div class="post-actions">
	<button
		class="post-action reply {post.actions.reply ? 'on' : ''}"
		aria-expanded={replyExpanded}
		aria-controls={replyControlsId}
		aria-label={`Reply ${post.replies}`}
		disabled={disabledActions.reply}
		onclick={() => onAction?.('reply')}
	>
		<Icon name="reply" /> {post.replies}
	</button>
	<button
		class="post-action boost {post.actions.boost ? 'on' : ''}"
		aria-pressed={post.actions.boost ? 'true' : 'false'}
		aria-label={`Boost ${post.boosts + (post.actions.boost ? 1 : 0)}`}
		disabled={disabledActions.boost}
		onclick={() => onAction?.('boost')}
	>
		<Icon name="boost" /> {post.boosts + (post.actions.boost ? 1 : 0)}
	</button>
	<button
		class="post-action fav {post.actions.fav ? 'on' : ''}"
		aria-pressed={post.actions.fav ? 'true' : 'false'}
		aria-label={`Favorite ${post.favs + (post.actions.fav ? 1 : 0)}`}
		disabled={disabledActions.fav}
		onclick={() => onAction?.('fav')}
	>
		<Icon name="star" fill={post.actions.fav ? 'currentColor' : 'none'} /> {post.favs + (post.actions.fav ? 1 : 0)}
	</button>
	{#if onReact}
		<button
			type="button"
			class="post-action react"
			aria-label="Add reaction"
			aria-haspopup="dialog"
			title="Add reaction"
			data-emoji-trigger
			onclick={(event) => onReact?.(event.currentTarget)}
		>
			<Icon name="smile" width={15} height={15} />
		</button>
	{/if}
	<div class="post-more-wrap" data-post-ignore>
		<button
			type="button"
			class="post-more"
			aria-label="More post actions"
			aria-haspopup="menu"
			aria-expanded={menuOpen}
			onclick={() => (menuOpen ? closeMenu() : (menuOpen = true))}
		>
			<Icon name="more" width={16} height={16} />
		</button>
		{#if menuOpen}
			<div class="post-action-menu" role="menu">
				{#if canManage && post.bookmarked !== undefined}
					<button type="button" role="menuitem" onclick={() => runAction('bookmark')}>{post.bookmarked ? 'Remove bookmark' : 'Bookmark'}</button>
				{/if}
				{#if post.statusUrl}
					<button type="button" role="menuitem" onclick={() => runAction('copy-link')}>Copy link to post</button>
				{/if}
				<button type="button" role="menuitem" onclick={copyPostJson}>Copy post JSON</button>
				{#if canManage && post.own}
					{#if confirmDelete}
						<button type="button" role="menuitem" class="menu-danger" onclick={() => runAction('delete')}>Confirm delete</button>
						<button type="button" role="menuitem" onclick={() => (confirmDelete = false)}>Cancel</button>
					{:else}
						<button type="button" role="menuitem" class="menu-danger" onclick={() => (confirmDelete = true)}>Delete post</button>
					{/if}
				{:else if canManage && post.authorHandle}
					<button type="button" role="menuitem" onclick={() => runAction('mute')}>Mute {post.authorHandle}</button>
					<button type="button" role="menuitem" class="menu-danger" onclick={() => runAction('block')}>Block {post.authorHandle}</button>
				{/if}
			</div>
		{/if}
		{#if copyStatus}
			<span class="post-copy-status" role="status" aria-label="Post JSON copy status">{copyStatus}</span>
		{/if}
	</div>
</div>
