import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/theme';
import { triggerErrorHaptic } from '@/shared/utils';

import { DRIVER_ALERT_DURATION_MS, SOS_COPY } from '../constants/sos.constants';
import { useSosStore } from '../hooks/useSosStore';
import { sosSession } from '../services/sosSession';

const formatEmergencyTime = (value: string | null): string => {
  if (!value) {
    return 'Just now';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const DriverSosAlertOverlay = (): React.ReactElement | null => {
  const sos = useSosStore();
  const insets = useSafeAreaInsets();
  const flash = useSharedValue(1);

  useEffect(() => {
    if (!sos.driverAlertVisible || !sos.driverAlertSosId) {
      return;
    }
    triggerErrorHaptic();
    flash.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 280, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 280, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    const sosId = sos.driverAlertSosId;
    const elapsed = Date.now() - (sos.driverAlertStartedAt ?? Date.now());
    const remaining = Math.max(0, DRIVER_ALERT_DURATION_MS - elapsed);
    const timer = setTimeout(() => {
      void sosSession.dismissDriverAlert(sosId);
    }, remaining);
    return () => {
      clearTimeout(timer);
    };
  }, [flash, sos.driverAlertSosId, sos.driverAlertStartedAt, sos.driverAlertVisible]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  if (!sos.driverAlertVisible) {
    return null;
  }

  return (
    <View
      style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
      pointerEvents="auto"
      accessibilityViewIsModal
    >
      <Animated.View style={[styles.card, flashStyle]}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning" size={36} color={colors.white} />
        </View>
        <Text style={styles.title}>{SOS_COPY.driverAlertTitle}</Text>
        <Text style={styles.meta}>
          {SOS_COPY.driverRideLabel}: {sos.rideId || '—'}
        </Text>
        <Text style={styles.meta}>
          {sos.triggererName?.trim() || SOS_COPY.driverUnknownPassenger}
        </Text>
        <Text style={styles.meta}>
          {SOS_COPY.driverTimeLabel}: {formatEmergencyTime(sos.triggeredAt)}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.exitButton, pressed && { opacity: 0.88 }]}
          onPress={() => {
            void sosSession.dismissDriverAlert(sos.driverAlertSosId ?? undefined);
          }}
          accessibilityRole="button"
          accessibilityLabel={SOS_COPY.driverExitLabel}
        >
          <Text style={styles.exitLabel}>{SOS_COPY.driverExitLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(127, 29, 29, 0.88)',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 80,
  },
  card: {
    backgroundColor: colors.error,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  meta: {
    color: colors.white,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  exitButton: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  exitLabel: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '800',
  },
});
