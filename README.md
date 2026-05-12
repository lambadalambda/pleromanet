# PleromaNet

PleromaNet is a new frontend for Pleroma focused on a reduced, refined interface. The visual design source file will be added later and should become the reference for UI implementation.

## Status

This repository is at the project setup stage. The application scaffold, test suite, and integration-test environment have not been created yet.

## Development Principles

- TDD first: red, green, refactor.
- `pnpm` is the package manager.
- Svelte 5 only, using current patterns and no legacy usage.
- Functional JavaScript style: arrow functions, no classes.
- Small, topical commits. Each feature gets its own commit; large features are split into smaller commits.

## Testing Strategy

- Use Playwright for headless browser tests.
- Mock Pleroma backend behavior in regular tests when needed.
- Maintain dockerized integration tests that run against an ephemeral dockerized Pleroma backend.
- Do not run dockerized integration tests by default.
- Run dockerized integration tests after larger changes.

## API Reference

Pleroma API documentation is available at https://api.pleroma.social/.
