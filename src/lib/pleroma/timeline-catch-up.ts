import type { TimelineCursor, TimelinePage } from './types';

type TimelineItem = { id: string | number };

type TimelineCatchUpOptions<Item extends TimelineItem> = {
	sinceId: string | null;
	loadPage: (cursor?: TimelineCursor) => Promise<TimelinePage<Item>>;
};

const cursorKey = (cursor: TimelineCursor | undefined) => JSON.stringify(cursor ?? {});

export const loadTimelineCatchUp = async <Item extends TimelineItem>({ sinceId, loadPage }: TimelineCatchUpOptions<Item>) => {
	let cursor: TimelineCursor | undefined = sinceId ? { sinceId } : undefined;
	const visitedCursors = new Set<string>();
	const seenItems = new Set<string | number>();
	const items: Item[] = [];
	let newestId: string | null = null;
	let nextCursor: TimelineCursor | null = null;

	while (true) {
		const currentCursorKey = cursorKey(cursor);
		if (visitedCursors.has(currentCursorKey)) throw new Error('Timeline catch-up returned a repeated pagination cursor.');
		visitedCursors.add(currentCursorKey);
		const page = await loadPage(cursor);
		if (newestId === null && page.items[0]) newestId = String(page.items[0].id);
		for (const item of page.items) {
			if (seenItems.has(item.id)) continue;
			seenItems.add(item.id);
			items.push(item);
		}

		if (!sinceId) {
			nextCursor = page.cursors.next;
			break;
		}
		if (!page.cursors.next) break;
		cursor = { ...page.cursors.next, sinceId };
	}

	return { items, newestId, nextCursor };
};
