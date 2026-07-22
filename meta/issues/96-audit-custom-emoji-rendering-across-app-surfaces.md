# 96 Audit custom emoji rendering across app surfaces

## Summary

Custom emoji do not render correctly in at least some notification content. Audit every app surface that displays status text or account display names to identify metadata propagation and rendering gaps beyond primary post cards.

## Requirements

- Inventory full and compact status, notification, search, profile, thread, quote, boost, bookmark, and preview renderers.
- Trace account-name and status-body custom emoji metadata from Pleroma responses through adapters and component props.
- Identify plain-text renderers that expose shortcodes or omit API-provided emoji images.
- Distinguish intentional plain-text fields from defects in user-authored display names and status content.
- Record concrete findings and missing regression coverage before implementation.

## Acceptance Criteria

- Every status/account text surface is classified as correct, intentionally plain, or defective.
- Defects include file and line references plus the missing data or rendering step.
- Existing relevant tests and coverage gaps are documented.

## Notes

- Keep this issue open until the identified rendering defects are implemented and verified.

## Audit Findings

### Primary defects

- Notification status excerpts drop `status.emojis` in `src/lib/pleroma/ui.ts` and render `post.excerpt` as plain text in `src/lib/rebuild/NotifRow.svelte`. Both the notifications page and header popover are affected; actor display-name emoji are already correct.
- The anonymous `/public` adapter in `src/routes/public/+page.svelte` drops `nameEmojis` and `bodyEmojis` before passing statuses to the shared `Post` component.

### Shared and compact defects

- `src/lib/rebuild/PostCW.svelte` renders folded and revealed content-warning summaries as plain text despite status emoji metadata being available. The same applies to the CW state in `PostPinged.svelte`.
- `src/lib/rebuild/ProfileSideRail.svelte` renders “Also pinned” status bodies as plain text despite `ProfilePost.bodyEmojis` being present.
- `src/lib/rebuild/ChatRow.svelte` renders last-message excerpts as plain text, while `PleromaChatView` and its adapter discard `last_message.emojis`. Full chat messages and account names are correct.
- Composer mention suggestions render account display names as plain text because `ComposerMentionAccount` and its adapter omit account emoji metadata.
- Ancestor and reply attachment-lightbox openers omit author `nameEmojis`; full and focused post openers already propagate them.
- Profile loading, locked, and empty contextual sentences interpolate the display name without `displayNameEmojis`. The settings profile preview does the same; the editable display-name input is intentionally raw.
- Character-based excerpt truncation can bisect a `:shortcode:` in notifications and chat rows even after metadata is propagated.

### Correct primary surfaces

- Authenticated home, local, federated, bookmark, profile-post, focused-post, ancestor, reply, and nested-reply bodies and author names use the shared rich-text path.
- Quoted posts, boost attribution, reply-preview visible names/bodies, search results/dropdowns, notification actor names, reaction images, who-to-follow names, header/user-menu names, profile headings, and full chat messages preserve custom emoji metadata.
- Mobile routes reuse the same live renderers and do not introduce separate status-text gaps.

### Coverage Gaps

- Notification body/CW emoji in page and popover variants.
- Anonymous `/public` author and body emoji.
- CW summaries across post and reply-preview surfaces.
- Pinned compact excerpts, composer mention suggestions, and chat-list excerpts.
- Lightbox attribution from ancestor and reply openers.
- Profile contextual names and settings preview.
- Shortcode-safe truncation boundaries.
