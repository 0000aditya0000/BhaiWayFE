import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { shareLocalFile } from '@/shared/utils';
import type { RideInvoiceSummary, TripDetailsSummary } from '../types';

const safeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 48) || 'invoice';

export const buildDriverTripInvoiceText = (trip: TripDetailsSummary): string => {
  const lines = [
    'BhaiWay — Trip Invoice (Driver)',
    '================================',
    `Ride ID: ${trip.rideId}`,
    `Type: ${
      trip.rideType === 'assured'
        ? 'Assured'
        : trip.rideType === 'commute'
          ? 'Office Commute'
          : 'Regular'
    }`,
    `Date: ${trip.dateLabel}`,
    `Status: ${trip.statusLabel}`,
    '',
    'Route',
    `  ${trip.origin} → ${trip.destination}`,
    `  Duration: ${trip.durationLabel}`,
    `  Distance: ${trip.distanceLabel}`,
    '',
    'Vehicle',
    `  ${trip.vehicle.name}`,
    `  ${trip.vehicle.plateNumber}`,
    '',
    'Earnings',
    ...trip.earningsLines.map((line) => {
      if (line.kind === 'passenger') {
        const fareNote = line.subtitle ? ` [${line.subtitle}]` : '';
        return `  ${line.name}${line.tag ? ` (${line.tag})` : ''}: ${line.amountLabel}${fareNote}`;
      }
      return `  ${line.name}: ${line.amountLabel}`;
    }),
    '',
    `Total Earnings: ${trip.totalEarningsLabel}`,
    '',
    'Thank you for driving with BhaiWay.',
  ];
  return lines.join('\n');
};

export const buildRiderTripInvoiceText = (invoice: RideInvoiceSummary): string => {
  const lines = [
    'BhaiWay — Ride Invoice',
    '======================',
    `Booking ID: ${invoice.bookingId}`,
    `Ride ID: ${invoice.rideId || invoice.bookingId}`,
    `Date: ${invoice.dateLabel}`,
    `Status: ${invoice.statusLabel}`,
    '',
    'Trip',
    `  Pickup: ${invoice.pickupLabel} (${invoice.pickupTimeLabel})`,
    `  Drop-off: ${invoice.dropoffLabel} (${invoice.dropoffTimeLabel})`,
    '',
    'Driver',
    `  ${invoice.driver.name}${invoice.driver.verified ? ' (Verified)' : ''}`,
    `  ${invoice.driver.vehicleLabel}`,
    `  ${invoice.driver.plateNumber}`,
    '',
    'Fare Breakdown',
    ...invoice.fareLines.map((line) => `  ${line.label}: ${line.amountLabel}`),
    '',
    `Total Amount: ${invoice.totalAmountLabel}`,
    `Amount Paid: ${invoice.paidAmountLabel}`,
    `Payment: ${invoice.paymentMethodLabel}`,
    '',
    'Thank you for riding with BhaiWay.',
  ];
  return lines.join('\n');
};

export const shareInvoiceDocument = async (params: {
  fileBaseName: string;
  body: string;
  dialogTitle: string;
}): Promise<void> => {
  const fileName = `${safeFileName(params.fileBaseName)}.txt`;
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) {
    await Share.share({
      title: params.dialogTitle,
      message: params.body,
    });
    return;
  }

  const path = `${directory}${fileName}`;
  await FileSystem.writeAsStringAsync(path, params.body);
  await shareLocalFile({
    path,
    mimeType: 'text/plain',
    dialogTitle: params.dialogTitle,
    uti: 'public.plain-text',
  });
};
