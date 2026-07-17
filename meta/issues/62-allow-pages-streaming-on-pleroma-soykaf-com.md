# 62 Allow Pages streaming on pleroma.soykaf.com

## Summary

Check and, if necessary, update `pleroma.soykaf.com` so the GitHub Pages deployment can open Pleroma WebSocket streams.

## Requirements

- Probe the existing WebSocket origin policy without credentials.
- Back up the production configuration before changing it.
- Configure an explicit allowlist containing only `https://pleroma.soykaf.com` and `https://lambadalambda.github.io`.
- Preserve rejection of unrelated origins.

## Acceptance Criteria

- The GitHub Pages origin receives a successful WebSocket upgrade.
- An unrelated origin remains rejected.
- Pleroma restarts successfully and its HTTP API remains healthy.

## Notes

- The Pages origin initially received `403 Forbidden` while the instance origin received `101 Switching Protocols`.
- `/etc/pleroma/config.exs` now allows the instance origin and `https://lambadalambda.github.io` through `Pleroma.Web.Endpoint.check_origin`.
- The original configuration is backed up as `/etc/pleroma/config.exs.backup-20260717-streaming-origin`.
