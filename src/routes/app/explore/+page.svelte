<script lang="ts">
	type DiscoverFeed = 'popular' | 'new' | 'active';

	const exploreTags = ['#fediverse', '#pleroma', '#vaporwave', '#selfhosted', '#indieweb'];
	const curatedTopics = [
		{ id: 'fediverse', title: 'Federated calm', tag: '#fediverse', posts: '12.4K posts', tone: 'sunset' },
		{ id: 'vaporwave', title: 'Vaporwave web', tag: '#vaporwave', posts: '3,901 posts', tone: 'city' },
		{ id: 'selfhosted', title: 'Self-hosted notes', tag: '#selfhosted', posts: '2,844 posts', tone: 'grid' }
	] as const;
	const featuredCommunities = [
		{
			id: 'css-garden',
			name: 'Federated CSS Garden',
			description: 'Quiet front-end experiments, soft layouts, and hand-rolled interface details.',
			members: '8.2K members',
			tone: 'window'
		},
		{
			id: 'packet-radio',
			name: 'Packet Radio Club',
			description: 'Instance operators trading notes on moderation, mail, storage, and uptime.',
			members: '4.7K members',
			tone: 'signal'
		},
		{
			id: 'soft-archive',
			name: 'Soft Archive',
			description: 'A reading room for old blogs, personal sites, zines, and low-noise links.',
			members: '2.1K members',
			tone: 'archive'
		}
	] as const;
	const discoverFeedTabs: Array<{ id: DiscoverFeed; label: string }> = [
		{ id: 'popular', label: 'Popular' },
		{ id: 'new', label: 'New' },
		{ id: 'active', label: 'Active' }
	];
	const discoverFeeds: Record<DiscoverFeed, Array<{ id: string; title: string; meta: string; body: string }>> = {
		popular: [
			{
				id: 'popular-friendly',
				title: 'Popular across friendly instances',
				meta: '1.8K boosts · 34 instances',
				body: 'A long thread about keeping social clients quiet, local-first, and readable on older hardware.'
			},
			{
				id: 'popular-css',
				title: 'CSS without shouting',
				meta: '734 favorites · design',
				body: 'Interface screenshots with fewer boxes, calmer affordances, and better source links.'
			}
		],
		new: [
			{
				id: 'new-dispatches',
				title: 'Fresh instance dispatches',
				meta: 'Just now · local firehose',
				body: 'New arrivals from small instances: release notes, garden logs, and Saturday maintenance windows.'
			},
			{
				id: 'new-zines',
				title: 'New zine uploads',
				meta: '6m · media',
				body: 'A wave of self-published PDFs, web zines, and personal catalogs from the outer timeline.'
			}
		],
		active: [
			{
				id: 'active-replied',
				title: 'Most replied threads',
				meta: '422 replies · active now',
				body: 'Moderators and designers are comparing how much context a timeline preview should preserve.'
			},
			{
				id: 'active-ops',
				title: 'Instance operator roundtable',
				meta: '118 replies · ops',
				body: 'Backups, upload limits, and how to document federation policy without writing a novel.'
			}
		]
	};

	let exploreSearch = $state('');
	let activeDiscoverFeed = $state<DiscoverFeed>('popular');
	let joinedCommunities = $state<Record<string, boolean>>({});
	const activeDiscoverItems = $derived(discoverFeeds[activeDiscoverFeed]);

	const toggleCommunityJoin = (id: string) => {
		joinedCommunities = { ...joinedCommunities, [id]: !joinedCommunities[id] };
	};
</script>

<svelte:head><title>PleromaNet · Explore</title></svelte:head>

<div class="explore-view" data-testid="explore-view">
	<section class="pn-card explore-hero" aria-labelledby="explore-title">
		<div class="explore-artwork" data-testid="explore-artwork" aria-hidden="true">
			<span class="explore-planet"></span>
			<span class="explore-comet explore-comet--one"></span>
			<span class="explore-comet explore-comet--two"></span>
		</div>
		<div class="explore-hero__copy">
			<p class="pn-kicker">Network discovery</p>
			<h1 id="explore-title">Explore the network</h1>
			<p>
				Find local topics, neighboring communities, and the threads carrying across the federated
				timeline without leaving the calm shell.
			</p>
		</div>

		<label class="explore-search">
			<span>Search</span>
			<input
				type="search"
				aria-label="Search topics, people, and posts"
				placeholder="Search topics, people, and posts"
				bind:value={exploreSearch}
			/>
		</label>

		<div class="explore-tags" aria-label="Suggested tags">
			{#each exploreTags as tag}
				<button type="button">{tag}</button>
			{/each}
		</div>
	</section>

	<section class="explore-section" aria-labelledby="explore-topics-title">
		<div class="section-head">
			<div>
				<p class="pn-kicker">Curated topics</p>
				<h2 id="explore-topics-title">Start with a mood</h2>
			</div>
			<span class="pn-pill">Mocked data</span>
		</div>
		<div class="topic-grid">
			{#each curatedTopics as topic}
				<article class="pn-card topic-card" data-testid="explore-topic-card">
					<div class={`topic-thumb topic-thumb--${topic.tone}`} aria-hidden="true"></div>
					<div class="topic-card__body">
						<span>{topic.tag}</span>
						<h3>{topic.title}</h3>
						<p>{topic.posts}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="explore-section" aria-labelledby="explore-communities-title">
		<div class="section-head">
			<div>
				<p class="pn-kicker">Featured communities</p>
				<h2 id="explore-communities-title">Rooms worth visiting</h2>
			</div>
		</div>
		<div class="community-grid">
			{#each featuredCommunities as community}
				{@const joined = !!joinedCommunities[community.id]}
				<article class="pn-card community-card" data-testid="explore-community-card">
					<div class={`community-cover community-cover--${community.tone}`} aria-hidden="true"></div>
					<div class="community-card__body">
						<h3>{community.name}</h3>
						<p>{community.description}</p>
						<div class="community-card__foot">
							<span>{community.members}</span>
							<button
								class="community-join"
								class:joined
								type="button"
								aria-pressed={joined}
								aria-label={`${joined ? 'Joined' : 'Join'} ${community.name}`}
								onclick={() => toggleCommunityJoin(community.id)}
							>
								{joined ? 'Joined' : 'Join'}
							</button>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="pn-card discover-feed-card" aria-labelledby="discover-feed-title">
		<div class="section-head discover-feed-head">
			<div>
				<p class="pn-kicker">Discover feed</p>
				<h2 id="discover-feed-title">What people are finding</h2>
			</div>
		</div>
		<div class="pn-tabs discover-tabs" role="tablist" aria-label="Discover feed">
			{#each discoverFeedTabs as tab}
				<button
					id={`discover-tab-${tab.id}`}
					class="pn-tab"
					class:active={activeDiscoverFeed === tab.id}
					type="button"
					role="tab"
					aria-selected={activeDiscoverFeed === tab.id}
					aria-controls="discover-feed-panel"
					onclick={() => (activeDiscoverFeed = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>
		<div
			id="discover-feed-panel"
			class="discover-feed-list"
			role="tabpanel"
			aria-labelledby={`discover-tab-${activeDiscoverFeed}`}
			data-testid="explore-feed"
		>
			{#each activeDiscoverItems as item}
				<article class="discover-feed-item">
					<div>
						<h3>{item.title}</h3>
						<p>{item.body}</p>
					</div>
					<span>{item.meta}</span>
				</article>
			{/each}
		</div>
	</section>
</div>

<style>
	.explore-view {
		display: grid;
		gap: 18px;
	}

	.explore-hero {
		position: relative;
		display: grid;
		gap: 18px;
		padding: 26px;
		overflow: hidden;
		isolation: isolate;
		box-shadow: none;
	}

	.explore-hero::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -2;
		background:
			radial-gradient(circle at 78% 18%, var(--accent-soft), transparent 13rem),
			linear-gradient(135deg, var(--panel), var(--panel-2));
	}

	.explore-hero__copy,
	.explore-search,
	.explore-tags {
		position: relative;
		z-index: 1;
	}

	.explore-hero h1,
	.explore-hero p,
	.explore-section h2,
	.explore-section h3,
	.discover-feed-card h2,
	.discover-feed-card h3,
	.discover-feed-card p {
		margin: 0;
	}

	.explore-hero h1 {
		margin-top: 8px;
		font-family: var(--serif);
		font-size: clamp(2.55rem, 5vw, 5rem);
		font-weight: 500;
		line-height: 0.94;
		letter-spacing: -0.05em;
	}

	.explore-hero__copy > p:last-child {
		max-width: 58ch;
		margin-top: 14px;
		color: var(--ink-2);
		font-size: 1rem;
	}

	.explore-artwork {
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
	}

	.explore-planet {
		position: absolute;
		right: 28px;
		top: 24px;
		width: 108px;
		height: 108px;
		border: 1px solid rgba(255, 255, 255, 0.26);
		border-radius: 999px;
		background: radial-gradient(circle at 35% 35%, #f3c191, #d889a0 42%, #533c7a 72%);
		opacity: 0.78;
	}

	.explore-planet::after {
		content: '';
		position: absolute;
		left: -22px;
		right: -22px;
		top: 50%;
		height: 1px;
		background: rgba(255, 255, 255, 0.45);
		transform: rotate(-12deg);
	}

	.explore-comet {
		position: absolute;
		width: 120px;
		height: 2px;
		border-radius: 999px;
		background: linear-gradient(90deg, transparent, var(--accent), transparent);
		opacity: 0.7;
		transform: rotate(-18deg);
	}

	.explore-comet::after {
		content: '';
		position: absolute;
		right: 18px;
		top: -3px;
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: var(--pink);
	}

	.explore-comet--one {
		right: 110px;
		top: 50px;
	}

	.explore-comet--two {
		right: 16px;
		bottom: 58px;
		width: 90px;
		opacity: 0.44;
	}

	.explore-search {
		display: grid;
		gap: 7px;
		max-width: 520px;
	}

	.explore-search span {
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.explore-search input {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--panel) 88%, white 12%);
		padding: 11px 12px;
		outline: 0;
	}

	.explore-search input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft-2);
	}

	.explore-tags {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.explore-tags button {
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--panel);
		color: var(--accent-ink);
		padding: 6px 11px;
		font-size: 12px;
		font-weight: 600;
	}

	.explore-tags button:hover {
		border-color: var(--accent);
		background: var(--accent-soft-2);
	}

	.explore-section {
		display: grid;
		gap: 12px;
	}

	.section-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 16px;
	}

	.section-head h2,
	.discover-feed-card h2 {
		margin-top: 4px;
		font-family: var(--serif);
		font-size: clamp(1.6rem, 3vw, 2.25rem);
		font-weight: 500;
		line-height: 1;
	}

	.topic-grid,
	.community-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}

	.topic-card,
	.community-card,
	.discover-feed-card {
		box-shadow: none;
	}

	.topic-thumb,
	.community-cover {
		position: relative;
		min-height: 116px;
		border-bottom: 1px solid var(--border);
		background: linear-gradient(180deg, #1d1840 0%, #533c7a 42%, #d889a0 76%, #f3c191 100%);
		overflow: hidden;
	}

	.topic-thumb::before,
	.community-cover::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 20%;
		width: 64px;
		height: 64px;
		border-radius: 999px;
		background: radial-gradient(circle, #ffd1a8 0 34%, #f78fb3 58%, transparent 70%);
		transform: translateX(-50%);
	}

	.topic-thumb::after,
	.community-cover::after {
		content: '';
		position: absolute;
		inset: 56% 0 0;
		background:
			repeating-linear-gradient(0deg, transparent 0 16px, rgba(255, 255, 255, 0.18) 16px 17px),
			repeating-linear-gradient(90deg, transparent 0 12px, rgba(255, 255, 255, 0.18) 12px 13px);
		transform: perspective(120px) rotateX(58deg);
		transform-origin: top;
	}

	.topic-thumb--city,
	.community-cover--signal {
		background: linear-gradient(180deg, #0c0a28 0%, #2a1f4a 30%, #6b4d8e 60%, #d889a0 100%);
	}

	.topic-thumb--grid,
	.community-cover--archive {
		background: linear-gradient(180deg, #0a223f 0%, #164a5a 45%, #7dc4be 100%);
	}

	.topic-card__body,
	.community-card__body {
		display: grid;
		gap: 7px;
		padding: 13px 14px 14px;
	}

	.topic-card__body span,
	.community-card__foot span,
	.discover-feed-item span {
		font-family: var(--mono);
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.topic-card h3,
	.community-card h3,
	.discover-feed-item h3 {
		font-family: var(--serif);
		font-size: 1.35rem;
		font-weight: 500;
		line-height: 1;
	}

	.topic-card p,
	.community-card p,
	.discover-feed-item p {
		margin: 0;
		color: var(--ink-2);
		font-size: 13px;
	}

	.community-card__foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 4px;
	}

	.community-join {
		border: 1px solid var(--accent);
		border-radius: 999px;
		background: transparent;
		color: var(--accent-ink);
		padding: 5px 12px;
		font-size: 12px;
		font-weight: 600;
		white-space: nowrap;
	}

	.community-join:hover,
	.community-join.joined {
		background: var(--accent-soft);
	}

	.discover-feed-card {
		overflow: hidden;
	}

	.discover-feed-head {
		padding: 16px 18px 12px;
	}

	.discover-tabs {
		padding-inline: 16px;
	}

	.discover-feed-list {
		display: grid;
	}

	.discover-feed-item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 14px;
		border-top: 1px solid var(--border);
		padding: 14px 16px;
	}

	.discover-feed-item p {
		margin-top: 6px;
	}

	.discover-feed-item span {
		white-space: nowrap;
	}

	@media (max-width: 880px) {
		.explore-hero {
			padding: 20px 16px;
		}

		.explore-planet {
			right: -10px;
			top: 18px;
			width: 86px;
			height: 86px;
			opacity: 0.42;
		}

		.topic-grid,
		.community-grid {
			grid-template-columns: 1fr;
		}

		.section-head {
			align-items: flex-start;
			flex-direction: column;
		}
	}

	@media (max-width: 560px) {
		.discover-feed-item,
		.community-card__foot {
			grid-template-columns: 1fr;
			align-items: start;
		}

		.discover-feed-item span {
			white-space: normal;
		}
	}
</style>
