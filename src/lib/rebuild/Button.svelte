<script lang="ts">
	type Variant = 'primary' | 'secondary' | 'follow' | 'upload' | 'ghost';
	type Props = {
		variant?: Variant;
		className?: string;
		disabled?: boolean;
		children?: import('svelte').Snippet;
		onclick?: (e: MouseEvent) => void;
	};

	let { variant = 'primary', className = '', disabled = false, children, onclick }: Props = $props();

	const variantClass = (v: Variant) =>
		v === 'primary' ? 'btn-primary' :
		v === 'secondary' ? 'btn-secondary' :
		v === 'follow' ? 'btn-follow' :
		v === 'upload' ? 'btn-upload' :
		v === 'ghost' ? 'tab-action' :
		'';
</script>

<button
	type="button"
	class="{variantClass(variant)} {className}"
	{disabled}
	{onclick}
>
	{@render children?.()}
</button>
