# 25 Wire explore search

## Summary

Connect explore search to the Pleroma search API with deterministic debounce and accessible result navigation.

## Dependencies

- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Wire explore search to `client.search`.
- Debounce delay must be configurable so default tests can set it to `0ms` or otherwise avoid real-timer flakiness.
- Render account, status, and hashtag results where returned by Pleroma.
- Support keyboard focus, query submission, result-group navigation, and result activation.
- Add loading, no-results, error, retry, and cleared-query states.

## Acceptance Criteria

- Tests mock `/api/v2/search` and cover accounts, statuses, hashtags, no results, and API error.
- Debounced search behavior is tested deterministically without real timer delays.
- Keyboard navigation can focus the search field, move through result groups, and activate a result.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Notes

- Trends and instance metadata are split into issue 26.
