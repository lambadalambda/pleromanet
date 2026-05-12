import { expect, test, type Page } from '@playwright/test';

const expectNoHorizontalOverflow = async (page: Page) => {
	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);

	expect(hasOverflow).toBe(false);
};

const softCssPost = (page: Page) =>
	page
		.getByTestId('timeline-post')
		.filter({ hasText: 'quiet CSS can still be expressive' });

const softCssThreadButton = (page: Page) =>
	softCssPost(page).getByRole('button', { name: /quiet CSS can still be expressive/ });

const federatedTimelinesThreadButton = (page: Page) =>
	page
		.getByTestId('timeline-post')
		.filter({ hasText: 'Federated timelines feel best' })
		.getByRole('button', { name: /Federated timelines feel best/ });

const openSoftCssThread = async (page: Page) => {
	await page.goto('/');
	await softCssThreadButton(page).click();
};

test('opens a thread from the home timeline and returns to the timeline', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openSoftCssThread(page);

	await expect(page.getByTestId('thread-view')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Thread' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Back to home timeline' })).toBeFocused();

	await page.getByRole('button', { name: 'Back to home timeline' }).click();
	await expect(page.getByTestId('thread-view')).toBeHidden();
	await expect(page.getByRole('tablist', { name: 'Timeline sections' }).getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');
	await expect(softCssThreadButton(page)).toBeFocused();
});

test('shows ancestors, focused metadata, reply composer, and reply count', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openSoftCssThread(page);

	await expect(page.getByTestId('thread-ancestor')).toContainText('gridwave');
	await expect(page.getByTestId('thread-line')).toBeVisible();
	await expect(page.getByTestId('focused-post')).toContainText('quiet CSS can still be expressive');
	await expect(page.getByTestId('focused-post')).toContainText('4:18 PM · May 11, 2026');
	await expect(page.getByTestId('focused-post')).toContainText('PleromaNet™ Web');
	await expect(page.getByTestId('focused-post')).toContainText('12.4K views');
	await expect(page.getByTestId('focused-engagement')).toContainText('12 Boosts');
	await expect(page.getByRole('textbox', { name: 'Reply text' })).toBeVisible();
	await expect(page.getByTestId('reply-composer-count')).toContainText('500');
	await expect(page.getByTestId('thread-reply-count')).toContainText('3 replies');

	await page.getByRole('textbox', { name: 'Reply text' }).fill('replying from the mocked thread composer');
	await page.getByRole('button', { name: 'Reply', exact: true }).click();
	await expect(page.getByTestId('thread-reply-count')).toContainText('4 replies');
	await expect(page.getByText('replying from the mocked thread composer')).toBeVisible();
});

test('thread reply actions update local state', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openSoftCssThread(page);

	const reply = page
		.getByTestId('thread-reply')
		.filter({ hasText: 'we used to log off. when did that stop being a thing.' });

	await reply.getByRole('button', { name: 'Boost 12' }).click();
	await expect(reply.getByRole('button', { name: 'Boost 13' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Boost 13' })).toHaveClass(/active/);

	await reply.getByRole('button', { name: 'Favorite 64' }).click();
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveAttribute('aria-pressed', 'true');
	await expect(reply.getByRole('button', { name: 'Favorite 65' })).toHaveClass(/active/);
});

test('thread reply state stays isolated between opened posts', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openSoftCssThread(page);

	await page.getByRole('textbox', { name: 'Reply text' }).fill('soft thread only reply');
	await page.getByRole('button', { name: 'Reply', exact: true }).click();
	await expect(page.getByText('soft thread only reply')).toBeVisible();

	await page.getByRole('button', { name: 'Back to home timeline' }).click();
	await federatedTimelinesThreadButton(page).click();

	await expect(page.getByTestId('focused-post')).toContainText('Federated timelines feel best');
	await expect(page.getByTestId('thread-reply-count')).toContainText('3 replies');
	await expect(page.getByText('soft thread only reply')).toBeHidden();
});

test('thread reply sort changes selected state and order', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openSoftCssThread(page);

	const replies = page.getByTestId('thread-reply');
	await expect(page.getByRole('group', { name: 'Reply sort' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Top' })).toHaveAttribute('aria-pressed', 'true');
	await expect(replies.first()).toContainText('we used to log off. when did that stop being a thing.');

	await page.getByRole('button', { name: 'Newest' }).click();
	await expect(page.getByRole('button', { name: 'Newest' })).toHaveAttribute('aria-pressed', 'true');
	await expect(replies.first()).toContainText('this is the energy i needed today.');
});

test('opens expandable nested replies', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openSoftCssThread(page);

	await expect(page.getByText('around the time the algorithm replaced the timeline.')).toBeHidden();
	await page.getByRole('button', { name: 'Show 1 reply' }).first().click();
	await expect(page.getByText('around the time the algorithm replaced the timeline.')).toBeVisible();
});

test('thread layout remains readable on mobile without horizontal overflow', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openSoftCssThread(page);

	await expect(page.getByTestId('thread-view')).toBeVisible();
	await expect(page.getByTestId('focused-post')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Reply text' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
