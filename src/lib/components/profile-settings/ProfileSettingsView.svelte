<script lang="ts">
	import ProfilePreviewCard from './ProfilePreviewCard.svelte';
	import ProfileSettingSwitch from './ProfileSettingSwitch.svelte';
	import ProfileTipsCard from './ProfileTipsCard.svelte';
	import ProfileUploadRow from './ProfileUploadRow.svelte';
	import {
		cloneProfileSettings,
		createDefaultProfileSettings,
		profileSettingsEqual,
		type ProfileSettings
	} from './types';

	let savedProfile = $state<ProfileSettings>(createDefaultProfileSettings());
	let draftProfile = $state<ProfileSettings>(createDefaultProfileSettings());
	let saveMessage = $state('Saved');

	const isDirty = $derived(!profileSettingsEqual(savedProfile, draftProfile));
	const saveState = $derived(isDirty ? 'Unsaved changes' : saveMessage);

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
</script>

<section class="settings-view" aria-labelledby="profile-settings-title">
	<div class="settings-main">
		<div class="pn-card settings-card">
			<header class="settings-head">
				<p class="settings-breadcrumb">Settings / Profile</p>
				<div class="settings-title-row">
					<div>
						<p class="pn-kicker">Account profile</p>
						<h1 id="profile-settings-title">Profile settings</h1>
						<p>
							Edit the public profile details shown across PleromaNet. These controls are mocked
							until the profile update API is wired.
						</p>
					</div>
					<span class="pn-pill" data-testid="settings-save-state">{saveState}</span>
				</div>
			</header>

			<div class="settings-section upload-section">
				<ProfileUploadRow
					title="Avatar"
					description="Square image shown beside your posts. File handling is stubbed for now."
					buttonLabel="Choose avatar"
					preview="avatar"
					testId="avatar-upload-row"
				/>
				<ProfileUploadRow
					title="Banner"
					description="Wide profile header treatment for profile preview and profile pages."
					buttonLabel="Choose banner"
					preview="banner"
					testId="banner-upload-row"
				/>
			</div>

			<div class="settings-section form-grid">
				<label class="field">
					<span>Display name</span>
					<input
						type="text"
						aria-label="Display name"
						value={draftProfile.displayName}
						oninput={(event) => updateProfile({ displayName: event.currentTarget.value })}
					/>
				</label>
				<label class="field">
					<span>Username</span>
					<input
						type="text"
						aria-label="Username"
						value={draftProfile.username}
						oninput={(event) => updateProfile({ username: event.currentTarget.value })}
					/>
				</label>
				<label class="field">
					<span>Instance</span>
					<input
						type="text"
						aria-label="Instance domain"
						value={draftProfile.instance}
						oninput={(event) => updateProfile({ instance: event.currentTarget.value })}
					/>
				</label>
				<label class="field">
					<span>Website</span>
					<input
						type="url"
						aria-label="Website"
						value={draftProfile.website}
						oninput={(event) => updateProfile({ website: event.currentTarget.value })}
					/>
				</label>
				<label class="field field--wide">
					<span>Bio</span>
					<textarea
						aria-label="Bio"
						value={draftProfile.bio}
						oninput={(event) => updateProfile({ bio: event.currentTarget.value })}
					></textarea>
				</label>
				<label class="field field--wide">
					<span>Location</span>
					<input
						type="text"
						aria-label="Location"
						value={draftProfile.location}
						oninput={(event) => updateProfile({ location: event.currentTarget.value })}
					/>
				</label>
			</div>

			<div class="settings-section toggle-section">
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
				<button class="pn-button" type="button" aria-label="Reset profile settings" disabled={!isDirty} onclick={resetProfile}>
					Reset
				</button>
				<button class="pn-button pn-button--primary" type="button" aria-label="Save profile settings" disabled={!isDirty} onclick={saveProfile}>
					Save
				</button>
			</footer>
		</div>
	</div>

	<aside class="settings-preview" aria-label="Profile settings preview">
		<ProfilePreviewCard profile={draftProfile} />
		<ProfileTipsCard />
	</aside>
</section>

<style>
	.settings-view {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 280px;
		gap: 16px;
		align-items: start;
	}

	.settings-main,
	.settings-preview {
		min-width: 0;
	}

	.settings-preview {
		display: grid;
		gap: 16px;
	}

	.settings-card,
	.settings-preview :global(.pn-card) {
		box-shadow: none;
	}

	.settings-head,
	.settings-section,
	.settings-actions {
		padding: 16px 18px;
	}

	.settings-head,
	.settings-section {
		border-bottom: 1px solid var(--border);
	}

	.settings-breadcrumb,
	.settings-head h1,
	.settings-head p {
		margin: 0;
	}

	.settings-breadcrumb {
		font-family: var(--mono);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent-ink);
	}

	.settings-title-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 16px;
		align-items: start;
		margin-top: 12px;
	}

	.settings-head h1 {
		margin-top: 6px;
		font-family: var(--serif);
		font-size: clamp(2rem, 4vw, 3.4rem);
		font-weight: 500;
		line-height: 1;
	}

	.settings-head .pn-kicker + h1 + p {
		max-width: 58ch;
		margin-top: 10px;
		color: var(--ink-2);
	}

	.upload-section {
		display: grid;
		gap: 12px;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	.field {
		display: grid;
		gap: 6px;
	}

	.field--wide {
		grid-column: 1 / -1;
	}

	.field span {
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.field input,
	.field textarea {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel-2);
		padding: 10px 11px;
		outline: 0;
	}

	.field textarea {
		min-height: 96px;
		resize: vertical;
	}

	.field input:focus,
	.field textarea:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft-2);
	}

	.toggle-section {
		display: grid;
	}

	.settings-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	.settings-actions button {
		min-height: 40px;
	}

	.settings-actions button:disabled {
		cursor: default;
		opacity: 0.55;
	}

	@media (max-width: 1100px) {
		.settings-view {
			grid-template-columns: 1fr;
		}

		.settings-preview {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 560px) {
		.settings-head,
		.settings-section,
		.settings-actions {
			padding: 14px;
		}

		.settings-title-row,
		.form-grid,
		.settings-preview {
			grid-template-columns: 1fr;
		}

		.settings-actions {
			align-items: stretch;
			flex-direction: column-reverse;
		}

		.settings-actions button {
			width: 100%;
			min-height: 44px;
		}
	}
</style>
