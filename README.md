# PleromaNet

PleromaNet is a new frontend for Pleroma focused on a reduced, refined interface. The visual design source file is now represented by the implementation plan in `meta/issues.md`.

## Status

This repository contains the initial SvelteKit TypeScript scaffold, configured as an SPA/static frontend without SSR.

## Development Principles

- TDD first: red, green, refactor.
- `pnpm` is the package manager, with tool versions managed by mise.
- TypeScript is the application language.
- SvelteKit is the application framework, configured as an SPA/static frontend without SSR.
- Svelte 5 only, using current patterns and no legacy usage.
- Functional TypeScript style: arrow functions, no application classes.
- Small, topical commits. Large features are split into smaller commits.
- Detailed contributor and agent rules live in `AGENTS.md`.

## Developing

Install dependencies:

```sh
pnpm install
```

Start a development server:

```sh
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev -- --open
```

## Testing

Default tests are Playwright headless browser tests with mocked/local data only. They do not require Docker or a live Pleroma instance.

```sh
pnpm test
```

Run type checks:

```sh
pnpm check
```

Equivalent mise tasks are available:

```sh
mise run test
mise run check
mise run build
```

Dockerized integration tests against an ephemeral Pleroma backend will be added later and kept behind explicit mise tasks.

## Building

To create a production version of your app:

```sh
pnpm build
```

Preview the production build:

```sh
pnpm preview
```

## API Reference

PleromaNet targets Pleroma directly and can rely on Pleroma-specific features being present. Pleroma API documentation is available at https://api.pleroma.social/.
