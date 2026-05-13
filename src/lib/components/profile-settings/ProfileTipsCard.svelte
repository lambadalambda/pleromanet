<article class="pn-card tips-card" data-testid="profile-tips-card">
	<div class="tips-head">
		<span>Profile tips</span>
	</div>
	<div class="tips-list">
		<div class="tip-row"><span class="tip-dot" aria-hidden="true"></span><span>Your avatar will be shown at 96×96px.</span></div>
		<div class="tip-row"><span class="tip-dot" aria-hidden="true"></span><span>The banner helps personalize your profile.</span></div>
		<div class="tip-row"><span class="tip-dot" aria-hidden="true"></span><span>Link your website to drive traffic.</span></div>
		<div class="tip-row"><span class="tip-dot" aria-hidden="true"></span><span>A good bio helps others find you.</span></div>
	</div>
	<button class="tips-foot" type="button">Learn more about profiles →</button>
</article>

<style>
	.tips-card {
		box-shadow: none;
	}

	.tips-head {
		padding: 14px 16px 4px;
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
	}

	.tips-list {
		display: grid;
		padding: 4px 0 8px;
	}

	.tip-row {
		display: grid;
		grid-template-columns: 20px minmax(0, 1fr);
		gap: 10px;
		align-items: center;
		padding: 8px 16px;
		font-size: 12.5px;
		color: var(--ink-2);
	}

	.tip-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--muted);
	}

	.tips-foot {
		display: block;
		width: 100%;
		border: 0;
		border-top: 1px solid var(--border);
		background: transparent;
		padding: 10px 16px;
		font-size: 12.5px;
		text-align: left;
		color: var(--accent-ink);
	}

	.tips-foot:hover {
		background: var(--bg);
	}
</style>
