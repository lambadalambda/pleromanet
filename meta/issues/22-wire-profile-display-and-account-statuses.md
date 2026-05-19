# 22 Wire profile display and account statuses

## Summary

Add routed account profile display with public account details and account status lists.

## Dependencies

- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Add typed API support for account lookup and account statuses if missing.
- Add routed profile pages for local or remote accounts.
- Render account avatar, banner, display name, remote handle, fields, counts, and public note.
- Account `note` HTML must be sanitized or rendered through a constrained allowlist before DOM insertion.
- Signed-out visitors can view public profile information and see a sign-in prompt for authenticated actions.

## Acceptance Criteria

- Tests cover viewing local and remote profiles with mocked account/status fixtures.
- Profile status lists render through Pleroma adapters and timeline components.
- Unsafe account-note markup is sanitized or excluded by tested rendering code.
- Signed-out and signed-in profile states are covered.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Current Status

- Partially done: the API client has `getAccount` support.
- Partially done: `/app/profiles/...` is routable inside the real app shell, but it is still a placeholder surface.
- Still open: profile account loading, account status lists, signed-out profile viewing, and account-note sanitization are not implemented.

## Notes

- Follow/unfollow actions are split into issue 24.
