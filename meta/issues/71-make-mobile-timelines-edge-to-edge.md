# 71 Make mobile timelines edge to edge

## Summary

Use the full phone viewport width for primary home, local, and federated timeline surfaces instead of retaining desktop-style outer gutters.

## Requirements

- Remove horizontal shell gutters from primary authenticated timeline routes at phone widths.
- Keep internal composer and post padding so content remains readable.
- Preserve inset card treatment for settings, explore, messages, and other conventional panel routes.
- Preserve tablet and desktop layouts.

## Acceptance Criteria

- Home, local, and federated feed surfaces touch both viewport edges at the phone breakpoint.
- Timeline surfaces fill the viewport at 390px and 320px; the separate 320px post-action overflow is owned by issue 73 and remains a parent-audit completion dependency.
- Timeline content has no horizontal document overflow at 390px.
- Non-timeline panel routes retain their intended outer inset.

## Dependencies

- [73 Keep mobile post actions in bounds](73-keep-mobile-post-actions-in-bounds.md) owns the remaining 320px document overflow and must close before parent issue 69.

## Notes

- Child of [69 Audit and polish mobile app](69-audit-and-polish-mobile-app.md).
