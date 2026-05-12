<script lang="ts">
	import TimelinePostCard from '$lib/components/TimelinePostCard.svelte';
	import type { SocialPost } from '$lib/social/types';
	import BrandMark from './BrandMark.svelte';
	import SignedOutAuthCard from './SignedOutAuthCard.svelte';

	const stats = [
		{ value: '12,847', label: 'Active accounts' },
		{ value: '94', label: 'Federated instances' },
		{ value: '3.2M', label: 'Posts this month' },
		{ value: '99.94%', label: 'Uptime, 90d' }
	];

	const posts: SocialPost[] = [
		{
			id: 'public-soft-css',
			name: 'soft.hertz',
			handle: '@soft.hertz@kolektiva.social',
			time: '8m',
			body: 'quiet CSS can still be expressive when the spacing carries the voice.',
			avatar: 'grad-3',
			replies: 4,
			boosts: 12,
			favorites: 28,
			actions: { reply: false, boost: false, favorite: false }
		},
		{
			id: 'public-fed-gardens',
			name: 'datagram',
			handle: '@datagram@retro.social',
			time: '21m',
			body: 'Federated timelines feel best when they preserve context without shouting about it.',
			avatar: 'pc',
			media: 'city',
			replies: 2,
			boosts: 7,
			favorites: 16,
			actions: { reply: false, boost: false, favorite: false }
		},
		{
			id: 'public-local-composer',
			name: 'nyan.binary',
			handle: '@nyan@catgirl.cloud',
			time: '42m',
			body: 'Local mutuals are comparing composer affordances and somehow the GIF button is winning.',
			avatar: 'orb',
			replies: 6,
			boosts: 4,
			favorites: 22,
			actions: { reply: false, boost: false, favorite: false }
		}
	];

	const trends = [
		{ tag: '#OutsideTime', count: '4,210 posts' },
		{ tag: '#smallweb', count: '2,847 posts' },
		{ tag: '#FedDevs', count: '1,394 posts' },
		{ tag: '#cassette', count: '982 posts' }
	];

	const instanceRows = [
		{ key: 'Domain', value: 'pleromanet.social' },
		{ key: 'Operator', value: '@ada and @felix' },
		{ key: 'Region', value: 'EU-West, Frankfurt' },
		{ key: 'Funding', value: 'Members, Patreon' },
		{ key: 'Open registration', value: 'Yes / reviewed', positive: true }
	];

	const rules = [
		{
			number: 'i.',
			title: 'Be a person, not a brand.',
			description: 'First-person voice. No engagement farming, no growth hacks.'
		},
		{
			number: 'ii.',
			title: 'Use content warnings.',
			description: "For news, politics, food, body talk. Your timeline is someone's morning coffee."
		},
		{
			number: 'iii.',
			title: 'Alt-text your images.',
			description: 'Everyone deserves to see your dog. The composer reminds you.'
		},
		{
			number: 'iv.',
			title: 'Disagree gently.',
			description: "If you would not say it across a table, do not post it across a network."
		}
	];
</script>

<div class="signedout">
	<header class="so-header">
		<div class="so-shell so-header-inner">
			<a class="brand" href="/" aria-label="PleromaNet home">
				<BrandMark />
				<span>
					<span class="brand-name">PleromaNet<sup>TM</sup></span>
				</span>
				<span class="brand-tag">A federated<br />social web</span>
			</a>

			<nav class="so-nav" aria-label="Landing">
				<a href="#manifesto">Manifesto</a>
				<a href="#instances">Instances</a>
				<a href="#apps">Apps</a>
				<a href="#support">Support</a>
			</nav>

			<div class="so-header-right">
				<a href="#public" class="so-link-sm">Browse public</a>
				<a href="#oauth" class="so-mini-cta">Sign in</a>
			</div>
		</div>
	</header>

	<main>
		<section class="so-hero" aria-labelledby="landing-title">
			<div class="so-shell">
				<div class="so-hero-grid">
					<div class="so-hero-copy">
						<div class="so-eyebrow">
							<span class="so-eyebrow-dot"></span>
							<span>Est. 2017 / Federated network / v2.4.58</span>
						</div>
						<h1 id="landing-title" class="so-h1">
							A <em>quieter</em> corner of the <span class="so-h1-accent">social web.</span>
						</h1>
						<p class="so-lede">
							PleromaNet is a federation of small, human-run servers. No algorithm, no ads,
							no scraping. You bring your voice; your server handles your account.
						</p>

						<div class="so-stats" aria-label="Network statistics">
							{#each stats as stat}
								<div class="so-stat">
									<div class="so-stat-v">{stat.value}</div>
									<div class="so-stat-l">{stat.label}</div>
								</div>
							{/each}
						</div>

						<a class="so-scroll-hint" href="#manifesto">
							<span>Read the manifesto</span>
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
						</a>
					</div>

					<SignedOutAuthCard />
				</div>
			</div>
		</section>

		<section id="manifesto" class="so-band" aria-label="PleromaNet manifesto">
			<div class="so-shell so-band-inner">
				<div class="so-band-item">
					<div class="so-band-num">01</div>
					<h2 class="so-band-t">No ads. No algorithm.</h2>
					<p class="so-band-d">A reverse-chronological timeline of the people you follow. That is it.</p>
				</div>
				<div class="so-band-sep"></div>
				<div class="so-band-item">
					<div class="so-band-num">02</div>
					<h2 class="so-band-t">You own your follows.</h2>
					<p class="so-band-d">Move servers and bring your social graph with you. ActivityPub all the way down.</p>
				</div>
				<div class="so-band-sep"></div>
				<div class="so-band-item">
					<div class="so-band-num">03</div>
					<h2 class="so-band-t">Run by humans.</h2>
					<p class="so-band-d">Real moderators with names and faces. Funded by members, not advertisers.</p>
				</div>
			</div>
		</section>

		<section id="public" class="so-peek" aria-labelledby="public-title">
			<div class="so-shell so-peek-inner">
				<div class="so-peek-head">
					<div>
						<p class="so-peek-eyebrow">A look inside</p>
						<h2 id="public-title" class="so-h2">The federated timeline, right now.</h2>
					</div>
					<div class="so-peek-meta">
						<span class="so-live-dot"></span>
						<span>Live / refreshed 12s ago</span>
					</div>
				</div>

				<div class="so-peek-grid">
					<div class="so-peek-feed pn-card">
						{#each posts as post (post.id)}
							<TimelinePostCard {post} />
						{/each}
						<div class="so-peek-mask">
							<a class="so-peek-cta" href="#oauth">Sign in to see more</a>
						</div>
					</div>

					<aside class="so-peek-side" aria-label="Network metadata">
						<div class="pn-card so-sidecard">
							<h3 class="so-side-h">What's trending</h3>
							{#each trends as trend, index}
								<div class="so-trend">
									<span class="so-trend-n">{String(index + 1).padStart(2, '0')}</span>
									<span>
										<span class="so-trend-t">{trend.tag}</span>
										<span class="so-trend-c">{trend.count}</span>
									</span>
								</div>
							{/each}
						</div>

						<div id="instances" class="pn-card so-sidecard so-instance-card">
							<h3 class="so-side-h">This instance</h3>
							{#each instanceRows as row}
								<div class="so-inst-row">
									<span class="so-inst-k">{row.key}</span>
									<span class="so-inst-v" class:so-yes={row.positive}>{row.value}</span>
								</div>
							{/each}
						</div>
					</aside>
				</div>
			</div>
		</section>

		<section id="rules" class="so-rules" aria-labelledby="rules-title">
			<div class="so-shell">
				<div class="so-rules-head">
					<div class="so-eyebrow">
						<span class="so-eyebrow-dot"></span>
						<span>The house rules</span>
					</div>
					<h2 id="rules-title" class="so-h2">Things we ask of each other.</h2>
				</div>

				<ol class="so-rules-list">
					{#each rules as rule}
						<li>
							<span class="so-rules-n">{rule.number}</span>
							<span>
								<span class="so-rules-t">{rule.title}</span>
								<span class="so-rules-d">{rule.description}</span>
							</span>
						</li>
					{/each}
				</ol>
			</div>
		</section>
	</main>

	<footer id="support" class="so-footer">
		<div class="so-shell so-footer-inner">
			<div class="so-foot-brand">
				<BrandMark />
				<div>
					<div class="brand-name brand-name--foot">PleromaNet<sup>TM</sup></div>
					<div class="so-foot-tag">A federated social web / est. 2017</div>
				</div>
			</div>

			<div class="so-foot-cols">
				<div>
					<h2 class="so-foot-h">Instance</h2>
					<a href="#instances">About</a>
					<a href="#rules">Server rules</a>
					<a href="#instances">Moderators</a>
					<a href="#instances">Status and uptime</a>
				</div>
				<div>
					<h2 class="so-foot-h">Network</h2>
					<a href="#instances">Browse instances</a>
					<a href="#manifesto">What is ActivityPub?</a>
					<a href="#apps">Developer API</a>
					<a href="#public">Federation log</a>
				</div>
				<div id="apps">
					<h2 class="so-foot-h">Apps</h2>
					<a href="#oauth">iOS TestFlight</a>
					<a href="#oauth">Android F-Droid</a>
					<a href="#oauth">CLI client</a>
					<a href="#oauth">RSS bridge</a>
				</div>
				<div>
					<h2 class="so-foot-h">Support</h2>
					<a href="#support">Member dues</a>
					<a href="#support">Patreon</a>
					<a href="#support">Donate once</a>
					<a href="#support">Merch shop</a>
				</div>
			</div>
		</div>

		<div class="so-shell so-foot-bottom">
			<span>2026 PleromaNet collective</span>
			<span class="so-foot-dot"></span>
			<span>Made with care in Frankfurt, Lisbon, and Mexico City</span>
			<span class="so-foot-dot"></span>
			<span class="so-foot-mono">v2.4.58 / build 8a1c2f</span>
		</div>
	</footer>
</div>

<style>
	.signedout {
		min-height: 100vh;
		background: var(--bg);
		color: var(--ink);
	}

	.so-shell {
		width: min(1200px, 100%);
		margin: 0 auto;
		padding: 0 32px;
	}

	.so-header {
		position: sticky;
		top: 0;
		z-index: 50;
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel) 94%, transparent);
		backdrop-filter: blur(16px);
	}

	.so-header-inner {
		display: flex;
		height: 64px;
		align-items: center;
		gap: 28px;
	}

	.brand,
	.so-foot-brand {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.brand-name {
		display: block;
		color: var(--ink);
		font-family: var(--serif);
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.brand-name sup {
		font-family: var(--mono);
		font-size: 8px;
		letter-spacing: 0.08em;
		margin-left: 1px;
	}

	.brand-name--foot {
		font-size: 20px;
	}

	.brand-tag {
		padding-left: 10px;
		border-left: 1px solid var(--border);
		color: var(--muted);
		font-family: var(--mono);
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.1em;
		line-height: 1.2;
		text-transform: uppercase;
	}

	.so-nav {
		display: flex;
		flex: 1;
		gap: 24px;
	}

	.so-nav a {
		border-bottom: 1px solid transparent;
		color: var(--ink-2);
		font-size: 13px;
		padding: 6px 2px;
	}

	.so-nav a:hover {
		border-bottom-color: var(--accent);
		color: var(--accent-ink);
	}

	.so-header-right {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-left: auto;
	}

	.so-link-sm {
		color: var(--muted);
		font-size: 12px;
		white-space: nowrap;
	}

	.so-link-sm:hover {
		color: var(--accent-ink);
	}

	.so-mini-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--ink);
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--panel);
		padding: 7px 14px;
		font-size: 12px;
		font-weight: 700;
		white-space: nowrap;
	}

	.so-mini-cta:hover {
		border-color: var(--accent-ink);
		background: var(--accent-ink);
	}

	.so-hero {
		position: relative;
		border-bottom: 1px solid var(--border);
		background:
			radial-gradient(circle at 12% 18%, var(--accent-soft-2), transparent 50%),
			radial-gradient(circle at 88% 30%, rgba(231, 168, 201, 0.18), transparent 55%),
			var(--bg);
		padding: 72px 0 88px;
		overflow: hidden;
	}

	.so-hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(var(--border) 1px, transparent 1px),
			linear-gradient(90deg, var(--border) 1px, transparent 1px);
		background-size: 64px 64px;
		opacity: 0.18;
		pointer-events: none;
	}

	.so-hero-grid {
		position: relative;
		display: grid;
		grid-template-columns: 1.15fr 1fr;
		align-items: start;
		gap: 64px;
	}

	.so-hero-copy {
		min-width: 0;
	}

	.so-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		background: var(--panel);
		color: var(--muted);
		padding: 6px 12px;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.so-eyebrow-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}

	.so-h1 {
		max-width: 720px;
		margin: 22px 0 24px;
		color: var(--ink);
		font-family: var(--serif);
		font-size: clamp(48px, 6vw, 84px);
		font-weight: 400;
		letter-spacing: -0.03em;
		line-height: 0.96;
	}

	.so-h1 em,
	.so-h1-accent {
		color: var(--accent-ink);
		font-style: italic;
	}

	.so-lede {
		max-width: 540px;
		margin: 0 0 36px;
		color: var(--ink-2);
		font-size: 18px;
		line-height: 1.55;
	}

	.so-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		margin: 0 0 28px;
		border-top: 1px solid var(--border-strong);
		border-bottom: 1px solid var(--border-strong);
	}

	.so-stat {
		border-right: 1px solid var(--border);
		padding: 16px 14px 14px;
	}

	.so-stat:last-child {
		border-right: 0;
	}

	.so-stat-v {
		color: var(--accent-ink);
		font-family: var(--serif);
		font-size: 28px;
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.so-stat-l {
		margin-top: 6px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 9px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.so-scroll-hint {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.so-scroll-hint svg {
		width: 12px;
		height: 12px;
		animation: soBounce 2s ease infinite;
	}

	.so-band {
		background: var(--ink);
		color: var(--panel);
		padding: 32px 0;
	}

	.so-band-inner {
		display: grid;
		grid-template-columns: 1fr auto 1fr auto 1fr;
		align-items: start;
		gap: 24px;
	}

	.so-band-sep {
		width: 1px;
		align-self: stretch;
		background: rgba(255, 255, 255, 0.15);
	}

	.so-band-num {
		margin-bottom: 8px;
		color: rgba(255, 255, 255, 0.5);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.18em;
	}

	.so-band-t {
		margin: 0 0 6px;
		font-family: var(--serif);
		font-size: 22px;
		font-weight: 400;
		line-height: 1.15;
	}

	.so-band-d {
		margin: 0;
		color: rgba(255, 255, 255, 0.7);
		font-size: 13px;
		line-height: 1.5;
	}

	.so-peek {
		border-bottom: 1px solid var(--border);
		padding: 88px 0;
	}

	.so-peek-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 32px;
		flex-wrap: wrap;
	}

	.so-peek-eyebrow {
		margin: 0 0 10px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.so-h2 {
		margin: 0;
		color: var(--ink);
		font-family: var(--serif);
		font-size: clamp(32px, 4vw, 48px);
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	.so-peek-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.so-live-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		animation: soLive 1.6s ease infinite;
		background: var(--good);
		box-shadow: 0 0 0 3px rgba(168, 213, 177, 0.25);
	}

	.so-peek-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		align-items: start;
		gap: 24px;
	}

	.so-peek-feed {
		position: relative;
		overflow: hidden;
	}

	.so-peek-mask {
		position: absolute;
		inset: auto 0 0;
		display: flex;
		height: 180px;
		align-items: end;
		justify-content: center;
		background: linear-gradient(180deg, transparent, var(--panel) 70%);
		padding-bottom: 24px;
	}

	.so-peek-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--ink);
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--panel);
		padding: 12px 24px;
		font-size: 13px;
		font-weight: 700;
	}

	.so-peek-cta:hover {
		border-color: var(--accent-ink);
		background: var(--accent-ink);
	}

	.so-peek-side {
		display: grid;
		gap: 16px;
	}

	.so-sidecard {
		padding: 18px 18px 14px;
	}

	.so-side-h {
		margin: 0 0 14px;
		border-bottom: 1px solid var(--border);
		color: var(--muted);
		font-family: var(--mono);
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		padding-bottom: 10px;
		text-transform: uppercase;
	}

	.so-trend {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
	}

	.so-trend-n {
		min-width: 30px;
		color: var(--accent-ink);
		font-family: var(--serif);
		font-size: 22px;
		line-height: 1;
	}

	.so-trend-t,
	.so-trend-c {
		display: block;
	}

	.so-trend-t {
		color: var(--ink);
		font-size: 13.5px;
		font-weight: 600;
	}

	.so-trend-c {
		margin-top: 2px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 10px;
	}

	.so-instance-card .so-side-h {
		margin-bottom: 8px;
	}

	.so-inst-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		border-bottom: 1px dashed var(--border);
		padding: 8px 0;
		font-size: 12px;
	}

	.so-inst-row:last-child {
		border-bottom: 0;
	}

	.so-inst-k {
		color: var(--muted);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.so-inst-v {
		color: var(--ink);
		text-align: right;
	}

	.so-yes {
		color: var(--good-ink);
		font-weight: 700;
	}

	.so-rules {
		border-bottom: 1px solid var(--border);
		background: var(--panel);
		padding: 88px 0;
	}

	.so-rules-head {
		max-width: 700px;
		margin-bottom: 40px;
	}

	.so-rules-head .so-h2 {
		margin-top: 10px;
	}

	.so-rules-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 28px 56px;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.so-rules-list li {
		display: flex;
		gap: 18px;
		border-top: 1px solid var(--border-strong);
		padding-top: 18px;
	}

	.so-rules-n {
		min-width: 28px;
		color: var(--accent-ink);
		font-family: var(--serif);
		font-size: 24px;
		font-style: italic;
		line-height: 1;
	}

	.so-rules-t,
	.so-rules-d {
		display: block;
	}

	.so-rules-t {
		margin-bottom: 6px;
		color: var(--ink);
		font-family: var(--serif);
		font-size: 22px;
		line-height: 1.15;
	}

	.so-rules-d {
		color: var(--ink-2);
		font-size: 14px;
		line-height: 1.55;
	}

	.so-footer {
		background: var(--bg);
		padding: 64px 0 28px;
	}

	.so-footer-inner {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 48px;
		margin-bottom: 20px;
		border-bottom: 1px solid var(--border-strong);
		padding-bottom: 40px;
	}

	.so-foot-brand {
		align-items: flex-start;
	}

	.so-foot-tag {
		margin-top: 4px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.so-foot-cols {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 24px;
	}

	.so-foot-h {
		margin: 0 0 10px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.so-foot-cols a {
		display: block;
		color: var(--ink-2);
		font-size: 13px;
		padding: 4px 0;
	}

	.so-foot-cols a:hover {
		color: var(--accent-ink);
	}

	.so-foot-bottom {
		display: flex;
		align-items: center;
		gap: 12px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.08em;
		flex-wrap: wrap;
	}

	.so-foot-dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--muted-2);
	}

	.so-foot-mono {
		color: var(--muted-2);
	}

	@keyframes soBounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(3px);
		}
	}

	@keyframes soLive {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	@media (max-width: 980px) {
		.so-hero {
			padding: 48px 0 56px;
		}

		.so-hero-grid,
		.so-peek-grid,
		.so-band-inner,
		.so-footer-inner {
			grid-template-columns: 1fr;
		}

		.so-hero-grid {
			gap: 36px;
		}

		.so-band-sep {
			display: none;
		}

		.so-rules-list {
			grid-template-columns: 1fr;
			gap: 22px;
		}

		.so-foot-cols {
			grid-template-columns: 1fr 1fr;
		}

		.so-nav {
			display: none;
		}

		.so-stats {
			grid-template-columns: 1fr 1fr;
		}

		.so-stat:nth-child(2) {
			border-right: 0;
		}

		.so-stat:nth-child(1),
		.so-stat:nth-child(2) {
			border-bottom: 1px solid var(--border);
		}
	}

	@media (max-width: 720px) {
		.so-header-inner {
			height: auto;
			min-height: 62px;
			gap: 12px;
			padding-top: 8px;
			padding-bottom: 8px;
		}

		.brand-tag {
			display: none;
		}

		.brand-name {
			font-size: 20px;
		}

		.so-header-right {
			gap: 10px;
		}

		.so-mini-cta {
			padding-inline: 10px;
		}
	}

	@media (max-width: 560px) {
		.so-shell {
			padding: 0 18px;
		}

		.so-hero {
			padding: 40px 0 48px;
		}

		.so-h1 {
			font-size: clamp(46px, 16vw, 64px);
		}

		.so-lede {
			font-size: 16px;
		}

		.so-rules,
		.so-peek {
			padding: 48px 0;
		}

		.so-footer {
			padding: 40px 0 20px;
		}

		.so-foot-cols {
			grid-template-columns: 1fr;
		}

		.so-foot-bottom {
			align-items: flex-start;
			flex-direction: column;
			gap: 8px;
		}

		.so-foot-dot {
			display: none;
		}
	}
</style>
