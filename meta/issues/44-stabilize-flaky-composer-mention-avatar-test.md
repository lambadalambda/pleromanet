# 44 Stabilize flaky composer mention avatar test

## Summary

`home-timeline.e2e.ts › composer mention avatars fall back when remote avatar images fail` intermittently fails in full-suite runs: after `pressSequentially('@so', { delay: 20 })` the mention suggestions listbox sometimes never opens within the 5s timeout. The test passes reliably in isolation.

## Requirements

- Reproduce or reason out the race (likely the debounced account-search request vs. typing simulation under full-suite load).
- Make the suggestion-open wait deterministic, for example by waiting for the account-search request before asserting the listbox, or making the autocomplete debounce injectable for tests.

## Acceptance Criteria

- The test passes consistently in full-suite runs (several consecutive `pnpm test` runs without this failure).
- No behavior change to the composer autocomplete itself.

## Notes

- Observed on 2026-07-02 during a full-suite run (263 passed, this one failed; passed twice in isolation immediately after).
