# 92 Remove the double seam at thread endings

## Summary

Threads with no rendered replies end with an empty replies container between the focused post border and the outer card border, producing two separated horizontal seams at the bottom.

## Requirements

- End a reply-free thread with a single outer card seam.
- Preserve the divider below the focused post when replies or an inline reply composer follow it.
- Preserve thread card clipping, radius, and responsive behavior.

## Acceptance Criteria

- A thread with no replies does not render an empty replies container.
- The final focused post does not draw a redundant bottom border against the thread card border.
- Threads with replies retain their focused-post divider and reply spacing.
- Focused Playwright coverage, type checks, and the complete mocked route suite pass.

## Notes

- Reported from the bottom edge of a live reply-free thread.
