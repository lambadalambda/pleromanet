<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import NotifRow from './NotifRow.svelte';
	import { cloneNotifications, filterNotifs, NOTIF_TABS, type NotificationData, type NotificationTabId } from './notifications';

	type Props = {
		onClose?: () => void;
		onSeeAll?: () => void;
	};

	let { onClose, onSeeAll }: Props = $props();
	let popoverEl = $state<HTMLDivElement | undefined>();
	let tab = $state<NotificationTabId>('all');
	let list = $state<NotificationData[]>(cloneNotifications());
	let visible = $derived(filterNotifs(list, tab).slice(0, 8));
	let unreadCount = $derived(list.filter((notification) => !notification.read).length);

	const markAll = () => {
		list = list.map((notification) => ({ ...notification, read: true }));
	};

	onMount(() => {
		if (!onClose) return;

		const onDocClick = (event: MouseEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (popoverEl?.contains(target)) return;
			if (target instanceof Element && target.closest('[data-bell]')) return;
			onClose();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};

		const docClickTimer = window.setTimeout(() => document.addEventListener('click', onDocClick), 0);
		document.addEventListener('keydown', onKeyDown);

		return () => {
			window.clearTimeout(docClickTimer);
			document.removeEventListener('click', onDocClick);
			document.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

<div class="notif-pop" bind:this={popoverEl}>
	<div class="notif-pop-head">
		<div class="notif-pop-title">
			<span>Notifications</span>
			{#if unreadCount > 0}
				<span class="notif-pop-count">{unreadCount} new</span>
			{/if}
		</div>
		<div class="notif-pop-tools">
			<button type="button" class="notif-pop-tool" onclick={markAll} title="Mark all read" aria-label="Mark all read">
				<svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px" aria-hidden="true"><path d="M4 12l4 4 12-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</button>
			<button type="button" class="notif-pop-tool" title="Notification settings" aria-label="Notification settings">
				<Icon name="gear" width={14} height={14} />
			</button>
		</div>
	</div>
	<div class="notif-pop-tabs">
		{#each NOTIF_TABS.slice(0, 4) as item (item.id)}
			<button type="button" class:active={tab === item.id} class="notif-pop-tab" aria-pressed={tab === item.id} onclick={() => (tab = item.id)}>{item.label}</button>
		{/each}
	</div>
	<div class="notif-pop-body">
		{#if visible.length === 0}
			<div class="notif-empty">
				<div class="notif-empty-mark">∅</div>
				<div>No {tab === 'all' ? '' : tab} notifications.</div>
			</div>
		{:else}
			{#each visible as notification (notification.id)}
				<NotifRow n={notification} dense />
			{/each}
		{/if}
	</div>
	<button type="button" class="notif-pop-foot" onclick={() => onSeeAll?.()}>
		<span>See all notifications</span>
		<Icon name="arrowR" width={13} height={13} />
	</button>
</div>
