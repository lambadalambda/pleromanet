import { createPleromaHttp, encodePathSegment, type FetchLike } from './http';
import { registerOAuthApp as registerApp } from './oauth';
import type {
	PleromaAccount,
	PleromaInstance,
	PleromaRelationship,
	PleromaSearchResult,
	PleromaStatus,
	PleromaStatusContext,
	PleromaTag,
	ProfileUpdate,
	SearchQuery,
	TimelineQuery
} from './types';

type ClientConfig = {
	instanceUrl: string;
	accessToken?: string;
	fetch?: FetchLike;
};

const timelineQuery = (query: TimelineQuery = {}) => ({
	limit: query.limit,
	max_id: query.maxId,
	min_id: query.minId,
	since_id: query.sinceId,
	only_media: query.onlyMedia
});

const searchQuery = (query: SearchQuery) => ({
	q: query.q,
	type: query.type,
	resolve: query.resolve,
	limit: query.limit,
	offset: query.offset,
	following: query.following
});

const profileUpdateBody = (profile: ProfileUpdate) => ({
	display_name: profile.displayName,
	note: profile.note,
	locked: profile.locked,
	bot: profile.bot,
	discoverable: profile.discoverable,
	fields_attributes: profile.fields
});

export const createPleromaClient = (config: ClientConfig) => {
	const http = createPleromaHttp(config);

	return {
		getHomeTimeline: (query?: TimelineQuery) =>
			http.request<PleromaStatus[]>({
				path: '/api/v1/timelines/home',
				query: timelineQuery(query),
				auth: 'required'
			}),

		getLocalTimeline: (query?: TimelineQuery) =>
			http.request<PleromaStatus[]>({
				path: '/api/v1/timelines/public',
				query: { ...timelineQuery(query), local: true },
				auth: 'optional'
			}),

		getFederatedTimeline: (query?: TimelineQuery) =>
			http.request<PleromaStatus[]>({
				path: '/api/v1/timelines/public',
				query: timelineQuery(query),
				auth: 'optional'
			}),

		getStatus: (id: string) =>
			http.request<PleromaStatus>({
				path: `/api/v1/statuses/${encodePathSegment(id)}`,
				auth: 'optional'
			}),

		getStatusContext: (id: string) =>
			http.request<PleromaStatusContext>({
				path: `/api/v1/statuses/${encodePathSegment(id)}/context`,
				auth: 'optional'
			}),

		getAccount: (id: string) =>
			http.request<PleromaAccount>({
				path: `/api/v1/accounts/${encodePathSegment(id)}`,
				auth: 'optional'
			}),

		updateAccountProfile: (profile: ProfileUpdate) =>
			http.request<PleromaAccount>({
				method: 'PATCH',
				path: '/api/v1/accounts/update_credentials',
				body: profileUpdateBody(profile),
				auth: 'required'
			}),

		followAccount: (id: string) =>
			http.request<PleromaRelationship>({
				method: 'POST',
				path: `/api/v1/accounts/${encodePathSegment(id)}/follow`,
				auth: 'required'
			}),

		unfollowAccount: (id: string) =>
			http.request<PleromaRelationship>({
				method: 'POST',
				path: `/api/v1/accounts/${encodePathSegment(id)}/unfollow`,
				auth: 'required'
			}),

		favoriteStatus: (id: string) =>
			http.request<PleromaStatus>({
				method: 'POST',
				path: `/api/v1/statuses/${encodePathSegment(id)}/favourite`,
				auth: 'required'
			}),

		unfavoriteStatus: (id: string) =>
			http.request<PleromaStatus>({
				method: 'POST',
				path: `/api/v1/statuses/${encodePathSegment(id)}/unfavourite`,
				auth: 'required'
			}),

		boostStatus: (id: string) =>
			http.request<PleromaStatus>({
				method: 'POST',
				path: `/api/v1/statuses/${encodePathSegment(id)}/reblog`,
				auth: 'required'
			}),

		unboostStatus: (id: string) =>
			http.request<PleromaStatus>({
				method: 'POST',
				path: `/api/v1/statuses/${encodePathSegment(id)}/unreblog`,
				auth: 'required'
			}),

		search: (query: SearchQuery) =>
			http.request<PleromaSearchResult>({
				path: '/api/v2/search',
				query: searchQuery(query),
				auth: 'optional'
			}),

		getTrendingTags: (query: Pick<TimelineQuery, 'limit'> = {}) =>
			http.request<PleromaTag[]>({
				path: '/api/v1/trends/tags',
				query: { limit: query.limit },
				auth: 'optional'
			}),

		getInstance: () =>
			http.request<PleromaInstance>({
				path: '/api/v2/instance',
				auth: 'optional'
			}),

		registerOAuthApp: (input: Parameters<typeof registerApp>[0]) => registerApp(input)
	};
};

export type PleromaClient = ReturnType<typeof createPleromaClient>;
