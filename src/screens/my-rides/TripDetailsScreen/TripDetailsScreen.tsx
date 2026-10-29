import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  Avatar,
  ScreenHeader,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { MyRidesRouteMap } from '@/features/my-rides/components';
import { TRIP_DETAILS_SCREEN } from '@/features/my-rides/constants';
import { useTripDetails } from '@/features/my-rides/hooks';
import { HISTORY_UNAVAILABLE_LABEL } from '@/features/my-rides/utils';
import { styles } from './TripDetailsScreen.styles';

export const TripDetailsScreen = () => {
  const { trip, loading, error, downloadInvoice, goBack, retry } = useTripDetails();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerWrap}>
          <ScreenHeader title={TRIP_DETAILS_SCREEN.title} onBack={handleBack} />
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerStateText}>{TRIP_DETAILS_SCREEN.loadingLabel}</Text>
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerWrap}>
          <ScreenHeader title={TRIP_DETAILS_SCREEN.title} onBack={handleBack} />
        </View>
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color="#747686" />
          <Text style={styles.centerStateTitle}>{TRIP_DETAILS_SCREEN.loadErrorTitle}</Text>
          <Text style={styles.centerStateText}>{error ?? TRIP_DETAILS_SCREEN.loadErrorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={retry} accessibilityRole="button">
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  const showVehicleVerified = Boolean(trip.vehicle.verified);
  const hasEarningsLines = trip.earningsLines.length > 0;
  const vehicleMetaParts = [
    trip.vehicle.vehicleType,
    trip.vehicle.registrationYear != null
      ? String(trip.vehicle.registrationYear)
      : null,
    trip.vehicle.seatingCapacity != null
      ? TRIP_DETAILS_SCREEN.seatsLabel(trip.vehicle.seatingCapacity)
      : null,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={TRIP_DETAILS_SCREEN.title}
          onBack={handleBack}
          right={
            <Avatar
              size={40}
              uri={trip.avatarUri}
              accessibilityLabel="Driver profile photo"
            />
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapCard}>
          <MyRidesRouteMap
            pickup={trip.pickup}
            dropoff={trip.dropoff}
            pickupLabel={trip.origin}
            dropoffLabel={trip.destination}
            height={200}
          />
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.completedBadgeText}>{trip.statusLabel}</Text>
          </View>
        </View>

        {trip.cancelledAtLabel ? (
          <Text style={styles.cancelledAt}>Cancelled {trip.cancelledAtLabel}</Text>
        ) : null}

        <View style={styles.card}>
          <View style={styles.summaryGrid}>
            <View style={styles.routeBlock}>
              <Text style={styles.metaLabel}>{TRIP_DETAILS_SCREEN.routeLabel}</Text>
              <View style={styles.routeRow}>
                <Text style={styles.routeCity}>{trip.origin}</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
                <Text style={styles.routeCity}>{trip.destination}</Text>
              </View>
              <Text style={styles.dateText}>{trip.dateLabel}</Text>
              {trip.startedAtLabel ? (
                <Text style={styles.dateText}>Started {trip.startedAtLabel}</Text>
              ) : null}
            </View>

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>{TRIP_DETAILS_SCREEN.durationLabel}</Text>
              <Text style={styles.metaValue}>{trip.durationLabel}</Text>
            </View>

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>{TRIP_DETAILS_SCREEN.distanceLabel}</Text>
              <Text style={styles.metaValue}>{trip.distanceLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleLeft}>
              <View style={styles.vehicleIcon}>
                <Ionicons name="car" size={24} color={colors.primary} />
              </View>
              <View style={styles.vehicleMeta}>
                <Text style={styles.metaLabel}>{TRIP_DETAILS_SCREEN.vehicleLabel}</Text>
                <Text style={styles.vehicleName}>{trip.vehicle.name}</Text>
                <Text style={styles.vehiclePlate}>{trip.vehicle.plateNumber}</Text>
                {vehicleMetaParts.length > 0 ? (
                  <Text style={styles.vehiclePlate}>{vehicleMetaParts.join(' · ')}</Text>
                ) : null}
              </View>
            </View>
            {showVehicleVerified ? (
              <Ionicons name="shield-checkmark" size={22} color={colors.textMuted} />
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.earningsTitle}>{TRIP_DETAILS_SCREEN.earningsTitle}</Text>
          {hasEarningsLines ? (
            <View style={styles.earningsList}>
              {trip.earningsLines.map((line, index) => {
                const isLast = index === trip.earningsLines.length - 1;
                const isBonus = line.kind === 'bonus' || line.kind === 'other';
                const isMeta = line.kind === 'platform' || line.kind === 'meta';
                return (
                  <View
                    key={line.id}
                    style={[styles.earningsRow, isLast && styles.earningsRowLast]}
                  >
                    <View style={styles.earningsPerson}>
                      <View
                        style={[
                          styles.initials,
                          isBonus && styles.initialsBonus,
                          isMeta && styles.initialsMeta,
                        ]}
                      >
                        {isBonus ? (
                          <Ionicons name="star" size={14} color={colors.primary} />
                        ) : isMeta ? (
                          <Ionicons
                            name={line.kind === 'platform' ? 'pie-chart-outline' : 'cash-outline'}
                            size={14}
                            color={colors.textMuted}
                          />
                        ) : (
                          <Text style={styles.initialsText}>{line.initials}</Text>
                        )}
                      </View>
                      {line.kind === 'passenger' ? (
                        <View style={styles.earningsTextCol}>
                          <Text style={styles.personName}>
                            {line.name}{' '}
                            <Text style={styles.personTag}>({line.tag})</Text>
                          </Text>
                          {line.subtitle ? (
                            <Text style={styles.personTag}>{line.subtitle}</Text>
                          ) : null}
                        </View>
                      ) : (
                        <Text style={isBonus ? styles.bonusLabel : styles.metaLineLabel}>
                          {line.name}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={
                        isBonus
                          ? styles.bonusAmount
                          : isMeta
                            ? styles.metaAmount
                            : styles.amount
                      }
                    >
                      {line.amountLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyEarnings}>{TRIP_DETAILS_SCREEN.noPassengers}</Text>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{TRIP_DETAILS_SCREEN.totalLabel}</Text>
            <Text style={styles.totalValue}>
              {trip.totalEarningsLabel === HISTORY_UNAVAILABLE_LABEL
                ? HISTORY_UNAVAILABLE_LABEL
                : trip.totalEarningsLabel}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.9 }]}
          onPress={downloadInvoice}
          accessibilityRole="button"
          accessibilityLabel={TRIP_DETAILS_SCREEN.downloadInvoiceLabel}
        >
          <Ionicons name="download-outline" size={22} color={colors.textMuted} />
          <Text style={styles.downloadLabel}>{TRIP_DETAILS_SCREEN.downloadInvoiceLabel}</Text>
        </Pressable>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
