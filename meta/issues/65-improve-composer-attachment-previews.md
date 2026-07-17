# 65 Improve composer attachment previews

## Summary

Show useful visual and playable previews for media attached in the composer instead of representing completed uploads with generic file-type tiles.

## Requirements

- Display the uploaded image itself without cropping away its composition.
- Display video with its poster and playable media controls.
- Display audio with a recognizable audio treatment and playable media controls.
- Preserve upload progress, errors, filename, alt-text editing, and removal controls.
- Share one reusable preview component between the home composer and inline reply composer.
- Keep attachment previews compact, keyboard-accessible, and responsive on mobile.
- Retain a clear fallback treatment when media preview URLs are unavailable.

## Acceptance Criteria

- A completed image upload shows the returned preview or media URL in the composer.
- Completed video and audio uploads can be previewed before posting.
- Multiple attachments form a responsive grid without horizontal overflow.
- Alt text can still be edited and saved for each uploaded attachment.
- Uploading, failed, and removable states remain clear and accessible.
- Playwright covers image, video, audio, fallback, inline reply, and mobile behavior.

## Notes

- Keep the issue open until the user has reviewed the treatment locally.
- Do not commit or push the implementation before that review.
