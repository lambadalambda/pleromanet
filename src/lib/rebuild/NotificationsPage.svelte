<script lang="ts">
	import { onMount } from 'svelte';
	import NotifRow from './NotifRow.svelte';
	import { filterNotifs, NOTIF_TABS, type NotificationData, type NotificationTabId } from './notifications';

	type Status = 'loading' | 'empty' | 'error' | 'success';
	type BucketId = 'now' | 'today' | 'yesterday' | 'this-week' | 'earlier';
	type Props = {
		status: Status;
		notifications?: NotificationData[];
		errorTitle?: string;
		errorMessage?: string;
		retryable?: boolean;
		clearPending?: boolean;
		clearError?: string | null;
		onRetry?: () => void;
		onMarkAll?: () => void;
		onClear?: () => void;
		onOpen?: (notification: NotificationData) => void;
		onAccept?: (notification: NotificationData) => Promise<void> | void;
		onReject?: (notification: NotificationData) => Promise<void> | void;
	};

	const buckets: Array<{ id: BucketId; label: string }> = [
		{ id: 'now', label: 'New' },
		{ id: 'today', label: 'Today' },
		{ id: 'yesterday', label: 'Yesterday' },
		{ id: 'this-week', label: 'This week' },
		{ id: 'earlier', label: 'Earlier' }
	];
	const statKinds = [
		{ id: 'fav', label: 'Favorites', symbol: '★', color: 'var(--accent)', kinds: ['fav', 'reaction'] },
		{ id: 'boost', label: 'Boosts', symbol: '↻', color: '#7dc4be', kinds: ['boost'] },
		{ id: 'reply', label: 'Replies', symbol: '↩', color: 'var(--accent-ink)', kinds: ['reply'] },
		{ id: 'mention', label: 'Mentions', symbol: '@', color: 'var(--accent-ink)', kinds: ['mention'] },
		{ id: 'follow', label: 'Follows', symbol: '+', color: '#a48bd9', kinds: ['follow', 'follow_req'] }
	] as const;
	const ageMinutes = (notification: NotificationData, now = Date.now()) => {
		const createdAt = notification.createdAt ? Date.parse(notification.createdAt) : Number.NaN;
		const timestamp = Number.isFinite(createdAt) ? createdAt : notification.t > 10_000_000 ? notification.t : now - notification.t * 60_000;
		return Math.max(0, (now - timestamp) / 60_000);
	};
	const bucketFor = (notification: NotificationData, now: number): BucketId => {
		const age = ageMinutes(notification, now);
		if (age < 60) return 'now';
		if (age < 60 * 6) return 'today';
		if (age < 60 * 24 * 2) return 'yesterday';
		if (age < 60 * 24 * 7) return 'this-week';
		return 'earlier';
	};

	let {
		status,
		notifications = [],
		errorTitle = 'Notifications unavailable',
		errorMessage = 'Try again in a moment.',
		retryable = false,
		clearPending = false,
		clearError = null,
		onRetry,
		onMarkAll,
		onClear,
		onOpen,
		onAccept,
		onReject
	}: Props = $props();
	const componentId = $props.id();
	const panelId = `${componentId}-panel`;
	let tab = $state<NotificationTabId>('all');
	let hideBoosts = $state(false);
	let now = $state(Date.now());
	let tabButtons = $state<HTMLButtonElement[]>([]);
	let unread = $derived(notifications.filter((notification) => !notification.read).length);
	let filterable = $derived(hideBoosts ? notifications.filter((notification) => notification.kind !== 'boost') : notifications);
	let visible = $derived(filterNotifs(filterable, tab));
	let grouped = $derived(buckets.map((bucket) => ({
		...bucket,
		notifications: visible.filter((notification) => bucketFor(notification, now) === bucket.id)
	})));
	let tabCounts = $derived(Object.fromEntries(NOTIF_TABS.map((item) => [
		item.id,
		filterNotifs(filterable, item.id).filter((notification) => !notification.read).length
	])) as Record<NotificationTabId, number>);
	let weeklyNotifications = $derived(notifications.filter((notification) => ageMinutes(notification, now) < 60 * 24 * 7));
	let stats = $derived(statKinds.map((stat) => ({
		...stat,
		count: weeklyNotifications.filter((notification) => (stat.kinds as readonly string[]).includes(notification.kind)).length
	})));
	let statMaximum = $derived(Math.max(1, ...stats.map((stat) => stat.count)));
	let activeTabIndex = $derived(Math.max(0, NOTIF_TABS.findIndex((item) => item.id === tab)));
	const selectTabByIndex = (index: number) => {
		const nextIndex = (index + NOTIF_TABS.length) % NOTIF_TABS.length;
		tab = NOTIF_TABS[nextIndex].id;
		tabButtons[nextIndex]?.focus();
	};
	const handleTabKeydown = (event: KeyboardEvent, index: number) => {
		if (event.key === 'ArrowRight') selectTabByIndex(index + 1);
		else if (event.key === 'ArrowLeft') selectTabByIndex(index - 1);
		else if (event.key === 'Home') selectTabByIndex(0);
		else if (event.key === 'End') selectTabByIndex(NOTIF_TABS.length - 1);
		else return;
		event.preventDefault();
	};

	onMount(() => {
		const timer = window.setInterval(() => (now = Date.now()), 60_000);
		return () => window.clearInterval(timer);
	});
</script>

<section class="notif-page" data-testid="notifications-page">
	<header class="notif-page-head">
		<div>
			<div class="notif-page-eye">Inbox</div>
			<h1 class="notif-page-title">Notifications</h1>
			<div class="notif-page-sub">{unread > 0 ? `${unread} unread` : 'All caught up.'} · {notifications.length} total</div>
		</div>
		<div class="notif-page-tools">
			<button type="button" class="notif-tool-btn" disabled={unread === 0} onclick={() => onMarkAll?.()}>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12l4 4 12-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
				<span>Mark all read</span>
			</button>
			<button type="button" class="notif-tool-btn" disabled={notifications.length === 0 || clearPending} onclick={() => onClear?.()}>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M6 6v13a1 1 0 001 1h10a1 1 0 001-1V6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
				<span>{clearPending ? 'Clearing…' : 'Clear all'}</span>
			</button>
		</div>
	</header>

	<div class="notif-page-tabs" role="tablist" aria-label="Notification types">
		{#each NOTIF_TABS as item, index (item.id)}
			<button type="button" role="tab" class="notif-page-tab" class:active={tab === item.id} id={`${componentId}-tab-${item.id}`} aria-selected={tab === item.id} aria-controls={panelId} tabindex={tab === item.id ? 0 : -1} bind:this={tabButtons[index]} onclick={() => (tab = item.id)} onkeydown={(event) => handleTabKeydown(event, index)}>
				<span>{item.label}</span>
				{#if tabCounts[item.id] > 0}<span class="notif-page-tab-c">{tabCounts[item.id]}</span>{/if}
			</button>
		{/each}
	</div>

	{#if clearError}<div class="notif-page-error" role="alert">{clearError}</div>{/if}

	<div class="notif-page-main">
		<div class="notif-page-list" id={panelId} role="tabpanel" aria-labelledby={`${componentId}-tab-${NOTIF_TABS[activeTabIndex].id}`} tabindex="0" data-testid={status === 'error' ? undefined : 'notifications-list'}>
			{#if status === 'loading'}
				<div class="request-state" role="status" aria-label="Request status">Loading notifications</div>
			{:else if status === 'error'}
				<div class="request-state request-error">
					<h2>{errorTitle}</h2>
					<p>{errorMessage}</p>
					{#if retryable && onRetry}<button type="button" class="notif-btn" onclick={onRetry}>Retry notifications</button>{/if}
				</div>
			{:else if visible.length === 0}
				<div class="notif-empty big">
					<div class="notif-empty-mark">∅</div>
					<div class="notif-empty-t">Nothing here yet.</div>
					<div class="notif-empty-s">When someone interacts with you, it’ll show up here. Try another notification type or broaden the available filters.</div>
				</div>
			{:else}
				{#each grouped as bucket (bucket.id)}
					{#if bucket.notifications.length > 0}
						<section class="notif-bucket">
							<header class="notif-bucket-head">
								<span class="notif-bucket-label">{bucket.label}</span>
								<span class="notif-bucket-rule"></span>
								<span class="notif-bucket-count">{bucket.notifications.length}</span>
							</header>
							<div class="notif-bucket-list">
								{#each bucket.notifications as notification (notification.id)}
									<NotifRow n={notification} onOpen={onOpen} onAccept={onAccept} onReject={onReject} />
								{/each}
							</div>
						</section>
					{/if}
				{/each}
			{/if}
		</div>

		<aside class="notif-page-side" data-testid="notifications-side">
			<section class="card notif-side-card">
				<h2 class="notif-side-head">Filters</h2>
				<label class="notif-filter unavailable" title="Following relationships are not included with notification actors yet.">
					<input type="checkbox" disabled aria-label="From people I follow only" />
					<span class="notif-filter-l"><span class="notif-filter-t">From people I follow only</span><span class="notif-filter-d">Unavailable until relationship data is loaded.</span></span>
				</label>
				<label class="notif-filter">
					<input type="checkbox" bind:checked={hideBoosts} aria-label="Hide boosts" />
					<span class="notif-filter-l"><span class="notif-filter-t">Hide boosts</span><span class="notif-filter-d">Boosts can flood the inbox during a viral moment.</span></span>
				</label>
				<label class="notif-filter unavailable" title="Keyword notification filters are not available yet.">
					<input type="checkbox" disabled aria-label="Mute mentions with keywords" />
					<span class="notif-filter-l"><span class="notif-filter-t">Mute mentions with keywords</span><span class="notif-filter-d">Manage keyword filtering when notification rules are available.</span></span>
				</label>
				<button type="button" class="notif-side-link" disabled>Manage filters →</button>
			</section>

			<section class="card notif-side-card">
				<h2 class="notif-side-head">Delivery</h2>
				<p class="notif-side-note">Delivery preferences aren’t available in this client yet.</p>
				<button type="button" class="notif-side-link" disabled>Notification settings →</button>
			</section>

			<section class="card notif-side-card notif-side-stats">
				<h2 class="notif-side-head">This week</h2>
				{#each stats as stat (stat.id)}
					<div class="notif-stat-row">
						<span class="notif-stat-l">{stat.symbol} {stat.label}</span>
						<span class="notif-stat-bar"><span style={`width: ${(stat.count / statMaximum) * 100}%; background: ${stat.color};`}></span></span>
						<span class="notif-stat-v">{stat.count}</span>
					</div>
				{/each}
			</section>
		</aside>
	</div>
</section>
