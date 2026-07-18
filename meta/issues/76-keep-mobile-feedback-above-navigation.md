# 76 Keep mobile feedback above navigation

## Summary

Position transient post feedback above the fixed mobile navigation instead of obscuring bottom navigation tabs.

## Requirements

- Offset post-control feedback by the mobile navigation height without changing the app's deferred safe-area policy.
- Preserve the existing desktop feedback position.
- Keep feedback readable without blocking primary navigation.

## Acceptance Criteria

- At 390px, the feedback toast bottom remains at least 8px above the mobile navigation top.
- Copy-link and other post-control feedback remain visible.
- Mobile navigation tabs remain clickable while feedback is shown.

## Notes

- Child of [69 Audit and polish mobile app](69-audit-and-polish-mobile-app.md).
