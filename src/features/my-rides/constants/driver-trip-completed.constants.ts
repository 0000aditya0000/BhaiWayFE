import { ROUTES } from '@/config';
import { formatBhaiWayCoins } from '@/shared/utils';

import type { DriverRideKind, DriverTripCompletedSummary } from '../types';
import {
  buildDriverCompletedFareLines,
  defaultRideIdForKind,
  getDriverCompletedEarningsLabels,
  parseDriverRideKind,
  withRideTypeParam,
} from '../utils';

export const DRIVER_TRIP_COMPLETED_SCREEN = {
  brandName: 'BhaiWay',
  heading: 'Trip Completed Successfully!',
  subtitle: 'Great job, your ride was smooth and efficient.',
  distanceStatLabel: 'Distance',
  timeStatLabel: 'Time',
  earningsStatLabel: 'Earnings',
  earningsStatHint: 'Total',
  reviewSectionTitle: 'Review Your Passengers',
  reviewPlaceholder: 'Write a review...',
  submitLabel: 'Submit Reviews & Finish',
  incompleteTitle: 'Rate all passengers',
  incompleteMessage: 'Please give each passenger a star rating before finishing.',
  statusLabel: 'SUCCESSFUL',
  // Kept for secondary flows / older copy references.
  totalEarningsLabel: 'Total Earnings',
  communityMessage:
    'Thank you for driving with the community! Your service helps keep the city moving efficiently.',
  ratePassengersLabel: 'Rate Your Passengers',
  viewTripDetailsLabel: 'View Trip Details',
} as const;

const DRIVER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDzugxVG8HMi_7iVboenqOHVRrLimekCgiYS-xIxdjhU_rCq4e5BnoMbE3k3f2FUldLkdV_4ql4x7rXiy7x0cceY1wCQwqTDaT9N_bx0PeWiiQkhR_KXRbT8_Qk0EDAng5jYaKGF7jTA2lA8lUeUuUBEdQveLv4ySPjHiCpsDuviXDFjoJk40wa1PTSdZrbwrCBRkDBdkCBNDwILAKLg36bZ2f3YMcHIyW_7ZvC_v3imKAplS5avEvbC65Q8ifxpOIS5QRI20wvokY';

const PASSENGERS: DriverTripCompletedSummary['passengers'] = [
  {
    id: 'p-amit',
    name: 'Amit R.',
    avatarUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBKDFb4_Mp3X12U306cLLAqIXNoDX1EKIf7q6XlnMGEAoxY6lDP3ApZqfaRkcHjxs1urjQPQ9Z0IUzYhMi5D51pyOei5axJ4FRprBlYe5oIfsoOekuiclYmNaKXwmaEHs6S3ivoMMxe_c65byisl2MIml2Om5xhl_hIut4fdJ5CwK_mfsqkMUd83sy1m8uVWFUfYxM4t1OVkamifBEw1hof8sZstZDeCdYWoZNkJ2j1EDHwNC_WG9SauI1lBfKmfklEOJEJOVBSxiA',
    fareLabel: formatBhaiWayCoins(140, { spaced: false }),
    complimentOptions: ['Punctual', 'Polite', 'Quiet'],
  },
  {
    id: 'p-priya',
    name: 'Priya S.',
    avatarUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD9IIkQCTfaOvcE2RCUf2nywXKHdxR8dO7UiK_3r41X6U4nRgEZyRPnkEHm-0zFsFpCrt19zxpVqqhxIPDBIlWxLxku_me8HGiwwZb7BEq66C3ipnL3hS_mqNj8BiHbvr_4o2UUThbxByq6cIoU0u1fvKfaAJj7gIPik39BC2eVXmGAyDpN7jne3klmHiGSPBlKPTpuAzwVFaTOBEmz2hACBKDLr3uw7pnrct7K_uIK-G0ZpREe2QzsucJ0f_a6cWdL_VSRXIIPKLI',
    fareLabel: formatBhaiWayCoins(140, { spaced: false }),
    complimentOptions: ['Great Conversation', 'Friendly', 'Respectful'],
  },
  {
    id: 'p-rahul',
    name: 'Rahul K.',
    avatarUri: '',
    initials: 'RK',
    fareLabel: formatBhaiWayCoins(140, { spaced: false }),
    complimentOptions: ['Clean', 'Quiet', 'Polite'],
  },
];

export const getDriverTripCompletedMock = (params?: {
  destination?: string;
  rideType?: DriverRideKind;
}): DriverTripCompletedSummary => {
  const dropoffTitle = params?.destination?.trim() || 'BhaiWay Corporate Office';
  const rideType = parseDriverRideKind(params?.rideType);
  const earnings = getDriverCompletedEarningsLabels(rideType);

  return {
    rideId: defaultRideIdForKind(rideType),
    rideType,
    dateLabel: 'Aug 2, 2026',
    statusLabel: DRIVER_TRIP_COMPLETED_SCREEN.statusLabel,
    pickupTitle: 'Koramangala',
    pickupAddress: 'Koramangala 5th Block, Bengaluru',
    dropoffTitle,
    dropoffAddress: `${dropoffTitle}, Bengaluru`,
    distanceLabel: '12.4 km',
    distanceValueLabel: '12.4',
    distanceUnitLabel: 'km',
    durationValueLabel: '38',
    durationUnitLabel: 'mins',
    earningsLabel: earnings.earningsLabel,
    earningsAmount: earnings.earningsAmount,
    rideFareLabel: earnings.rideFareLabel,
    assuredBonusLabel: earnings.assuredBonusLabel,
    hasAssuredBonus: earnings.hasAssuredBonus,
    driverAvatarUri: DRIVER_AVATAR,
    passengers: PASSENGERS,
    fareLines: buildDriverCompletedFareLines(rideType),
    pickup: {
      latitude: 12.9352,
      longitude: 77.6245,
    },
    dropoff: {
      latitude: 12.9716,
      longitude: 77.5946,
    },
  };
};

export const getDriverTripCompletedPath = (params?: {
  destination?: string;
  rideType?: DriverRideKind;
}) => ({
  pathname: ROUTES.myRidesTripCompleted,
  params: withRideTypeParam(
    { destination: params?.destination ?? '' },
    parseDriverRideKind(params?.rideType),
  ),
});
