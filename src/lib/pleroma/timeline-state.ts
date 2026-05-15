import type { TimelineCursor } from './types';

export type TimelineItem = {
	id: string | number;
};

export type TimelineLoadMoreStatus = 'idle' | 'loading' | 'error';

export type PaginatedTimelineSuccess<Item extends TimelineItem, ErrorView> = {
	status: 'success';
	data: Item[];
	nextCursor: TimelineCursor | null;
	loadMoreStatus: TimelineLoadMoreStatus;
	loadMoreError?: ErrorView;
};

export type PaginatedTimelineBaseState<ErrorView> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'empty' }
	| { status: 'error'; error: ErrorView };

export type PaginatedTimelineState<Item extends TimelineItem, ErrorView> =
	| PaginatedTimelineBaseState<ErrorView>
	| PaginatedTimelineSuccess<Item, ErrorView>;

export const mergeTimelineItems = <Item extends TimelineItem>(current: Item[], next: Item[]) => {
	const seen = new Set(current.map((item) => item.id));
	return [
		...current,
		...next.filter((item) => {
			if (seen.has(item.id)) return false;
			seen.add(item.id);
			return true;
		})
	];
};

export const prependTimelineItems = <Item extends TimelineItem>(current: Item[], next: Item[]) => {
	const seen = new Set(current.map((item) => item.id));
	const uniqueNext = next.filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});

	return [...uniqueNext, ...current];
};

export const queueNewerTimelineItems = <Item extends TimelineItem>(queued: Item[], current: Item[], incoming: Item[]) => {
	const seen = new Set([...current.map((item) => item.id), ...queued.map((item) => item.id)]);
	const uniqueIncoming = incoming.filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});

	return [...uniqueIncoming, ...queued];
};
