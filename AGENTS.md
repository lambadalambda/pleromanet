# AGENTS.md

## Project

PleromaNet is a new frontend for Pleroma with a reduced, refined visual style. Design references will be added later and should guide UI work once available.

## Core Rules

- Practice TDD: red, green, refactor.
- Prefer small, topical changes over broad rewrites.
- Make atomic, topical commits. Larger features should be split into smaller commits that each represent one logical change.
- Use `pnpm` for package management. Pin tool versions through `mise.toml` and, once scaffolded, `packageManager` plus the lockfile.
- Use mise tasks for complicated or repeated workflows, especially dockerized testing.
- Use TypeScript for application code, component props, and API client boundaries.
- Use SvelteKit as the application framework, configured for SPA/static output rather than SSR.
- Use Svelte 5 with current, non-legacy patterns. Keep dependency upgrades intentional through the lockfile.
- Follow the Svelte 5 docs: https://svelte.dev/docs/svelte/overview
- Use the Svelte 5 migration guide as a checklist for legacy patterns to avoid: https://svelte.dev/docs/svelte/v5-migration-guide
- Avoid legacy Svelte patterns: no `export let`, `on:` directives, `createEventDispatcher`, `<slot>`, `$:` reactive statements, or `new Component()` usage in application code.
- Use a functional TypeScript style: arrow functions, no application classes, and small composable functions.

## Testing

- Write tests before implementation when adding behavior.
- Use Playwright for headless browser testing.
- Default tests should be fast, deterministic, and not require Docker or a live Pleroma instance.
- Mock Pleroma backend behavior in default tests when needed.
- Integration tests should be dockerized and use an ephemeral dockerized Pleroma backend.
- Dockerized integration tests are not run by default.
- Keep dockerized integration tests in a clearly separated location or tag group, such as `tests/integration` or `@integration`.
- Run dockerized integration tests after larger changes, especially changes touching API behavior, authentication, persistence, or cross-page flows.
- Put dockerized integration test commands behind explicit mise tasks, such as `mise run test:integration`, once those commands exist.

## Pleroma API

- API documentation: https://api.pleroma.social/
- Target Pleroma directly and assume Pleroma-specific features are present.
- Do not add Mastodon-compatibility abstractions unless they serve a concrete PleromaNet need.
- Prefer typed, isolated API client code once the application scaffold exists.
- Keep API-facing tests independent from a live backend unless explicitly running integration tests.

## Implementation Preferences

- Keep changes minimal and direct.
- Preserve the project's reduced/refined direction; avoid generic dashboard aesthetics.
- Do not introduce backward-compatibility layers unless there is a concrete need.
- Do not write class declarations or class inheritance in application code. Framework internals and third-party APIs are exempt.
- Keep code comments rare and focused on non-obvious behavior.
- Agents should only create commits when explicitly requested.
