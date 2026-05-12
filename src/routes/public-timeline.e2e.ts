import { expect, test, type Page } from '@playwright/test';

const avatarDataUri =
	'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

const localStatuses = [
	{
		id: 'local-status-1',
		created_at: '2026-05-12T10:30:00.000Z',
		content: '<p>hello from <strong>lain.com</strong> without logging in</p>',
		replies_count: 2,
		reblogs_count: 3,
		favourites_count: 5,
		account: {
			display_name: 'lain admin',
			username: 'lain',
			acct: 'lain',
			avatar: avatarDataUri,
			avatar_static: avatarDataUri
		},
		media_attachments: []
	}
];

const federatedStatuses = [
	{
		id: 'federated-status-1',
		created_at: '2026-05-12T10:35:00.000Z',
		content: '<p>a federated post reaches the guest timeline</p>',
		replies_count: 1,
		reblogs_count: 4,
		favourites_count: 9,
		account: {
			display_name: '',
			username: 'remote',
			acct: 'remote@example.social',
			avatar: avatarDataUri,
			avatar_static: avatarDataUri
		},
		media_attachments: []
	}
];

const expectNoHorizontalOverflow = async (page: Page) => {
	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);

	expect(hasOverflow).toBe(false);
};

test('loads the lain.com local public timeline without signing in', async ({ page }) => {
	const requests: string[] = [];

	await page.route('https://lain.com/api/v1/timelines/public**', async (route) => {
		requests.push(route.request().url());
		await route.fulfill({ json: localStatuses });
	});

	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/public');

	await expect(page.getByRole('heading', { name: 'lain.com public timeline' })).toBeVisible();
	await expect(page.getByText('No login required')).toBeVisible();
	await expect(page.getByText('Sign in on your server')).toBeVisible();
	await expect(page.getByTestId('public-timeline-post')).toContainText('hello from lain.com without logging in');
	await expect(page.getByTestId('public-timeline-post')).toContainText('@lain@lain.com');
	expect(new URL(requests[0]).searchParams.get('local')).toBe('true');
	await expectNoHorizontalOverflow(page);
});

test('switches between local and federated public timelines', async ({ page }) => {
	const requests: string[] = [];

	await page.route('https://lain.com/api/v1/timelines/public**', async (route) => {
		const url = new URL(route.request().url());
		requests.push(route.request().url());

		await route.fulfill({ json: url.searchParams.get('local') === 'true' ? localStatuses : federatedStatuses });
	});

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/public');
	await expect(page.getByTestId('public-timeline-post')).toContainText('hello from lain.com without logging in');

	await page.getByRole('tab', { name: 'Federated' }).click();

	await expect(page.getByRole('tab', { name: 'Federated' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('public-timeline-post')).toContainText('a federated post reaches the guest timeline');
	expect(new URL(requests.at(-1) ?? '').searchParams.has('local')).toBe(false);
	await expectNoHorizontalOverflow(page);
});

test('shows a recoverable error when the public timeline request fails', async ({ page }) => {
	await page.route('https://lain.com/api/v1/timelines/public**', async (route) => {
		await route.fulfill({ status: 503, json: { error: 'offline' } });
	});

	await page.goto('/public');

	await expect(page.getByText('Could not load the public timeline from lain.com.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});
