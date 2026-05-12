<script lang="ts">
	type AuthMode = 'signin' | 'signup';
	type AuthStep = 'enter' | 'redirect';
	type RecentServer = {
		domain: string;
		theme: string;
		color: string;
		last?: string;
	};

	const recentServers: RecentServer[] = [
		{ domain: 'pleromanet.social', theme: 'General / Cream', color: '#a48bd9', last: 'You / 2h ago' },
		{ domain: 'retro.social', theme: 'Vintage tech / Open', color: '#7dc4be', last: 'gridwave / last week' },
		{ domain: 'kolektiva.social', theme: 'Mutual aid / Curated', color: '#e7a8c9' },
		{ domain: 'spacebear.net', theme: 'Astronomy / Friendly', color: '#e0b97a' }
	];

	let mode = $state<AuthMode>('signin');
	let instance = $state('pleromanet.social');
	let showInstancePicker = $state(false);
	let agree = $state(false);
	let authStep = $state<AuthStep>('enter');
	const selectedInstance = $derived(instance.trim() || 'server');

	const selectMode = (nextMode: AuthMode) => {
		mode = nextMode;
		authStep = 'enter';
		showInstancePicker = false;
	};

	const selectServer = (domain: string) => {
		instance = domain;
		showInstancePicker = false;
	};

	const beginAuth = () => {
		if (!instance.trim()) return;
		if (mode === 'signup' && !agree) return;

		authStep = 'redirect';
		showInstancePicker = false;
	};

	const cancelRedirect = () => {
		authStep = 'enter';
	};
</script>

<section id="oauth" class="so-auth" aria-labelledby="oauth-title">
	<div class="so-auth-tabs" role="tablist" aria-label="OAuth options">
		<button
			id="signin-tab"
			class="so-auth-tab"
			class:active={mode === 'signin'}
			type="button"
			role="tab"
			aria-selected={mode === 'signin'}
			aria-controls="signin-panel"
			onclick={() => selectMode('signin')}
		>
			Sign in
		</button>
		<button
			id="signup-tab"
			class="so-auth-tab"
			class:active={mode === 'signup'}
			type="button"
			role="tab"
			aria-selected={mode === 'signup'}
			aria-controls="signup-panel"
			onclick={() => selectMode('signup')}
		>
			Create account
		</button>
	</div>

	<h2 id="oauth-title" class="sr-only">Sign in with your Pleroma server</h2>

	{#if authStep === 'enter' && mode === 'signin'}
		<div id="signin-panel" class="so-auth-body" role="tabpanel" aria-labelledby="signin-tab">
			<p class="so-oauth-blurb">
				PleromaNet uses your home server to sign you in. Enter where your account lives and
				we will redirect you there to authorize PleromaNet.
			</p>

			<div class="so-field">
				<label class="so-label" for="home-server">Your home server</label>
				<div class="so-input-wrap so-input-handle">
					<span class="so-input-prefix">https://</span>
					<input id="home-server" class="so-input" placeholder="your.instance" bind:value={instance} />
					<button
						class="so-input-suffix"
						type="button"
						aria-label="Recent servers"
						aria-expanded={showInstancePicker}
						aria-controls="recent-servers"
						onclick={() => (showInstancePicker = !showInstancePicker)}
					>
						<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
					</button>
				</div>

				{#if showInstancePicker}
					<div id="recent-servers" class="so-instance-pop" role="listbox" aria-label="Recently used servers">
						<div class="so-pop-label">Recently used</div>
						{#each recentServers as server (server.domain)}
							<button
								class="so-instance-opt"
								class:sel={instance === server.domain}
								type="button"
								role="option"
								aria-selected={instance === server.domain}
								onclick={() => selectServer(server.domain)}
							>
								<span class="so-inst-sw" style={`background: ${server.color}`}></span>
								<span class="so-inst-copy">
									<span class="so-inst-d">{server.domain}</span>
									<span class="so-inst-t">{server.last ?? server.theme}</span>
								</span>
								{#if instance === server.domain}
									<span class="so-selected" aria-hidden="true">Selected</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<button class="so-cta" type="button" disabled={!instance.trim()} onclick={beginAuth}>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
				<span>Continue to {selectedInstance}</span>
			</button>

			<div class="so-oauth-chain" aria-label="OAuth authorization steps">
				<div class="so-chain-step done">
					<span class="so-chain-dot"></span>
					<span>Enter server</span>
				</div>
				<div class="so-chain-line"></div>
				<div class="so-chain-step">
					<span class="so-chain-dot"></span>
					<span>Authorize on {selectedInstance}</span>
				</div>
				<div class="so-chain-line"></div>
				<div class="so-chain-step">
					<span class="so-chain-dot"></span>
					<span>Return here</span>
				</div>
			</div>

			<p class="so-footnote">
				PleromaNet never sees your password. Authorization is granted by your home server via OAuth,
				and passwords stay on that server.
			</p>
		</div>
	{:else if authStep === 'enter' && mode === 'signup'}
		<div id="signup-panel" class="so-auth-body" role="tabpanel" aria-labelledby="signup-tab">
			<p class="so-oauth-blurb">
				Choose a server. Each one has its own community, rules, and moderators. You can move
				later and keep your follows.
			</p>

			<div class="so-server-list" aria-label="Available Pleroma servers">
				{#each recentServers as server (server.domain)}
					<button
						class="so-server-card"
						class:sel={instance === server.domain}
						type="button"
						aria-pressed={instance === server.domain}
						onclick={() => selectServer(server.domain)}
					>
						<span class="so-inst-sw so-inst-sw--large" style={`background: ${server.color}`}></span>
						<span class="so-inst-copy so-inst-copy--left">
							<span class="so-inst-d">{server.domain}</span>
							<span class="so-inst-t">{server.theme}</span>
						</span>
						<span class="so-server-radio" aria-hidden="true"></span>
					</button>
				{/each}
			</div>

			<label class="so-check">
				<input type="checkbox" bind:checked={agree} />
				<span>I'm 16+ and I've read {selectedInstance}'s <a href="#rules">Code of Conduct</a>.</span>
			</label>

			<button class="so-cta" type="button" disabled={!agree} onclick={beginAuth}>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
				<span>Continue to {selectedInstance}</span>
			</button>

			<p class="so-footnote">
				New accounts on <strong>{selectedInstance}</strong> are reviewed manually, usually within 24 hours.
				If your server asks for a password, that happens on the server after this handoff.
			</p>
		</div>
	{:else}
		<div class="so-auth-body so-redirect" aria-live="polite">
			<div class="so-redirect-anim" aria-hidden="true">
				<div class="so-redirect-card so-r-pn">
					<div class="so-r-mark">PN</div>
					<div class="so-redirect-l">PleromaNet</div>
				</div>
				<div class="so-redirect-arrow">
					<svg viewBox="0 0 60 12" fill="none"><path d="M2 6h50M48 2l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
				</div>
				<div class="so-redirect-card so-r-inst">
					<div class="so-r-globe">
						<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" stroke-width="1.4" /></svg>
					</div>
					<div class="so-redirect-l">{selectedInstance}</div>
				</div>
			</div>
			<div class="so-redirect-title">Redirecting to {selectedInstance}</div>
			<p class="so-redirect-sub">
				Your server will ask you to authorize PleromaNet. We will bring you right back.
			</p>
			<div class="so-redirect-bar" aria-hidden="true"><span></span></div>
			<button class="so-link-button" type="button" aria-label="Cancel redirect" onclick={cancelRedirect}>Cancel</button>
		</div>
	{/if}
</section>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.so-auth {
		background: var(--panel);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow:
			0 24px 60px rgba(28, 32, 70, 0.08),
			0 2px 8px rgba(28, 32, 70, 0.04);
	}

	.so-auth-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border-bottom: 1px solid var(--border);
		background: var(--panel-2);
	}

	.so-auth-tab {
		position: relative;
		border: 0;
		border-right: 1px solid var(--border);
		background: transparent;
		color: var(--muted);
		padding: 14px;
		font-size: 13px;
		font-weight: 600;
	}

	.so-auth-tab:last-child {
		border-right: 0;
	}

	.so-auth-tab.active {
		background: var(--panel);
		color: var(--accent-ink);
	}

	.so-auth-tab.active::after {
		content: '';
		position: absolute;
		inset: auto 0 -1px;
		height: 2px;
		background: var(--accent);
	}

	.so-auth-body {
		padding: 22px;
	}

	.so-oauth-blurb {
		margin: 0 0 18px;
		padding-bottom: 14px;
		border-bottom: 1px dashed var(--border);
		color: var(--muted);
		font-size: 13px;
		line-height: 1.55;
	}

	.so-field {
		position: relative;
		margin-bottom: 14px;
	}

	.so-label {
		display: block;
		margin-bottom: 6px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.so-input-wrap {
		display: flex;
		align-items: stretch;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--panel-2);
	}

	.so-input-wrap:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}

	.so-input-prefix {
		padding: 11px 4px 11px 12px;
		color: var(--muted);
		font-size: 14px;
	}

	.so-input {
		min-width: 0;
		flex: 1;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--ink);
		padding: 11px 12px 11px 0;
		font-size: 14px;
	}

	.so-input::placeholder {
		color: var(--muted-2);
	}

	.so-input-suffix {
		display: inline-flex;
		align-items: center;
		border: 0;
		border-left: 1px solid var(--border);
		background: var(--accent-soft-2);
		color: var(--accent-ink);
		padding: 0 12px;
	}

	.so-input-suffix:hover {
		background: var(--accent-soft);
	}

	.so-input-suffix svg,
	.so-cta svg {
		width: 14px;
		height: 14px;
	}

	.so-instance-pop {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		z-index: 10;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--panel);
		box-shadow: 0 12px 30px rgba(28, 32, 70, 0.1);
		padding: 4px;
	}

	.so-pop-label {
		padding: 8px 10px 4px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.so-instance-opt,
	.so-server-card {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 10px;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		padding: 8px 10px;
		text-align: left;
	}

	.so-instance-opt:hover,
	.so-instance-opt.sel {
		background: var(--accent-soft-2);
	}

	.so-inst-sw {
		width: 18px;
		height: 18px;
		border: 1px solid var(--border);
		border-radius: 50%;
		flex: 0 0 auto;
	}

	.so-inst-sw--large {
		width: 22px;
		height: 22px;
	}

	.so-inst-copy {
		display: grid;
		min-width: 0;
		flex: 1;
	}

	.so-inst-copy--left {
		text-align: left;
	}

	.so-inst-d,
	.so-inst-t {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.so-inst-d {
		color: var(--ink);
		font-size: 13px;
		font-weight: 600;
	}

	.so-inst-t {
		margin-top: 1px;
		color: var(--muted);
		font-size: 11px;
	}

	.so-selected {
		color: var(--accent-ink);
		font-family: var(--mono);
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.so-cta {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 1px solid var(--accent-ink);
		border-radius: var(--radius);
		background: var(--accent-ink);
		color: var(--panel);
		padding: 13px;
		font-size: 13.5px;
		font-weight: 600;
	}

	.so-cta:hover {
		border-color: var(--ink);
		background: var(--ink);
	}

	.so-cta:disabled {
		border-color: var(--muted-2);
		background: var(--muted-2);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.so-oauth-chain {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 18px 0 4px;
		border: 1px solid var(--accent-soft);
		border-radius: var(--radius);
		background: var(--accent-soft-2);
		padding: 12px;
	}

	.so-chain-step {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 6px;
		color: var(--muted);
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.so-chain-step span:last-child {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.so-chain-step.done {
		color: var(--accent-ink);
		font-weight: 700;
	}

	.so-chain-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--border-strong);
		flex: 0 0 auto;
	}

	.so-chain-step.done .so-chain-dot {
		background: var(--accent);
		box-shadow: 0 0 0 2px var(--accent-soft);
	}

	.so-chain-line {
		height: 1px;
		min-width: 8px;
		flex: 1;
		background: var(--border-strong);
	}

	.so-footnote {
		margin: 14px 0 0;
		color: var(--muted);
		font-size: 11.5px;
		line-height: 1.5;
	}

	.so-server-list {
		display: grid;
		gap: 6px;
		margin-bottom: 14px;
	}

	.so-server-card {
		gap: 12px;
		border: 1px solid var(--border-strong);
		background: var(--panel-2);
		padding: 11px 12px;
	}

	.so-server-card:hover,
	.so-server-card.sel {
		border-color: var(--accent);
	}

	.so-server-card.sel {
		background: var(--accent-soft-2);
	}

	.so-server-radio {
		position: relative;
		width: 16px;
		height: 16px;
		border: 1.5px solid var(--border-strong);
		border-radius: 50%;
		flex: 0 0 auto;
	}

	.so-server-card.sel .so-server-radio {
		border-color: var(--accent-ink);
	}

	.so-server-card.sel .so-server-radio::after {
		content: '';
		position: absolute;
		inset: 3px;
		border-radius: 50%;
		background: var(--accent-ink);
	}

	.so-check {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin: 4px 0 12px;
		color: var(--ink-2);
		cursor: pointer;
		font-size: 12.5px;
		line-height: 1.45;
	}

	.so-check input {
		margin-top: 2px;
		accent-color: var(--accent-ink);
	}

	.so-check a {
		color: var(--accent-ink);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.so-redirect {
		padding-top: 32px;
		padding-bottom: 28px;
		text-align: center;
	}

	.so-redirect-anim {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		margin-bottom: 22px;
	}

	.so-redirect-card {
		display: flex;
		width: 100px;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background: var(--panel-2);
		padding: 14px 8px;
	}

	.so-r-pn {
		animation: soOriginPulse 1.6s ease-in-out infinite;
	}

	.so-r-inst {
		animation: soDestPulse 1.6s ease-in-out infinite 0.6s;
		border-color: var(--accent);
		background: var(--accent-soft-2);
	}

	.so-r-mark,
	.so-r-globe {
		display: grid;
		width: 36px;
		height: 36px;
		place-items: center;
		color: var(--accent-ink);
	}

	.so-r-mark {
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--panel);
		font-family: var(--serif);
		font-size: 16px;
		font-weight: 700;
	}

	.so-r-globe svg {
		width: 22px;
		height: 22px;
	}

	.so-redirect-l {
		max-width: 88px;
		overflow: hidden;
		color: var(--ink-2);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.08em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.so-redirect-arrow {
		display: flex;
		color: var(--accent-ink);
	}

	.so-redirect-arrow svg {
		width: 60px;
		height: 12px;
	}

	.so-redirect-arrow svg path {
		animation: soArrow 1.6s ease-in-out infinite;
		stroke-dasharray: 60;
		stroke-dashoffset: 60;
	}

	.so-redirect-title {
		margin-bottom: 6px;
		color: var(--ink);
		font-family: var(--serif);
		font-size: 22px;
	}

	.so-redirect-sub {
		max-width: 320px;
		margin: 0 auto;
		color: var(--muted);
		font-size: 13px;
		line-height: 1.55;
	}

	.so-redirect-bar {
		width: 80%;
		height: 3px;
		margin: 20px auto 0;
		overflow: hidden;
		border-radius: 2px;
		background: var(--border);
	}

	.so-redirect-bar span {
		display: block;
		width: 30%;
		height: 100%;
		animation: soBar 1.6s ease-in-out infinite;
		border-radius: 2px;
		background: var(--accent-ink);
	}

	.so-link-button {
		margin-top: 14px;
		border: 0;
		background: transparent;
		color: var(--muted);
		font-size: 12px;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.so-link-button:hover {
		color: var(--accent-ink);
	}

	@keyframes soArrow {
		0% {
			stroke-dashoffset: 60;
		}
		60% {
			stroke-dashoffset: 0;
		}
		100% {
			opacity: 0;
			stroke-dashoffset: 0;
		}
	}

	@keyframes soOriginPulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(0.96);
			opacity: 0.7;
		}
	}

	@keyframes soDestPulse {
		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 0 0 0 var(--accent-soft);
		}
		50% {
			transform: scale(1.04);
			box-shadow: 0 0 0 8px transparent;
		}
	}

	@keyframes soBar {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(380%);
		}
	}

	@media (max-width: 560px) {
		.so-auth-body {
			padding: 18px;
		}

		.so-oauth-chain {
			align-items: flex-start;
			flex-direction: column;
		}

		.so-chain-line {
			width: 1px;
			height: 12px;
			min-width: 0;
			margin-left: 3px;
			flex: none;
		}

		.so-redirect-anim {
			gap: 8px;
		}

		.so-redirect-card {
			width: 88px;
		}

		.so-redirect-arrow svg {
			width: 42px;
		}
	}
</style>
