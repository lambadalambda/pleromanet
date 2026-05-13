<svelte:head><title>PleromaNet · Notifications</title></svelte:head>

<section class="pn-card notifications-route" aria-labelledby="notifications-title">
	<div class="notifications-head">
		<p class="pn-kicker">Guarded placeholder</p>
		<h1 id="notifications-title">Notifications</h1>
		<p>Notification API polling lands in a later issue; this route exists so shell navigation and deep links are real now.</p>
	</div>
	<div class="notification-list">
		<article><strong>quiet admin</strong> has 3 unread mocked alerts.</article>
		<article><strong>#smallweb</strong> is active on pleroma.example.</article>
	</div>
</section>

<style>
	.notifications-route { box-shadow: none; }
	.notifications-head { border-bottom: 1px solid var(--border); padding: 20px 16px; }
	.notifications-head h1, .notifications-head p { margin: 0; }
	.notifications-head h1 { margin-top: 4px; font-family: var(--serif); font-size: clamp(2.3rem, 7vw, 4.5rem); font-weight: 500; line-height: 0.95; }
	.notification-list { display: grid; }
	.notification-list article { border-top: 1px solid var(--border); padding: 14px 16px; }
	.notification-list article:first-child { border-top: 0; }
</style>
