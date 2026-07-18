import { expect, test, type Page } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { expectNoHorizontalOverflow, setViewport } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};

const authenticate = async (page: Page) => {
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

test('real explore route presents search as its only prominent feature', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'wide');
	await page.goto('/app/explore');

	const content = page.getByTestId('app-content');
	await expect(content.getByRole('heading', { name: 'Search the network' })).toBeVisible();
	const searchForm = content.getByRole('search', { name: 'Explore search' });
	const search = searchForm.getByRole('searchbox', { name: 'Search people and posts' });
	await expect(search).toBeVisible();
	await expect(search).toHaveCSS('font-size', '18px');
	await expect(search).toHaveAttribute('aria-describedby', 'explore-search-hint');
	await search.focus();
	await expect(searchForm).toHaveCSS('outline-width', '2px');
	const formBounds = await searchForm.boundingBox();
	expect(formBounds?.width ?? 0).toBeGreaterThanOrEqual(500);
	expect(formBounds?.height ?? 0).toBeGreaterThanOrEqual(64);
	await expect(page.getByTestId('right-rail')).toHaveCount(0);
	await expect(page.getByTestId('explore-topic-card')).toHaveCount(0);
	await expect(page.getByTestId('explore-community-card')).toHaveCount(0);
	await expect(page.getByTestId('explore-feed')).toHaveCount(0);
	await expect(page.getByTestId('explore-artwork')).toHaveCount(0);
	await expect(content.getByRole('button', { name: '#fediverse' })).toHaveCount(0);
	await expectNoHorizontalOverflow(page);
});

test('real explore route submits searches to the full search page', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/explore');

	const content = page.getByTestId('app-content');
	await content.getByRole('searchbox', { name: 'Search people and posts' }).fill('slow web');
	await content.getByRole('button', { name: 'Search', exact: true }).click();
	await expect(page).toHaveURL(/\/app\/search\?q=slow(?:\+|%20)web$/);
});

test('real explore search remains prominent and contained on mobile', async ({ page }) => {
	await authenticate(page);
	for (const width of [390, 320]) {
		await page.setViewportSize({ width, height: 844 });
		await page.goto('/app/explore');

		const content = page.getByTestId('app-content');
		const searchForm = content.getByRole('search', { name: 'Explore search' });
		const search = searchForm.getByRole('searchbox', { name: 'Search people and posts' });
		await expect(content.getByRole('heading', { name: 'Search the network' })).toBeVisible();
		await expect(search).toBeVisible();
		await expect(search).toHaveCSS('font-size', '16px');
		await expect.poll(async () => searchForm.evaluate((element) => {
			const bounds = element.getBoundingClientRect();
			return bounds.left >= 0 && bounds.right <= window.innerWidth && element.scrollWidth <= element.clientWidth;
		})).toBe(true);
		await expectNoHorizontalOverflow(page);
	}
});
