# 64 Add custom theme editor and share codes

## Summary

Allow users to create, preview, persist, import, and share custom PleromaNet color themes through an approachable interface.

## Requirements

- Model a custom theme with eight user-facing base colors: page background, panel background, primary text, muted text, accent, success, warning, and danger.
- Derive secondary panels, borders, secondary text, accent text, and soft accent surfaces from the base colors instead of requiring users to edit all 20 semantic tokens.
- Add a custom theme editor reachable from the existing appearance controls.
- Let users start from any built-in theme and preview changes immediately against representative UI states.
- Pair color pickers with editable hex fields and validate all imported and edited values.
- Warn when important foreground/background combinations do not meet accessible contrast targets.
- Persist the active custom theme and draft locally without changing the built-in themes.
- Support copying and importing a versioned, readable share code using the fixed eight-color order, for example `PN1:f5f1e8,fbfaf3,1f2347,7a7c95,a48bd9,a8d5b1,e0b97a,d68b8b`.
- Reject malformed or unsupported share codes without replacing the current theme.
- Remove built-in-theme assumptions from the Simoun composer gradient and media duotone treatment so custom themes do not retain unrelated theme colors.
- Keep the editor keyboard-accessible and usable on mobile.

## Acceptance Criteria

- A user can duplicate a built-in theme, edit all eight base colors, and see a live preview.
- Saving and reloading preserves the custom theme and active selection.
- Exporting and re-importing a share code reproduces the same eight base colors.
- Invalid share codes show a useful error and leave the current theme unchanged.
- Derived semantic tokens update consistently without direct user editing.
- Contrast warnings identify failing primary text, muted text, and accent combinations.
- Built-in themes retain their current appearance.
- The custom composer and media treatment use the custom palette.
- Playwright coverage includes editing, persistence, import/export, invalid input, keyboard use, and mobile layout.

## Notes

- The current system has four built-in themes and 20 effective semantic color tokens per theme.
- Keep the `PN1` format versioned so future theme fields can use a new prefix without ambiguous parsing.
- Theme names can remain local metadata; the share code only needs to encode the palette.
