# Devlog

## 2026-07-23

- Compact notification and reply-context images now expand into viewport-contained original-image previews on hover or keyboard focus while preserving sensitive/CW privacy across live notification refreshes.
- Notification image excerpts have twice the previous vertical room and preserve full aspect ratios; reply previews and notification excerpts retain accessible, non-nested navigation controls around the new image interactions.
- Authenticated timeline settings now offer a persisted Fit images preference that contains complete standard, mixed, strip, and quoted images across home, local, and federated feeds without changing other post surfaces.

## 2026-07-22

- Home, local, and federated streams now reconnect stalled sockets and page through REST catch-up from stable watermarks after failures, successful reconnects, and retained-route returns without skipping, duplicating, or reordering concurrent posts.
- Open threads now reconcile locally created and user-stream replies immediately, preserving canonical boosted-status identity, nesting, counts, deduplication, loading races, and route/session isolation.
- Thread reply composers now scroll fully into view when opened near the viewport edge and continue tracking mobile visual-viewport changes without moving already-visible forms.
- Reply-context tooltips and notification excerpts now share compact image/video previews, sample visible videos at one second, defer offscreen video loading, and conceal status- or attachment-level sensitive/CW media.
- Custom emoji metadata now reaches notification excerpts, anonymous public posts, content-warning summaries, compact pinned posts, chat rows, composer mention suggestions, lightbox attribution, and profile context without splitting shortcodes or exposing concealed content.

## 2026-07-21

- GitHub Actions now gates Pages deployment on type checks, the complete mocked Playwright suite, and the dockerized Pleroma integration suite, with failure diagnostics retained as artifacts.
- Authenticated post menus can mute or unmute a thread through Pleroma's conversation endpoints and reconcile the returned mute state across visible post surfaces.
- Long threads show accessible animated loading feedback, align fresh routes to the selected post after context renders, and preserve exact native history positions without moving keyboard focus.
- Reply-free threads end at one clean card border, including while their focused inline reply composer opens and closes.
- Stale-thread browser coverage now uses real intercepted app navigation and tolerates only negligible layout settling, eliminating synthetic-popstate CI races.
- Replied-to post previews render API-provided custom emoji in author names and visible bodies while content-warning previews avoid rendering or requesting hidden emoji.

## 2026-07-19

- Reply context now lazily previews the replied-to post on hover, focus, or touch with session-isolated caching, content-warning safety, public-profile support, and viewport-contained positioning.
- Replied-to previews retain their own direct reply target, including correct parent selection when CC mentions appear first and a generic fallback when account metadata is unavailable.
- Previewed replies reuse the normal post-card Replying to footer in an explicitly static mode, preserving the shared visual treatment without links or recursive previews inside tooltips.
- Appearance settings can keep one fixed theme or follow the system with independently selected light and dark themes, including saved Custom slots, live OS changes, migration, and conflict-safe cross-tab synchronization.
- Successful profile edits immediately reconcile the signed-in account across retained posts, quotes, boosts, searches, and profile views while preventing stale embedded account responses from reverting the update.

## 2026-07-18

- Authenticated home, local, and federated timelines retain independent session-scoped pages and cursors across app navigation so browser history can restore scroll without an initial refetch.
- Inactive timeline streams close and reconnect on return, while session replacement, sign-out, and stale in-flight work cannot expose or mutate a previous timeline cache.
- Threads opened from timelines carry their return provenance in the history entry, preserving the back action through browser forward navigation while direct links fall back to home.
- The desktop left rail keeps its base 240px width until the tablet collapse so profile statistic labels remain legible instead of clipping at intermediate widths.
- Mobile and coarse-pointer form controls use a 16px minimum text size across composers, search, chat, settings, polls, emoji, and attachment fields to prevent iOS focus zoom without disabling user scaling.
- Phone-width home, local, and federated feeds use full-bleed surfaces with square viewport edges while conventional panel routes keep their inset card treatment.
- Mobile privacy controls use a bounded sheet above bottom navigation, and emoji pickers clamp to live visual-viewport bounds as software keyboards resize the usable screen.
- At 320px, populated status actions compact and wrap within timeline, thread, profile, and bookmark surfaces while keeping engagement counts and every action visible.
- Mobile notification popovers reserve fixed-navigation clearance, constrain their complete frame to the dynamic viewport, and scroll loaded notification rows without moving the page or hiding the footer.
- Mobile navigation drawers and detail sheets now behave as modal dialogs with trapped focus, inert background controls, opener focus restoration, and safe teardown when leaving the mobile breakpoint.
- Shared post-control feedback moves above the fixed mobile navigation while retaining its existing desktop position and leaving navigation tabs clickable.
- Composer poll settings collapse from two columns to one at phone widths, with shrinkable selects, wrapping toggle labels, and keyboard-operable controls contained at 320px.
- The authenticated mobile audit is complete across issues 70–77; all 288 route regressions pass together at the final head, with touch-target standards and physical iOS safe-area validation retained as explicit product follow-ups.
- Phone lightboxes give images the full viewer width, overlay multi-image arrows instead of reserving side gutters, clamp long metadata around the close control, and omit desktop keyboard legends.
- Lightbox headers now contain arbitrarily long attachment filenames and keep the mobile close control fully visible and clickable, including when attribution is absent.
- Mobile timelines meet the sticky header without an empty gutter, and the redundant bottom navigation and details sheet are removed in favor of the header logo and focus-trapped side drawer.
- Repository agents must review every completed task, address findings, then create a topical commit and push it without waiting for a separate request.
- Incoming sensitive statuses without content warnings keep safe text visible while gating media behind an explicit reveal, and media composers can submit Pleroma's status-level `sensitive` flag with reset-safe NSFW controls.
- Explore is reduced to one prominent, accessible search surface that opens full results, fits at 320px, and expands into the space formerly reserved for unfinished discovery content and a right rail.

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
- Reply composers follow Pleroma FE participant semantics: author first, then API mentions in order, with account-ID deduplication and the current user excluded after identity hydration.
