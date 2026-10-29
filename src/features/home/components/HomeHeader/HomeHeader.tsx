import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { styles } from './HomeHeader.styles';
import type { HomeHeaderProps } from './HomeHeader.types';

export const HomeHeader = React.memo(
  ({
    brandName,
    location,
    hasUnreadNotifications = false,
    notificationBadgeCount = null,
    avatarUri = null,
    onNotificationsPress,
    onProfilePress,
  }: HomeHeaderProps) => {
    const [photoFailed, setPhotoFailed] = useState(false);
    const photoUri = avatarUri?.trim() || '';
    const showPhoto = Boolean(photoUri) && !photoFailed;

    useEffect(() => {
      setPhotoFailed(false);
    }, [photoUri]);

    const locationLabel = useMemo(() => {
      if (location.label && location.city && location.label !== location.city) {
        return `${location.label}, ${location.city}`;
      }
      return location.label || location.city || 'Locating…';
    }, [location.city, location.label]);

    return (
      <View style={styles.container}>
        <View style={styles.brandBlock}>
          <Text style={styles.brandName} accessibilityRole="header">
            {brandName}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <IconButton
            icon="notifications-outline"
            onPress={onNotificationsPress}
            accessibilityLabel="Notifications"
            badgeCount={notificationBadgeCount}
            showBadge={
              hasUnreadNotifications &&
              !(typeof notificationBadgeCount === 'number' && notificationBadgeCount > 0)
            }
          />
          {showPhoto ? (
            <Pressable
              onPress={onProfilePress}
              style={styles.avatarButton}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              hitSlop={8}
              android_ripple={{ color: 'rgba(29, 78, 216, 0.08)', borderless: true }}
            >
              <Image
                source={{ uri: photoUri }}
                style={styles.avatarImage}
                accessibilityIgnoresInvertColors
                onError={() => setPhotoFailed(true)}
              />
            </Pressable>
          ) : (
            <IconButton
              icon="person-circle-outline"
              onPress={onProfilePress}
              accessibilityLabel="Profile"
            />
          )}
        </View>
      </View>
    );
  },
);

HomeHeader.displayName = 'HomeHeader';
