# 80 Simplify the mobile app shell

## Summary

Remove the redundant mobile bottom navigation and make timeline content meet the top header without an empty gutter.

## Requirements

- Remove the mobile Home, Explore, Settings, and More bottom navigation from the real app shell.
- Keep primary navigation available through the header logo and mobile side drawer.
- Remove the bottom navigation's details sheet and obsolete viewport-space reservations.
- At the top of mobile Home, Local, and Federated timelines, place the timeline surface directly below the sticky header.
- Preserve inset spacing for non-timeline panel routes and retain desktop layout behavior.

## Acceptance Criteria

- The real app renders no mobile bottom navigation at tablet or phone breakpoints.
- At 390px and 320px widths, the Home, Local, and Federated timeline surfaces meet the header with no measurable vertical gap.
- Mobile overlays, composer privacy controls, notifications, and feedback remain contained without reserving space for the removed navigation.
- Existing responsive, route, and timeline tests pass after their obsolete bottom-navigation expectations are updated.

## Notes

- The PleromaNet logo already links to Home, and the header menu exposes the full app navigation.
