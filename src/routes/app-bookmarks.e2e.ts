import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import type { PleromaStatus } from '../lib/pleroma/types';
import { expectNoHorizontalOverflow, fulfillJson, mockRightRailApis, setViewport } from '../test/playwright';

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
	await page.route('https://pleroma.example/api/v1/notifications**', async (route) => fulfillJson(route, []));
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('pleromanet.session', JSON.stringify(storedSession));
	}, session);
};

const bookmarkStatus = (id: string, text: string): PleromaStatus => ({
	...pleromaFixtures.status,
	id,
	uri: `https://pleroma.example/objects/${id}`,
	url: `https://pleroma.example/notice/${id}`,
	content: `<p>${text}</p>`,
	bookmarked: true,
	pleroma: { ...pleromaFixtures.status.pleroma, content: { 'text/plain': text } }
});

test('bookmarks route lists saved posts from the API', async ({ page }) => {
	await authenticate(page);
	await page.addInitScript(() => window.localStorage.setItem('pleromanet.timeline.fit-images', 'true'));
	let authorization: string | undefined;
	await page.route('https://pleroma.example/api/v1/bookmarks**', async (route: Route) => {
		authorization = route.request().headers().authorization;
		await fulfillJson(route, [{
			...bookmarkStatus('bm-1', 'saved for later'),
			media_attachments: [{ id: 'bookmark-image', type: 'image', url: 'https://cdn.example/bookmark-image.jpg', description: 'saved image' }]
		}, bookmarkStatus('bm-2', 'another keeper')]);
	});

	await setViewport(page, 'wide');
	await page.goto('/app/bookmarks');

	await expect(page.getByRole('heading', { name: 'Bookmarks' })).toBeVisible();
	await expect(page.getByTestId('right-rail')).toHaveCount(0);
	await expect.poll(async () => (await page.getByTestId('app-content').boundingBox())?.width ?? 0).toBeGreaterThan(900);
	const list = page.getByTestId('bookmarks-list');
	await expect(list).toContainText('saved for later');
	await expect(list).toContainText('another keeper');
	await expect(list.getByLabel('Visibility: Public').first()).toBeVisible();
	await expect(list.locator('[data-status-id="bm-1"] .ph-raw')).toHaveCSS('object-fit', 'cover');
	expect(authorization).toBe('Bearer access-token');
});

test('populated bookmark actions stay available at 320px', async ({ page }) => {
	await authenticate(page);
	await page.route('https://pleroma.example/api/v1/bookmarks**', async (route: Route) => {
		await fulfillJson(route, [{
			...bookmarkStatus('bm-mobile', 'saved on a narrow screen'),
			replies_count: 123,
			reblogs_count: 456,
			favourites_count: 789
		}]);
	});
	await page.setViewportSize({ width: 320, height: 568 });
	await page.goto('/app/bookmarks');

	const post = page.getByTestId('bookmarks-list').locator('.post').first();
	await expect(post.locator('.post-action, .post-more')).toHaveCount(5);
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
	await expectNoHorizontalOverflow(page);
});

test('bookmarks route shows an empty state', async ({ page }) => {
	await authenticate(page);
	await page.route('https://pleroma.example/api/v1/bookmarks**', async (route: Route) => fulfillJson(route, []));

	await setViewport(page, 'desktop');
	await page.goto('/app/bookmarks');

	await expect(page.getByTestId('bookmarks-panel')).toContainText('No bookmarks yet');
	await expect(page.getByTestId('bookmarks-list')).toHaveCount(0);
});

test('bookmarks route surfaces an API error', async ({ page }) => {
	await authenticate(page);
	await page.route('https://pleroma.example/api/v1/bookmarks**', async (route: Route) => fulfillJson(route, { error: 'bookmarks unavailable' }, 500));

	await setViewport(page, 'desktop');
	await page.goto('/app/bookmarks');

	await expect(page.getByTestId('bookmarks-panel')).toContainText('bookmarks unavailable');
});

test('removing a bookmark from the bookmarks list drops the post', async ({ page }) => {
	await authenticate(page);
	await page.route('https://pleroma.example/api/v1/bookmarks**', async (route: Route) => {
		await fulfillJson(route, [bookmarkStatus('bm-1', 'saved for later'), bookmarkStatus('bm-2', 'another keeper')]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/bm-1/unbookmark', async (route: Route) => {
		expect(route.request().method()).toBe('POST');
		await fulfillJson(route, { ...bookmarkStatus('bm-1', 'saved for later'), bookmarked: false });
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/bookmarks');

	const list = page.getByTestId('bookmarks-list');
	const first = list.locator('.post').filter({ hasText: 'saved for later' });
	await first.getByRole('button', { name: 'More post actions' }).click();
	await first.getByRole('menuitem', { name: 'Remove bookmark' }).click();
	await expect(list).not.toContainText('saved for later');
	await expect(list).toContainText('another keeper');
});

test('removing the last bookmark collapses to the empty state', async ({ page }) => {
	await authenticate(page);
	await page.route('https://pleroma.example/api/v1/bookmarks**', async (route: Route) => {
		await fulfillJson(route, [bookmarkStatus('bm-only', 'the only keeper')]);
	});
	await page.route('https://pleroma.example/api/v1/statuses/bm-only/unbookmark', async (route: Route) => {
		await fulfillJson(route, { ...bookmarkStatus('bm-only', 'the only keeper'), bookmarked: false });
	});

	await setViewport(page, 'desktop');
	await page.goto('/app/bookmarks');

	const post = page.getByTestId('bookmarks-list').locator('.post').filter({ hasText: 'the only keeper' });
	await post.getByRole('button', { name: 'More post actions' }).click();
	await post.getByRole('menuitem', { name: 'Remove bookmark' }).click();

	await expect(page.getByTestId('bookmarks-list')).toHaveCount(0);
	await expect(page.getByTestId('bookmarks-panel')).toContainText('No bookmarks yet');
});
