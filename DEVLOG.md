# Devlog

## 2026-07-17

- GitHub Pages deployment requires a repository-aware SvelteKit base path because project sites are served below `/<repository>`.
- Pages does not provide an SPA rewrite rule, so deployment publishes the SvelteKit fallback as both `index.html` and `404.html`.
- Timeline settings can persist automatic insertion of queued posts while the page is scrolled to the top, without disrupting readers further down the feed.
- A Pleroma instance with an explicit Phoenix `check_origin` list must include the GitHub Pages origin for browser WebSocket streaming; regular API CORS settings do not control the WebSocket handshake.
- The Pages WebSocket origin is allowed on both `lain.com` and `pleroma.soykaf.com`; unrelated origins remain rejected.
- Routes without route-specific right-rail content omit the rail and expand the main content instead of showing generic profile mock cards.
- Custom themes use eight persisted base colors to derive the app's semantic tokens, with live contrast feedback and atomic, versioned `PN1` share-code import and export.
- Theme drafts preserve their selected built-in source independently from the active theme, and custom palettes now drive composer, duotone, halftone, and accent-filled control treatments.
- Composer uploads use one responsive preview card across home posts and inline replies: images remain uncropped, video and audio are playable before posting, and URL-less media keeps an explicit fallback.
