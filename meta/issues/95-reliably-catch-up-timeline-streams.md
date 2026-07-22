# 95 Reliably catch up timeline streams

## Summary

Timeline WebSockets reconnect after explicit failures, but recovery does not consistently query every timeline for events missed during startup, outages, route absence, or reconnect delays. Home catch-up can also skip posts when more than one API page arrived.

## Requirements

- Catch up home, local, and federated timelines after stream failures and successful reconnections.
- Page through every status newer than the last completed REST watermark before advancing it.
- Support catch-up from initially empty timelines without replacing loaded or queued state.
- Do not advance a timeline watermark from locally composed posts or streamed events.
- Reconnect sockets that never open within a bounded timeout.
- Preserve session and route isolation, deduplication, pagination, queued-post, and automatic-insertion behavior.

## Acceptance Criteria

- Tests prove public timelines query and render posts missed during a stream outage.
- Tests prove home catch-up retrieves multiple newer API pages without skipping intermediate posts.
- Tests prove initially empty timelines can recover posts through REST after a stream failure.
- Tests prove successful reconnection performs a catch-up and stalled connections are replaced.
- Tests prove composing a post cannot move the catch-up watermark past unseen posts.
- Type checks, production build, and the complete mocked Playwright suite pass.

## Notes

- Keep default tests independent from a live Pleroma instance.
