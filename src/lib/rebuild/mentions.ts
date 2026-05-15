import type { CustomEmoji } from '$lib/social/types';

const TEXT_TOKEN_RE = /@[\w.]+(?:@[\w.-]+)?|:([A-Za-z0-9_+-]+):/g;

export type BodyPart =
	| string
	| { kind: 'mention'; key: string; text: string }
	| { kind: 'emoji'; key: string; shortcode: string; url: string; staticUrl?: string };

export const renderBodyText = (text: string | undefined, emojis: CustomEmoji[] = []): BodyPart[] => {
	if (!text) return [];
	const emojiByShortcode = new Map(emojis.map((emoji) => [emoji.shortcode, emoji]));
	const out: BodyPart[] = [];
	let lastIdx = 0;
	let match: RegExpExecArray | null;
	let key = 0;
	TEXT_TOKEN_RE.lastIndex = 0;
	while ((match = TEXT_TOKEN_RE.exec(text)) !== null) {
		const shortcode = match[1];
		const emoji = shortcode ? emojiByShortcode.get(shortcode) : null;
		if (shortcode && !emoji) continue;

		if (match.index > lastIdx) out.push(text.slice(lastIdx, match.index));
		if (emoji) out.push({ kind: 'emoji', key: 'e' + key++, shortcode: emoji.shortcode, url: emoji.url, staticUrl: emoji.staticUrl });
		else out.push({ kind: 'mention', key: 'm' + key++, text: match[0] });
		lastIdx = match.index + match[0].length;
	}
	if (lastIdx < text.length) out.push(text.slice(lastIdx));
	return out;
};
