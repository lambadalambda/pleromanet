# 104 Reconcile post counts from notifications

## Summary

Visible timeline and thread posts keep stale favorite, boost, and reply counts when relevant notifications carry a newer status snapshot.

## Requirements

- Reconcile authoritative engagement counts from notification status snapshots into matching loaded posts.
- Cover WebSocket notifications and foreground/background REST notification loads.
- Match canonical source identities so boosts and their source posts update together.
- Update home, local, federated, bookmark, thread, and profile post snapshots without changing unrelated posts.
- Preserve local favorite/boost pressed state and pending optimistic actions while refreshing counts.
- Keep duplicate and stale-session notifications idempotent and isolated.

## Acceptance Criteria

- A relevant streamed notification updates visible favorite, boost, and reply counts immediately in timelines and threads.
- Notification polling applies the same count reconciliation.
- Replaying a notification snapshot does not increment counts again.
- Boost wrappers reconcile through their source status identity.
- Pending local action state is not lost or rolled back to a pre-notification count.
- Focused Playwright coverage, type checks, production build, and the complete mocked Playwright suite pass.
