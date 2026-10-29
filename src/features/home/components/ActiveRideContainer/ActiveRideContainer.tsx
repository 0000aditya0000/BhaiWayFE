import React, { useEffect } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText as Text, BhaiWayCoinIcon } from '@/shared/components';
import { colors } from '@/shared/theme';
import { ACTIVE_RIDE_COPY, ACTIVE_RIDE_LAYOUT } from '../../constants/active-ride.constants';
import type { ActiveRideView } from '../../utils/activeRide.mapper';
import { styles } from './ActiveRideContainer.styles';

export interface ActiveRideContainerProps {
  items: readonly ActiveRideView[];
  selected: ActiveRideView | null;
  expanded: boolean;
  onToggleExpanded: () => void;
  onCollapse: () => void;
  onSelectRide: (key: string) => void;
  onGoToRide: () => void;
}

const timing = {
  duration: ACTIVE_RIDE_LAYOUT.animationMs,
  easing: Easing.out(Easing.cubic),
};

const MetaRow = ({
  label,
  value,
  valueStyle,
  coins,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  coins?: boolean;
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {coins ? (
      <View style={styles.fareRow}>
        <BhaiWayCoinIcon size={14} />
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    ) : (
      <Text style={[styles.rowValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    )}
  </View>
);

export const ActiveRideContainer = React.memo(
  ({
    items,
    selected,
    expanded,
    onToggleExpanded,
    onCollapse,
    onSelectRide,
    onGoToRide,
  }: ActiveRideContainerProps) => {
    const { height: windowHeight } = useWindowDimensions();
    const progress = useSharedValue(expanded ? 1 : 0);
    const detailsMax = useSharedValue(ACTIVE_RIDE_LAYOUT.expandedDetailsMaxHeight);

    const detailsCap = Math.min(
      ACTIVE_RIDE_LAYOUT.expandedDetailsMaxHeight,
      Math.round(windowHeight * ACTIVE_RIDE_LAYOUT.expandedMaxScreenRatio),
    );

    useEffect(() => {
      progress.value = withTiming(expanded ? 1 : 0, timing);
    }, [expanded, progress]);

    useEffect(() => {
      if (detailsMax.value > detailsCap) {
        detailsMax.value = detailsCap;
      }
    }, [detailsCap, detailsMax]);

    const detailsStyle = useAnimatedStyle(() => ({
      maxHeight: interpolate(progress.value, [0, 1], [0, detailsMax.value]),
      opacity: progress.value,
    }));

    const scrimStyle = useAnimatedStyle(() => ({
      opacity: progress.value,
    }));

    if (!selected || items.length === 0) {
      return null;
    }

    const multiple = items.length > 1;
    const isPassenger = selected.role === 'PASSENGER';
    const showPassengerFare = Boolean(isPassenger && selected.fareLabel);
    const showOtp = Boolean(isPassenger && selected.otp);
    const showPassengers = Boolean(!isPassenger && selected.totalPassengersLabel);
    const showDriverFare = Boolean(!isPassenger && selected.totalFareLabel);
    const showMeta = showPassengerFare || showOtp || showPassengers || showDriverFare;

    return (
      <>
        <Animated.View
          style={[styles.scrim, scrimStyle]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={onCollapse}
            accessibilityRole="button"
            accessibilityLabel={ACTIVE_RIDE_COPY.collapseLabel}
          />
        </Animated.View>

        <View
          style={styles.wrap}
          pointerEvents="box-none"
          accessibilityRole="summary"
          accessibilityLabel={`${ACTIVE_RIDE_COPY.liveLabel} ${selected.typeLabel}. ${selected.routeLabel}`}
        >
          <View style={styles.card}>
            <View style={styles.liveBar} />
            <Pressable
              onPress={onToggleExpanded}
              accessibilityRole="button"
              accessibilityLabel={
                expanded ? ACTIVE_RIDE_COPY.collapseLabel : ACTIVE_RIDE_COPY.expandLabel
              }
              style={styles.collapsedHit}
            >
              <View style={styles.liveDotWrap}>
                <View style={styles.liveDot} />
              </View>
              <View style={styles.collapsedCopy}>
                <View style={styles.collapsedMeta}>
                  <Text style={styles.liveText}>{ACTIVE_RIDE_COPY.liveLabel}</Text>
                  <Text style={styles.typeText}>
                    {selected.roleLabel} · {selected.typeLabel}
                    {multiple ? ` · ${ACTIVE_RIDE_COPY.multipleLabel(items.length)}` : ''}
                  </Text>
                </View>
                <Text style={styles.routeText} numberOfLines={1}>
                  {selected.routeLabel}
                </Text>
              </View>
              {expanded ? (
                <Pressable
                  onPress={onCollapse}
                  accessibilityRole="button"
                  accessibilityLabel={ACTIVE_RIDE_COPY.closeLabel}
                  hitSlop={8}
                  style={styles.headerAction}
                >
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </Pressable>
              ) : (
                <View style={styles.headerAction}>
                  <Ionicons name="chevron-up" size={16} color={colors.textSecondary} />
                </View>
              )}
            </Pressable>

            <Animated.View
              style={[styles.detailsClip, detailsStyle]}
              pointerEvents={expanded ? 'auto' : 'none'}
            >
              <ScrollView
                nestedScrollEnabled
                bounces={false}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={(_width, height) => {
                  const next = Math.ceil(height);
                  if (next > 8) {
                    detailsMax.value = Math.min(next, detailsCap);
                  }
                }}
                contentContainerStyle={styles.details}
              >
                {multiple ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.selectorRow}
                  >
                    {items.map((item) => {
                      const selectedChip = item.key === selected.key;
                      return (
                        <Pressable
                          key={item.key}
                          onPress={() => onSelectRide(item.key)}
                          accessibilityRole="button"
                          accessibilityLabel={`${ACTIVE_RIDE_COPY.selectRideLabel}: ${item.roleLabel} ${item.typeLabel}`}
                          accessibilityState={{ selected: selectedChip }}
                          style={[styles.chip, selectedChip && styles.chipSelected]}
                        >
                          <Text
                            style={[styles.chipText, selectedChip && styles.chipTextSelected]}
                          >
                            {item.roleLabel} · {item.typeLabel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}

                <View style={styles.itinerary}>
                  <View style={styles.itineraryRail}>
                    <View style={styles.itineraryDotStart} />
                    <View style={styles.itineraryConnector} />
                    <View style={styles.itineraryDotEnd} />
                  </View>
                  <View style={styles.itineraryCopy}>
                    <View style={styles.itineraryStop}>
                      <Text style={styles.itineraryKicker}>{ACTIVE_RIDE_COPY.sourceLabel}</Text>
                      <Text style={styles.itineraryPlace} numberOfLines={2}>
                        {selected.source}
                      </Text>
                    </View>
                    <View style={styles.itineraryStop}>
                      <Text style={styles.itineraryKicker}>
                        {ACTIVE_RIDE_COPY.destinationLabel}
                      </Text>
                      <Text style={styles.itineraryPlace} numberOfLines={2}>
                        {selected.destination}
                      </Text>
                    </View>
                  </View>
                </View>

                {showMeta ? (
                  <View style={styles.metaPanel}>
                    {showPassengerFare ? (
                      <MetaRow
                        label={ACTIVE_RIDE_COPY.fareLabel}
                        value={selected.fareLabel!}
                        coins
                      />
                    ) : null}
                    {showOtp ? (
                      <MetaRow
                        label={ACTIVE_RIDE_COPY.otpLabel}
                        value={selected.otp!}
                        valueStyle={styles.otpValue}
                      />
                    ) : null}
                    {showPassengers ? (
                      <MetaRow
                        label={ACTIVE_RIDE_COPY.passengersLabel}
                        value={selected.totalPassengersLabel!}
                      />
                    ) : null}
                    {showDriverFare ? (
                      <MetaRow
                        label={ACTIVE_RIDE_COPY.totalFareLabel}
                        value={selected.totalFareLabel!}
                        coins
                      />
                    ) : null}
                  </View>
                ) : null}

                <Pressable
                  onPress={onGoToRide}
                  accessibilityRole="button"
                  accessibilityLabel={ACTIVE_RIDE_COPY.goToRideLabel}
                  style={({ pressed }) => [styles.goButton, pressed && styles.goButtonPressed]}
                >
                  <Ionicons name="navigate" size={16} color={colors.textInverse} />
                  <Text style={styles.goButtonText}>{ACTIVE_RIDE_COPY.goToRideLabel}</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </View>
      </>
    );
  },
);

ActiveRideContainer.displayName = 'ActiveRideContainer';
