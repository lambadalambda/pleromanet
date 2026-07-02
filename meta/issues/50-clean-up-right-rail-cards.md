# 50 Clean up right rail cards

## Summary

Per user direction: remove the Shortcuts card (its controls and keyboard hints do nothing), remove the Instance status card (not useful), and only show "Who to follow" when the backend actually returns suggestions — today it renders three hardcoded mock accounts with a fake follow toggle.

## Requirements

- Remove the Shortcuts card from the timeline right rail and the mobile details sheet; give the sheet the real rail content (trends, suggestions) instead so it isn't empty.
- Remove the Instance status card and its page-level state; keep the instance fetch that feeds the composer character limit.
- Wire "Who to follow" to `GET /api/v2/suggestions` (verified live on Pleroma: exists, returns `{source, account}` entries). Render the card only when at least one suggestion is returned; hide it while loading, when empty, and on error.
- Follow buttons on real suggestions perform the real follow mutation with server reconciliation; the dead "View more suggestions" footer is dropped from the wired card.
- Keep the static SurfaceCard specimens in `/design-system` as design reference.

## Acceptance Criteria

- Timeline rails no longer render Shortcuts or Instance status cards.
- With mocked suggestions the card renders real accounts and a working follow button; with `[]` or an error the card is absent.
- Default tests mock `/api/v2/suggestions`; existing trends, rail, and mobile-sheet tests updated and passing.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Requested by the user on 2026-07-02.
