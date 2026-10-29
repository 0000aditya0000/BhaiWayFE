import React, { forwardRef, useMemo } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { resolveFontStyle } from '@/theme/fontTheme';

function withResolvedFont(style: TextProps['style']): Array<TextStyle | typeof style> {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const resolved = resolveFontStyle(flat);
  return style != null ? [style, resolved] : [resolved];
}

/**
 * Brand Text — maps fontWeight to the correct Noto Sans face.
 * Prefer this (or typography tokens) over raw React Native Text.
 */
export const AppText = forwardRef<React.ComponentRef<typeof RNText>, TextProps>(
  function AppText({ style, ...rest }, ref) {
    const resolvedStyle = useMemo(() => withResolvedFont(style), [style]);
    return <RNText ref={ref} {...rest} style={resolvedStyle} />;
  },
);

AppText.displayName = 'AppText';

/**
 * Brand TextInput — same weight → family mapping as AppText.
 */
export const AppTextInput = forwardRef<
  React.ComponentRef<typeof RNTextInput>,
  TextInputProps
>(function AppTextInput({ style, ...rest }, ref) {
  const resolvedStyle = useMemo(() => withResolvedFont(style), [style]);
  return <RNTextInput ref={ref} {...rest} style={resolvedStyle} />;
});

AppTextInput.displayName = 'AppTextInput';
