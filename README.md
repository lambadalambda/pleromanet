# PleromaNet

PleromaNet is a new frontend for Pleroma focused on a reduced, refined interface. The visual design source file will be added later and should become the reference for UI implementation.

## Status

This repository is at the project setup stage. The application scaffold, test suite, and integration-test environment have not been created yet.

## Development Principles

- TDD first: red, green, refactor.
- `pnpm` is the package manager, with tool versions managed by mise.
- TypeScript is the application language.
- SvelteKit is the application framework, configured as an SPA/static frontend without SSR.
- Svelte 5 only, using current patterns and no legacy usage.
- Functional TypeScript style: arrow functions, no application classes.
- Small, topical commits. Large features are split into smaller commits.
- Detailed contributor and agent rules live in `AGENTS.md`.

## Testing Strategy

- Use Playwright for headless browser tests.
- Default tests should be fast, deterministic, and not require Docker or a live Pleroma instance.
- Mock Pleroma backend behavior in regular tests when needed.
- Maintain dockerized integration tests that run against an ephemeral dockerized Pleroma backend.
- Do not run dockerized integration tests by default; keep them behind explicit mise tasks once those commands exist.
- Run dockerized integration tests after larger changes.

## API Reference

PleromaNet targets Pleroma directly and can rely on Pleroma-specific features being present. Pleroma API documentation is available at https://api.pleroma.social/.
