# 39 Design and wire emoji reaction row

## Summary

Add Pleroma emoji reactions to post rendering, guided by the newly imported reaction and postmark variant pages.

## Requirements

- Add typed Pleroma adapter support for status emoji reactions, including unicode emoji and custom emoji shortcodes/assets when present.
- Choose a stable canonical reaction-row direction from `reaction-variants.jsx` and `postmark-variants.jsx` before implementation.
- Render reaction rows in shared post surfaces without disrupting reply, boost, favorite, media, content warning, and thread layouts.
- Support viewer-selected reactions distinctly from other reactions.
- Provide an add-reaction affordance shape even if the first pass keeps submission mocked or deferred.

## Acceptance Criteria

- Mocked Pleroma statuses with emoji reactions render a reaction row in home timeline, thread, and design-system specimens.
- Custom emoji reactions can render with accessible names/alt text.
- Existing post action tests continue to pass, and focused tests cover reaction-row layout and selected-state behavior.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/reaction-variants.jsx`, `reaction-variants.css`, `postmark-variants.jsx`, and `postmark-variants.css`.
- The current application only handles emoji reactions as an unknown notification type; status-level reaction rows are not wired yet.
