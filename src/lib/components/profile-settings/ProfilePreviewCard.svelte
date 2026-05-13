<script lang="ts">
	import type { ProfileSettings } from './types';

	type Props = {
		profile: ProfileSettings;
	};

	let { profile }: Props = $props();
</script>

<article class="pn-card preview-card" data-testid="profile-preview-card">
	<div class="preview-head">
		<div class="preview-head__title">Profile preview</div>
	</div>
	<div class="preview-banner-wrap">
		<div class="preview-banner" aria-hidden="true">
			<button class="preview-edit" type="button">Edit preview</button>
		</div>
		<div class="preview-avatar" aria-hidden="true"></div>
	</div>
	<div class="preview-body">
		<div>
			<h2>{profile.displayName}</h2>
			<p>@{profile.username}@{profile.instance}</p>
		</div>
		<p class="preview-bio">{profile.bio}</p>
		<div class="preview-stat-row">
			<div class="preview-stat"><span>Posts</span><strong>1,248</strong></div>
			<div class="preview-stat"><span>Following</span><strong>312</strong></div>
			<div class="preview-stat"><span>Followers</span><strong>{profile.showFollowerCount ? '1,921' : 'Hidden'}</strong></div>
		</div>
		<div class="preview-footnote">This is how your profile appears to other users.</div>
	</div>
</article>

<style>
	.preview-card {
		box-shadow: none;
		overflow: hidden;
	}

	.preview-head {
		padding: 14px 16px 8px;
		border-bottom: 1px solid var(--border);
	}

	.preview-head__title {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
	}

	.preview-banner-wrap {
		position: relative;
	}

	.preview-banner {
		height: 120px;
		background: linear-gradient(180deg, #1d1840 0%, #533c7a 40%, #d889a0 76%, #f3c191 100%);
	}

	.preview-edit {
		position: absolute;
		right: 8px;
		bottom: 8px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.85);
		padding: 4px 8px;
		font-size: 11px;
		color: var(--ink);
	}

	.preview-body {
		display: grid;
		gap: 10px;
		padding: 38px 16px 14px;
	}

	.preview-avatar {
		position: absolute;
		left: 16px;
		bottom: -28px;
		width: 64px;
		height: 64px;
		border: 4px solid var(--panel);
		border-radius: 999px;
		background: linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0);
	}

	h2,
	p {
		margin: 0;
	}

	h2 {
		font-family: var(--serif);
		font-size: 22px;
		font-weight: 500;
		line-height: 1;
	}

	h2 + p {
		margin-top: 4px;
		color: var(--accent-ink);
		font-size: 12.5px;
		word-break: break-word;
	}

	.preview-bio {
		color: var(--ink-2);
		font-size: 13px;
	}

	.preview-stat-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid var(--border);
		margin-top: 4px;
	}

	.preview-stat {
		padding: 12px 8px;
		border-right: 1px solid var(--border);
	}

	.preview-stat:last-child {
		border-right: 0;
	}

	.preview-stat span {
		display: block;
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.preview-stat strong {
		display: block;
		margin-top: 2px;
		font-family: var(--serif);
		font-size: 22px;
		font-weight: 500;
		line-height: 1;
		color: var(--accent-ink);
	}

	.preview-footnote {
		border-top: 1px solid var(--border);
		padding-top: 12px;
		font-size: 11.5px;
		text-align: center;
		color: var(--muted);
	}
</style>
