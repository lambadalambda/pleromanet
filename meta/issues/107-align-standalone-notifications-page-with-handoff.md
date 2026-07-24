# 107 Align standalone notifications page with handoff

## Summary

Bring the authenticated standalone notifications route in line with the canonical notification-page handoff while preserving its real Pleroma data and production behavior.

## Requirements

- Port the handoff header, unread summary, tab bar, time buckets, list surface, empty state, and notification-specific side rail.
- Keep shared notification rows backed by real API data and preserve notification target navigation and follow-request actions.
- Make tab filtering, unread counts, mark-all-read, clear-all, boost filtering, and weekly activity summaries operate on loaded notifications.
- Keep controls that cannot be implemented from currently available relationship or keyword-filter data clearly disabled.
- Preserve responsive behavior and avoid horizontal overflow on phone-width viewports.
- Add typed Pleroma client support for clearing notifications.

## Acceptance Criteria

- Playwright coverage verifies the canonical page composition, filtering, grouped rows, mark-all-read, clear-all, and responsive containment using mocked APIs.
- Client coverage verifies the notification-clear request method and endpoint.
- Existing notification, type, and build checks pass.
- A focused review finds no unresolved actionable issues.

## Notes

- The handoff's delivery values are design specimens rather than account data. Render the card without presenting unsupported values as live preferences.
