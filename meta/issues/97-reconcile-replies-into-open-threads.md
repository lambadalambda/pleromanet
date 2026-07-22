# 97 Reconcile replies into open threads

## Summary

Submitting a reply while viewing a thread succeeds remotely but does not insert the created status into the open thread, making the action appear to do nothing. Statuses received through streaming have the same problem when they belong to the currently open thread.

## Requirements

- Insert a successfully submitted inline reply into the currently open thread.
- Insert streamed statuses that belong to the currently open thread.
- Preserve reply nesting, deduplication, sort behavior, action state, and session/route isolation.
- Ignore streamed statuses unrelated to the open thread.

## Acceptance Criteria

- A successful focused-post reply appears immediately in the open thread without reloading.
- A successful reply to an existing descendant appears under the correct target.
- A streamed direct or nested reply belonging to the open thread appears once in the correct location.
- Unrelated, duplicate, stale-session, and post-navigation stream updates do not mutate the thread.
- Focused Playwright coverage, type checks, production build, and the complete mocked Playwright suite pass.

## Notes

- Keep WebSocket and REST status adaptation on the existing shared Pleroma paths.
