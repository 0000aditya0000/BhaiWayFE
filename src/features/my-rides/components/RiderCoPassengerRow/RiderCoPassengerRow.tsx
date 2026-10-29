import React from 'react';
import { View } from 'react-native';

import { Avatar, AppText as Text } from '@/shared/components';
import { DRIVER_TRACK_RIDE_SCREEN } from '../../constants';
import type { RiderCoPassenger } from '../../types/rider-co-passenger.types';
import { styles } from './RiderCoPassengerRow.styles';

export interface RiderCoPassengerRowProps {
  passenger: RiderCoPassenger;
}

export const RiderCoPassengerRow = React.memo(({ passenger }: RiderCoPassengerRowProps) => (
  <View style={styles.row}>
    <Avatar
      size={48}
      uri={passenger.avatarUri}
      accessibilityLabel={`${passenger.name} photo`}
    />
    <Text style={styles.name}>{passenger.name}</Text>
    <View style={styles.seatsBadge}>
      <Text style={styles.seatsText}>
        {DRIVER_TRACK_RIDE_SCREEN.seatsBookedShort(passenger.seatsBooked)}
      </Text>
    </View>
  </View>
));

RiderCoPassengerRow.displayName = 'RiderCoPassengerRow';
