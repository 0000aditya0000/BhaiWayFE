import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { RouteOptionCard, RouteOptionsMap } from '@/features/offer-ride/components';
import { SELECT_DRIVING_ROUTE_SCREEN } from '@/features/offer-ride/constants/select-route.constants';
import { useSelectDrivingRoute } from '@/features/offer-ride/hooks';
import type {
  RouteOptionDto,
  SelectDrivingRouteMode,
} from '@/features/offer-ride/api/routeOptions.types';
import {
  formatRouteDistanceLabel,
  formatRouteDurationLabel,
  routeOptionLabel,
} from '@/features/offer-ride/utils/routeSelection';
import { Button, ScreenHeader, AppText as Text } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { useRouter } from 'expo-router';

import { styles } from './SelectDrivingRouteScreen.styles';

export interface SelectDrivingRouteScreenProps {
  mode: SelectDrivingRouteMode;
}

export const SelectDrivingRouteScreen = ({ mode }: SelectDrivingRouteScreenProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    title,
    subtitle,
    source,
    destination,
    sourceLabel,
    destinationLabel,
    continueLabel,
    retryLabel,
    goBack,
    confirm,
    options,
    selectedOptionId,
    loading,
    errorMessage,
    selectOption,
    retry,
    canContinue,
  } = useSelectDrivingRoute(mode);

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleConfirm = useCallback(() => {
    if (!canContinue) {
      return;
    }
    confirm();
  }, [canContinue, confirm]);

  const handleSelectRouteOption = useCallback(
    (option: RouteOptionDto) => {
      triggerLightHaptic();
      requestAnimationFrame(() => {
        selectOption(option);
      });
    },
    [selectOption],
  );

  const showRetry = Boolean(errorMessage) && !loading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title={title}
        onBack={handleBack}
        onNotificationsPress={() => router.push(ROUTES.notifications)}
      />

      <View style={styles.mapWrap}>
        <RouteOptionsMap
          source={source}
          destination={destination}
          sourceLabel={sourceLabel}
          destinationLabel={destinationLabel}
          options={options}
          selectedOptionId={selectedOptionId}
          loading={loading}
          onSelectOption={handleSelectRouteOption}
        />
      </View>

      <View style={styles.sheet}>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.status} accessibilityLabel={SELECT_DRIVING_ROUTE_SCREEN.loadingLabel}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.statusText}>{SELECT_DRIVING_ROUTE_SCREEN.loadingLabel}</Text>
            </View>
          ) : null}

          {!loading && errorMessage ? (
            <View style={styles.status}>
              <Text style={styles.statusText}>{errorMessage}</Text>
              {showRetry ? (
                <Button
                  label={retryLabel}
                  variant="secondary"
                  onPress={retry}
                  accessibilityLabel={retryLabel}
                />
              ) : null}
            </View>
          ) : null}

          {!loading && !errorMessage
            ? options.map((option, index) => (
                <RouteOptionCard
                  key={option.optionId}
                  title={routeOptionLabel(index, options.length)}
                  distanceLabel={formatRouteDistanceLabel(option.distanceMeters)}
                  durationLabel={formatRouteDurationLabel(option.durationSeconds)}
                  selected={option.optionId === selectedOptionId}
                  disabled={loading}
                  onPress={() => handleSelectRouteOption(option)}
                />
              ))
            : null}
        </ScrollView>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          label={continueLabel}
          onPress={handleConfirm}
          disabled={!canContinue}
          accessibilityLabel={continueLabel}
        />
      </View>
    </SafeAreaView>
  );
};
