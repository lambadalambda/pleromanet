# AGENTS.md

## Project

PleromaNet is a new frontend for Pleroma with a reduced, refined visual style. Design references will be added later and should guide UI work once available.

## Core Rules

- Practice TDD: red, green, refactor.
- Prefer small, topical changes over broad rewrites.
- Commit early and often. Each feature should have its own commit; larger features should be split into multiple commits.
- Use `pnpm` for package management.
- Use mise tasks for complicated or repeated workflows, especially dockerized testing.
- Use the latest Svelte 5 release and avoid legacy Svelte patterns.
- Follow the Svelte 5 migration guidance: https://svelte.dev/docs/svelte/v5-migration-guide
- Use a functional JavaScript style: arrow functions, no classes, and small composable functions.

## Testing

- Write tests before implementation when adding behavior.
- Use Playwright for headless browser testing.
- Mock backend behavior in tests when needed to keep tests deterministic.
- Integration tests should be dockerized and use an ephemeral dockerized Pleroma backend.
- Dockerized integration tests are not run by default.
- Run dockerized integration tests after larger changes.
- Put dockerized integration test commands behind mise tasks once they exist.

## Pleroma API

- API documentation: https://api.pleroma.social/
- Prefer typed, isolated API client code once the application scaffold exists.
- Keep API-facing tests independent from a live backend unless explicitly running integration tests.

## Implementation Preferences

- Keep changes minimal and direct.
- Preserve the project's reduced/refined direction; avoid generic dashboard aesthetics.
- Do not introduce backward-compatibility layers unless there is a concrete need.
- Keep code comments rare and focused on non-obvious behavior.
