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
- Timeline content has no horizontal document overflow at 390px and 320px.
- Non-timeline panel routes retain their intended outer inset.

## Notes

- Child of [69 Audit and polish mobile app](69-audit-and-polish-mobile-app.md).
