export type ComposerPollDraft = {
	choices: string[];
	duration: string;
	multi: boolean;
	hideUntil: boolean;
};

export type ComposerPollPayload = {
	options: string[];
	expiresIn: number;
	multiple: boolean;
	hideTotals: boolean;
};

const durationSeconds: Record<string, number> = {
	'5m': 5 * 60,
	'1h': 60 * 60,
	'6h': 6 * 60 * 60,
	'24h': 24 * 60 * 60,
	'3d': 3 * 24 * 60 * 60,
	'7d': 7 * 24 * 60 * 60
};

export const createComposerPollDraft = (): ComposerPollDraft => ({
	choices: ['', '', ''],
	duration: '24h',
	multi: false,
	hideUntil: true
});

export const composerPollPayload = (poll: ComposerPollDraft): ComposerPollPayload | null => {
	const options = poll.choices.map((choice) => choice.trim()).filter(Boolean);
	if (options.length < 2) return null;

	return {
		options,
		expiresIn: durationSeconds[poll.duration] ?? durationSeconds['24h'],
		multiple: poll.multi,
		hideTotals: poll.hideUntil
	};
};
