import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, setViewport } from '../test/playwright';

test.skip(true, 'Legacy /mockup explore coverage is retired; src/routes/app-explore.e2e.ts covers the real route.');

const openExplore = async (page: Page) => {
	await page.goto('/mockup');
	await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Explore' }).click();
};

test('renders explore search, suggested tags, topics, and communities', async ({ page }) => {
	await setViewport(page, 'desktop');
	await openExplore(page);

	await expect(page.getByRole('heading', { name: 'Explore the network' })).toBeVisible();
	const search = page.getByRole('searchbox', { name: 'Search topics, people, and posts' });
	await expect(search).toBeVisible();
	await search.fill('vaporwave');
	await expect(search).toHaveValue('vaporwave');
	await expect(page.getByRole('button', { name: '#fediverse' })).toBeVisible();
	await expect(page.getByTestId('explore-topic-card')).toHaveCount(3);
	await expect(page.getByTestId('explore-community-card')).toHaveCount(3);
	await expect(page.getByTestId('explore-artwork')).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('switches discover feed tabs', async ({ page }) => {
	await setViewport(page, 'desktop');
	await openExplore(page);

	const feedTabs = page.getByRole('tablist', { name: 'Discover feed' });
	await expect(feedTabs.getByRole('tab', { name: 'Popular' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('explore-feed')).toContainText('Popular across friendly instances');

	await feedTabs.getByRole('tab', { name: 'New' }).click();
	await expect(feedTabs.getByRole('tab', { name: 'New' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('explore-feed')).toContainText('Fresh instance dispatches');

	await feedTabs.getByRole('tab', { name: 'Active' }).click();
	await expect(feedTabs.getByRole('tab', { name: 'Active' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('explore-feed')).toContainText('Most replied threads');
});

test('community join buttons retain local joined state', async ({ page }) => {
	await setViewport(page, 'desktop');
	await openExplore(page);

	const community = page.getByTestId('explore-community-card').filter({ hasText: 'Federated CSS Garden' });
	const join = community.getByRole('button', { name: 'Join Federated CSS Garden' });

	await expect(join).toHaveAttribute('aria-pressed', 'false');
	await join.click();
	await expect(community.getByRole('button', { name: 'Joined Federated CSS Garden' })).toHaveAttribute('aria-pressed', 'true');
});

test('explore layout stacks cleanly on mobile', async ({ page }) => {
	await setViewport(page, 'mobile');
	await page.goto('/mockup');

	await page.getByTestId('mobile-bottom-nav').getByRole('button', { name: 'Explore' }).click();

	await expect(page.getByRole('heading', { name: 'Explore the network' })).toBeVisible();
	await expect(page.getByTestId('explore-topic-card').first()).toBeVisible();
	await expect(page.getByTestId('explore-community-card').first()).toBeVisible();
	await expect(page.getByRole('searchbox', { name: 'Search topics, people, and posts' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
