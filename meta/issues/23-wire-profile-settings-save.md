# 23 Wire profile settings save

## Summary

Connect the profile settings form to the Pleroma account update API and reconcile the authenticated account state.

## Dependencies

- 11 Add reactive auth state and session lifecycle.
- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Populate account/profile settings from the authenticated session or verified account request.
- Save profile settings through `updateAccountProfile`.
- Reconcile the returned account with reactive auth/session state where appropriate.
- Preserve dirty-state, reset, loading, success, and error behavior.
- Keep profile avatar and header upload rows visual-only placeholders; media upload API wiring is out of scope.

## Acceptance Criteria

- Tests cover initial form population, edit dirty-state, save success, save failure, reset behavior, and session/account reconciliation.
- Profile field payload shape is asserted against the typed API boundary.
- Avatar and header upload controls render as disabled or no-op placeholders.
- 401/403 responses trigger the global behavior established by issue 11.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Notes

- This issue should not add media upload support.
