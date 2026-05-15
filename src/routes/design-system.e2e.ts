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
	await expect(page.locator('#thread')).toContainText('AncestorPost → FocusedPost → ReplyPost');
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
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page.getByText('1 of 5 · station platform at dusk')).toBeVisible();
	await expect(page.getByRole('dialog').locator('.lightbox-photo')).toHaveCSS('filter', 'none');
	await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
});

test('renders the canonical thread specimen with a working reply composer', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/design-system');

	const thread = page.locator('#thread');
	await expect(thread.getByText('gridwave', { exact: true })).toBeVisible();
	await expect(thread.getByText('nyan.binary', { exact: true })).toBeVisible();
	await expect(thread.getByText('2 replies')).toBeVisible();

	const composer = thread.locator('.thread-reply-composer');
	const submitReply = composer.locator('.btn-primary');
	await expect(composer.getByRole('textbox')).toHaveAttribute('placeholder', 'Reply to @emichan...');
	await expect(submitReply).toBeDisabled();
	await composer.getByRole('textbox').fill('soft web yes');
	await expect(submitReply).toBeEnabled();
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
