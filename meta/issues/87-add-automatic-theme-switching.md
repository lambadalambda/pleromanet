# 87 Add automatic theme switching

## Summary

Allow people to keep one fixed theme or choose separate light and dark themes that follow the operating system color-scheme preference.

## Requirements

- Preserve the current single-theme behavior as an explicit supported mode.
- Add an automatic mode with independently selected light and dark themes.
- Apply the appropriate selected theme on initial load and whenever the system preference changes.
- Persist the mode and both automatic-theme selections.
- Keep custom-theme behavior and existing built-in theme switching intact.
- Keep theme controls accessible and usable on mobile.

## Acceptance Criteria

- Single-theme mode always applies its selected theme regardless of system preference.
- Automatic mode applies the selected light theme for a light system preference and the selected dark theme for a dark preference.
- Automatic mode reacts to system preference changes without a reload.
- Mode and selections survive reloads.
- Existing saved custom themes can be used without losing their palette.
