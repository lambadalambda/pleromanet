# 88 Refresh existing posts after profile updates

## Summary

Updating the signed-in account profile leaves that account's author details stale in posts already loaded by the frontend.

## Requirements

- Reconcile the updated account into already-loaded posts without requiring a page reload.
- Update every loaded occurrence of the account, including nested status representations where applicable.
- Preserve the existing profile update request and feedback behavior.

## Acceptance Criteria

- After a successful profile update, existing posts by the signed-in account immediately show the updated author details.
- Posts by other accounts remain unchanged.
- The updated author details remain visible across client-side navigation through preserved timelines.
- Automated regression coverage verifies the behavior.

## Notes

- Prefer updating cached account references over refetching whole timelines.
