<script lang="ts">
	import Avatar from './Avatar.svelte';
	import NotifIcon from './NotifIcon.svelte';
	import { NOTIF_KINDS, type NotificationData } from './notifications';

	type Props = {
		n: NotificationData;
		dense?: boolean;
		onOpen?: (notification: NotificationData) => void;
	};

	let { n, dense = false, onOpen }: Props = $props();

	let kind = $derived(NOTIF_KINDS[n.kind]);
	let visibleActors = $derived(n.who.slice(0, 4));
	let namedActors = $derived(n.who.slice(0, 2));
	let more = $derived(n.who.length > 4 ? n.who.length - 4 : 0);
	let otherCount = $derived(n.who.length > 2 ? n.who.length - 2 : 0);
	let isFollow = $derived(n.kind === 'follow' || n.kind === 'follow_req');
	let rowClass = $derived(`notif-row ${n.read ? '' : 'unread '}${dense ? 'dense ' : ''}k-${n.kind}`);
</script>

<div class={rowClass}>
	<div class="notif-row-icon" style={`--kind-tint: ${kind.tint};`}>
		<NotifIcon name={kind.icon} />
	</div>
	<div class="notif-row-body">
		<div class="notif-row-avs">
			{#each visibleActors as actor}
				<Avatar variant="notif" avBanner={actor.av} size={dense ? 22 : 26} aria-label={actor.handle ?? actor.name} />
			{/each}
			{#if more > 0}
				<span class="notif-more">+{more}</span>
			{/if}
		</div>
		<div class="notif-row-text">
			<span class="notif-names">
				{#each namedActors as actor, i}
					<span><b>{actor.name}</b>{#if i === 0 && n.who.length > 1}, {' '}{/if}</span>
				{/each}
				{#if otherCount > 0}
					<span class="notif-others"> and {otherCount} other{otherCount > 1 ? 's' : ''}</span>
				{/if}
			</span>
			<span class="notif-action"> {kind.label}</span>
			<span class="notif-time">· {n.time}</span>
		</div>
		{#if n.on}
			<div class="notif-row-on">
				<span class="notif-on-l">on</span>
				<span class="notif-on-t">&quot;{n.on}&quot;</span>
			</div>
		{/if}
		{#if n.post}
			{#if onOpen}
				<button type="button" class="notif-row-quote" onclick={() => onOpen(n)}>
					<span class="notif-quote-mark">&quot;</span>
					<span class="notif-quote-t">{n.post.excerpt}</span>
				</button>
			{:else}
				<div class="notif-row-quote static">
					<span class="notif-quote-mark">&quot;</span>
					<span class="notif-quote-t">{n.post.excerpt}</span>
				</div>
			{/if}
		{/if}
		{#if n.bio}
			<div class="notif-row-bio">{n.bio}</div>
		{/if}
		{#if isFollow}
			<div class="notif-row-actions">
				{#if n.kind === 'follow_req'}
					<button type="button" class="notif-btn primary">Accept</button>
					<button type="button" class="notif-btn">Decline</button>
				{:else}
					<button type="button" class="notif-btn">Follow back</button>
				{/if}
			</div>
		{/if}
	</div>
	{#if !n.read}
		<span class="notif-unread-dot" aria-hidden="true"></span>
	{/if}
</div>
