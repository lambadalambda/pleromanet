<script lang="ts">
	import ProfileSettingSwitch from './ProfileSettingSwitch.svelte';
	import { setProfileSettingsPreview } from './store';
	import ProfileUploadRow from './ProfileUploadRow.svelte';
	import {
		cloneProfileSettings,
		createDefaultProfileSettings,
		profileSettingsEqual,
		type ProfileSettings
	} from './types';

	const bioLimit = 160;
	const instanceOptions = ['pleromanet.social', 'kolektiva.social', 'retro.social'];

	let savedProfile = $state<ProfileSettings>(createDefaultProfileSettings());
	let draftProfile = $state<ProfileSettings>(createDefaultProfileSettings());
	let saveMessage = $state('Saved');

	const isDirty = $derived(!profileSettingsEqual(savedProfile, draftProfile));
	const saveState = $derived(isDirty ? 'Unsaved changes' : saveMessage);
	const bioCount = $derived(`${draftProfile.bio.length} / ${bioLimit}`);

	const updateProfile = (patch: Partial<ProfileSettings>) => {
		draftProfile = { ...draftProfile, ...patch };
		if (saveMessage !== 'Saved') saveMessage = 'Saved';
	};

	const saveProfile = () => {
		savedProfile = cloneProfileSettings(draftProfile);
		saveMessage = 'Saved just now';
	};

	const resetProfile = () => {
		draftProfile = cloneProfileSettings(savedProfile);
		saveMessage = 'Saved';
	};

	$effect(() => {
		setProfileSettingsPreview(draftProfile);
	});
</script>

<section class="settings-view" aria-labelledby="profile-settings-title">
	<div class="pn-card settings-card">
		<header class="settings-head">
			<p class="settings-breadcrumb">Settings / Profile</p>
			<h1 id="profile-settings-title">Profile settings</h1>
			<p class="settings-subtitle">Manage your profile information and how you appear to others.</p>
		</header>

		<div class="field-row">
			<div class="field-label">Avatar</div>
			<div>
				<ProfileUploadRow
					title="Avatar"
					description="JPG, PNG or GIF. Max size 2MB."
					buttonLabel="Choose avatar"
					preview="avatar"
					testId="avatar-upload-row"
				/>
			</div>
		</div>

		<div class="field-row">
			<div class="field-label">Banner</div>
			<div>
				<ProfileUploadRow
					title="Banner"
					description="Recommended size 1500×500. JPG, PNG or GIF. Max size 5MB."
					buttonLabel="Choose banner"
					preview="banner"
					testId="banner-upload-row"
				/>
			</div>
		</div>

		<div class="field-row">
			<div class="field-label">Display name</div>
			<div class="field-control">
				<input
					class="field-input"
					type="text"
					aria-label="Display name"
					value={draftProfile.displayName}
					oninput={(event) => updateProfile({ displayName: event.currentTarget.value })}
				/>
				<p class="field-help">The name shown on your profile.</p>
			</div>
		</div>

		<div class="field-row">
			<div class="field-label">Username</div>
			<div class="field-control">
				<div class="split-row">
					<input
						class="field-input"
						type="text"
						aria-label="Username"
						value={draftProfile.username}
						oninput={(event) => updateProfile({ username: event.currentTarget.value })}
					/>
					<select
						class="field-input field-select"
						aria-label="Instance domain"
						value={draftProfile.instance}
						onchange={(event) => updateProfile({ instance: event.currentTarget.value })}
					>
						{#each instanceOptions as option}
							<option value={option}>@{option}</option>
						{/each}
					</select>
				</div>
				<p class="field-help">Your unique handle on this server.</p>
			</div>
		</div>

		<div class="field-row">
			<div class="field-label">Bio</div>
			<div class="field-control">
				<textarea
					class="field-input field-textarea"
					aria-label="Bio"
					maxlength={bioLimit}
					value={draftProfile.bio}
					oninput={(event) => updateProfile({ bio: event.currentTarget.value })}
				></textarea>
				<div class="field-counter">{bioCount}</div>
			</div>
		</div>

		<div class="field-row field-row--last">
			<div class="field-label">Website</div>
			<div class="field-control split-row split-row--wide">
				<div>
					<input
						class="field-input"
						type="url"
						aria-label="Website"
						value={draftProfile.website}
						oninput={(event) => updateProfile({ website: event.currentTarget.value })}
					/>
					<p class="field-help">Your website or personal link.</p>
				</div>
				<div>
					<div class="field-sub-label">Location</div>
					<input
						class="field-input"
						type="text"
						aria-label="Location"
						value={draftProfile.location}
						oninput={(event) => updateProfile({ location: event.currentTarget.value })}
					/>
					<p class="field-help">You can leave this blank.</p>
				</div>
			</div>
		</div>

		<div class="toggle-section">
			<ProfileSettingSwitch
				label="Discoverable profile"
				description="Allow this profile to appear in suggestions and discovery surfaces."
				checked={draftProfile.discoverable}
				onToggle={() => updateProfile({ discoverable: !draftProfile.discoverable })}
			/>
			<ProfileSettingSwitch
				label="Allow search indexing"
				description="Permit public profile fields to be indexed by Pleroma search."
				checked={draftProfile.indexable}
				onToggle={() => updateProfile({ indexable: !draftProfile.indexable })}
			/>
			<ProfileSettingSwitch
				label="Show follower count"
				description="Show follower totals in profile cards and profile preview surfaces."
				checked={draftProfile.showFollowerCount}
				onToggle={() => updateProfile({ showFollowerCount: !draftProfile.showFollowerCount })}
			/>
		</div>

		<footer class="settings-actions">
			<button class="pn-button pn-button--primary" type="button" aria-label="Save profile settings" disabled={!isDirty} onclick={saveProfile}>
				Save changes
			</button>
			<button class="pn-button" type="button" aria-label="Reset profile settings" disabled={!isDirty} onclick={resetProfile}>
				Reset
			</button>
			<span class="settings-saved" data-testid="settings-save-state">{saveState}</span>
		</footer>
	</div>
</section>

<style>
	.settings-view,
	.settings-card {
		min-width: 0;
	}

	.settings-card {
		box-shadow: none;
		padding: 24px 32px 28px;
	}

	.settings-head {
		border-bottom: 1px solid var(--border);
		padding-bottom: 24px;
		margin-bottom: 8px;
	}

	.settings-breadcrumb,
	.settings-head h1,
	.settings-subtitle {
		margin: 0;
	}

	.settings-breadcrumb {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.settings-head h1 {
		margin-top: 12px;
		font-family: var(--serif);
		font-size: 38px;
		font-weight: 500;
		line-height: 1;
	}

	.settings-subtitle {
		margin-top: 8px;
		color: var(--muted);
		font-size: 14px;
	}

	.field-row {
		display: grid;
		grid-template-columns: 130px minmax(0, 1fr);
		gap: 24px;
		align-items: start;
		padding: 16px 0;
		border-bottom: 1px solid var(--border);
	}

	.field-row--last {
		border-bottom: 0;
	}

	.field-label {
		padding-top: 8px;
		font-size: 13.5px;
		font-weight: 500;
		color: var(--ink-2);
	}

	.field-control {
		min-width: 0;
	}

	.field-input {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-2);
		padding: 8px 12px;
		font-size: 13.5px;
		outline: 0;
		color: var(--ink);
	}

	.field-input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft-2);
	}

	.field-textarea {
		min-height: 70px;
		resize: vertical;
	}

	.field-select {
		appearance: none;
		background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 8l3-3.5' stroke='%237a7c95' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
		padding-right: 28px;
	}

	.field-help,
	.field-counter {
		margin: 4px 0 0;
		font-size: 12px;
		color: var(--muted);
	}

	.field-counter {
		text-align: right;
		font-family: var(--mono);
		font-size: 11px;
	}

	.field-sub-label {
		margin-bottom: 6px;
		font-size: 13.5px;
		font-weight: 500;
		color: var(--ink-2);
	}

	.split-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.split-row--wide {
		align-items: start;
	}

	.toggle-section {
		margin-top: 12px;
	}

	.settings-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 24px;
		margin-top: 8px;
	}

	.settings-saved {
		margin-left: auto;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.04em;
		color: var(--muted);
	}

	.settings-actions button:disabled {
		cursor: default;
		opacity: 0.55;
	}

	@media (max-width: 720px) {
		.settings-card {
			padding: 18px 16px 20px;
		}

		.field-row,
		.split-row {
			grid-template-columns: 1fr;
		}

		.field-label {
			padding-top: 0;
		}
	}

	@media (max-width: 560px) {
		.settings-actions {
			align-items: stretch;
			flex-direction: column;
		}

		.settings-actions button {
			width: 100%;
			min-height: 44px;
		}

		.settings-saved {
			margin-left: 0;
			text-align: center;
		}
	}
</style>
