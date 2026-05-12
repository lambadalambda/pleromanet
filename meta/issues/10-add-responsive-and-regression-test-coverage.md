# 10 Add responsive and regression test coverage

## Summary

Add broad Playwright coverage for the design implementation and define the opt-in dockerized integration test workflow.

## Requirements

- Add Playwright projects or fixtures for desktop, medium, tablet, and mobile viewport coverage.
- Cover core signed-out, signed-in shell, timeline, thread, explore, and settings flows with mocked backend data.
- Add assertions for known layout risks: composer overflow, who-to-follow handle truncation, hidden right rail, mobile drawer, mobile sheet, and bottom tab behavior.
- Add mise tasks for default tests and, once available, dockerized integration tests.
- Define a separated integration test location or tag, such as `tests/integration` or `@integration`.
- Keep dockerized Pleroma integration tests opt-in and excluded from default local and CI test runs.

## Acceptance Criteria

- Default Playwright tests run headlessly and deterministically without Docker.
- Responsive tests cover at least the prototype's desktop, tablet, and small mobile breakpoints.
- `mise run test:integration` or equivalent is documented once the dockerized backend exists.
- The issue remains open until the integration-test workflow is either implemented or explicitly split into follow-up issues.

## Notes

- Run dockerized integration tests after larger changes, especially API, authentication, persistence, or cross-page flow changes.
