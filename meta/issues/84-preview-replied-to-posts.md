# 84 Preview replied-to posts

## Summary

Show a compact floating representation of a reply's parent post when the Replying to context is hovered or focused.

## Requirements

- Preserve parent status IDs through the render-facing post models.
- Load parent posts lazily when reply context is hovered or keyboard-focused.
- Cache parent preview requests so repeated interactions do not refetch the same status.
- Show the parent author, handle, timestamp, and a safe text excerpt in a viewport-contained floating card.
- Do not reveal content hidden behind a content warning in the preview.
- Keep the existing parent-account navigation link usable.
- Handle loading and unavailable parent posts without disrupting the reply.

## Acceptance Criteria

- Hovering Replying to on a reply opens a preview of the replied-to post.
- Focusing the reply context opens the same preview for keyboard users.
- Moving pointer and focus away closes the preview without blocking the existing account link.
- Reopening a loaded preview does not issue another parent-status request.
- Content-warned parent posts show their warning instead of hidden body content.
- The preview remains inside narrow viewports.

## Notes

- This is a compact context preview, not an embedded interactive post.
