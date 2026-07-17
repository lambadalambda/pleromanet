# 66 Prefill replies with all participants

## Summary

When replying to a post, initialize the composer with mentions for the replied-to author and every account mentioned by that post, matching Pleroma FE recipient behavior.

## Requirements

- Build reply participants from the exact replied-to status author followed by its API-provided mentions.
- Preserve the API mention order after the author.
- Deduplicate participants by account ID while retaining the first occurrence.
- Exclude the current account from generated reply mentions.
- Use each account's raw `acct`, keeping local handles short and remote handles fully qualified.
- Insert the generated mentions as a space-separated prefix with one trailing space.
- Apply the same behavior to home, public timeline, focused thread, ancestor, and nested reply composers.
- Preserve the existing reply target ID, inherited visibility, media, content warning, poll, autocomplete, and submission behavior.

## Acceptance Criteria

- Replying to a post with multiple mentions prefills the author and all other mentioned accounts.
- The current user and duplicate account IDs are omitted.
- Recipient ordering matches Pleroma FE: author first, then status mentions in API order.
- Local and remote `acct` values serialize correctly in the submitted status text.
- Replying to one's own post produces no self-mention unless other participants are present.
- Boost wrappers use the original status author and mentions rather than the booster.
- Playwright covers home and thread reply flows, duplicate/self filtering, ordering, and submitted request bodies.

## Notes

- Reference behavior: `pleroma-fe/src/components/post_status_form/post_status_form.js` builds recipients from `[repliedStatus.user, ...repliedStatus.attentions]`, deduplicates by ID, and removes the current user.
- Keep the issue open until the user has reviewed the behavior locally.
- Do not commit or push before that review.
