import React, { useCallback, useRef } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/shared/theme';
import { useScrollFocusedInputIntoView } from '@/shared/hooks/useScrollFocusedInputIntoView';
import {
  isIOS,
  keyboardAvoidingBehavior,
  keyboardVerticalOffset,
  scrollKeyboardDismissMode,
} from '@/shared/utils/platform';
import type { KeyboardAwareScrollViewProps } from './KeyboardAwareScrollView.types';

/** Approximate AppFooter height used when screens render footer outside this scroll. */
export const APP_FOOTER_KEYBOARD_OFFSET = 84;

/**
 * Keyboard-safe scroll container.
 * Keeps focused inputs above the keyboard and supports an optional sticky footer.
 */
export const KeyboardAwareScrollView = ({
  children,
  footer,
  style,
  contentContainerStyle,
  bottomInset = spacing.xxl,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  scrollViewRef,
  onScroll,
  scrollEventThrottle = 16,
  keyboardVerticalOffset: offsetOverride,
  extraBottomOffset = 0,
}: KeyboardAwareScrollViewProps) => {
  const insets = useSafeAreaInsets();
  const resolvedRef = useRef<ScrollView | null>(null);

  const { scrollFocusedIntoView, onScroll: trackScrollOffset } =
    useScrollFocusedInputIntoView(resolvedRef, {
      enabled: true,
      extraBottomOffset,
    });

  const setRefs = useCallback(
    (node: ScrollView | null) => {
      resolvedRef.current = node;
      if (!scrollViewRef) {
        return;
      }
      if (typeof scrollViewRef === 'function') {
        scrollViewRef(node);
        return;
      }
      (scrollViewRef as React.MutableRefObject<ScrollView | null>).current = node;
    },
    [scrollViewRef],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      trackScrollOffset(event);
      onScroll?.(event);
    },
    [onScroll, trackScrollOffset],
  );

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={keyboardAvoidingBehavior}
      keyboardVerticalOffset={offsetOverride ?? keyboardVerticalOffset}
    >
      <ScrollView
        ref={setRefs}
        style={{ flex: 1 }}
        contentContainerStyle={[
          contentContainerStyle,
          { paddingBottom: insets.bottom + bottomInset, flexGrow: 1 },
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={scrollKeyboardDismissMode}
        automaticallyAdjustKeyboardInsets={!isIOS}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        onContentSizeChange={() => {
          scrollFocusedIntoView();
        }}
      >
        {children}
      </ScrollView>
      {footer ? <View>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
};
