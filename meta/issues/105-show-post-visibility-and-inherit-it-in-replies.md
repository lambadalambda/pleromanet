# 105 Show post visibility and inherit it in replies

## Summary

Posts should clearly identify whether they are public, unlisted, followers-only, or direct, and every reply should use the exact visibility of its parent post.

## Requirements

- Show a compact, accessible visibility indicator on timeline, thread, profile, bookmark, and public-profile posts.
- Distinguish public, unlisted, followers-only, and direct visibility with clear text available to assistive technology.
- Make home and thread inline replies inherit the exact visibility of the replied-to status.
- Show the inherited visibility inside the reply composer without offering a conflicting override.
- Preserve canonical source visibility when replying to a boost wrapper.
- Serialize the inherited visibility in every reply API request.

## Acceptance Criteria

- Each supported post surface exposes the status visibility in its rendered UI.
- Replies to public, unlisted, followers-only, and direct statuses submit the matching visibility.
- The inline reply composer visibly communicates the inherited visibility before submission.
- Replies to boosts inherit the source status visibility rather than wrapper metadata.
- Focused Playwright coverage, type checks, production build, and the complete mocked Playwright suite pass.
