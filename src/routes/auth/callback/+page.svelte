<script lang="ts">
	import { onMount } from 'svelte';
	import { toPleromaClientError } from '$lib/pleroma/http';
	import { exchangeOAuthCode, parseOAuthCallback } from '$lib/pleroma/oauth';
	import { clearPendingOAuth, readPendingOAuth, storePleromaSession } from '$lib/pleroma/session';

	type CallbackView = {
		status: 'loading' | 'success' | 'cancelled' | 'missing' | 'error';
		title: string;
		message: string;
	};

	let view = $state<CallbackView>({
		status: 'loading',
		title: 'Finishing Pleroma authorization',
		message: 'PleromaNet is exchanging the authorization code with your home server.'
	});

	const instanceHost = (instanceUrl: string) => {
		try {
			return new URL(instanceUrl).host;
		} catch {
			return instanceUrl;
		}
	};

	onMount(async () => {
		const callback = parseOAuthCallback(window.location.href);
		const pending = readPendingOAuth(window.sessionStorage);
		const pendingMatchesCallback = Boolean(pending && callback.state && callback.state === pending.state);

		if (callback.status === 'error') {
			if (!pending || pendingMatchesCallback) clearPendingOAuth(window.sessionStorage);
			view = {
				status: 'cancelled',
				title: 'Authorization was cancelled',
				message: callback.description ?? 'Your Pleroma server did not grant authorization.'
			};
			return;
		}

		if (callback.status === 'missing_code') {
			if (!pending || pendingMatchesCallback) clearPendingOAuth(window.sessionStorage);
			view = {
				status: 'error',
				title: 'Authorization code was missing',
				message: 'The callback did not include an OAuth code from your Pleroma server.'
			};
			return;
		}

		if (!pending) {
			view = {
				status: 'missing',
				title: 'No pending Pleroma authorization',
				message: 'Start sign-in from PleromaNet so we know which server and OAuth app to finish.'
			};
			return;
		}

		if (callback.state !== pending.state) {
			clearPendingOAuth(window.sessionStorage);
			view = {
				status: 'error',
				title: 'Authorization state did not match',
				message: 'The server response did not match the sign-in request PleromaNet started.'
			};
			return;
		}

		try {
			const token = await exchangeOAuthCode({
				instanceUrl: pending.instanceUrl,
				clientId: pending.clientId,
				clientSecret: pending.clientSecret,
				redirectUri: pending.redirectUri,
				code: callback.code,
				fetch: window.fetch.bind(window)
			});

			storePleromaSession(window.localStorage, {
				instanceUrl: pending.instanceUrl,
				accessToken: token.accessToken,
				tokenType: token.tokenType,
				scope: token.scope,
				createdAt: token.createdAt ? token.createdAt * 1000 : Date.now()
			});
			clearPendingOAuth(window.sessionStorage);

			view = {
				status: 'success',
				title: `Signed in to ${instanceHost(pending.instanceUrl)}`,
				message: 'PleromaNet stored an OAuth token from your server. Passwords stay on the server that authorized you.'
			};
		} catch (error) {
			clearPendingOAuth(window.sessionStorage);
			const clientError = toPleromaClientError(error);
			view = {
				status: 'error',
				title: 'Could not finish Pleroma authorization',
				message: clientError.message
			};
		}
	});
</script>

<svelte:head>
	<title>PleromaNet · OAuth callback</title>
	<meta name="description" content="Finish OAuth authorization from your Pleroma server." />
</svelte:head>

<main class="callback-page">
	<section class="callback-card" aria-labelledby="callback-title">
		<p class="callback-kicker">OAuth handoff</p>
		<h1 id="callback-title">{view.title}</h1>
		<p class="callback-message">{view.message}</p>

		{#if view.status === 'loading'}
			<div class="callback-progress" role="status" aria-label="Authorization progress">
				<span></span>
				<span>Finishing authorization</span>
			</div>
		{:else if view.status === 'success'}
			<a class="callback-action" href="/mockup">Open mockup app</a>
		{:else}
			<a class="callback-action" href="/#oauth">Return to sign in</a>
		{/if}
	</section>
</main>

<style>
	.callback-page {
		display: grid;
		min-height: 100vh;
		place-items: center;
		background:
			radial-gradient(circle at 18% 18%, var(--accent-soft-2), transparent 28rem),
			var(--bg);
		padding: 24px;
	}

	.callback-card {
		width: min(620px, 100%);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background: var(--panel);
		box-shadow: var(--shadow-soft);
		padding: clamp(24px, 6vw, 42px);
	}

	.callback-kicker,
	.callback-card h1,
	.callback-message {
		margin: 0;
	}

	.callback-kicker {
		color: var(--muted);
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.callback-card h1 {
		margin-top: 10px;
		font-family: var(--serif);
		font-size: clamp(2.4rem, 8vw, 4.5rem);
		font-weight: 500;
		letter-spacing: -0.04em;
		line-height: 0.96;
	}

	.callback-message {
		max-width: 54ch;
		margin-top: 18px;
		color: var(--ink-2);
		font-size: 1rem;
	}

	.callback-progress {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		margin-top: 28px;
		border: 1px solid var(--accent-soft);
		border-radius: 999px;
		background: var(--accent-soft-2);
		color: var(--accent-ink);
		padding: 8px 13px;
		font-family: var(--mono);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.callback-progress span:first-child {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: var(--accent);
		box-shadow: 0 0 0 4px var(--accent-soft);
	}

	.callback-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-top: 28px;
		border: 1px solid var(--ink);
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--panel);
		padding: 9px 14px;
		font-weight: 700;
	}

	.callback-action:hover {
		border-color: var(--accent-ink);
		background: var(--accent-ink);
	}
</style>
