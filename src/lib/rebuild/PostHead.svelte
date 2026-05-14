<script lang="ts">
	type Props = {
		name?: string;
		handle?: string;
		time?: string;
		post?: { name?: string; handle?: string; time?: string };
	};

	let { name, handle, time, post }: Props = $props();
	let n = $derived(name ?? post?.name);
	let h = $derived(handle ?? post?.handle);
	let t = $derived(time ?? post?.time);
</script>

<div class="post-head">
	<span class="post-name">{n}</span>
	<span class="post-handle">{h}</span>
	<span class="post-time">{t}</span>
</div>
