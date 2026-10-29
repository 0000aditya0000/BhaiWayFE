import { ROUTES } from '@/config';
import { formatBhaiWayCoins } from '@/shared/utils';

import type { DriverRideKind, TripDetailsEarningsLine, TripDetailsSummary } from '../types';
import {
  DRIVER_EARNINGS,
  defaultRideIdForKind,
  getDriverCompletedEarningsLabels,
  getPassengerRideTag,
  parseDriverRideKind,
  withOptionalAssuredBonusLine,
  withRideTypeParam,
} from '../utils';

export const TRIP_DETAILS_SCREEN = {
  title: 'Trip Details',
  completedBadge: 'Completed',
  routeLabel: 'Route',
  durationLabel: 'Duration',
  distanceLabel: 'Distance',
  vehicleLabel: 'Vehicle Used',
  earningsTitle: 'Earnings Breakdown',
  totalLabel: 'Total Earnings',
  passengerTotalLabel: 'Passenger fares',
  driverShareLabel: 'Driver share',
  platformShareLabel: 'Platform share',
  assuredBonusLabel: 'Assured Bonus',
  otherEarningsLabel: 'Other earnings',
  fareSubtitlePrefix: 'Fare',
  seatsLabel: (count: number) => `${count} seats`,
  downloadInvoiceLabel: 'Download Invoice',
  downloadInvoiceTitle: 'Download Invoice',
  downloadInvoiceMessage: 'Share or save your trip invoice.',
  loadingLabel: 'Loading trip details…',
  loadErrorTitle: 'Unable to load trip',
  loadErrorMessage: 'Pull to refresh or go back and try again.',
  unavailableVehicle: 'Vehicle unavailable',
  noPassengers: 'No passenger earnings recorded',
  noFareBreakdown: 'Fare breakdown unavailable',
} as const;

const DRIVER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDo7ytbnGa64Je6rWmJUcAB00oDOUUCYxjLBdgTqRk853wmLiRclEymJ-2Np3fxzY-f3ah3zBue0gjoUafS__RZYDtSnGrsKVMH5H_xD557N2FPWnJ6ukFPIW_ICfXLJXk4N9gDcI-arQf5njnYRj0jHOAynfxQ7iTb3RmOO6zpdDMG94FhdZoYkC7zXtmRQFe71K_p-FSe1nQM-E3pVV-zZCblgmH9j1uQ1-C5NCdNntDV0_Vdkq1zOya6qHzi7GLePBIStw5kTRU';

const MAP_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBZRVrkfpzSOuRoenYB5c2sYEYyeObqz0aQI73BpJ3rU_2OH9ygeXLbi1LVW1eyiLCGxC9VcDiaPRSt23GH-hsBewlaEmpJmJu7bVYUGULgxTV8OhaxfoHslI717Kav78in2Q_ks5PpeDsNQrhVbPH3GOD4saSh1WE77OFylQ5PMT7UMWGYeH2hQ30ULZPjgyERTA-5p0WWfkljumoF374kSIQ37ABJZMPnFVpKmMBXOTAAkJuLp27jicvI47uQGGiqZ-N-6hWMV-c';

const buildPassengerLines = (tag: string): TripDetailsEarningsLine[] => [
  {
    id: 'e1',
    name: 'Amit S.',
    initials: 'AS',
    tag,
    amountLabel: formatBhaiWayCoins(150, { spaced: false }),
    kind: 'passenger',
  },
  {
    id: 'e2',
    name: 'Sneha K.',
    initials: 'SK',
    tag,
    amountLabel: formatBhaiWayCoins(150, { spaced: false }),
    kind: 'passenger',
  },
  {
    id: 'e3',
    name: 'Rohan M.',
    initials: 'RM',
    tag,
    amountLabel: formatBhaiWayCoins(150, { spaced: false }),
    kind: 'passenger',
  },
  {
    id: 'e4',
    name: 'Priya S.',
    initials: 'PS',
    tag,
    amountLabel: formatBhaiWayCoins(150, { spaced: false }),
    kind: 'passenger',
  },
];

export const getTripDetailsMock = (params?: {
  rideId?: string;
  origin?: string;
  destination?: string;
  rideType?: DriverRideKind;
}): TripDetailsSummary => {
  const rideType = parseDriverRideKind(params?.rideType);
  const earnings = getDriverCompletedEarningsLabels(rideType);
  const passengerLines = buildPassengerLines(getPassengerRideTag(rideType));

  const earningsLines = withOptionalAssuredBonusLine(passengerLines, rideType, {
    id: 'bonus',
    name: DRIVER_EARNINGS.assuredBonusLabel,
    initials: '',
    tag: '',
    amountLabel: earnings.assuredBonusLabelCompact,
    kind: 'bonus' as const,
  });

  return {
    rideId: params?.rideId || defaultRideIdForKind(rideType),
    rideType,
    origin: params?.origin?.trim() || 'Saket',
    destination: params?.destination?.trim() || 'Cyber City',
    dateLabel: 'Oct 24, 2023',
    durationLabel: '45 mins',
    distanceLabel: '18.5 km',
    statusLabel: TRIP_DETAILS_SCREEN.completedBadge,
    vehicle: {
      name: 'White Honda City',
      plateNumber: 'DL 3C AB 1234',
    },
    earningsLines,
    totalEarningsLabel: earnings.totalEarningsLabelCompact,
    mapImageUri: MAP_IMAGE,
    avatarUri: DRIVER_AVATAR,
    pickup: null,
    dropoff: null,
  };
};

export const getTripDetailsPath = (params?: {
  rideId?: string;
  rideType?: DriverRideKind;
}) => ({
  pathname: ROUTES.myRidesTripDetails,
  params: withRideTypeParam(
    {
      rideId: params?.rideId ?? '',
    },
    parseDriverRideKind(params?.rideType),
  ),
});
