<script lang="ts">
	import type { ProfileSettings } from './types';

	type Props = {
		profile: ProfileSettings;
	};

	let { profile }: Props = $props();
</script>

<article class="pn-card preview-card" data-testid="profile-preview-card">
	<div class="preview-banner" aria-hidden="true"></div>
	<div class="preview-body">
		<div class="preview-avatar" aria-hidden="true"></div>
		<div>
			<h2>{profile.displayName}</h2>
			<p>@{profile.username}@{profile.instance}</p>
		</div>
		<p class="preview-bio">{profile.bio}</p>
		<div class="preview-meta">
			<span>{profile.location}</span>
			<span>{profile.website}</span>
		</div>
		<div class="preview-stats">
			<span>{profile.discoverable ? 'Discoverable' : 'Hidden from discovery'}</span>
			<span>{profile.showFollowerCount ? '1,921 followers' : 'Follower count hidden'}</span>
		</div>
	</div>
</article>

<style>
	.preview-card {
		box-shadow: none;
	}

	.preview-banner {
		height: 96px;
		border-bottom: 1px solid var(--border);
		background: linear-gradient(180deg, #1d1840 0%, #533c7a 40%, #d889a0 76%, #f3c191 100%);
	}

	.preview-body {
		display: grid;
		gap: 10px;
		padding: 0 16px 16px;
	}

	.preview-avatar {
		width: 64px;
		height: 64px;
		border: 3px solid var(--panel);
		border-radius: 999px;
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
		margin-top: -32px;
	}

	h2,
	p {
		margin: 0;
	}

	h2 {
		font-family: var(--serif);
		font-size: 1.65rem;
		font-weight: 500;
		line-height: 1;
	}

	h2 + p {
		color: var(--accent-ink);
		font-size: 0.86rem;
		word-break: break-word;
	}

	.preview-bio,
	.preview-meta,
	.preview-stats {
		color: var(--ink-2);
		font-size: 0.88rem;
	}

	.preview-meta,
	.preview-stats {
		display: grid;
		gap: 5px;
		border-top: 1px solid var(--border);
		padding-top: 10px;
	}

	.preview-stats {
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--muted);
	}
</style>
