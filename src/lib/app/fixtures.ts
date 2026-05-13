import { pleromaFixtures } from '$lib/pleroma/fixtures';
import { adaptPleromaStatus, adaptPleromaStatuses } from '$lib/pleroma/ui';

export const appTimelinePosts = adaptPleromaStatuses(pleromaFixtures.timelines.home, { timelines: ['home'] });
export const publicTimelinePosts = adaptPleromaStatuses(pleromaFixtures.timelines.public, { timelines: ['federated'] });
export const localTimelinePosts = [adaptPleromaStatus(pleromaFixtures.status, { timelines: ['local'] })];
export const federatedTimelinePosts = publicTimelinePosts;
export const focusedThreadPost = appTimelinePosts[0];

export const appTrends = [
	{ tag: '#smallweb', count: '24 posts' },
	{ tag: '#fedidevs', count: '18 posts' },
	{ tag: '#pleroma', count: '12 posts' }
];

export const followSuggestions = [
	{ name: 'quiet admin', handle: '@quietadmin@pleroma.example' },
	{ name: 'datagram', handle: '@datagram@a-very-long-retro-instance-name.social' },
	{ name: 'gridwave', handle: '@gridwave@retro.social' }
];
