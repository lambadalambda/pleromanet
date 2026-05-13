<script lang="ts">
	import PnIcon from '$lib/PnIcon.svelte';
	import type { AvatarVariant } from '$lib/social/types';
	import TimelineAvatar from './TimelineAvatar.svelte';

	type ComposerVariant = 'timeline' | 'reply';
	type PrivacyMode = 'menu' | 'button';
	type PrivacyOption = 'Public' | 'Unlisted' | 'Followers';
	type Props = {
		label: string;
		textareaLabel: string;
		placeholder: string;
		submitLabel: string;
		value: string;
		onValueChange: (value: string) => void;
		onSubmit: () => void;
		avatar?: AvatarVariant;
		variant?: ComposerVariant;
		maxLength?: number;
		submitEnabled?: boolean;
		countTestId?: string;
		showGif?: boolean;
		showPoll?: boolean;
		privacyMode?: PrivacyMode;
		privacy?: PrivacyOption;
		privacyOptions?: readonly PrivacyOption[];
		privacyMenuOpen?: boolean;
		onPrivacyChange?: (value: PrivacyOption) => void;
		onPrivacyMenuOpenChange?: (value: boolean) => void;
		privacyButtonLabel?: string;
	};

	let {
		label,
		textareaLabel,
		placeholder,
		submitLabel,
		value,
		onValueChange,
		onSubmit,
		avatar = 'grad-1',
		variant = 'timeline',
		maxLength = 500,
		submitEnabled,
		countTestId = 'composer-count',
		showGif = true,
		showPoll = true,
		privacyMode = 'menu',
		privacy = 'Public',
		privacyOptions = ['Public', 'Unlisted', 'Followers'],
		privacyMenuOpen = false,
		onPrivacyChange,
		onPrivacyMenuOpenChange,
		privacyButtonLabel = `Privacy ${privacy}`
	}: Props = $props();

	const remainingCharacters = $derived(maxLength - value.length);
	const canSubmit = $derived(
		submitEnabled ?? (value.trim().length > 0 && remainingCharacters >= 0)
	);
	const composerClass = $derived(variant === 'reply' ? 'thread-reply-composer' : 'composer');
	const rowClass = $derived(variant === 'reply' ? 'composer-row thread-reply-row' : 'composer-row');
</script>

<form
	class={composerClass}
	aria-label={label}
	onsubmit={(event) => {
		event.preventDefault();
		onSubmit();
	}}
>
	<TimelineAvatar variant={avatar} size={variant === 'reply' ? 'sm' : 'composer'} />
	<div class={variant === 'reply' ? 'thread-reply-content' : 'composer-content'}>
		<textarea
			class={`composer-input ${variant === 'reply' ? 'thread-reply-input' : ''}`}
			aria-label={textareaLabel}
			{placeholder}
			maxlength={maxLength}
			value={value}
			oninput={(event) => onValueChange(event.currentTarget.value)}
		></textarea>
		<div class={rowClass}>
			<button class="composer-tool" type="button" aria-label="Image">
				<span class="composer-tool__icon" data-testid="composer-tool-image-icon"><PnIcon name="image" /></span>
			</button>
			{#if showGif}
				<button class="composer-tool composer-tool--gif" type="button" aria-label="GIF">GIF</button>
			{/if}
			{#if showPoll}
				<button class="composer-tool" type="button" aria-label="Poll">
					<span class="composer-tool__icon" data-testid="composer-tool-poll-icon"><PnIcon name="poll" /></span>
				</button>
			{/if}
			<button class="composer-tool" type="button" aria-label="Emoji">
				<span class="composer-tool__icon" data-testid="composer-tool-emoji-icon"><PnIcon name="smile" /></span>
			</button>
			<button class="composer-tool composer-tool--cw" type="button" aria-label="Content warning">CW</button>
			{#if privacyMode === 'menu'}
				<div class="privacy-control">
					<button
						class="composer-tool composer-tool--privacy"
						type="button"
						aria-label={`Privacy ${privacy}`}
						aria-expanded={privacyMenuOpen}
						onclick={() => onPrivacyMenuOpenChange?.(!privacyMenuOpen)}
					>
						<span class="composer-tool__icon composer-tool__icon--privacy" data-testid="composer-tool-privacy-icon"><PnIcon name="globe" /></span>
						<span>{privacy}</span>
						<span class="composer-tool__chevron" data-testid="composer-tool-privacy-chevron"><PnIcon name="chevron-down" /></span>
					</button>
					{#if privacyMenuOpen}
						<div class="privacy-menu" aria-label="Privacy options">
							{#each privacyOptions as option}
								<button
									type="button"
									aria-pressed={privacy === option}
									onclick={() => onPrivacyChange?.(option)}
								>
									{option}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<button class="composer-tool composer-tool--privacy" type="button" aria-label={privacyButtonLabel}>
					<span class="composer-tool__icon composer-tool__icon--privacy"><PnIcon name="reply" /></span>
					<span>{submitLabel}</span>
					<span class="composer-tool__chevron"><PnIcon name="chevron-down" /></span>
				</button>
			{/if}
			<span class="composer-spacer"></span>
			<span class="composer-count" class:warn={remainingCharacters < 50} data-testid={countTestId}>
				{remainingCharacters}
			</span>
			<button class="composer-submit" type="submit" disabled={!canSubmit}>{submitLabel}</button>
		</div>
	</div>
</form>

<style>
	.composer,
	.thread-reply-composer {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr);
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding: 18px 20px 14px;
	}

	.thread-reply-composer {
		display: flex;
		background: var(--panel);
		padding: 14px 16px;
	}

	.composer-content,
	.thread-reply-content {
		min-width: 0;
	}

	.thread-reply-content {
		flex: 1 1 auto;
	}

	.composer-input {
		display: block;
		width: 100%;
		min-height: 64px;
		border: 0;
		background: transparent;
		color: var(--ink);
		outline: 0;
		padding: 6px 0 12px;
		font-size: 15px;
		resize: none;
	}

	.thread-reply-input {
		min-height: 44px;
	}

	.composer-input::placeholder {
		color: var(--muted-2);
	}

	.composer-input:focus {
		box-shadow: inset 0 -1px 0 var(--accent);
	}

	.composer-row {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-wrap: wrap;
		margin-top: 4px;
		border-top: 1px solid var(--border);
		padding-top: 10px;
	}

	.thread-reply-row {
		border-top: 1px solid var(--border);
	}

	.composer-tool,
	.composer-submit {
		border: 0;
		background: transparent;
	}

	.composer-tool {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		width: 32px;
		height: 32px;
		border-radius: var(--radius);
		color: var(--muted);
		font-size: 10px;
		font-family: var(--mono);
		font-weight: 600;
		letter-spacing: 0.08em;
		flex: 0 0 auto;
	}

	.composer-tool:hover {
		background: var(--bg);
		color: var(--accent-ink);
	}

	.composer-tool__icon {
		width: 18px;
		height: 18px;
		flex: 0 0 auto;
	}

	.composer-tool__icon--privacy {
		width: 13px;
		height: 13px;
	}

	.composer-tool__chevron {
		width: 12px;
		height: 12px;
		flex: 0 0 auto;
	}

	.composer-tool--cw {
		width: auto;
		border: 1px solid var(--border);
		padding: 0 10px;
		margin-left: 2px;
	}

	.composer-tool--cw:hover {
		border-color: var(--accent);
	}

	.composer-tool--privacy {
		width: auto;
		max-width: 130px;
		padding: 0 10px;
		gap: 6px;
		margin-left: 8px;
		color: var(--ink-2);
		font-family: var(--sans);
		font-size: 12.5px;
		font-weight: 500;
		letter-spacing: 0;
	}

	.privacy-control {
		position: relative;
		display: inline-flex;
		flex: 0 0 auto;
	}

	.privacy-menu {
		position: absolute;
		left: 0;
		top: calc(100% + 6px);
		z-index: 25;
		min-width: 120px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel);
		box-shadow: 0 10px 26px rgba(28, 32, 70, 0.16);
		padding: 4px;
	}

	.privacy-menu button {
		display: block;
		width: 100%;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		padding: 7px 8px;
		color: var(--ink-2);
		font-size: 12.5px;
		text-align: left;
	}

	.privacy-menu button:hover,
	.privacy-menu button[aria-pressed='true'] {
		background: var(--accent-soft-2);
		color: var(--accent-ink);
	}

	.composer-spacer {
		flex: 1 1 12px;
	}

	.composer-count {
		margin-right: 10px;
		font-family: var(--mono);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}

	.composer-count.warn {
		color: var(--bad);
	}

	.composer-submit {
		border: 1px solid var(--accent);
		border-radius: var(--radius);
		background: var(--accent-soft);
		color: var(--accent-ink);
		padding: 7px 22px;
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
		flex: 0 0 auto;
	}

	.composer-submit:hover:not(:disabled) {
		background: var(--accent);
		color: white;
	}

	.composer-submit:disabled {
		border-color: var(--border);
		background: var(--panel-2);
		color: var(--muted-2);
		cursor: not-allowed;
	}

	.post-action-icon {
		width: 16px;
		height: 16px;
		flex: 0 0 auto;
	}

	@media (max-width: 640px) {
		.thread-reply-composer {
			padding: 14px;
		}
	}

	@media (max-width: 480px) {
		.composer-spacer {
			flex-basis: 100%;
		}

		.composer-count {
			margin-left: auto;
		}
	}
</style>
