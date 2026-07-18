# 72 Contain mobile composer overlays

## Summary

Keep composer privacy and emoji overlays fully inside narrow and keyboard-reduced phone viewports.

## Requirements

- Clamp the privacy menu within the horizontal visual viewport at 390px and 320px.
- Size and position the emoji picker within both axes of a 320x568 viewport.
- Respect `visualViewport` dimensions when the software keyboard reduces available space.
- Keep overlay contents scrollable and keyboard accessible.

## Acceptance Criteria

- Opening the privacy menu never increases document width or places an edge outside the viewport.
- At 320x568, opening the emoji picker keeps all four picker edges inside the visual viewport.
- A deterministic Playwright test injects a 320x300 `visualViewport` at offset 0, dispatches its resize event, focuses emoji search, and verifies all four picker edges remain within those mocked bounds; physical-iOS keyboard verification remains a manual follow-up.
- Existing composer privacy and emoji interactions remain functional.

## Notes

- Child of [69 Audit and polish mobile app](69-audit-and-polish-mobile-app.md).
