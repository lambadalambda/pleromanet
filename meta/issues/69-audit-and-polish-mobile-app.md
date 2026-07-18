# 69 Audit and polish mobile app

## Summary

Perform a thorough mobile UX audit of the authenticated PleromaNet application, document confirmed rough edges as focused child issues, and fix them through the standard issue, TDD, review, commit, and push cadence.

## Requirements

- Audit home, local, federated, thread, profile, notifications, explore/search, messages, bookmarks, and settings routes at representative phone widths.
- Check viewport fitting, unintended horizontal gaps or overflow, text-input zoom behavior, touch target usability, fixed navigation overlap, dialogs and sheets, media sizing, and long-content resilience.
- Create focused child issues for confirmed defects rather than combining unrelated fixes.
- Preserve the established desktop visual language and behavior.
- Add deterministic Playwright regressions before each behavioral or layout fix.
- Use only GPT-5.6 Sol subagents for delegated review work.

## Acceptance Criteria

- Confirmed mobile defects are recorded in linked repository issues with reproducible acceptance criteria.
- Issues 70 through 77 satisfy their acceptance criteria and are completed, or any deferred child is explicitly documented with a blocker and follow-up decision.
- Mobile routes do not trigger input-focus zoom through sub-16px form controls.
- Timeline surfaces use the intended mobile viewport width without desktop gutters.
- Fixed navigation, overlays, forms, media, and long content remain usable without horizontal document overflow.
- Focused reviews have no remaining actionable findings.
- Relevant route suites, responsive regressions, `pnpm check`, and production build pass.

## Notes

- User-reported starting points: iOS-style focus zoom on some text boxes and timeline content not filling the available horizontal space.
- Confirmed child issues: [70 input focus zoom](70-prevent-mobile-input-focus-zoom.md), [71 edge-to-edge timelines](71-make-mobile-timelines-edge-to-edge.md), [72 composer overlays](72-contain-mobile-composer-overlays.md), [73 post actions](73-keep-mobile-post-actions-in-bounds.md), [74 notification popover](74-fit-mobile-notification-popover.md), [75 navigation overlay focus](75-make-mobile-navigation-overlays-modal.md), [76 feedback positioning](76-keep-mobile-feedback-above-navigation.md), and [77 poll editor](77-fix-mobile-poll-editor-layout.md).
- Residual product decisions: choose a project-wide 40px or 44px touch-target standard before broad control enlargement; physical iOS testing should precede safe-area or standalone-PWA viewport changes.
