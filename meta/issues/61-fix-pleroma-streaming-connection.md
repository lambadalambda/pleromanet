# 61 Fix Pleroma streaming connection

## Summary

Diagnose and fix timeline WebSocket connections from the GitHub Pages deployment failing against `lain.com`.

## Requirements

- Confirm whether the client URL or the instance handshake rejects the connection.
- Allow only the deployed GitHub Pages origin if the instance origin policy is responsible.
- Preserve rejection of unrelated WebSocket origins.
- Preserve the existing polling fallback when streaming is unavailable.

## Acceptance Criteria

- The deployed Pages origin receives a successful WebSocket upgrade from `lain.com`.
- An unrelated origin remains rejected.
- Pleroma restarts successfully and its HTTP API remains healthy.

## Notes

- The client already used Pleroma's correct `/api/v1/streaming/` endpoint.
- Phoenix returned `403 Forbidden` because `https://lambadalambda.github.io` was absent from the production `check_origin` allowlist.
- The production config was backed up as `prod.secret.exs.backup-20260717-streaming-origin` before adding the origin.
