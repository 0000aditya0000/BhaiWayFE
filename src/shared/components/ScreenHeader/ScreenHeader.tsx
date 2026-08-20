import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { AppTopBar } from '../AppTopBar/AppTopBar';
import { IconButton } from '../IconButton/IconButton';
import { colors, typography } from '@/shared/theme';
import type { ScreenHeaderProps } from './ScreenHeader.types';
import { AppText as Text } from '../AppText';

/**
 * Top bar for screens that also show AppFooter (which includes Profile).
 * Right action defaults to notifications — never a profile avatar.
 */
export const ScreenHeader = ({
  title,
  onBack,
  onNotificationsPress,
  right,
  showBack = true,
}: ScreenHeaderProps) => {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.home);
  }, [onBack, router]);

  const openNotifications = useCallback(() => {
    if (onNotificationsPress) {
      onNotificationsPress();
      return;
    }
    router.push(ROUTES.notifications);
  }, [onNotificationsPress, router]);

  return (
    <AppTopBar
      left={
        showBack ? (
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={colors.primary}
            accessibilityLabel="Go back"
          />
        ) : null
      }
      center={
        <Text
          style={[
            typography.title,
            { fontSize: 18, color: colors.primary, textAlign: 'center', width: '100%' },
          ]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
      }
      right={
        right ?? (
          <IconButton
            icon="notifications-outline"
            onPress={openNotifications}
            color={colors.primary}
            accessibilityLabel="Notifications"
          />
        )
      }
    />
  );
};
