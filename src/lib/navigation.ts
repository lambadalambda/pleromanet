const base = import.meta.env?.BASE_PATH ?? '';

export const appPath = (path: string) => `${base}${path}`;

export const stripBasePath = (pathname: string) =>
	base && (pathname === base || pathname.startsWith(`${base}/`)) ? pathname.slice(base.length) || '/' : pathname;
