# 89 Add thread mute and unmute controls

## Summary

Allow authenticated users to mute or unmute a status conversation from the post overflow menu using Pleroma's status mute endpoints.

## Requirements

- Add typed client methods for `POST /api/v1/statuses/:id/mute` and `/unmute`.
- Expose each status's Pleroma-specific `pleroma.thread_muted` state to post components without confusing it with author muting.
- Show Mute thread or Unmute thread in authenticated post overflow menus.
- Reconcile the returned status across visible and retained post surfaces, including search results that are already loaded.
- Preserve established authentication and error handling behavior.

## Acceptance Criteria

- Client tests cover both endpoint paths.
- A mocked thread-route test covers muting and unmuting with menu state updates.
- `pnpm run check`, focused Playwright tests, and `git diff --check` pass.

## Verification

- `pnpm run check`: passed.
- Focused client, adapter, thread mute/unmute, and direct-link navigation Playwright tests: 4 passed.
- Playwright discovery: 357 tests in 24 files.
- Default and `BASE_PATH=/pleromanet` static builds: passed.
- `git diff --check`: passed.

## Notes

- Pleroma currently has no endpoint for enumerating muted threads. This slice supports unmuting whenever a muted status is encountered through a known URL, search, profile, bookmark, retained state, or another REST response. A server-side listing API is deferred.
- Mutation responses are treated as authoritative for their completed operation and are protected against duplicate toggles by a per-conversation pending request key.
