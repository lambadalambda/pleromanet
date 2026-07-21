# 94 Render custom emoji in reply previews

## Summary

Reply-preview loading adapts custom emoji on the parent status, but the preview model drops the author's display-name emoji and status-body emoji arrays. The tooltip then renders both fields as plain text, leaving shortcodes visible.

## Requirements

- Preserve display-name and body custom emoji metadata in reply previews.
- Render preview names and visible bodies through the shared rich-text emoji treatment.
- Keep content-warning bodies hidden and preserve existing mention/link safety in tooltips.

## Acceptance Criteria

- A parent preview replaces custom emoji shortcodes in the display name and visible body with images using the API-provided URLs and alt text.
- Preview text no longer displays the replaced shortcode as plain text.
- Content-warning, unavailable, loading, cache, and positioning behavior remain unchanged.
- Focused Playwright coverage, type checks, and the complete mocked Playwright suite pass.

## Notes

- Reported against reply-context tooltips in the authenticated app.
