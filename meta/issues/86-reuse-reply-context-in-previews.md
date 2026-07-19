# 86 Reuse reply context in previews

## Summary

Render reply context inside post previews with the same shared Replying to component used by normal post cards.

## Requirements

- Remove the preview-specific reply-context markup and styling.
- Reuse the existing PostPinged component for previewed replies.
- Keep nested preview context static so it cannot recursively fetch another preview.
- Preserve direct-parent selection, generic fallback, content-warning safety, and viewport containment.

## Acceptance Criteria

- A previewed reply uses the normal `.post-pinged` label and parent-chip treatment.
- Preview-specific reply-context markup no longer exists.
- Previewed non-replies show no Replying to footer.
- Existing preview interaction and privacy behavior remains unchanged.
