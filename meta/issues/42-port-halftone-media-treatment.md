# 42 Port halftone media treatment

## Summary

Port the halftone/duotone media treatment from the updated handoff for image previews where it improves the PleromaNet visual direction.

## Requirements

- Evaluate the canonical halftone shader and variants in `meta/design/claude-handoff/project/halftone-shader.jsx`, `halftone-variants.jsx`, and `halftone-variants.css` before implementation.
- Implement the smallest production-safe media treatment, preferring a progressive-enhancement path that preserves normal image rendering when WebGL or canvas rendering is unavailable.
- Apply the treatment only to agreed image-preview surfaces, such as design-system specimens and selected feed/profile media previews; do not transform audio, video controls, avatars, or emoji.
- Preserve accessibility: original image alt text must remain available, and decorative transformed layers must not duplicate announcements.
- Avoid introducing nondeterministic visual behavior into tests.

## Acceptance Criteria

- `/design-system` includes a stable specimen showing original, existing duotone, and halftone-treated media or the final chosen subset.
- Image previews still render usable fallback images when the halftone path is unavailable.
- Tests or component coverage verify the fallback path and that non-image attachments are not transformed.
- Existing media attachment, quoted-post, profile media, and timeline tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/halftone-shader.jsx`, `halftone-variants.jsx`, and `halftone-variants.css`.
- The handoff calls the 10px hex classic treatment the recommended default for recognizable feed photos, but implementation should still be constrained to surfaces where the treatment is wanted.
