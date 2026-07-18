# 77 Fix mobile poll editor layout

## Summary

Make the expanded composer poll editor fit and remain usable on 320px phone layouts.

## Requirements

- Stack poll settings when two columns cannot fit.
- Allow labels and toggle rows to wrap without increasing document width.
- Keep remove and toggle controls visible, focusable, and activatable without overlap.
- Preserve desktop poll-editor layout.

## Acceptance Criteria

- Opening the poll editor at 320px does not create horizontal document or panel overflow.
- Every poll control remains inside the panel.
- Settings stack at 320px and remain two-column at the 1280px desktop viewport.
- Existing poll creation behavior passes.

## Notes

- Child of [69 Audit and polish mobile app](69-audit-and-polish-mobile-app.md).
