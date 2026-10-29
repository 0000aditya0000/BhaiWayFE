import type { TextStyle } from 'react-native';

/**
 * App-wide font theme for BhaiWay.
 *
 * Typeface: Noto Sans (`@expo-google-fonts/noto-sans`).
 * Import from `@/theme` (or `@/theme/fontTheme`).
 */

export const fonts = {
  thin: 'NotoSans_100Thin',
  extraLight: 'NotoSans_200ExtraLight',
  light: 'NotoSans_300Light',
  regular: 'NotoSans_400Regular',
  medium: 'NotoSans_500Medium',
  semiBold: 'NotoSans_600SemiBold',
  bold: 'NotoSans_700Bold',
  extraBold: 'NotoSans_800ExtraBold',
  black: 'NotoSans_900Black',
  italic: 'NotoSans_400Regular_Italic',
} as const;

export type AppFontFamily = (typeof fonts)[keyof typeof fonts];

const WEIGHT_TO_FAMILY: Record<string, AppFontFamily> = {
  '100': fonts.thin,
  '200': fonts.extraLight,
  '300': fonts.light,
  '400': fonts.regular,
  normal: fonts.regular,
  '500': fonts.medium,
  '600': fonts.semiBold,
  '700': fonts.bold,
  bold: fonts.bold,
  '800': fonts.extraBold,
  '900': fonts.black,
};

const NOTO_PREFIX = 'NotoSans_';

/** True when the face is an intentional non-brand font (e.g. mono codes). */
export const isExplicitNonBrandFont = (fontFamily?: string): boolean => {
  if (!fontFamily) {
    return false;
  }
  return !fontFamily.startsWith(NOTO_PREFIX) && fontFamily !== 'System';
};

/**
 * Maps fontWeight → Noto Sans face.
 * Prefer this over combining a single Regular family with fontWeight
 * (Android often ignores weight; iOS can fall back to system).
 */
export const fontFamilyForWeight = (
  fontWeight?: TextStyle['fontWeight'],
): AppFontFamily => {
  if (fontWeight == null) {
    return fonts.regular;
  }
  return WEIGHT_TO_FAMILY[String(fontWeight)] ?? fonts.regular;
};

export type FlattenedTextStyle = TextStyle | null | undefined;

/**
 * Resolves the brand font for a flattened text style.
 * Keeps explicit non-brand families (Courier, etc.).
 * Clears fontWeight when a weight-specific Noto Sans face is applied.
 */
export const resolveFontStyle = (
  flat: FlattenedTextStyle,
): Pick<TextStyle, 'fontFamily' | 'fontWeight' | 'fontStyle'> => {
  const fontFamily = flat?.fontFamily;
  if (isExplicitNonBrandFont(fontFamily)) {
    return {};
  }

  if (flat?.fontStyle === 'italic') {
    return {
      fontFamily: fonts.italic,
      fontWeight: undefined,
      fontStyle: 'normal',
    };
  }

  if (typeof fontFamily === 'string' && fontFamily.startsWith(NOTO_PREFIX)) {
    return { fontFamily, fontWeight: undefined };
  }

  const resolved = fontFamilyForWeight(flat?.fontWeight);
  return { fontFamily: resolved, fontWeight: undefined };
};

/**
 * BhaiWay type scale — weight-specific Noto Sans faces.
 */
export const typography = {
  displayLarge: {
    fontFamily: fonts.extraBold,
    fontSize: 46,
    fontWeight: '800' as const,
    lineHeight: 52,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  titleSmall: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 34,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  input: {
    fontFamily: fonts.medium,
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  button: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  buttonCompact: {
    fontFamily: fonts.bold,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  buttonCompactMuted: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  overline: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
} as const;

export type AppTypography = typeof typography;

/** Alias for the full font + type-scale theme. */
export const fontTheme = {
  fonts,
  typography,
} as const;
