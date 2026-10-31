import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/theme';

import { SOS_COPY } from '../constants/sos.constants';
import { isActiveSosStatus } from '../api/sos.unwrap';
import { useSosStore } from '../hooks/useSosStore';

export const SosRideBanner = ({ rideId }: { rideId?: string | null }) => {
  const sos = useSosStore();
  const matchesRide = !rideId || !sos.rideId || sos.rideId === rideId;
  if (!matchesRide || !sos.sosId || !isActiveSosStatus(sos.status)) {
    return null;
  }

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="warning" size={18} color={colors.white} />
      <Text style={styles.label}>{SOS_COPY.statusActive}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  label: {
    flex: 1,
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
