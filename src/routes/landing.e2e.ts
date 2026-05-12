import { expect, test, type Page } from '@playwright/test';

const expectNoHorizontalOverflow = async (page: Page) => {
	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);

	expect(hasOverflow).toBe(false);
};

test('signed-out landing explains OAuth handoff and avoids passwords', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');

	await expect(page.getByRole('banner')).toContainText('PleromaNet');
	await expect(page.getByRole('link', { name: 'Browse public' })).toHaveAttribute('href', '#public');
	await expect(page.getByRole('heading', { name: /A quieter corner of the social web/ })).toBeVisible();
	await expect(page.getByText('no algorithm, no ads, no scraping')).toBeVisible();
	await expect(page.getByText('PleromaNet never sees your password')).toBeVisible();
	await expect(page.locator('input[type="password"]')).toHaveCount(0);
	await expect(page.getByRole('heading', { name: /The federated timeline/ })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Things we ask of each other.' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('selects recent server and cancels mocked OAuth redirect', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');

	await expect(page.getByRole('tab', { name: 'Sign in' })).toHaveAttribute('aria-selected', 'true');
	await page.getByRole('button', { name: 'Recent servers' }).click();
	await page.getByRole('option', { name: /retro.social/ }).click();

	await expect(page.getByRole('textbox', { name: 'Your home server' })).toHaveValue('retro.social');
	await expect(page.getByRole('button', { name: 'Continue to retro.social' })).toBeEnabled();
	await expect(page.getByText('Authorize on retro.social')).toBeVisible();

	await page.getByRole('button', { name: 'Continue to retro.social' }).click();
	await expect(page.getByText('Redirecting to retro.social')).toBeVisible();
	await expect(page.getByText('Your server will ask you to authorize PleromaNet')).toBeVisible();

	await page.getByRole('button', { name: 'Cancel redirect' }).click();
	await expect(page.getByRole('textbox', { name: 'Your home server' })).toHaveValue('retro.social');
	await expect(page.getByText('PleromaNet never sees your password')).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('create account flow gates redirect behind code of conduct agreement', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');

	await page.getByRole('tab', { name: 'Create account' }).click();
	await expect(page.getByRole('tab', { name: 'Create account' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('button', { name: 'Continue to pleromanet.social' })).toBeDisabled();

	await page.getByRole('button', { name: /spacebear.net/ }).click();
	await expect(page.getByText("spacebear.net's Code of Conduct")).toBeVisible();
	await expect(page.getByRole('button', { name: 'Continue to spacebear.net' })).toBeDisabled();

	await page.getByRole('checkbox', { name: /I'm 16\+/ }).check();
	await expect(page.getByRole('button', { name: 'Continue to spacebear.net' })).toBeEnabled();
	await page.getByRole('button', { name: 'Continue to spacebear.net' }).click();
	await expect(page.getByText('Redirecting to spacebear.net')).toBeVisible();
});

test('signed-out landing remains usable on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');

	await expect(page.getByRole('heading', { name: /A quieter corner of the social web/ })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'Sign in' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Continue to pleromanet.social' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Browse public' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
