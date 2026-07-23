# 106 Move visibility badge out of the post title

## Summary

The post visibility badge currently floats between the author identity and timestamp, making it look like part of the title and leaving an awkward gap.

## Requirements

- Group the visibility badge with timestamp metadata at the right edge of standard post headers.
- Keep author name and handle visually continuous.
- Preserve visibility accessibility labels and responsive containment.
- Leave focused-post and reply-composer visibility placement unchanged.

## Acceptance Criteria

- The visibility badge sits directly beside the timestamp rather than in the middle of the title row.
- Public, unlisted, followers-only, and direct labels remain readable and accessible.
- The header remains contained at 320px.
- Focused Playwright coverage, type checks, and the complete mocked Playwright suite pass.
