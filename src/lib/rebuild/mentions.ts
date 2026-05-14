export const POSTBODY_MENTION_RE = /@[\w.]+(?:@[\w.]+)?/g;

export type BodyPart = string | { key: string; text: string };

export const renderBodyText = (text: string | undefined): BodyPart[] => {
	if (!text) return [];
	const out: BodyPart[] = [];
	let lastIdx = 0;
	let match: RegExpExecArray | null;
	let key = 0;
	POSTBODY_MENTION_RE.lastIndex = 0;
	while ((match = POSTBODY_MENTION_RE.exec(text)) !== null) {
		if (match.index > lastIdx) out.push(text.slice(lastIdx, match.index));
		out.push({ key: 'm' + key++, text: match[0] });
		lastIdx = match.index + match[0].length;
	}
	if (lastIdx < text.length) out.push(text.slice(lastIdx));
	return out;
};
