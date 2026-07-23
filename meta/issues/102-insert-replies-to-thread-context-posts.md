# 102 Insert replies to thread context posts

## Summary

Replies submitted to a non-focused context post in an open thread can succeed remotely without appearing in the thread until the page is refreshed.

## Requirements

- Reconcile successful replies to any rendered post that belongs to the open thread, including ancestor/context posts.
- Show the created reply immediately without reloading.
- Match the thread shape produced by a subsequent context refresh.
- Preserve existing focused-post and nested-descendant insertion, deduplication, counts, sorting, and route/session isolation.

## Acceptance Criteria

- Submitting an inline reply to a rendered ancestor inserts the created post into the open thread immediately and exactly once.
- The request targets the selected ancestor status.
- Existing focused, descendant, nested, streamed, duplicate, and stale-thread reply behavior remains correct.
- Focused Playwright coverage, type checks, production build, and the complete mocked Playwright suite pass.

## Resolution

- Extended open-thread reconciliation to recognize ancestor/context posts as valid reply parents and append their replies as roots, matching context refresh reconstruction.
- Preserved canonical source identity for boosted ancestors and excluded streamed boost wrappers from reply-creation reconciliation.
- Kept reply counts, Top/Newest ordering, duplicate streams, nested expansion, route/session isolation, and refresh behavior consistent.
- Added Playwright coverage for immediate ancestor insertion, request targeting, canonical boosted ancestors, duplicate and genuine streams, ignored boost streams, sorting, and reload equivalence.
