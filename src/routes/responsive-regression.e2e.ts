import { expect, test } from '@playwright/test';
import { expectElementIsTruncatedWithinParent, expectNoHorizontalOverflow, setViewport, viewports } from '../test/playwright';

test.describe('responsive regression coverage', () => {
	for (const viewportName of Object.keys(viewports) as Array<keyof typeof viewports>) {
		test(`signed-out landing has no horizontal overflow at ${viewportName}`, async ({ page }) => {
			await setViewport(page, viewportName);
			await page.goto('/');

			await expect(page.getByRole('heading', { name: /A quieter corner of the social web/ })).toBeVisible();
			await expect(page.getByRole('tab', { name: 'Sign in' })).toBeVisible();
			await expectNoHorizontalOverflow(page);
		});

		test(`design system primitives have no horizontal overflow at ${viewportName}`, async ({ page }) => {
			await setViewport(page, viewportName);
			await page.goto('/design-system');

			await expect(page.getByRole('heading', { name: 'Design System' })).toBeVisible();
			await expect(page.getByTestId('primitive-grid')).toBeVisible();
			await expectNoHorizontalOverflow(page);
		});
	}

	test('mockup shell documents responsive layout risks across breakpoints', async ({ page }) => {
		await setViewport(page, 'desktop');
		await page.goto('/mockup');

		await expect(page.getByTestId('left-sidebar')).toBeVisible();
		await expect(page.getByTestId('right-rail')).toBeVisible();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expectElementIsTruncatedWithinParent(
			page
				.getByTestId('suggestion-handle')
				.filter({ hasText: '@datagram@a-very-long-retro-instance-name.social' })
		);
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'medium');
		await expect(page.getByTestId('right-rail')).toBeHidden();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'tablet');
		await expect(page.getByTestId('right-rail')).toBeHidden();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Mobile primary' })).toBeVisible();
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'mobile');
		await expect(page.getByTestId('left-sidebar')).toBeHidden();
		await expect(page.getByRole('navigation', { name: 'Mobile primary' })).toBeVisible();

		await page.getByRole('button', { name: 'Open navigation menu' }).click();
		await expect(page.getByRole('navigation', { name: 'Mobile drawer' })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('navigation', { name: 'Mobile drawer' })).toBeHidden();

		await page.getByTestId('mobile-bottom-nav').getByRole('button', { name: 'More' }).click();
		await expect(page.getByTestId('mobile-sheet')).toBeVisible();
		await page.getByRole('button', { name: 'Close details sheet' }).click();
		await expect(page.getByTestId('mobile-sheet')).toBeHidden();
		await expectNoHorizontalOverflow(page);
	});
});
