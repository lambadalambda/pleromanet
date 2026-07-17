import { base } from '$app/paths';

export const appPath = (path: string) => `${base}${path}`;

export const stripBasePath = (pathname: string) =>
	base && (pathname === base || pathname.startsWith(`${base}/`)) ? pathname.slice(base.length) || '/' : pathname;
