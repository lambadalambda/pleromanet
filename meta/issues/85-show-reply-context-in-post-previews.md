# 85 Show reply context in post previews

## Summary

Preserve reply context inside replied-to post previews so a previewed reply does not lose the post it was addressing.

## Requirements

- Include the previewed post's direct reply target in the compact preview model.
- Render that target as concise Replying to context above the preview body.
- Fall back to a generic parent-post label when Pleroma provides a parent status ID without an account handle.
- Keep the preview compact, content-warning safe, and viewport-contained.

## Acceptance Criteria

- Previewing a post that is itself a reply shows its direct replied-to account.
- Previewing a non-reply does not show reply context.
- Missing parent-account metadata does not hide the fact that the previewed post is a reply.
- Existing preview interaction, caching, privacy, and responsive behavior remain unchanged.
