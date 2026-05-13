<script lang="ts">
	let search = $state('');
	let joined = $state<Record<string, boolean>>({});
	const tags = ['#smallweb', '#fedidevs', '#pleroma', '#selfhosted'];
	const topics = [
		{ id: 'fediverse', title: 'Federated calm', posts: '24 posts' },
		{ id: 'operators', title: 'Instance operators', posts: '18 posts' },
		{ id: 'frontend', title: 'Frontend gardeners', posts: '12 posts' }
	];
	const communities = [
		{ id: 'css-garden', name: 'Federated CSS Garden', description: 'Quiet front-end experiments and hand-rolled UI details.' },
		{ id: 'packet-radio', name: 'Packet Radio Club', description: 'Instance operators trading maintenance notes.' },
		{ id: 'soft-archive', name: 'Soft Archive', description: 'Old blogs, zines, and low-noise links.' }
	];
	const toggleJoined = (id: string) => {
		joined = { ...joined, [id]: !joined[id] };
	};
</script>

<svelte:head><title>PleromaNet · Explore</title></svelte:head>

<div class="explore-view" data-testid="explore-view">
	<section class="pn-card explore-hero" aria-labelledby="explore-title">
		<div class="explore-artwork" data-testid="explore-artwork" aria-hidden="true"></div>
		<div>
			<p class="pn-kicker">Network discovery</p>
			<h1 id="explore-title">Explore the network</h1>
			<p>Find local topics, neighboring communities, and public posts without leaving the real routed shell.</p>
		</div>
		<label class="explore-search">
			<span>Search</span>
			<input bind:value={search} type="search" aria-label="Search topics, people, and posts" placeholder="Search topics, people, and posts" />
		</label>
		<div class="explore-tags" aria-label="Suggested tags">
			{#each tags as tag}<button type="button">{tag}</button>{/each}
		</div>
	</section>

	<section class="explore-section" aria-labelledby="explore-topics-title">
		<div class="section-head"><div><p class="pn-kicker">Curated topics</p><h2 id="explore-topics-title">Start with a mood</h2></div></div>
		<div class="topic-grid">
			{#each topics as topic}
				<article class="pn-card topic-card" data-testid="explore-topic-card"><h3>{topic.title}</h3><p>{topic.posts}</p></article>
			{/each}
		</div>
	</section>

	<section class="explore-section" aria-labelledby="explore-communities-title">
		<div class="section-head"><div><p class="pn-kicker">Featured communities</p><h2 id="explore-communities-title">Rooms worth visiting</h2></div></div>
		<div class="community-grid">
			{#each communities as community}
				{@const isJoined = !!joined[community.id]}
				<article class="pn-card community-card" data-testid="explore-community-card">
					<h3>{community.name}</h3>
					<p>{community.description}</p>
					<button type="button" aria-pressed={isJoined} aria-label={`${isJoined ? 'Joined' : 'Join'} ${community.name}`} onclick={() => toggleJoined(community.id)}>{isJoined ? 'Joined' : 'Join'}</button>
				</article>
			{/each}
		</div>
	</section>
</div>

<style>
	.explore-view,
	.explore-section {
		display: grid;
		gap: 18px;
	}

	.explore-hero {
		display: grid;
		gap: 18px;
		box-shadow: none;
		padding: 22px;
	}

	.explore-artwork {
		min-height: 120px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: radial-gradient(circle at 65% 35%, var(--pink), transparent 24%), linear-gradient(135deg, #1d1840, #533c7a 45%, #d889a0);
	}

	.explore-hero h1,
	.explore-hero p,
	.section-head h2,
	.section-head p {
		margin: 0;
	}

	.explore-hero h1 {
		font-family: var(--serif);
		font-size: clamp(2.2rem, 7vw, 4.4rem);
		font-weight: 500;
		letter-spacing: -0.04em;
		line-height: 0.95;
	}

	.explore-search {
		display: grid;
		gap: 6px;
	}

	.explore-search input {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-2);
		padding: 10px 12px;
	}

	.explore-tags,
	.topic-grid,
	.community-grid {
		display: grid;
		gap: 12px;
	}

	.explore-tags {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.explore-tags button,
	.community-card button {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-2);
		padding: 8px 10px;
	}

	.topic-grid,
	.community-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.topic-card,
	.community-card {
		box-shadow: none;
		padding: 16px;
	}

	@media (max-width: 880px) {
		.explore-tags,
		.topic-grid,
		.community-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
