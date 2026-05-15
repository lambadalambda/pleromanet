import { expect, test } from '@playwright/test';
import { expectElementIsTruncatedWithinParent, expectNoHorizontalOverflow, setViewport, viewports } from '../test/playwright';

test.skip(true, 'Legacy /mockup timeline coverage is retired; src/routes/home-timeline.e2e.ts covers the real timeline.');

test('composer starts empty, posts text, and prepends the new post', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/mockup');

	const composer = page.getByRole('textbox', { name: 'Post text' });
	const postButton = page.getByRole('button', { name: 'Post', exact: true });

	await expect(composer).toHaveValue('');
	await expect(postButton).toBeDisabled();

	await composer.fill('testing the issue 04 timeline slice');
	await expect(page.getByTestId('composer-count')).toContainText('465');
	await expect(postButton).toBeEnabled();
	await postButton.click();

	const posts = page.getByTestId('timeline-post');
	await expect(posts.first()).toContainText('testing the issue 04 timeline slice');
	await expect(composer).toHaveValue('');
	await expect(postButton).toBeDisabled();
});

test('post actions update reply, boost, and favorite state locally', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/mockup');

	const post = page.getByTestId('timeline-post').filter({ hasText: 'quiet CSS can still be expressive' });
	const reply = post.getByRole('button', { name: /Reply/ });
	const boost = post.getByRole('button', { name: /Boost/ });
	const favorite = post.getByRole('button', { name: /Favorite/ });

	await expect(post.getByTestId('post-action-reply-icon')).toBeVisible();
	await expect(post.getByTestId('post-action-boost-icon')).toBeVisible();
	await expect(post.getByTestId('post-action-favorite-icon')).toBeVisible();
	await expect(reply).toHaveAttribute('aria-pressed', 'false');
	await reply.click();
	await expect(reply).toHaveAttribute('aria-pressed', 'true');
	await expect(reply).toContainText('5');

	await expect(boost).toHaveAttribute('aria-pressed', 'false');
	await boost.click();
	await expect(boost).toHaveAttribute('aria-pressed', 'true');
	await expect(boost).toContainText('13');

	await expect(favorite).toHaveAttribute('aria-pressed', 'false');
	await favorite.click();
	await expect(favorite).toHaveAttribute('aria-pressed', 'true');
	await expect(favorite).toContainText('29');
});

test('right rail cards render and suggestion handles do not overflow', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/mockup');

	await expect(page.getByTestId('right-rail')).toContainText('Trends');
	await expect(page.getByTestId('right-rail')).toContainText('Who to follow');
	await expect(page.getByTestId('right-rail')).toContainText('Shortcuts');
	await expect(page.getByTestId('right-rail')).toContainText('Instance status');

	const longHandle = page
		.getByTestId('suggestion-handle')
		.filter({ hasText: '@datagram@a-very-long-retro-instance-name.social' });
	await expectElementIsTruncatedWithinParent(longHandle);
	await expectNoHorizontalOverflow(page);
});

test('composer toolbar and post button remain usable across viewport sizes', async ({ page }) => {
	for (const viewport of [
		viewports.desktop,
		viewports.tablet,
		viewports.mobile
	]) {
		await page.setViewportSize(viewport);
		await page.goto('/mockup');
		const composerForm = page.getByRole('form', { name: 'Composer' });
		const composer = page.getByRole('textbox', { name: 'Post text' });
		const postButton = composerForm.getByRole('button', { name: 'Post', exact: true });

		await expect(composerForm.getByRole('button', { name: 'Image' })).toBeVisible();
		await expect(composerForm.getByRole('button', { name: 'GIF' })).toBeVisible();
		await expect(composerForm.getByRole('button', { name: 'Poll' })).toBeVisible();
		await expect(composerForm.getByRole('button', { name: 'Emoji' })).toBeVisible();
		await expect(composerForm.getByRole('button', { name: 'Content warning' })).toBeVisible();
		await expect(composerForm.getByRole('button', { name: /Privacy/ })).toBeVisible();
		await composer.fill(`viewport ${viewport.width} composer post`);
		await expect(postButton).toBeEnabled();
		await postButton.click();
		await expect(page.getByTestId('timeline-post').first()).toContainText(`viewport ${viewport.width} composer post`);
		await expectNoHorizontalOverflow(page);
	}
});
