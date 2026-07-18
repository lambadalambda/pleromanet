# 82 Support sensitive posts and media

## Summary

Hide incoming sensitive media behind an explicit reveal control and let composers mark outgoing statuses as sensitive through Pleroma's status-level flag.

## Requirements

- Preserve attachments from incoming statuses marked `sensitive` instead of permanently dropping them.
- For sensitive statuses without a content warning, keep body text visible while hiding all media behind a keyboard-accessible reveal control.
- Keep the existing whole-post content-warning fold when `spoiler_text` is present, without adding a second media gate.
- Add a status-level sensitive-media toggle to the main composer and inline reply composer.
- Serialize the outgoing flag as `sensitive=true` through the Pleroma status creation API.
- Reset sensitive state after successful submission or composer cancellation.
- Treat sensitivity as status-level; do not imply that individual attachments can be marked independently.

## Acceptance Criteria

- An incoming `sensitive: true` status without `spoiler_text` initially hides its media, keeps its body visible, and reveals media on activation.
- An incoming status with both `sensitive: true` and a content warning uses only the existing content-warning reveal flow.
- Main and inline reply composers submit `sensitive=true` when enabled and omit the field when disabled.
- Composer controls are keyboard accessible and clearly describe their status-level effect.
- API, adapter, and browser regressions pass without a live Pleroma instance.

## Notes

- Pleroma's compatible status API applies `sensitive` to the status media collection, not individual media attachments.
