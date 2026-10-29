import {
  NotoSans_100Thin,
  NotoSans_200ExtraLight,
  NotoSans_300Light,
  NotoSans_400Regular,
  NotoSans_400Regular_Italic,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
  NotoSans_800ExtraBold,
  NotoSans_900Black,
} from '@expo-google-fonts/noto-sans';
import { useFonts } from 'expo-font';

import { fonts } from '@/theme/fontTheme';

/**
 * Loads BhaiWay brand fonts (Noto Sans from Google Fonts via Expo).
 * Returns [loaded, error].
 */
export const useBhaiWayFonts = () =>
  useFonts({
    [fonts.thin]: NotoSans_100Thin,
    [fonts.extraLight]: NotoSans_200ExtraLight,
    [fonts.light]: NotoSans_300Light,
    [fonts.regular]: NotoSans_400Regular,
    [fonts.medium]: NotoSans_500Medium,
    [fonts.semiBold]: NotoSans_600SemiBold,
    [fonts.bold]: NotoSans_700Bold,
    [fonts.extraBold]: NotoSans_800ExtraBold,
    [fonts.black]: NotoSans_900Black,
    [fonts.italic]: NotoSans_400Regular_Italic,
  });
