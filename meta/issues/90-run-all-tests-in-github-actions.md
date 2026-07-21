# 90 Run all tests in GitHub Actions

## Summary

Add GitHub CI coverage for the complete default and dockerized integration test suites so pushes and pull requests are validated before deployment.

## Requirements

- Run Svelte checks and the complete default Playwright suite on pushes to `master` and pull requests.
- Install the pinned Node, pnpm dependencies, and Playwright Chromium runtime in CI.
- Run the dockerized Pleroma integration suite in a separate CI job.
- Preserve the existing GitHub Pages deployment workflow.
- Upload Playwright diagnostics when a suite fails.

## Acceptance Criteria

- Workflow syntax is valid.
- Default CI invokes all non-integration Playwright tests with one worker.
- Integration CI invokes `pnpm test:integration` against its ephemeral Docker Compose stack.
- Local checks and workflow review pass.
