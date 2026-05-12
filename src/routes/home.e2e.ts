import { expect, test } from '@playwright/test';

test('renders the PleromaNet app shell placeholder', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'PleromaNet' })).toBeVisible();
	await expect(page.getByText('A quieter frontend for Pleroma is taking shape.')).toBeVisible();
});
