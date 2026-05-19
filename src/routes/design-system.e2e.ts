import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, setViewport } from '../test/playwright';

test('shows converted canonical design-system sections and switches themes', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	await expect(page).toHaveTitle('PleromaNet · Design System');
	await expect(page.getByRole('heading', { name: 'Foundations' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Iconography' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Controls' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Thread' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Radio · PN.fm' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Oekaki' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Surfaces' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Navigation' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Mobile' })).toBeVisible();

	await expect(page.locator('#controls')).toContainText('Button · primary');
	await expect(page.locator('#attachments')).toContainText('pickAttachmentLayout →');
	await expect(page.locator('#posts')).toContainText('Quoted posts');
	await expect(page.locator('#thread')).toContainText('ReplyPost → InlineReplyComposer below selected reply');
	await expect(page.locator('#notifications')).toContainText('NotifRow k-mention unread');
	await expect(page.locator('#radio')).toContainText('Radio · Now playing tab');
	await expect(page.locator('#oekaki')).toContainText('Tool rail');
	await expect(page.locator('#surfaces')).toContainText('TrendsCard');
	await expect(page.locator('#navigation')).toContainText('ProfileMini');
	await expect(page.locator('#mobile')).toContainText('Home · feed + bottom tab bar');

	await page.getByRole('button', { name: 'Simoun' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'simoun');
	await expectNoHorizontalOverflow(page);
});

test('renders canonical surface and right-rail card specimens', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const surfaces = page.locator('#surfaces');
	await expect(surfaces.getByText('TrendsCard')).toBeVisible();
	await expect(surfaces.getByRole('button', { name: /#fediverse/ })).toBeVisible();
	await expect(surfaces.getByText('WhoToFollow')).toBeVisible();
	await expect(surfaces.getByText('nyan.binary')).toBeVisible();
	await expect(surfaces.getByText('ShortcutsCard')).toBeVisible();
	await expect(surfaces.getByRole('button', { name: /Compose new post/ })).toBeVisible();
	await expect(surfaces.getByText('InstanceStatus')).toBeVisible();
	await expect(surfaces.getByText('pleromanet.social', { exact: true })).toBeVisible();
	await expect(surfaces.getByText('QuickSearchCard')).toBeVisible();
	await expect(surfaces.getByRole('button', { name: /Search hashtags/ })).toBeVisible();
	await expect(surfaces.getByText('FooterCard')).toBeVisible();
	await expect(surfaces.getByText('PLEROMANET™ 2.4.58')).toBeVisible();
	await expect(surfaces.getByText('ProfilePreviewCard')).toBeVisible();
	await expect(surfaces.getByText('@dreambyte@pleromanet.social')).toBeVisible();
	await expect(surfaces.getByText('ProfileTipsCard')).toBeVisible();
	await expect(surfaces.getByText('Your avatar will be shown at 96×96px.')).toBeVisible();

	await surfaces.getByRole('button', { name: 'Follow' }).first().click();
	await expect(surfaces.getByRole('button', { name: 'Following' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('renders canonical navigation specimens', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const navigation = page.locator('#navigation');
	await expect(navigation.getByText('ProfileMini')).toBeVisible();
	await expect(navigation.getByText('dreambyte', { exact: true })).toBeVisible();
	await expect(navigation.getByText('@dreambyte@pleroma.social')).toBeVisible();
	await expect(navigation.getByText('living in a soft world')).toBeVisible();
	await expect(navigation.getByText('pacific hour')).toBeVisible();
	await expect(navigation.getByText('Followers')).toBeVisible();
	await expect(navigation.getByText('SideNav (placeholder)')).toBeVisible();
	await expect(navigation.getByRole('button', { name: /^Home/ })).toBeVisible();
	await expect(navigation.getByRole('button', { name: /^Notifications/ })).toContainText('3');
	await expect(navigation.getByRole('button', { name: /^Settings/ })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('renders canonical mobile phone previews', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const mobile = page.locator('#mobile');
	await expect(mobile.getByText('Home · feed + bottom tab bar')).toBeVisible();
	await expect(mobile.getByText('Drawer · left side menu')).toBeVisible();
	await expect(mobile.getByText('Thread · ancestor + focused')).toBeVisible();
	await expect(mobile.locator('.ds-phone')).toHaveCount(3);
	await expect(mobile.getByText('PleromaNet™').first()).toBeVisible();
	await expect(mobile.getByRole('button', { name: /^Explore/ })).toBeVisible();
	await expect(mobile.getByRole('button', { name: /^Alerts/ })).toContainText('3');
	await expect(mobile.getByText('@dreambyte@pleroma.social')).toBeVisible();
	await expect(mobile.getByRole('button', { name: /^Local/ })).toBeVisible();
	await expect(mobile.getByText('Thread', { exact: true })).toBeVisible();
	await expect(mobile.getByText('gridwave', { exact: true })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('opens the attachment lightbox from the design-system specimen', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	await page.locator('#attachments').getByRole('button', { name: 'Open lightbox →' }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(page.getByText('1 of 5 · station platform at dusk')).toBeVisible();
	await expect(dialog.locator('.lightbox-photo')).toHaveCSS('filter', 'none');
	await dialog.getByRole('button', { name: 'Next' }).click();
	await dialog.getByRole('button', { name: 'Next' }).click();
	await expect(page.getByText('3 of 5 · door with cat')).toBeVisible();
	const bounds = await dialog.evaluate((node) => {
		const rect = (selector: string) => {
			const target = node.querySelector(selector);
			if (!target) return null;
			const box = target.getBoundingClientRect();
			return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
		};
		return {
			head: rect('.lightbox-head'),
			body: rect('.lightbox-body'),
			photo: rect('.lightbox-photo'),
			strip: rect('.lightbox-strip'),
			foot: rect('.lightbox-foot')
		};
	});
	expect(bounds.head).not.toBeNull();
	expect(bounds.body).not.toBeNull();
	expect(bounds.photo).not.toBeNull();
	expect(bounds.strip).not.toBeNull();
	expect(bounds.foot).not.toBeNull();
	expect(bounds.photo?.top ?? 0).toBeGreaterThanOrEqual(bounds.body?.top ?? 0);
	expect(bounds.photo?.bottom ?? 0).toBeLessThanOrEqual(bounds.body?.bottom ?? 0);
	expect(bounds.photo?.left ?? 0).toBeGreaterThanOrEqual(bounds.body?.left ?? 0);
	expect(bounds.photo?.right ?? 0).toBeLessThanOrEqual(bounds.body?.right ?? 0);
	expect(bounds.photo?.top ?? 0).toBeGreaterThanOrEqual(bounds.head?.bottom ?? 0);
	expect(bounds.photo?.bottom ?? 0).toBeLessThanOrEqual(bounds.strip?.top ?? bounds.foot?.top ?? 0);
	await expect(dialog.locator('.lightbox-photo')).toHaveCSS('object-fit', 'contain');
	const previousIsTopmost = await dialog.getByRole('button', { name: 'Previous' }).evaluate((button) => {
		const box = button.getBoundingClientRect();
		const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
		return target === button || button.contains(target);
	});
	expect(previousIsTopmost).toBe(true);
	await dialog.getByRole('button', { name: 'Close', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
});

test('renders canonical poll attachment specimens', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const attachments = page.locator('#attachments');
	await expect(attachments.locator('.ds-sub-h').filter({ hasText: /^Polls$/ })).toBeVisible();
	await expect(attachments.getByText('Voting · single choice')).toBeVisible();
	await expect(attachments.getByText('Voting · multiple choices')).toBeVisible();
	await expect(attachments.getByText('Results · with vote')).toBeVisible();
	await expect(attachments.locator('.ds-spec-label').filter({ hasText: /^Ended$/ })).toBeVisible();

	const single = attachments.locator('.ds-spec').filter({ hasText: 'Voting · single choice' });
	await expect(single.locator('.post-poll-vote-row')).toHaveCount(3);
	await expect(single.locator('.post-poll-radio')).toHaveCount(3);
	await expect(single.getByRole('button', { name: 'Vote' })).toBeDisabled();
	await single.locator('.post-poll-vote-row').filter({ hasText: 'warm cassette' }).click();
	await expect(single.getByRole('radio', { name: 'warm cassette' })).toBeChecked();
	await expect(single.locator('.post-poll-vote-row').filter({ hasText: 'warm cassette' })).toHaveClass(/selected/);
	await expect(single.getByRole('button', { name: 'Vote' })).toBeDisabled();
	await single.getByRole('radio', { name: 'warm cassette' }).focus();
	await expect(single.locator('.post-poll-vote-row').filter({ hasText: 'warm cassette' })).toHaveCSS('outline-style', 'solid');
	await single.getByRole('button', { name: 'View results ->' }).click();
	await expect(single.locator('.post-poll-row')).toHaveCount(3);
	await single.getByRole('button', { name: 'Back to voting' }).click();
	await expect(single.getByRole('radio', { name: 'warm cassette' })).toBeChecked();

	const multi = attachments.locator('.ds-spec').filter({ hasText: 'Voting · multiple choices' });
	await expect(multi.locator('.post-poll-check')).toHaveCount(3);
	await multi.locator('.post-poll-vote-row').filter({ hasText: 'CW redesign' }).click();
	await multi.locator('.post-poll-vote-row').filter({ hasText: 'Polls' }).click();
	await expect(multi.getByRole('checkbox', { name: 'CW redesign' })).toBeChecked();
	await expect(multi.getByRole('checkbox', { name: 'Polls' })).toBeChecked();
	await expect(multi.getByRole('button', { name: 'Vote · 2 selected' })).toBeDisabled();

	const results = attachments.locator('.ds-spec').filter({ hasText: 'Results · with vote' });
	await expect(results.locator('.post-poll-row')).toHaveCount(3);
	await expect(results.locator('.post-poll-row.winner')).toContainText('spinning vinyl');
	await expect(results.locator('.post-poll-row.me')).toContainText('spinning vinyl');
	await expect(results.locator('.post-poll-you')).toContainText('You');
	await expect(results.locator('.post-poll-meta')).toContainText('394 votes');
	await expect(results.locator('.post-poll-meta')).toContainText('you voted');

	const ended = attachments.locator('.ds-spec').filter({ hasText: 'Ended' });
	await expect(ended.locator('.post-poll-pill')).toContainText('Ended 2d ago');
	await expect(ended.locator('.post-poll-row.winner')).toContainText('spinning vinyl');
	await setViewport(page, 'mobile');
	await expectNoHorizontalOverflow(page);
});

test('renders canonical reply addressee chip specimens', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const posts = page.locator('#posts');
	await expect(posts.getByText('Body, mentions & reply addressees')).toBeVisible();
	await expect(posts.getByText('Reply · parent only')).toBeVisible();
	await expect(posts.getByText('Reply + cc-list')).toBeVisible();
	await expect(posts.getByText('Long cc-chain')).toBeVisible();

	const parentOnly = posts.locator('.ds-spec').filter({ hasText: 'Reply · parent only' });
	const parentChip = parentOnly.locator('.post-pinged-chip-parent');
	await expect(parentOnly.locator('.post-pinged-l')).toHaveText('Replying to');
	await expect(parentChip).toContainText('@gridwave');
	await expect(parentChip.locator('svg')).toBeVisible();
	await expect(parentChip).toHaveCSS('font-weight', '600');
	await expect(parentOnly.locator('.post-pinged-also')).toHaveCount(0);

	const ccList = posts.locator('.ds-spec').filter({ hasText: 'Reply + cc-list' });
	await expect(ccList.locator('.post-pinged-chip-parent .post-pinged-handle')).toHaveText('@dtluna');
	await expect(ccList.locator('.post-pinged-chip-parent')).toHaveAttribute('title', '@dtluna@retro.social');
	await expect(ccList.locator('.post-pinged-also')).toContainText('also');
	await expect(ccList.locator('.post-pinged-chip')).toHaveCount(2);
	await expect(ccList.locator('.post-pinged-chip').first()).toHaveText('@feld');
	await expect(ccList.locator('.post-pinged-chip').first()).toHaveAttribute('title', '@feld@queer.party');
	await expect(ccList.locator('.post-pinged-list')).not.toContainText('@dtluna@retro.social');
	await expect(ccList.locator('.post-pinged-list')).not.toContainText('@feld@queer.party');

	await setViewport(page, 'mobile');
	await expectNoHorizontalOverflow(page);
});

test('renders canonical boosted post specimens', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const posts = page.locator('#posts');
	await expect(posts.getByText('Boosts')).toBeVisible();
	await expect(posts.getByText('Boosted · text post')).toBeVisible();
	await expect(posts.getByText('Boosted · with photo')).toBeVisible();

	const boostedText = posts.locator('.ds-spec').filter({ hasText: 'Boosted · text post' });
	await expect(boostedText.locator('.post-boost')).toBeVisible();
	await expect(boostedText.locator('.post-boost-tag')).toContainText('boost');
	await expect(boostedText.locator('.post-boost-name')).toContainText('FiestaBun');
	await expect(boostedText.locator('.post-boost-time')).toContainText('35m');
	await expect(boostedText.locator('.post')).toContainText("the algorithm doesn't care about you");

	const boostedPhoto = posts.locator('.ds-spec').filter({ hasText: 'Boosted · with photo' });
	await boostedPhoto.locator('.post-photos button').click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.locator('.lightbox-photo')).toHaveAttribute('src', 'samples/falco.png');
	await dialog.getByRole('button', { name: 'Close', exact: true }).click();

	await setViewport(page, 'mobile');
	await expectNoHorizontalOverflow(page);
});

test('renders canonical content warning post specimens', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const posts = page.locator('#posts');
	await expect(posts.getByText('Content warnings')).toBeVisible();
	await expect(posts.getByText('Folded · with media')).toBeVisible();
	await expect(posts.getByText('Folded · text only')).toBeVisible();
	await expect(posts.getByText('Folded · with poll')).toBeVisible();

	const mediaCw = posts.locator('.ds-spec').filter({ hasText: 'Folded · with media' });
	await expect(mediaCw.locator('.post-cw-card')).toContainText('food, plated photos');
	await expect(mediaCw.locator('.post-cw-meta-chip')).toContainText(['2 photos', '~27 words']);
	await expect(mediaCw).not.toContainText('every restaurant photo I take');
	await expect(mediaCw.locator('.post-photos')).toHaveCount(0);
	await mediaCw.getByRole('button', { name: 'Show post' }).click();
	await expect(mediaCw.locator('.post-cw-revealed-summary')).toContainText('food, plated photos');
	await expect(mediaCw).toContainText('every restaurant photo I take');
	await expect(mediaCw.locator('.post-photos')).toBeVisible();
	await mediaCw.getByRole('button', { name: 'Hide' }).click();
	await expect(mediaCw).not.toContainText('every restaurant photo I take');

	const pollCw = posts.locator('.ds-spec').filter({ hasText: 'Folded · with poll' });
	await expect(pollCw.locator('.post-cw-meta-chip')).toContainText(['poll', '~16 words']);
	await expect(pollCw).not.toContainText('rough day');
	await setViewport(page, 'mobile');
	await expectNoHorizontalOverflow(page);
});

test('renders the canonical thread specimen with targeted inline reply composers', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const thread = page.locator('#thread');
	await expect(thread.getByText('gridwave', { exact: true })).toBeVisible();
	await expect(thread.getByText('nyan.binary', { exact: true })).toBeVisible();
	await expect(thread.getByText('2 replies')).toBeVisible();
	await expect(thread.locator('.thread-reply-composer')).toHaveCount(0);
	await expect(thread.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);

	const nyanReply = thread.locator('.post-reply').filter({ hasText: 'this is the energy i needed today' }).first();
	await nyanReply.getByRole('button', { name: 'Reply 2' }).click();
	const nyanComposer = thread.getByRole('form', { name: 'Inline reply to @nyan' });
	await expect(nyanComposer).toBeVisible();
	await expect(nyanComposer).toContainText('Replying to');
	await expect(nyanComposer).toContainText('@nyan');
	await expect(nyanComposer.getByRole('button', { name: 'Reply', exact: true })).toBeDisabled();
	await nyanComposer.getByRole('textbox', { name: 'Reply text' }).fill('soft web yes');
	await expect(nyanComposer.getByRole('button', { name: 'Reply', exact: true })).toBeEnabled();
	await nyanReply.getByRole('button', { name: 'Reply 2' }).click();
	await expect(thread.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);

	await nyanReply.getByRole('button', { name: 'Reply 2' }).click();
	const reopenedNyanComposer = thread.getByRole('form', { name: 'Inline reply to @nyan' });
	await expect(reopenedNyanComposer.getByRole('textbox', { name: 'Reply text' })).toHaveValue('');
	await reopenedNyanComposer.getByRole('textbox', { name: 'Reply text' }).fill('soft web yes');

	const softReply = thread.locator('.post-reply').filter({ hasText: 'touched grass too' }).first();
	await softReply.getByRole('button', { name: 'Reply 0' }).click();
	await expect(thread.getByRole('form', { name: /Inline reply/ })).toHaveCount(1);
	const softComposer = thread.getByRole('form', { name: 'Inline reply to @soft.hertz' });
	await expect(softComposer).toBeVisible();
	await expect(softComposer.getByRole('textbox', { name: 'Reply text' })).toHaveValue('');

	await softComposer.getByRole('button', { name: 'Cancel' }).click();
	await expect(thread.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);

	await softReply.getByRole('button', { name: 'Reply 0' }).click();
	await softComposer.getByRole('textbox', { name: 'Reply text' }).fill('submit closes this composer');
	await softComposer.getByRole('button', { name: 'Reply', exact: true }).click();
	await expect(thread.getByRole('form', { name: /Inline reply/ })).toHaveCount(0);

	await setViewport(page, 'mobile');
	await softReply.getByRole('button', { name: 'Reply 0' }).click();
	await expect(thread.getByRole('form', { name: 'Inline reply to @soft.hertz' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('renders canonical notification rows and popover controls', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const notifications = page.locator('#notifications');
	await expect(notifications.getByText('Mention · unread')).toBeVisible();
	await expect(notifications.getByText('Favorite · grouped')).toBeVisible();
	await expect(notifications.getByText('Follow request')).toBeVisible();
	await expect(notifications.getByText('orbit mentioned you').first()).toBeVisible();
	await expect(notifications.getByText('kestrel, mossy and 2 others favorited your post').first()).toBeVisible();
	await expect(notifications.getByRole('button', { name: 'Accept' }).first()).toBeVisible();
	await expect(notifications.getByRole('button', { name: 'Decline' }).first()).toBeVisible();
	await expect(notifications.getByText('NotifsPopover')).toBeVisible();
	await expect(notifications.locator('.notif-pop')).toContainText('3 new');

	await notifications.getByRole('button', { name: 'Boosts' }).click();
	await expect(notifications.locator('.notif-pop-body')).toContainText('lumen, mossy and 1 other boosted your post');

	await notifications.getByRole('button', { name: 'Mark all read' }).click();
	await expect(notifications.locator('.notif-pop-count')).toBeHidden();
});

test('renders canonical radio specimens and controls', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const radio = page.locator('#radio');
	await expect(radio.getByText('NowPlayingLine')).toBeVisible();
	await expect(radio.locator('.ds-nps-stack').getByText('pacific hour')).toHaveCount(2);
	await expect(radio.locator('.ds-nps-stack').getByText('paused')).toHaveCount(2);
	await expect(radio.getByText('Compact bar (collapsed)')).toBeVisible();
	await expect(radio.locator('.radio').first()).toContainText('PN.fm · Retrowave');
	await expect(radio.getByText('Radio · Now playing tab')).toBeVisible();
	await expect(radio.getByText('Album · Outer Drive')).toBeVisible();
	await expect(radio.getByRole('button', { name: 'coastline 1986' })).toBeVisible();
	await expect(radio.getByText('Radio · Albums tab')).toBeVisible();
	await expect(radio.getByRole('button', { name: /Modem Hymns/ })).toBeVisible();
	await expect(radio.getByRole('button', { name: /Garden Hours/ })).toBeVisible();

	const interactive = radio.locator('.radio').nth(1);
	await interactive.getByRole('button', { name: 'Play', exact: true }).first().click();
	await expect(interactive.getByRole('button', { name: 'Pause', exact: true }).first()).toBeVisible();
});

test('renders canonical oekaki anatomy and launcher', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const oekaki = page.locator('#oekaki');
	const anatomyList = oekaki.locator('.ds-anatomy-list');
	await expect(anatomyList.getByText('Tool rail', { exact: true })).toBeVisible();
	await expect(anatomyList.getByText('Canvas', { exact: true })).toBeVisible();
	await expect(anatomyList.getByText('Side panel', { exact: true })).toBeVisible();
	await expect(anatomyList.getByText('Footer', { exact: true })).toBeVisible();
	await expect(oekaki.getByTitle('Brush').first()).toBeVisible();
	await expect(oekaki.getByTitle('Text').first()).toBeVisible();

	await oekaki.getByRole('button', { name: 'Launch fullscreen →' }).click();
	const modal = page.getByRole('dialog', { name: 'oekaki' });
	await expect(modal).toBeVisible();
	await expect(modal).toContainText('~/draft/untitled.png');
	await modal.getByTitle('Pen').click();
	await expect(modal).toContainText('PNG · 800×600 · pen');
	await page.keyboard.press('Escape');
	await expect(modal).toBeHidden();
});

test('keeps the design system usable on mobile', async ({ page }) => {
	await setViewport(page, 'mobile');
	await page.goto('/design-system');

	await expect(page.getByRole('heading', { name: 'Foundations' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Simoun' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Thread' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Radio · PN.fm' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Oekaki' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
