# 67 Preserve timelines across navigation

## Summary

Keep timeline data, pagination, and browser scroll position intact when navigating into a thread and returning, instead of rebuilding and refetching timelines on every route change.

## Requirements

- Preserve a loaded home timeline when navigating to another app route.
- Preserve independent local and federated timeline states rather than sharing and clearing one state.
- Do not repeat the initial timeline REST request when returning to a valid session-scoped cached timeline.
- Keep loaded older pages, pagination cursors, queued newer posts, and load-more state across navigation.
- Close inactive timeline streams and reconnect the correct stream when returning without replacing cached data.
- Let SvelteKit restore browser-history scroll after timeline-to-thread-to-back navigation by rendering cached timeline DOM synchronously.
- Keep cache boundaries scoped to the authenticated session and clear all retained timeline data on session changes or sign-out.
- Prevent stale in-flight initial or pagination requests from mutating inactive or replaced timeline entries.
- Make the visible thread back action return through browser history when the thread was opened from an app timeline, with a safe direct-link fallback.

## Acceptance Criteria

- Home timeline to thread to browser Back restores the previous scroll position within a small tolerance.
- Returning to home does not issue another initial home timeline request.
- Previously loaded older pages and their cursor remain present after returning from a thread.
- Local and federated timelines retain distinct items and do not refetch when revisited in the same session.
- Returning to local or federated restores its previous scroll position.
- A session change or sign-out cannot expose the previous account's retained timeline data.
- Relevant Playwright route, home timeline, public timeline, pagination, and history regressions pass.

## Notes

- All authenticated URLs share one SvelteKit catch-all component, so page state can survive route changes if route deactivation stops clearing it.
- SvelteKit already records popstate scroll; cached list DOM must exist before its restoration step.
