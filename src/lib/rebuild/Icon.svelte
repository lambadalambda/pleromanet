<script lang="ts">
	import { icons, type IconName } from './icons';

	type Props = {
		name: IconName;
		className?: string;
		title?: string;
	};

	let { name, className = '', title }: Props = $props();
	let icon = $derived(icons[name]);
</script>

<svg
	viewBox={icon.viewBox}
	fill={icon.fill}
	class={className || undefined}
	aria-hidden={title ? undefined : 'true'}
	role={title ? 'img' : undefined}
>
	{#if title}<title>{title}</title>{/if}
	{#each icon.nodes as node}
		{#if node.tag === 'path'}
			<path
				d={node.d}
				fill={node.fill}
				opacity={node.opacity}
				stroke={node.stroke}
				stroke-width={node.strokeWidth}
				stroke-linecap={node.strokeLinecap}
				stroke-linejoin={node.strokeLinejoin}
				stroke-dasharray={node.strokeDasharray}
				transform={node.transform}
			/>
		{:else if node.tag === 'circle'}
			<circle
				cx={node.cx}
				cy={node.cy}
				r={node.r}
				fill={node.fill}
				opacity={node.opacity}
				stroke={node.stroke}
				stroke-width={node.strokeWidth}
				stroke-linecap={node.strokeLinecap}
				stroke-linejoin={node.strokeLinejoin}
				stroke-dasharray={node.strokeDasharray}
				transform={node.transform}
			/>
		{:else if node.tag === 'rect'}
			<rect
				x={node.x}
				y={node.y}
				width={node.width}
				height={node.height}
				rx={node.rx}
				fill={node.fill}
				opacity={node.opacity}
				stroke={node.stroke}
				stroke-width={node.strokeWidth}
				stroke-linecap={node.strokeLinecap}
				stroke-linejoin={node.strokeLinejoin}
				stroke-dasharray={node.strokeDasharray}
				transform={node.transform}
			/>
		{:else if node.tag === 'ellipse'}
			<ellipse
				cx={node.cx}
				cy={node.cy}
				rx={node.rx}
				ry={node.ry}
				fill={node.fill}
				opacity={node.opacity}
				stroke={node.stroke}
				stroke-width={node.strokeWidth}
				stroke-linecap={node.strokeLinecap}
				stroke-linejoin={node.strokeLinejoin}
				stroke-dasharray={node.strokeDasharray}
				transform={node.transform}
			/>
		{/if}
	{/each}
</svg>
