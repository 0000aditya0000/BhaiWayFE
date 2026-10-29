import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { EMERGENCY_ASSISTANCE_SCREEN } from '@/features/profile/constants';
import { useEmergencyAssistance } from '@/features/profile/hooks';
import { emergencyTokens, styles } from './EmergencyAssistanceScreen.styles';

export const EmergencyAssistanceScreen = () => {
  const {
    ride,
    rideLoading,
    contacts,
    tips,
    isHolding,
    holdProgress,
    tapCount,
    goBack,
    exitEmergency,
    startHold,
    cancelHold,
    registerTap,
    callContact,
    openMap,
  } = useEmergencyAssistance();

  const counterpartHeading =
    ride.role === 'driver'
      ? EMERGENCY_ASSISTANCE_SCREEN.driverCounterpartLabel
      : EMERGENCY_ASSISTANCE_SCREEN.riderCounterpartLabel;

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={emergencyTokens.ON_SURFACE}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {EMERGENCY_ASSISTANCE_SCREEN.title}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.exitButton,
            pressed && { backgroundColor: emergencyTokens.ERROR_CONTAINER },
          ]}
          onPress={exitEmergency}
          accessibilityRole="button"
          accessibilityLabel={EMERGENCY_ASSISTANCE_SCREEN.exitLabel}
        >
          <Text style={styles.exitLabel}>{EMERGENCY_ASSISTANCE_SCREEN.exitLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.sosWrap}>
            <View style={styles.sosGlow} pointerEvents="none" />
            <Animated.View style={pulseStyle}>
              <Pressable
                style={({ pressed }) => [
                  styles.sosButton,
                  pressed && { transform: [{ scale: 0.92 }] },
                ]}
                onPress={registerTap}
                onPressIn={startHold}
                onPressOut={cancelHold}
                accessibilityRole="button"
                accessibilityLabel="SOS emergency button. Tap three times or hold to trigger alert."
              >
                <Ionicons name="warning" size={56} color="#FFFFFF" />
                <Text style={styles.sosLabel}>{EMERGENCY_ASSISTANCE_SCREEN.sosLabel}</Text>
              </Pressable>
            </Animated.View>
          </View>
          <Text style={styles.sosHint}>{EMERGENCY_ASSISTANCE_SCREEN.sosHint}</Text>
          {tapCount > 0 ? (
            <Text style={styles.tapHint}>
              {tapCount}/{EMERGENCY_ASSISTANCE_SCREEN.tapsRequired} taps
            </Text>
          ) : null}
        </View>

        <View style={styles.rideCard}>
          <View style={styles.rideHeader}>
            <Text style={styles.rideSectionLabel}>
              {EMERGENCY_ASSISTANCE_SCREEN.rideSectionLabel}
            </Text>
            <View
              style={[
                styles.statusBadge,
                !ride.hasActiveRide && styles.statusBadgeMuted,
              ]}
            >
              <Text
                style={[
                  styles.statusLabel,
                  !ride.hasActiveRide && styles.statusLabelMuted,
                ]}
              >
                {ride.hasActiveRide
                  ? ride.statusLabel
                  : EMERGENCY_ASSISTANCE_SCREEN.noActiveRideLabel}
              </Text>
            </View>
          </View>

          {rideLoading ? (
            <View style={styles.rideLoadingRow}>
              <ActivityIndicator color={emergencyTokens.PRIMARY} />
            </View>
          ) : (
            <>
              <View style={styles.driverRow}>
                {ride.avatarUri ? (
                  <Image
                    source={{ uri: ride.avatarUri }}
                    style={styles.driverAvatar}
                    accessibilityIgnoresInvertColors
                    accessibilityLabel={ride.driverName}
                  />
                ) : (
                  <View style={[styles.driverAvatar, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons
                      name={ride.hasActiveRide ? 'person' : 'car-outline'}
                      size={28}
                      color={emergencyTokens.PRIMARY}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  {ride.hasActiveRide ? (
                    <Text style={styles.counterpartLabel}>{counterpartHeading}</Text>
                  ) : null}
                  <Text style={styles.driverName}>{ride.driverName}</Text>
                  {ride.hasActiveRide ? (
                    <Text style={styles.driverMeta}>
                      {ride.vehicleLabel} • {ride.plateNumber}
                    </Text>
                  ) : (
                    <Text style={styles.driverMeta}>{ride.locationLabel}</Text>
                  )}
                </View>
              </View>

              {ride.hasActiveRide ? (
                <View style={styles.locationCard}>
                  <Ionicons name="location" size={22} color={emergencyTokens.PRIMARY} />
                  <View style={styles.locationMeta}>
                    <Text style={styles.locationLabel}>
                      {EMERGENCY_ASSISTANCE_SCREEN.locationLabel}
                    </Text>
                    <Text style={styles.locationValue}>{ride.locationLabel}</Text>
                  </View>
                  <Pressable
                    onPress={openMap}
                    accessibilityRole="button"
                    accessibilityLabel={EMERGENCY_ASSISTANCE_SCREEN.mapLabel}
                    hitSlop={8}
                  >
                    <Text style={styles.mapLabel}>{EMERGENCY_ASSISTANCE_SCREEN.mapLabel}</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.contactsSection}>
          <Text style={styles.contactsHeading}>
            {EMERGENCY_ASSISTANCE_SCREEN.contactsHeading}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contactsRow}
          >
            {contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View
                  style={
                    contact.tone === 'error'
                      ? styles.contactIconError
                      : styles.contactIconPrimary
                  }
                >
                  <Ionicons
                    name={contact.icon}
                    size={22}
                    color={
                      contact.tone === 'error'
                        ? emergencyTokens.ON_ERROR_CONTAINER
                        : emergencyTokens.ON_SECONDARY_CONTAINER
                    }
                  />
                </View>
                <Text style={styles.contactLabel}>{contact.label}</Text>
                <Pressable
                  style={({ pressed }) => [
                    contact.action === 'alarm' ? styles.alarmButton : styles.callButton,
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                  onPress={() => callContact(contact)}
                  accessibilityRole="button"
                  accessibilityLabel={`${contact.actionLabel} ${contact.label}`}
                >
                  <Text style={styles.contactActionLabel}>{contact.actionLabel}</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="shield-checkmark" size={22} color={emergencyTokens.PRIMARY} />
            <Text style={styles.tipsTitle}>{EMERGENCY_ASSISTANCE_SCREEN.tipsTitle}</Text>
          </View>
          {tips.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={emergencyTokens.ON_SURFACE_VARIANT}
              />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {isHolding ? (
        <View style={styles.holdOverlay} pointerEvents="none">
          <View style={styles.holdCard}>
            <View style={styles.holdRingOuter}>
              <View style={[styles.holdRingFill, { height: `${Math.round(holdProgress * 100)}%` }]} />
            </View>
            <Text style={styles.holdLabel}>{EMERGENCY_ASSISTANCE_SCREEN.holdingLabel}</Text>
          </View>
        </View>
      ) : null}

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
