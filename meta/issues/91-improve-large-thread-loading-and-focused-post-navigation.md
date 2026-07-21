# 91 Improve large-thread loading and focused-post navigation

## Summary

Large threads can take long enough to load that the existing text-only state provides weak visual feedback. Once the thread renders, the page remains at the top of a potentially long ancestor chain instead of bringing the status selected by the route into view.

## Requirements

- Show clear, accessible visual activity while the focused status and thread context are loading.
- After a thread loads, scroll the route-selected focused status into view below the thread header.
- Apply the scroll only to the current thread request and do not move keyboard focus.
- Preserve the reader's position when revisiting an already-viewed thread through browser history.
- Preserve existing thread error, retry, ancestor, focused-status, and reply behavior.

## Acceptance Criteria

- A pending thread request displays an animated loading treatment with a live status label.
- A thread with enough ancestors to place the focused status below the viewport automatically scrolls to the focused status after rendering.
- The automatic scroll uses immediate positioning so long threads do not animate through the full ancestor chain.
- Stale thread responses and non-thread routes do not trigger focused-status scrolling.
- Short threads do not scroll unnecessarily, reduced-motion preferences are respected, and browser history restores a saved long-thread position.
- Focused Playwright coverage, type checks, and the complete mocked route suite pass.

## Notes

- Reported against `/app/thread/B8YkORlxVykxlW2SFU` on a large live thread.
