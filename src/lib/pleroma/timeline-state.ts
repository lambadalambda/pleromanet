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
	const currentIds = new Set(current.map((item) => item.id));
	const seenIncoming = new Set(currentIds);
	const uniqueIncoming = incoming.filter((item) => {
		if (seenIncoming.has(item.id)) return false;
		seenIncoming.add(item.id);
		return true;
	});
	const seen = new Set([...currentIds, ...uniqueIncoming.map((item) => item.id)]);
	const queuedOnly = queued.filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});

	return [...uniqueIncoming, ...queuedOnly];
};

export const reconcileTimelineCatchUp = <Item extends TimelineItem>(
	data: Item[],
	queued: Item[],
	incoming: Item[],
	initialDataIds: ReadonlySet<string | number>,
	initialQueuedIds: ReadonlySet<string | number>,
	insertImmediately = false
) => {
	const incomingIds = new Set(incoming.map((item) => item.id));
	const overlappingDataIndex = data.findIndex((item) => incomingIds.has(item.id));
	const queuedOnly = queued.filter((item) => !incomingIds.has(item.id));
	const queuedDuringCatchUp = queuedOnly.filter((item) => !initialQueuedIds.has(item.id));
	const queuedBeforeCatchUp = queuedOnly.filter((item) => initialQueuedIds.has(item.id));
	if (overlappingDataIndex >= 0) {
		const overlappingId = data[overlappingDataIndex].id;
		const incomingOverlapIndex = incoming.findIndex((item) => item.id === overlappingId);
		const dataBeforeOverlap = data.slice(0, overlappingDataIndex).filter((item) => !incomingIds.has(item.id));
		const dataAfterOverlap = data.slice(overlappingDataIndex).filter((item) => !incomingIds.has(item.id));
		if (insertImmediately) {
			const orderedNew = mergeTimelineItems(mergeTimelineItems(mergeTimelineItems(queuedDuringCatchUp, dataBeforeOverlap), incoming), queuedBeforeCatchUp);
			return { data: prependTimelineItems(dataAfterOverlap, orderedNew), newerPosts: [] as Item[] };
		}

		const incomingBeforeOverlap = incoming.slice(0, incomingOverlapIndex);
		const incomingFromOverlap = incoming.slice(incomingOverlapIndex);
		const reconciledData = prependTimelineItems(dataAfterOverlap, mergeTimelineItems(mergeTimelineItems(dataBeforeOverlap, incomingFromOverlap), queuedBeforeCatchUp));
		return {
			data: reconciledData,
			newerPosts: queueNewerTimelineItems([], reconciledData, mergeTimelineItems(queuedDuringCatchUp, incomingBeforeOverlap))
		};
	}

	const previousData = data.filter((item) => initialDataIds.has(item.id));
	const concurrentData = data.filter((item) => !initialDataIds.has(item.id));
	const existingOnly = mergeTimelineItems(
		queuedDuringCatchUp,
		concurrentData.filter((item) => !incomingIds.has(item.id))
	);
	const orderedNew = mergeTimelineItems(mergeTimelineItems(existingOnly, incoming), queuedBeforeCatchUp);
	const overlapsConcurrentData = concurrentData.some((item) => incomingIds.has(item.id));

	if (insertImmediately || overlapsConcurrentData || concurrentData.length > 0) {
		return { data: prependTimelineItems(previousData, orderedNew), newerPosts: [] as Item[] };
	}

	return {
		data,
		newerPosts: queueNewerTimelineItems([], data, orderedNew)
	};
};
