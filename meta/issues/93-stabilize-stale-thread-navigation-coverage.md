# 93 Stabilize stale-thread navigation coverage

## Summary

The stale-thread response regression manually pushes browser history and dispatches a synthetic popstate event. That unsupported navigation shortcut can race with SvelteKit and failed in GitHub Actions without leaving thread A.

## Requirements

- Navigate from pending thread A to rendered thread B through SvelteKit's normal intercepted-link path.
- Keep thread A's request alive so the stale-response viewport assertion remains meaningful.
- Avoid synthetic popstate events in the regression.

## Acceptance Criteria

- The stale-thread regression passes repeatedly in the same full test discovery used by CI.
- Releasing thread A after thread B renders does not change thread B or its scroll position.
- Type checks and the complete mocked Playwright suite pass.

## Notes

- GitHub Actions run `29831817681` failed only at this navigation step; the remaining 360 tests passed.
