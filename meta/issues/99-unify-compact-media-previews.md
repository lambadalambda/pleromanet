# 99 Unify compact media previews

## Summary

Reply-context previews and notification excerpts currently reduce media posts to inconsistent text placeholders such as “media post” and “[image]” instead of showing useful compact previews.

## Requirements

- Use one compact media-preview treatment for reply previews and notification excerpts.
- Show small image thumbnails when media is safe to reveal.
- Show a representative frame from video attachments without playing the video.
- Keep content-warning and sensitive/NSFW media concealed by default.
- Preserve concise text fallbacks when media cannot be previewed.
- Keep compact previews accessible and contained on desktop and mobile.

## Acceptance Criteria

- Image-only reply previews and notification excerpts show compact thumbnails instead of placeholder text.
- Video-only reply previews and notification excerpts show a sampled still frame instead of placeholder text or autoplaying media.
- Sensitive and content-warning media do not expose visual content in compact previews.
- Missing or unsupported media retains an explicit fallback label.
- Focused Playwright coverage, type checks, production build, and the complete mocked Playwright suite pass.
