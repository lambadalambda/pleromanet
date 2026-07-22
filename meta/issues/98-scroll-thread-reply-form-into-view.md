# 98 Scroll thread reply form into view

## Summary

Opening an inline reply composer at the end of a thread can place the form below the viewport, making the action appear incomplete until the user scrolls manually.

## Requirements

- Scroll an opened thread reply form into view when it extends below the viewport.
- Keep the composer associated with the selected thread post.
- Do not move the page when the complete reply form is already visible.
- Preserve keyboard focus and reduced-motion behavior.

## Acceptance Criteria

- Replying to the last visible post in a thread reveals the complete inline reply form without manual scrolling.
- Opening an already visible inline reply form does not cause unnecessary page movement.
- Focus remains usable in the opened composer.
- Focused Playwright coverage, type checks, production build, and the complete mocked Playwright suite pass.
