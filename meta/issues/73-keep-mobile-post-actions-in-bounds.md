# 73 Keep mobile post actions in bounds

## Summary

Keep every status action, including reactions and the overflow menu, reachable within narrow mobile timeline and panel surfaces.

## Requirements

- Make post action rows fit at 320px on timelines, threads, profiles, and bookmarks.
- Do not rely on ancestor overflow clipping to hide controls.
- Preserve readable counts and all existing actions.
- Keep touch controls operable without horizontal document overflow.

## Acceptance Criteria

- With a populated status containing reactions, overflow actions, and multi-digit counts, each post action rectangle remains inside its post surface at 320px.
- `.post-actions` does not horizontally overflow its own box.
- Home, local, federated, thread, profile, and bookmarks retain their action controls.

## Notes

- Child of [69 Audit and polish mobile app](69-audit-and-polish-mobile-app.md).
