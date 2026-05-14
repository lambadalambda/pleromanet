<script lang="ts">
	import Button from '$lib/rebuild/Button.svelte';
	import Icon from '$lib/rebuild/Icon.svelte';
	import Pill from '$lib/rebuild/Pill.svelte';
	import Seg from '$lib/rebuild/Seg.svelte';
	import Tag from '$lib/rebuild/Tag.svelte';
	import Toggle from '$lib/rebuild/Toggle.svelte';
	import { iconNames } from '$lib/rebuild/icons';
	import { onMount } from 'svelte';

	type ThemeId = 'cream' | 'dusk' | 'drive' | 'simoun';
	type Theme = {
		id: ThemeId;
		label: string;
		bg: string;
		panel: string;
		ink: string;
		accent: string;
	};
	type Section = {
		id: string;
		label: string;
	};
	type ColorToken = {
		name: string;
		value: string;
		ink?: boolean;
	};
	type TypeRow = {
		family: string;
		sample: string;
		meta: string;
	};
	const THEMES: Theme[] = [
		{ id: 'cream', label: 'Cream', bg: '#f5f1e8', panel: '#fbfaf3', ink: '#1f2347', accent: '#a48bd9' },
		{ id: 'dusk', label: 'Dusk', bg: '#1a1538', panel: '#2a1f4a', ink: '#e8e2f5', accent: '#e7a8c9' },
		{ id: 'drive', label: 'Drive', bg: '#070719', panel: '#0c0c2a', ink: '#e0e6f0', accent: '#7dc4be' },
		{ id: 'simoun', label: 'Simoun', bg: '#141b36', panel: '#1c2547', ink: '#f4ebd8', accent: '#e8763a' }
	];

	const SECTIONS: Section[] = [
		{ id: 'foundations', label: 'Foundations' },
		{ id: 'iconography', label: 'Iconography' },
		{ id: 'controls', label: 'Controls' },
		{ id: 'forms', label: 'Forms' },
		{ id: 'avatars', label: 'Avatars' },
		{ id: 'attachments', label: 'Attachments' },
		{ id: 'composer', label: 'Composer' },
		{ id: 'posts', label: 'Posts' },
		{ id: 'thread', label: 'Thread' },
		{ id: 'notifications', label: 'Notifications' },
		{ id: 'radio', label: 'Radio' },
		{ id: 'oekaki', label: 'Oekaki' },
		{ id: 'surfaces', label: 'Surfaces' },
		{ id: 'navigation', label: 'Navigation' },
		{ id: 'mobile', label: 'Mobile' }
	];

	const colorTokens: ColorToken[] = [
		{ name: '--bg', value: 'page' },
		{ name: '--panel', value: 'cards' },
		{ name: '--panel-2', value: 'raised' },
		{ name: '--border', value: 'default' },
		{ name: '--border-strong', value: 'emphasis' },
		{ name: '--ink', value: 'primary text', ink: true },
		{ name: '--ink-2', value: 'secondary text', ink: true },
		{ name: '--muted', value: 'captions', ink: true },
		{ name: '--muted-2', value: 'weakest', ink: true },
		{ name: '--accent', value: 'brand' },
		{ name: '--accent-ink', value: 'brand-text', ink: true },
		{ name: '--accent-soft', value: 'hover/sel' },
		{ name: '--accent-soft-2', value: 'softest' }
	];

	const typeRows: TypeRow[] = [
		{ family: 'var(--serif)', sample: 'Soft hertz, slow web', meta: '--serif · Cormorant Garamond · headings, brand wordmark' },
		{ family: 'var(--sans)', sample: 'The quick brown fox jumps over the lazy dog.', meta: '--sans · Inter · body, UI' },
		{ family: 'var(--mono)', sample: 'PLEROMANET / v2.4.58 / @dreambyte@pleromanet.social', meta: '--mono · JetBrains Mono · captions, eyebrows, technical' }
	];

	const isThemeId = (value: string | null): value is ThemeId => THEMES.some((themeOption) => themeOption.id === value);

	const applyTheme = (nextTheme: ThemeId) => {
		document.body.dataset.theme = nextTheme;
		document.documentElement.dataset.theme = nextTheme;
	};

	let theme = $state<ThemeId>('cream');
	let section = $state('foundations');
	let mounted = $state(false);
	let toggleOn = $state(true);
	let segValue = $state('Popular');
	let toggleRowOn = $state(true);

	onMount(() => {
		const storedTheme = localStorage.getItem('pn-theme');
		if (isThemeId(storedTheme)) theme = storedTheme;
		mounted = true;
		applyTheme(theme);
	});

	$effect(() => {
		if (!mounted) return;
		applyTheme(theme);
		localStorage.setItem('pn-theme', theme);
	});
</script>

<svelte:head>
	<title>PleromaNet · Design System</title>
</svelte:head>

<div class="ds-page">
	<header class="ds-header">
		<div class="ds-header-l">
			<div class="brand">
				<div class="brand-mark" aria-hidden="true">
					<svg viewBox="0 0 32 32" fill="none">
						<path d="M16 3v9M16 20v9M3 16h9M20 16h9M7 7l5 5M20 20l5 5M25 7l-5 5M12 20l-5 5" stroke="#dcd1f0" stroke-width="1.4" stroke-linecap="round" />
						<circle cx="16" cy="16" r="2" fill="#dcd1f0" />
					</svg>
				</div>
				<div>
					<div class="brand-name ds-brand-title">PleromaNet<sup>™</sup></div>
					<div class="ds-brand-subtitle">Design system · v2.4.58</div>
				</div>
			</div>
		</div>
		<div class="ds-header-r">
			<div class="ds-theme-picker" aria-label="Theme picker">
				{#each THEMES as themeOption}
					<button
						type="button"
						class:active={theme === themeOption.id}
						class="ds-theme-chip"
						onclick={() => (theme = themeOption.id)}
						aria-pressed={theme === themeOption.id}
					>
						<span class="ds-theme-swatch" style={`background: ${themeOption.bg}; border-color: ${themeOption.panel};`}>
							<span style={`background: ${themeOption.accent};`}></span>
							<span style={`background: ${themeOption.ink};`}></span>
						</span>
						<span>{themeOption.label}</span>
					</button>
				{/each}
			</div>
			<a class="ds-app-link" href="PleromaNet.html">Open app →</a>
		</div>
	</header>

	<div class="ds-body">
		<aside class="ds-nav">
			<div class="ds-nav-label">Contents</div>
			{#each SECTIONS as navSection}
				<a
					href={`#${navSection.id}`}
					class:active={section === navSection.id}
					class="ds-nav-item"
					onclick={() => (section = navSection.id)}
				>
					{navSection.label}
				</a>
			{/each}
			<div class="ds-nav-foot">
				<div>0 shared primitives</div>
				<div>4 themes</div>
			</div>
		</aside>

		<main class="ds-main">
			<section id="foundations" class="ds-slab">
				<header class="ds-slab-head">
					<div class="ds-kicker">01</div>
					<h2 class="ds-h2">Foundations</h2>
					<p class="ds-sub">Tokens, palette and type. Everything else is composed from these.</p>
				</header>
				<div class="ds-slab-body">
					<div class="ds-sub-h">Color tokens</div>
					<div class="ds-tok-grid">
						{#each colorTokens as token}
							<div class="ds-tok">
								<div class="ds-tok-swatch" style={`background: var(${token.name});${token.ink ? ` color: var(${token.name});` : ''}`}>
									{#if token.ink}<span>Aa</span>{/if}
								</div>
								<div class="ds-tok-meta">
									<div class="ds-tok-name">{token.name}</div>
									<div class="ds-tok-val">{token.value}</div>
								</div>
							</div>
						{/each}
					</div>

					<div class="ds-sub-h">Type</div>
					<div class="ds-type-stack">
						{#each typeRows as row}
							<div class="ds-type-row">
								<div class="ds-type-sample" style={`font-family: ${row.family};`}>{row.sample}</div>
								<div class="ds-type-meta">{row.meta}</div>
							</div>
						{/each}
					</div>

					<div class="ds-sub-h">Themes</div>
					<div class="ds-grid ds-grid-4">
						{#each THEMES as themeOption}
							<div class="ds-theme-card" style={`background: ${themeOption.bg}; color: ${themeOption.ink}; border-color: ${themeOption.panel};`}>
								<div class="ds-theme-card-head" style={`background: ${themeOption.panel}; border-bottom-color: ${themeOption.accent}33;`}>
									<div class="ds-theme-card-title">{themeOption.label}</div>
									<div class="ds-theme-card-sub" style={`color: ${themeOption.accent};`}>theme · {themeOption.id}</div>
								</div>
								<div class="ds-theme-card-swatches">
									<span style={`background: ${themeOption.bg}; border-color: ${themeOption.accent}33;`}></span>
									<span style={`background: ${themeOption.panel};`}></span>
									<span style={`background: ${themeOption.ink};`}></span>
									<span style={`background: ${themeOption.accent};`}></span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<section id="iconography" class="ds-slab">
				<header class="ds-slab-head">
					<div class="ds-kicker">02</div>
					<h2 class="ds-h2">Iconography</h2>
					<p class="ds-sub">One stroke weight (1.5–1.6), one corner style, currentColor on stroke. Imported from icons.jsx as the `I` namespace.</p>
				</header>
				<div class="ds-slab-body">
					<div class="ds-icon-grid">
						{#each iconNames as iconName (iconName)}
							<div class="ds-icon-cell">
								<div class="ds-icon-box"><Icon name={iconName} className="ds-icon-svg" /></div>
								<div class="ds-icon-name">I.{iconName}</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<section id="controls" class="ds-slab">
				<header class="ds-slab-head">
					<div class="ds-kicker">03</div>
					<h2 class="ds-h2">Controls</h2>
					<p class="ds-sub">Buttons, pills, tabs and segmented switches.</p>
				</header>
				<div class="ds-slab-body">
					<div class="ds-grid ds-grid-3">
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<div class="ds-row">
									<Button variant="primary">Post</Button>
									<Button variant="primary" disabled>Disabled</Button>
								</div>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Button · primary</span>
								<span class="ds-spec-note">btn-primary</span>
							</div>
						</div>
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<Button variant="secondary">Reset</Button>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Button · secondary</span>
								<span class="ds-spec-note">btn-secondary</span>
							</div>
						</div>
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<div class="ds-row">
									<Button variant="follow">Follow</Button>
									<Button variant="follow" className="following">Following</Button>
								</div>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Button · follow</span>
								<span class="ds-spec-note">btn-follow · btn-follow.following</span>
							</div>
						</div>
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<Button variant="upload">
									<span>Change avatar</span>
									<Icon name="upload" className="ds-spec-icon-sm" />
								</Button>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Button · upload</span>
								<span class="ds-spec-note">btn-upload</span>
							</div>
						</div>
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<div class="ds-row">
									<Pill>All systems normal</Pill>
									<Pill>3 new</Pill>
								</div>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Pill</span>
								<span class="ds-spec-note">pill</span>
							</div>
						</div>
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<div class="ds-row">
									<Tag>#fediverse</Tag>
									<Tag>#privacy</Tag>
									<Tag>#vaporwave</Tag>
								</div>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Tag</span>
								<span class="ds-spec-note">tag</span>
							</div>
						</div>
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<div class="tabs" style="border-radius: 4px; overflow: hidden;">
									<button type="button" class="tab active">Home</button>
									<button type="button" class="tab">Local</button>
									<button type="button" class="tab">Federated</button>
									<div class="tab-spacer"></div>
									<button type="button" class="tab-action"><Icon name="sliders" className="ds-spec-icon-sm" /></button>
								</div>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Tabs</span>
								<span class="ds-spec-note">.tabs > .tab · .tabs > .tab.active</span>
							</div>
						</div>
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<Seg options={['Popular', 'New', 'Active']} value={segValue} onchange={(v) => (segValue = v)} />
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Segmented</span>
								<span class="ds-spec-note">.seg</span>
							</div>
						</div>
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<div class="ds-row" style="align-items: center;">
									<Toggle checked={toggleOn} onchange={(v) => (toggleOn = v)} />
									<span class="ds-toggle-label">{toggleOn ? 'ON' : 'OFF'}</span>
								</div>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Toggle</span>
								<span class="ds-spec-note">.toggle · .toggle.on</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section id="forms" class="ds-slab">
				<header class="ds-slab-head">
					<div class="ds-kicker">04</div>
					<h2 class="ds-h2">Forms</h2>
					<p class="ds-sub">Inputs, textareas, selects, and the toggle row pattern.</p>
				</header>
				<div class="ds-slab-body">
					<div class="ds-grid ds-grid-2">
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<input class="input" value="dreambyte" />
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Input</span>
								<span class="ds-spec-note">.input</span>
							</div>
						</div>
						<div class="ds-spec">
							<div class="ds-spec-stage padded">
								<select class="select">
									<option>@pleromanet.social</option>
									<option>@kolektiva.social</option>
								</select>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Select</span>
								<span class="ds-spec-note">.select</span>
							</div>
						</div>
						<div class="ds-spec ds-spec-span-2">
							<div class="ds-spec-stage padded">
								<div class="split-row">
									<input class="input" value="dreambyte" />
									<select class="select"><option>@pleromanet.social</option></select>
								</div>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Split row</span>
								<span class="ds-spec-note">.split-row</span>
							</div>
						</div>
						<div class="ds-spec ds-spec-span-2">
							<div class="ds-spec-stage padded">
								<textarea class="textarea">living in a soft world</textarea>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Textarea</span>
								<span class="ds-spec-note">.textarea</span>
							</div>
						</div>
						<div class="ds-spec ds-spec-span-2">
							<div class="ds-spec-stage padded">
								<div class="toggle-row">
									<div>
										<div class="toggle-title">Discoverable</div>
										<div class="toggle-help">Allow others to find you in search and suggestions.</div>
									</div>
									<Toggle checked={toggleRowOn} onchange={(v) => (toggleRowOn = v)} />
								</div>
							</div>
							<div class="ds-spec-foot">
								<span class="ds-spec-label">Toggle row</span>
								<span class="ds-spec-note">.toggle-row — used in settings</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<footer class="ds-foot">
				<div>End of system · everything else is composed from what's above.</div>
				<div>PleromaNet™ Design System · v2.4.58 · {new Date().getFullYear()}</div>
			</footer>
		</main>
	</div>
</div>

<style>
	.ds-page {
		min-height: 100vh;
		background: var(--bg);
		color: var(--ink);
		font-family: var(--sans);
	}

	/* ===== Header ===== */
	.ds-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 32px;
		background: var(--panel);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.brand-mark {
		width: 48px;
		height: 48px;
		background: #1c2046;
		border-radius: 4px;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}

	.brand-mark svg {
		width: 30px;
		height: 30px;
	}

	.brand-name {
		font-family: var(--serif);
		font-size: 32px;
		font-weight: 500;
		letter-spacing: -0.01em;
		color: var(--ink);
		line-height: 1;
		position: relative;
		display: inline-block;
	}

	.brand-name sup {
		font-family: var(--sans);
		font-size: 10px;
		font-weight: 500;
		color: var(--muted);
		margin-left: 2px;
		vertical-align: super;
	}

	.ds-header .brand-mark {
		width: 44px;
		height: 44px;
	}

	.ds-header .brand-mark svg {
		width: 28px;
		height: 28px;
	}

	.ds-brand-title {
		font-size: 26px;
	}

	.ds-brand-subtitle {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
		margin-top: 2px;
	}

	.ds-header-r {
		display: flex;
		align-items: center;
		gap: 18px;
	}

	.ds-app-link {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent-ink);
		padding: 8px 12px;
		border: 1px solid var(--border);
		border-radius: 2px;
		background: var(--bg);
		transition: background 0.15s, color 0.15s;
	}

	.ds-app-link:hover {
		background: var(--accent-soft);
	}

	.ds-theme-picker {
		display: flex;
		gap: 6px;
		padding: 4px;
		border: 1px solid var(--border);
		border-radius: 2px;
		background: var(--bg);
	}

	.ds-theme-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 8px 4px 5px;
		font-family: var(--mono);
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		border-radius: 2px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.ds-theme-chip:hover {
		color: var(--ink);
	}

	.ds-theme-chip.active {
		background: var(--accent-soft);
		color: var(--accent-ink);
	}

	.ds-theme-swatch {
		position: relative;
		width: 22px;
		height: 22px;
		border-radius: 2px;
		border: 1px solid var(--border-strong);
		display: block;
		overflow: hidden;
	}

	.ds-theme-swatch span:nth-child(1) {
		position: absolute;
		inset: auto 0 0 0;
		height: 50%;
		display: block;
	}

	.ds-theme-swatch span:nth-child(2) {
		position: absolute;
		inset: 0 50% 50% 0;
		display: block;
		opacity: 0.4;
	}

	/* ===== Layout ===== */
	.ds-body {
		display: grid;
		grid-template-columns: 220px 1fr;
		max-width: 1440px;
		margin: 0 auto;
	}

	.ds-nav {
		position: sticky;
		top: 80px;
		align-self: start;
		padding: 32px 0 32px 32px;
		display: flex;
		flex-direction: column;
		gap: 1px;
		max-height: calc(100vh - 80px);
		overflow-y: auto;
	}

	.ds-nav-label {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--muted-2);
		margin-bottom: 12px;
		padding: 0 12px;
	}

	.ds-nav-item {
		display: block;
		padding: 7px 12px;
		font-size: 13px;
		color: var(--ink-2);
		border-left: 1px solid var(--border);
		transition: background 0.12s, color 0.12s, border-color 0.12s;
	}

	.ds-nav-item:hover {
		background: var(--accent-soft-2);
		color: var(--ink);
	}

	.ds-nav-item.active {
		color: var(--accent-ink);
		border-left-color: var(--accent);
		background: var(--accent-soft-2);
	}

	.ds-nav-foot {
		margin-top: 24px;
		padding: 12px;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		color: var(--muted-2);
		border-top: 1px solid var(--border);
		display: grid;
		gap: 4px;
	}

	.ds-main {
		padding: 32px 48px 80px;
		min-width: 0;
	}

	/* ===== Slab ===== */
	.ds-slab {
		padding-top: 16px;
		padding-bottom: 56px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 32px;
		scroll-margin-top: 90px;
	}

	.ds-slab:last-of-type {
		border-bottom: none;
	}

	.ds-slab-head {
		margin-bottom: 24px;
		max-width: 720px;
	}

	.ds-kicker {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--accent-ink);
		margin-bottom: 8px;
	}

	.ds-h2 {
		font-family: var(--serif);
		font-weight: 500;
		font-size: 36px;
		line-height: 1.05;
		letter-spacing: -0.02em;
		margin: 0;
		color: var(--ink);
	}

	.ds-sub {
		font-size: 14px;
		line-height: 1.55;
		color: var(--ink-2);
		margin: 10px 0 0;
		max-width: 60ch;
		text-wrap: pretty;
	}

	.ds-sub-h {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--muted);
		margin: 28px 0 14px;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border);
	}

	.ds-sub-h:first-child {
		margin-top: 0;
	}

	/* ===== Grid ===== */
	.ds-grid {
		display: grid;
		gap: 18px;
	}

	:global(.ds-grid-2) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	:global(.ds-grid-3) {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.ds-grid-4 {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	/* ===== Color tokens ===== */
	.ds-tok-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		gap: 8px;
	}

	.ds-tok {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		border: 1px solid var(--border);
		background: var(--panel);
		border-radius: 2px;
	}

	.ds-tok-swatch {
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		border-radius: 2px;
		border: 1px solid var(--border);
		display: grid;
		place-items: center;
		font-family: var(--serif);
		font-size: 22px;
		line-height: 1;
	}

	.ds-tok-meta {
		min-width: 0;
	}

	.ds-tok-name {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.04em;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ds-tok-val {
		font-size: 10.5px;
		color: var(--muted);
		margin-top: 2px;
	}

	/* ===== Type ===== */
	.ds-type-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.ds-type-row {
		padding: 18px 20px;
		border: 1px solid var(--border);
		background: var(--panel);
		border-radius: 2px;
	}

	.ds-type-sample {
		font-size: 32px;
		line-height: 1.15;
		color: var(--ink);
		margin-bottom: 8px;
		letter-spacing: -0.01em;
	}

	.ds-type-meta {
		font-family: var(--mono);
		font-size: 10.5px;
		letter-spacing: 0.08em;
		color: var(--muted);
		text-transform: uppercase;
	}

	/* ===== Theme cards ===== */
	.ds-theme-card {
		border: 1px solid;
		border-radius: 2px;
		overflow: hidden;
		min-height: 110px;
	}

	.ds-theme-card-head {
		padding: 10px 12px;
		border-bottom: 1px solid;
	}

	.ds-theme-card-title {
		font-family: var(--serif);
		font-size: 20px;
		line-height: 1;
	}

	.ds-theme-card-sub {
		font-family: var(--mono);
		font-size: 9px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		margin-top: 4px;
	}

	.ds-theme-card-swatches {
		padding: 12px;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}

	.ds-theme-card-swatches span {
		height: 28px;
		border: 0;
	}

	.ds-theme-card-swatches span:first-child {
		border: 1px solid;
	}

	/* ===== Icon gallery ===== */
	.ds-icon-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 8px;
	}

	.ds-icon-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 14px 8px 10px;
		border: 1px solid var(--border);
		background: var(--panel);
		border-radius: 2px;
	}

	.ds-icon-box {
		width: 40px;
		height: 40px;
		border: 1px solid var(--border);
		background: var(--bg);
		display: grid;
		place-items: center;
		color: var(--ink);
		border-radius: 2px;
	}

	:global(.ds-icon-svg) {
		width: 20px;
		height: 20px;
	}

	:global(.ds-spec-icon-sm) {
		width: 14px;
		height: 14px;
	}

	.ds-spec {
		border: 1px solid var(--border);
		background: var(--panel);
		display: flex;
		flex-direction: column;
		border-radius: 2px;
		overflow: hidden;
	}

	:global(.ds-spec-span-2) {
		grid-column: span 2;
	}

	.ds-spec-stage {
		flex: 1;
		background:
			repeating-linear-gradient(45deg, transparent 0, transparent 12px, rgba(0,0,0,0.02) 12px, rgba(0,0,0,0.02) 13px);
		display: flex;
		align-items: stretch;
		justify-content: center;
		min-height: 100px;
	}

	.ds-spec-stage.padded {
		padding: 24px;
		align-items: center;
	}

	.ds-spec-foot {
		padding: 8px 12px;
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		background: var(--panel-2);
	}

	.ds-spec-label {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.06em;
		color: var(--ink);
	}

	.ds-spec-note {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.04em;
		color: var(--muted);
	}

	:global(.ds-row) {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		align-items: flex-start;
	}

	.ds-toggle-label {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--muted);
	}

	.ds-icon-name {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.04em;
		color: var(--muted);
	}

	.ds-foot {
		margin-top: 40px;
		padding-top: 32px;
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted-2);
	}

	/* ===== Responsive nav collapse ===== */
	@media (max-width: 1100px) {
		.ds-grid-4 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		:global(.ds-grid-3) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 900px) {
		.ds-body {
			grid-template-columns: 1fr;
		}

		.ds-nav {
			position: static;
			flex-direction: row;
			overflow-x: auto;
			max-height: none;
			padding: 12px 16px;
			gap: 4px;
			border-bottom: 1px solid var(--border);
		}

		.ds-nav-label,
		.ds-nav-foot {
			display: none;
		}

		.ds-nav-item {
			border-left: none;
			border-bottom: 2px solid transparent;
			white-space: nowrap;
			padding: 6px 10px;
		}

		.ds-nav-item.active {
			border-left: none;
			border-bottom-color: var(--accent);
		}

		.ds-main {
			padding: 24px 20px 60px;
		}

		.ds-header {
			padding: 14px 18px;
		}
	}

	@media (max-width: 720px) {
		.ds-header {
			align-items: flex-start;
			flex-direction: column;
			gap: 14px;
		}

		.ds-header-r {
			width: 100%;
			align-items: stretch;
			flex-direction: column;
			gap: 10px;
		}

		.ds-theme-picker {
			overflow-x: auto;
		}

		.ds-app-link {
			width: max-content;
		}

		.ds-grid-4,
		:global(.ds-grid-3),
		:global(.ds-grid-2) {
			grid-template-columns: 1fr;
		}

		.ds-type-sample {
			font-size: 26px;
		}

		.ds-foot {
			flex-direction: column;
			gap: 8px;
		}
	}
</style>
