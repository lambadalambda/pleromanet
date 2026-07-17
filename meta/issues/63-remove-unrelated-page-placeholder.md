# 63 Remove unrelated page placeholder

## Summary

Remove the unrelated placeholder shown in the right rail on a real content page.

## Requirements

- Identify the route and conditional rendering responsible for the placeholder.
- Keep useful timeline and discovery right-rail content unchanged.
- Do not replace the placeholder with another unrelated card.

## Acceptance Criteria

- The affected page no longer renders the placeholder.
- Existing route-specific right-rail coverage continues to pass.
- Svelte and TypeScript checks pass.
