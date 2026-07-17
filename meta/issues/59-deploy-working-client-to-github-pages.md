# 59 Deploy working client to GitHub Pages

## Summary

Configure the static SvelteKit client for deployment from GitHub Actions to GitHub Pages.

## Requirements

- Build correctly at a GitHub project Pages subpath.
- Deploy the generated static site from the default branch through GitHub Actions.
- Preserve SPA route fallback behavior on direct navigation.
- Allow local and non-Pages builds to continue using the site root.

## Acceptance Criteria

- The production build succeeds with the GitHub repository name as its base path.
- Generated asset and route URLs include the configured project Pages base path.
- A GitHub Actions workflow uploads and deploys the static build artifact to Pages.
- Type and Svelte checks pass.

## Notes

- GitHub Pages must use GitHub Actions as its deployment source in the repository settings.
