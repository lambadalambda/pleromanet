import { expect, test } from '@playwright/test';
import {
	BUILT_IN_THEME_PALETTES,
	contrastRatio,
	deriveThemeTokens,
	formatThemeShareCode,
	normalizeHex,
	parseThemeShareCode,
	themeContrastChecks
} from './theme';

test('custom theme helpers normalize colors and round-trip PN1 share codes', () => {
	expect(normalizeHex('abc')).toBe('#AABBCC');
	expect(normalizeHex('#12abEF')).toBe('#12ABEF');
	expect(normalizeHex('nope')).toBeNull();

	const palette = BUILT_IN_THEME_PALETTES.cream;
	const code = formatThemeShareCode(palette);
	expect(code).toBe('PN1:F5F1E8,FBFAF3,1F2347,7A7C95,A48BD9,A8D5B1,E0B97A,D68B8B');
	expect(parseThemeShareCode(code)).toEqual(palette);
	expect(parseThemeShareCode(' pn1: f5f1e8, fbfaf3, 1f2347, 7a7c95, a48bd9, a8d5b1, e0b97a, d68b8b ')).toEqual(palette);
});

test('custom theme helpers reject malformed and unsupported share codes atomically', () => {
	expect(() => parseThemeShareCode('PN2:F5F1E8,FBFAF3,1F2347,7A7C95,A48BD9,A8D5B1,E0B97A,D68B8B')).toThrow(/newer format/i);
	expect(() => parseThemeShareCode('PN1:F5F1E8,FBFAF3')).toThrow(/8 hex colors/i);
	expect(() => parseThemeShareCode('PN1:F5F1E8,FBFAF3,1F2347,7A7C95,nothex,A8D5B1,E0B97A,D68B8B')).toThrow(/hex color/i);
});

test('custom theme helpers derive all semantic colors and contrast results', () => {
	const palette = BUILT_IN_THEME_PALETTES.drive;
	const tokens = deriveThemeTokens(palette);

	expect(Object.keys(tokens)).toEqual([
		'--bg', '--panel', '--panel-2', '--border', '--border-strong', '--ink', '--ink-2', '--muted', '--muted-2',
		'--accent', '--accent-ink', '--accent-soft', '--accent-soft-2', '--pink', '--teal', '--good', '--good-ink', '--warn', '--warn-ink', '--bad'
	]);
	expect(tokens['--bg']).toBe('#07091A');
	expect(tokens['--panel']).toBe('#0E1228');
	expect(tokens['--accent']).toBe('#7DC4BE');
	expect(contrastRatio('#FFFFFF', '#000000')).toBe(21);
	expect(themeContrastChecks(palette).map((check) => check.id)).toEqual(['primary-page', 'primary-panel', 'muted-panel', 'accent-panel']);
	expect(themeContrastChecks({ ...palette, ink: '#111111', bg: '#101010', panel: '#111111' }).some((check) => !check.passes)).toBe(true);
	expect(themeContrastChecks({ ...palette, accent: palette.panel }).find((check) => check.id === 'accent-panel')?.passes).toBe(false);
});
