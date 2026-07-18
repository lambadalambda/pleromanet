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
const populatedStatus = {
	...pleromaFixtures.status,
	replies_count: 123,
	reblogs_count: 456,
	favourites_count: 789
};

const authenticate = async (page: Page) => {
	await mockRightRailApis(page);
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

const mockHomeTimeline = async (page: Page, statuses = pleromaFixtures.timelines.home) => {
	await page.route('https://pleroma.example/api/v1/timelines/home**', async (route: Route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(statuses)
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

const expectPostActionsFit = async (post: ReturnType<Page['locator']>, expectedControlCount = 5) => {
	const actions = post.locator('.post-actions');
	await expect(actions.locator('.post-action, .post-more')).toHaveCount(expectedControlCount);
	await expect(post.getByRole('button', { name: 'Reply 123', exact: true })).toBeVisible();
	await expect(post.getByRole('button', { name: 'Boost 456', exact: true })).toBeVisible();
	await expect(post.getByRole('button', { name: 'Favorite 789', exact: true })).toBeVisible();
	await expect.poll(async () => post.evaluate((element) => {
		const postBounds = element.getBoundingClientRect();
		const row = element.querySelector<HTMLElement>('.post-actions');
		if (!row || row.scrollWidth > row.clientWidth) return false;
		return [...row.querySelectorAll<HTMLElement>('.post-action, .post-more')].every((action) => {
			const actionBounds = action.getBoundingClientRect();
			return actionBounds.left >= postBounds.left - 1 && actionBounds.right <= postBounds.right + 1;
		});
	})).toBe(true);
};

const expectViewportWidth = async (page: Page, locator: ReturnType<Page['locator']>) => {
	const bounds = await locator.evaluate((element) => {
		const rect = element.getBoundingClientRect();
		return { left: rect.left, right: rect.right };
	});
	expect(Math.abs(bounds.left)).toBeLessThanOrEqual(1);
	expect(Math.abs(bounds.right - (await page.evaluate(() => window.innerWidth)))).toBeLessThanOrEqual(1);
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
		await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'mobile');
		await expect(page.getByTestId('left-sidebar')).toBeHidden();
		await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);
		await expectNoMobileFocusZoom(page);

		await page.getByRole('button', { name: 'Open navigation menu' }).click();
		await expect(page.getByTestId('mobile-drawer')).toBeVisible();
		await page.getByRole('button', { name: 'Close navigation menu' }).last().click();
		await expect(page.getByTestId('mobile-drawer')).toBeHidden();
		await expectNoHorizontalOverflow(page);
	});

	test('mobile timelines meet the header and fill the viewport while panel routes keep their inset', async ({ page }) => {
		await authenticate(page);
		await mockHomeTimeline(page, [populatedStatus]);
		await page.route('https://pleroma.example/api/v1/timelines/public**', async (route: Route) => {
			await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([populatedStatus]) });
		});
		for (const width of [390, 320]) {
			await page.setViewportSize({ width, height: 844 });
			for (const path of ['/app/home', '/app/local', '/app/federated']) {
				await page.goto(path);
				await expectViewportWidth(page, page.getByTestId('app-content'));
				const feed = page.locator('.app-feed-card');
				await expectViewportWidth(page, feed);
				const verticalGap = await page.evaluate(() => {
					const header = document.querySelector<HTMLElement>('[data-testid="app-header"]');
					const timeline = document.querySelector<HTMLElement>('.app-feed-card');
					if (!header || !timeline) return null;
					return timeline.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
				});
				expect(verticalGap).not.toBeNull();
				expect(Math.abs(verticalGap ?? 999)).toBeLessThanOrEqual(1);
				await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);
				await expect(feed).toHaveCSS('border-left-width', '0px');
				await expect(feed).toHaveCSS('border-right-width', '0px');
				await expect(feed).toHaveCSS('border-radius', '0px');
				await expectPostActionsFit(feed.locator('.post').first());
				await expectNoHorizontalOverflow(page);
			}
		}

		await setViewport(page, 'mobile');
		await page.goto('/app/explore');
		const panelBounds = await page.getByTestId('app-content').evaluate((element) => {
			const bounds = element.getBoundingClientRect();
			return { left: bounds.left, right: bounds.right };
		});
		expect(Math.abs(panelBounds.left - 14)).toBeLessThanOrEqual(1);
		expect(Math.abs(panelBounds.right - 376)).toBeLessThanOrEqual(1);
	});

	test('populated post actions stay inside a status at 320px', async ({ page }) => {
		await authenticate(page);
		await page.route('https://pleroma.example/api/v1/timelines/home**', async (route: Route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([populatedStatus])
			});
		});
		await page.setViewportSize({ width: 320, height: 568 });
		await page.goto('/app/home');

		const post = page.getByTestId('home-timeline-list').locator('.post').first();
		await expectPostActionsFit(post);
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
				body: JSON.stringify(url.searchParams.get('pinned') === 'true' ? [] : [populatedStatus])
			});
		});

		for (const viewportName of Object.keys(viewports) as Array<keyof typeof viewports>) {
			await setViewport(page, viewportName);
			await page.goto('/app/profiles/quietadmin@pleroma.social');
			await expect(page.getByTestId('public-profile-shell')).toBeVisible();
			await expect(page.getByTestId('profile-view')).toBeVisible();
			await expectNoHorizontalOverflow(page);
		}

		await page.setViewportSize({ width: 320, height: 568 });
		await page.goto('/app/profiles/quietadmin@pleroma.social');
		const post = page.getByTestId('profile-posts').locator('.post').first();
		await expectPostActionsFit(post, 4);
		await expectNoHorizontalOverflow(page);
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
