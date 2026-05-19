# 26 Wire trends and instance metadata

## Summary

Replace mocked trend and instance metadata panels with Pleroma API-backed data where the server supports it.

## Dependencies

- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Wire trends to `getTrendingTags`.
- Wire instance metadata cards to `getInstance`.
- Handle unavailable, disabled, or empty trend data gracefully.
- Preserve curated/design-specific discovery cards only where no Pleroma endpoint exists.

## Acceptance Criteria

- Tests mock `/api/v1/trends/tags` and `/api/v2/instance`.
- Trend and instance panels cover loading, success, empty, disabled/unavailable, and error states.
- Missing trends or feature-disabled responses degrade to clear UI copy rather than broken panels.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Current Status

- Partially done: the API client has `getTrendingTags` and `getInstance` methods.
- Partially done: authenticated app routes use `getInstance` for the composer status character limit.
- Still open: trend and instance metadata panels remain static/design-backed and do not cover loading, empty, unavailable, or error states.

## Notes

- Do not add Mastodon compatibility layers; model Pleroma behavior directly and degrade where needed.
