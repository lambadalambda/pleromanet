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

const mockHomeTimeline = async (page: Page) => {
	await page.route('https://pleroma.example/api/v1/timelines/home**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(pleromaFixtures.timelines.home)
		});
	});
};

test('real thread route shows ancestors, focused metadata, reply composer, and reply count', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	await expect(page.getByTestId('thread-ancestor')).toContainText('gridwave');
	await expect(page.getByTestId('thread-line')).toBeVisible();
	await expect(page.getByTestId('focused-post')).toContainText('quiet CSS can still carry the voice.');
	await expect(page.getByTestId('focused-post')).toContainText('4:18 PM · May 11, 2026');
	await expect(page.getByTestId('focused-post')).toContainText('PleromaNet™ Web');
	await expect(page.getByTestId('focused-post')).toContainText('12.4K views');
	await expect(page.getByTestId('focused-engagement')).toContainText('12 Boosts');
	await expect(page.getByRole('textbox', { name: 'Reply text' })).toBeVisible();
	await expect(page.getByTestId('reply-composer-count')).toContainText('500');
	await expect(page.getByTestId('thread-reply-count')).toContainText('3 replies');

	await page.getByRole('textbox', { name: 'Reply text' }).fill('replying from the routed thread composer');
	await page.getByRole('button', { name: 'Reply', exact: true }).click();
	await expect(page.getByTestId('thread-reply-count')).toContainText('4 replies');
	await expect(page.getByText('replying from the routed thread composer')).toBeVisible();
});

test('real thread route reply actions update local state', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const reply = page.getByTestId('thread-reply').filter({ hasText: 'we used to log off. when did that stop being a thing.' });

	await reply.getByRole('button', { name: 'Boost 12' }).click();
	await expect(reply.getByRole('button', { name: 'Boost 13' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Boost 13' })).toHaveClass(/active/);

	await reply.getByRole('button', { name: 'Favorite 64' }).click();
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveClass(/active/);
});

test('real thread route reply sort changes selected state and order', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	const replies = page.getByTestId('thread-reply');
	await expect(page.getByRole('group', { name: 'Reply sort' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Top' })).toHaveAttribute('aria-pressed', 'true');
	await expect(replies.first()).toContainText('we used to log off. when did that stop being a thing.');

	await page.getByRole('button', { name: 'Newest' }).click();
	await expect(page.getByRole('button', { name: 'Newest' })).toHaveAttribute('aria-pressed', 'true');
	await expect(replies.first()).toContainText('this is the energy i needed today.');
});

test('real thread route opens expandable nested replies', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	await expect(page.getByText('around the time the algorithm replaced the timeline.')).toBeHidden();
	await page.getByRole('button', { name: 'Show 1 reply' }).first().click();
	await expect(page.getByText('around the time the algorithm replaced the timeline.')).toBeVisible();
});

test('real thread route returns to the home timeline', async ({ page }) => {
	await authenticate(page);
	await mockHomeTimeline(page);
	await setViewport(page, 'desktop');
	await page.goto('/app/thread/status-1');

	await page.getByRole('button', { name: 'Back to home timeline' }).click();
	await expect(page).toHaveURL('/app/home');
	await expect(page.getByRole('tablist', { name: 'Timeline sections' })).toBeVisible();
});

test('real thread layout remains readable on mobile without horizontal overflow', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'mobile');
	await page.goto('/app/thread/status-1');

	await expect(page.getByTestId('thread-view')).toBeVisible();
	await expect(page.getByTestId('focused-post')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Reply text' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
