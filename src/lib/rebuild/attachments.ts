export type BannerVariant = 'sunset' | 'pixel-window' | 'city' | 'space';

export const bannerVariants: BannerVariant[] = ['sunset', 'pixel-window', 'city', 'space'];

export const isBannerVariant = (value: string | undefined): value is BannerVariant =>
	bannerVariants.some((variant) => variant === value);

export type PhotoAttachment = {
	kind: 'photo';
	src: string;
	alt?: string;
	cw?: boolean;
	filename?: string;
};

export type VideoAttachment = {
	kind: 'video';
	poster?: BannerVariant;
	title?: string;
	duration?: string;
	cc?: boolean;
	caption?: string;
	start?: number;
	filename?: string;
};

export type AudioAttachment = {
	kind: 'audio';
	title?: string;
	byline?: string;
	duration?: string;
	cover?: string;
	start?: number;
	filename?: string;
};

export type Attachment = PhotoAttachment | VideoAttachment | AudioAttachment;

export type LegacyPhotoAttachment = Omit<PhotoAttachment, 'kind'> & { kind?: 'photo' };
export type LegacyVideoAttachment = Omit<VideoAttachment, 'kind'> & { kind?: 'video' };
export type LegacyAudioAttachment = Omit<AudioAttachment, 'kind'> & { kind?: 'audio' };

export type PostLike = {
	attachments?: Attachment[];
	photos?: LegacyPhotoAttachment[];
	video?: LegacyVideoAttachment;
	audio?: LegacyAudioAttachment;
	media?: BannerVariant;
	avBanner?: BannerVariant;
	[key: string]: unknown;
};

export type NoLayout = { type: 'none' };
export type SingleLayout = { type: 'single'; attachment: Attachment };
export type PhotoGridLayout = { type: 'photoGrid'; photos: PhotoAttachment[] };
export type PhotoAudioLayout = { type: 'photoAudio'; photo: PhotoAttachment; audio: AudioAttachment };
export type PhotosAudioLayout = { type: 'photosAudio'; photos: PhotoAttachment[]; audio: AudioAttachment };
export type HeroStripLayout = { type: 'heroStrip'; attachments: Attachment[] };

export type AttachmentLayout =
	| NoLayout
	| SingleLayout
	| PhotoGridLayout
	| PhotoAudioLayout
	| PhotosAudioLayout
	| HeroStripLayout;

export const pickAttachmentLayout = (attachments: Attachment[] | undefined): AttachmentLayout => {
	if (!attachments || attachments.length === 0) return { type: 'none' };
	const photos = attachments.filter((a): a is PhotoAttachment => a.kind === 'photo');
	const videos = attachments.filter((a): a is VideoAttachment => a.kind === 'video');
	const audios = attachments.filter((a): a is AudioAttachment => a.kind === 'audio');

	if (attachments.length === 1) {
		return { type: 'single', attachment: attachments[0] };
	}
	if (photos.length === attachments.length && photos.length <= 4) {
		return { type: 'photoGrid', photos };
	}
	if (photos.length === 1 && audios.length === 1 && videos.length === 0) {
		return { type: 'photoAudio', photo: photos[0], audio: audios[0] };
	}
	if (photos.length >= 2 && photos.length <= 4 && audios.length === 1 && videos.length === 0) {
		return { type: 'photosAudio', photos, audio: audios[0] };
	}
	return { type: 'heroStrip', attachments };
};

export const normalizeAttachments = (post: PostLike): Attachment[] => {
	if (post.attachments) return post.attachments;
	const out: Attachment[] = [];
	if (post.photos) post.photos.forEach((p) => out.push({ ...p, kind: 'photo' }));
	if (post.video) out.push({ ...post.video, kind: 'video' });
	if (post.audio) out.push({ ...post.audio, kind: 'audio' });
	return out;
};

export const attachmentTitle = (attachment: Attachment): string => {
	if (attachment.kind === 'photo') return attachment.filename || attachment.alt || 'photo';
	if (attachment.kind === 'video') return attachment.title || attachment.filename || 'video';
	return attachment.title || attachment.filename || 'audio';
};

export const parseDur = (s: string): number => {
	const [m, sec] = s.split(':').map(Number);
	return m * 60 + sec;
};

export const fmtDur = (t: number): string => {
	const m = Math.floor(t / 60);
	const s = Math.floor(t % 60);
	return m + ':' + String(s).padStart(2, '0');
};

export type LightboxAttribution = {
	name?: string;
	handle?: string;
	avClass?: string;
	avBanner?: BannerVariant;
};

export const openLightbox = (
	attachments: Attachment[],
	startIdx = 0,
	attribution: LightboxAttribution | null = null
) => {
	window.dispatchEvent(
		new CustomEvent('pn-open-lightbox', {
			detail: { attachments, startIdx, attribution },
		})
	);
};

export const pickQuoteHero = (
	attachments: Attachment[] | undefined
): Attachment | null => {
	if (!attachments || !attachments.length) return null;
	const photo = attachments.find((a) => a.kind === 'photo');
	return photo || attachments[0];
};
