# 83 Make Explore search only

## Summary

Reduce the unfinished Explore route to its working search functionality and make that search the route's clear visual focus.

## Requirements

- Keep the existing Explore search behavior that opens the full search results route.
- Remove placeholder hero, tags, topics, communities, discovery feed, and Explore-specific right-rail content.
- Present a prominent, accessible search field as the only Explore feature.
- Keep the search surface usable without horizontal overflow on mobile.
- Preserve the established PleromaNet visual language and app navigation.

## Acceptance Criteria

- `/app/explore` displays one prominent search form and no unfinished discovery controls or content.
- Submitting a query navigates to `/app/search` with the encoded query.
- Explore has no right rail at desktop widths.
- The search form fits and remains usable at mobile widths.

## Notes

- This intentionally removes unimplemented placeholders rather than disabling them.
