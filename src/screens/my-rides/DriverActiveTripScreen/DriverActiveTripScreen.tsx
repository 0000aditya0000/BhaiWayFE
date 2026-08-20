import React, { useCallback, useEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppFooter, Avatar, AppText as Text, IconButton } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { SwipeToComplete } from '@/features/my-rides/components';
import { DRIVER_ACTIVE_TRIP_SCREEN } from '@/features/my-rides/constants';
import { useDriverActiveTrip } from '@/features/my-rides/hooks';
import { styles } from './DriverActiveTripScreen.styles';

export const DriverActiveTripScreen = () => {
  const { trip, completed, completeTrip, triggerSos, toggleVoice, goBack } =
    useDriverActiveTrip();

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleSos = useCallback(() => {
    triggerLightHaptic();
    triggerSos();
  }, [triggerSos]);

  const handleVoice = useCallback(() => {
    triggerLightHaptic();
    toggleVoice();
  }, [toggleVoice]);

  const handleComplete = useCallback(() => {
    triggerLightHaptic();
    completeTrip();
  }, [completeTrip]);

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
          color="#374BB1"
          accessibilityLabel="Go back"
        />
        <Pressable
          style={styles.brandRow}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back to My Rides"
        >
          <Ionicons name="car" size={28} color="#374BB1" />
          <Text style={styles.brandTitle}>{DRIVER_ACTIVE_TRIP_SCREEN.brandName}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <View style={styles.statusLeft}>
              <Animated.View style={[styles.flagWrap, pulseStyle]}>
                <Ionicons name="flag" size={22} color="#FFFFFF" />
              </Animated.View>
              <View style={styles.statusText}>
                <Text style={styles.arrivingLabel}>
                  {DRIVER_ACTIVE_TRIP_SCREEN.arrivingLabel}
                </Text>
                <Text style={styles.destination}>{trip.destinationLabel}</Text>
              </View>
            </View>
            <View style={styles.etaBlock}>
              <Text style={styles.etaValue}>{trip.etaMinutes}</Text>
              <Text style={styles.etaUnit}>{DRIVER_ACTIVE_TRIP_SCREEN.etaUnit}</Text>
              <Text style={styles.distance}>{trip.distanceLabel}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${trip.progress * 100}%` }]} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.passengerRow}
        >
          {trip.passengers.map((passenger) => (
            <View key={passenger.id} style={styles.passengerChip}>
              <View style={styles.passengerAvatar}>
                <Avatar
                  size={28}
                  uri={passenger.avatarUri}
                  accessibilityLabel={`${passenger.name} photo`}
                />
              </View>
              <Text style={styles.passengerName}>{passenger.name}</Text>
              {passenger.isOnline ? <View style={styles.onlineDot} /> : null}
            </View>
          ))}
        </ScrollView>

        <View style={styles.mapCard}>
          <Image
            source={{ uri: trip.mapImageUri }}
            style={styles.mapImage}
            resizeMode="cover"
            accessibilityLabel="Navigation map"
          />
          <View style={styles.mapOverlay}>
            <View style={styles.navRow}>
              <View style={styles.navIcon}>
                <Ionicons name={trip.navStep.icon} size={22} color="#374BB1" />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navInstruction}>{trip.navStep.instruction}</Text>
                <Text style={styles.navDistance}>{trip.navStep.distanceLabel}</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.voiceButton,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
              onPress={handleVoice}
              accessibilityRole="button"
              accessibilityLabel={DRIVER_ACTIVE_TRIP_SCREEN.voiceLabel}
            >
              <Ionicons name="volume-high" size={18} color="#585E72" />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.sosButton,
            pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleSos}
          accessibilityRole="button"
          accessibilityLabel={DRIVER_ACTIVE_TRIP_SCREEN.sosLabel}
        >
          <Ionicons name="warning" size={20} color="#FFFFFF" />
          <Text style={styles.sosLabel}>{DRIVER_ACTIVE_TRIP_SCREEN.sosLabel}</Text>
        </Pressable>

        <SwipeToComplete
          label={DRIVER_ACTIVE_TRIP_SCREEN.swipeLabel}
          completedLabel={DRIVER_ACTIVE_TRIP_SCREEN.completedLabel}
          completed={completed}
          onComplete={handleComplete}
        />
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
