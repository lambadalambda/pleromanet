import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);

export default defineConfig({
	reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
	webServer: { command: `pnpm run build && pnpm exec vite preview --port ${port} --strictPort`, port, timeout: 180_000 },
	use: {
		baseURL: `http://localhost:${port}`,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	testMatch: '**/*.e2e.{ts,js}',
	testIgnore: ['**/tests/integration/**', '**/*.integration.e2e.{ts,js}']
});
