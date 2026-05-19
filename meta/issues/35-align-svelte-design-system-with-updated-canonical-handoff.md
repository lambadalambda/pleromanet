# 35 Align Svelte design system with updated canonical handoff

## Summary

Bring `/design-system` back into parity with the updated canonical handoff after the component-level ports are complete.

## Dependencies

- 29 Port poll attachments from updated handoff.
- 30 Port composer CW and poll editor panels.
- 31 Port post content warning wrapper.
- 32 Port boosted post rendering.
- 33 Update reply addressee chips.
- 34 Port inline thread reply composer.

## Requirements

- Update `/design-system` section content to match `meta/design/claude-handoff/project/design-system.jsx` v2.4.58.
- Add the new Polls, Content warnings, Boosts, expanded Composer, expanded Reply addressees, and updated Thread specimens.
- Replace hardcoded stale specimen labels and notes with the updated canonical labels and copy.
- Fix the sidebar shared-primitive count so it is not permanently `0 shared primitives`.
- Decide whether the new variant pages should remain only as canonical handoff references or be exposed through Svelte design-system specimens.

## Acceptance Criteria

- The Svelte `/design-system` section order and specimen set match the canonical handoff for stable shared primitives.
- Focused Playwright coverage asserts the newly added canonical specimen groups are present.
- Mobile `/design-system` coverage remains green with no horizontal overflow.
- `pnpm run check`, the design-system Playwright suite, and `pnpm test` pass.

## Current Status

- Partially done: several canonical specimen groups are present, including polls, content warnings, boosted posts, reply addressee chips, notifications, radio, and oekaki.
- Still open: the sidebar still reports `0 shared primitives`, and issue 30 composer specimens are missing.
- Still open: final parity with `design-system.jsx` v2.4.58 has not been audited section-by-section.

## Notes

- Follow the project rule to port `/design-system` section by section from the JSX handoff and stop after each section for visual confirmation when doing substantial visual work.
- Source of truth: `meta/design/claude-handoff/project/design-system.jsx` and `meta/design/claude-handoff/project/design-system.css`.
