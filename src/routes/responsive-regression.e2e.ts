import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { expectNoHorizontalOverflow, expectNoMobileFocusZoom, mockRightRailApis, setViewport, viewports } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};

const authenticate = async (page: Page) => {
	await mockRightRailApis(page);
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

const mockHomeTimeline = async (page: Page) => {
	await page.route('https://pleroma.example/api/v1/timelines/home**', async (route: Route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(pleromaFixtures.timelines.home)
		});
	});
};

const expectSidebarProfileStatsFit = async (page: Page) => {
	const sidebar = page.getByTestId('left-sidebar');
	const labels = sidebar.locator('.stat-label');
	await expect.poll(async () => sidebar.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(240);
	await expect(labels).toHaveText(['Posts', 'Following', 'Followers']);
	await expect.poll(async () => labels.evaluateAll((elements) => elements.every((label) => {
		const cell = label.parentElement;
		if (!cell) return false;
		const labelBounds = label.getBoundingClientRect();
		const cellBounds = cell.getBoundingClientRect();
		return label.scrollWidth <= label.clientWidth
			&& labelBounds.left >= cellBounds.left - 1
			&& labelBounds.right <= cellBounds.right + 1;
	}))).toBe(true);
};

const expectAppContentControlsFit = async (page: Page) => {
	const content = page.getByTestId('app-content');
	const controls = page.locator('.composer-row, [data-testid="home-timeline-list"] .post-actions');
	await expect(controls).not.toHaveCount(0);
	await expect.poll(async () => {
		const contentBounds = await content.evaluate((element) => {
			const bounds = element.getBoundingClientRect();
			return { left: bounds.left, right: bounds.right };
		});
		return controls.evaluateAll((elements, bounds) => elements.every((element) => {
			const elementBounds = element.getBoundingClientRect();
			return element.scrollWidth <= element.clientWidth
				&& elementBounds.left >= bounds.left - 1
				&& elementBounds.right <= bounds.right + 1;
		}), contentBounds);
	}).toBe(true);
};

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

			await expect(page).toHaveTitle('PleromaNet · Design System');
			await expect(page.getByRole('heading', { name: 'Foundations' })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Controls' })).toBeVisible();
			await expectNoHorizontalOverflow(page);
		});
	}

	test('real app shell has no horizontal overflow across breakpoints', async ({ page }) => {
		await authenticate(page);
		await mockHomeTimeline(page);

		await setViewport(page, 'wide');
		await page.goto('/app/home');

		await expect(page.getByTestId('left-sidebar')).toBeVisible();
		await expect(page.getByTestId('right-rail')).toBeVisible();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'desktop');
		await expect(page.getByTestId('left-sidebar')).toBeVisible();
		await expect(page.getByTestId('right-rail')).toBeHidden();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expectSidebarProfileStatsFit(page);
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'medium');
		await expect(page.getByTestId('left-sidebar')).toBeVisible();
		await expect(page.getByTestId('right-rail')).toBeHidden();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expectSidebarProfileStatsFit(page);
		await expectNoHorizontalOverflow(page);

		await page.setViewportSize({ width: 881, height: 800 });
		await expect(page.getByTestId('left-sidebar')).toBeVisible();
		await expect(page.getByTestId('right-rail')).toBeHidden();
		await expectSidebarProfileStatsFit(page);
		await expectAppContentControlsFit(page);
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'tablet');
		await expect(page.getByTestId('left-sidebar')).toBeHidden();
		await expect(page.getByTestId('right-rail')).toBeHidden();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'mobile');
		await expect(page.getByTestId('left-sidebar')).toBeHidden();
		await expect(page.getByRole('navigation', { name: 'Mobile app navigation' })).toBeVisible();
		await expectNoMobileFocusZoom(page);

		await page.getByRole('button', { name: 'Open navigation menu' }).click();
		await expect(page.getByTestId('mobile-drawer')).toBeVisible();
		await page.getByRole('button', { name: 'Close navigation menu' }).last().click();
		await expect(page.getByTestId('mobile-drawer')).toBeHidden();

		await page.getByTestId('mobile-bottom-nav').getByRole('button', { name: 'More' }).click();
		await expect(page.getByTestId('mobile-sheet')).toBeVisible();
		await page.getByRole('button', { name: 'Close details sheet' }).click();
		await expect(page.getByTestId('mobile-sheet')).toBeHidden();
		await expectNoHorizontalOverflow(page);
	});

	test('signed-out public profile has no horizontal overflow across breakpoints', async ({ page }) => {
		await page.route('https://pleroma.social/api/v1/accounts/search**', async (route: Route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([{ ...pleromaFixtures.account, acct: 'quietadmin@pleroma.social', url: 'https://pleroma.social/users/quietadmin' }])
			});
		});
		await page.route('https://pleroma.social/api/v1/accounts/account-1/statuses**', async (route: Route) => {
			const url = new URL(route.request().url());
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(url.searchParams.get('pinned') === 'true' ? [] : [pleromaFixtures.status])
			});
		});

		for (const viewportName of Object.keys(viewports) as Array<keyof typeof viewports>) {
			await setViewport(page, viewportName);
			await page.goto('/app/profiles/quietadmin@pleroma.social');
			await expect(page.getByTestId('public-profile-shell')).toBeVisible();
			await expect(page.getByTestId('profile-view')).toBeVisible();
			await expectNoHorizontalOverflow(page);
		}
	});
});

test.describe('touch landscape focus sizing', () => {
	test.use({ hasTouch: true, viewport: { width: 956, height: 440 } });

	test('authenticated text controls remain large enough to avoid focus zoom', async ({ page }) => {
		await authenticate(page);
		await mockHomeTimeline(page);
		await page.goto('/app/home');

		await expect(page.getByRole('textbox', { name: 'Post text' })).toBeVisible();
		await expectNoMobileFocusZoom(page);
	});
});
