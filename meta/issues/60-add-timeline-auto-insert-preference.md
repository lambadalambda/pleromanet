# 60 Add timeline auto-insert preference

## Summary

Make the timeline settings control functional by allowing users to automatically insert incoming posts while they are scrolled to the top.

## Requirements

- Add an accessible setting to the sliders menu above home, local, and federated timelines.
- Persist the preference locally.
- When enabled and at the top of the page, insert newly queued posts without requiring indicator activation.
- Keep the existing new-post indicator behavior while the user is scrolled away from the top or when the preference is disabled.

## Acceptance Criteria

- The timeline settings menu opens, exposes the setting, and supports keyboard interaction.
- Enabling the setting immediately inserts incoming posts at the top.
- Incoming posts remain queued behind the indicator when scrolled down.
- The setting survives a page reload.
- Focused Playwright coverage and Svelte checks pass.
