# 68 Prevent sidebar stat clipping

## Summary

Keep the authenticated desktop sidebar wide enough for profile statistics such as Following and Followers to render without clipping.

## Requirements

- Preserve the base 240px left rail at every breakpoint where the desktop sidebar remains visible, intentionally overriding the narrower handoff breakpoints.
- Keep all profile statistic labels inside their cells without truncation or horizontal overflow.
- Preserve the existing tablet and mobile sidebar collapse behavior.

## Acceptance Criteria

- The left sidebar is at least 240px wide at desktop and medium viewport sizes.
- Posts, Following, and Followers labels fit within their statistic cells at those viewport sizes.
- The authenticated shell has no horizontal overflow across existing responsive breakpoints.
- Relevant responsive and app-shell Playwright regressions pass.
