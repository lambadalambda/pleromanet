# 45 Wire focused post follow button

## Summary

The thread focused-post header renders a static Follow/Following button (`FocusedPost.svelte`) with no click handler and no real relationship state — it shows "Follow" even on the viewer's own posts. Wire it to the relationship state and mutations now available from issue 24, or hide it until wired.

## Requirements

- Derive the focused post author's relationship state (self/following/requested/blocked) from fetched relationships or the account cache.
- Hide the button for the viewer's own posts.
- Either wire follow/unfollow with the optimistic pattern used on profile pages, or clearly disable the control until it is wired.

## Acceptance Criteria

- The viewer's own focused posts show no follow affordance.
- For other authors the button reflects the real relationship state, and clicking it (if wired) round-trips the relationship mutation with rollback on failure.
- Covered by mocked tests in `app-thread.e2e.ts`.

## Notes

- Observed during live testing against fediffusion.art on 2026-07-02: sophia's own thread page showed an inert "Follow" button.
