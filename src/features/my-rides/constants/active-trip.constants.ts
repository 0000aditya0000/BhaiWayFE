import { ROUTES } from '@/config';

import type { ActiveTripSummary, DriverRideKind } from '../types';

export const DRIVER_ACTIVE_TRIP_SCREEN = {
  brandName: 'BhaiWay',
  arrivingLabel: 'Arriving At',
  etaUnit: 'min',
  openMapsLabel: 'Open in Google Maps',
  sosLabel: 'EMERGENCY SOS',
  swipeLabel: 'Swipe to Complete Trip',
  completedLabel: 'Trip Completed!',
  completedTitle: 'Trip completed',
  completedMessage: 'Trip to {destination} completed. Thank you!',
  voiceLabel: 'Voice guidance',
  mapsUnavailableTitle: 'Directions unavailable',
  mapsUnavailableMessage: 'Destination coordinates are not available yet for this trip.',
} as const;

export const DEFAULT_DRIVER_ACTIVE_TRIP: ActiveTripSummary = {
  destinationLabel: 'BhaiWay Corporate Office',
  etaMinutes: 2,
  etaLabel: '2 min',
  distanceLabel: '0.4 miles',
  progress: 0.72,
  mapImageUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCVXZeqcQRiyiaZs9_hKuoF4XVMbs0PD-SD7AJNNHffGTvFzIcP5Bd0a8SwJlJkTeeBTS670hJyQ539eTtvL-yyR4-UoPtcBydDNCs94k7ri_IWp0ZEaUZOJtBCOlsvKFE7VMipr7ZcwukTJZ4K1mQX5ot5Sv5adrGwgU9MXghfp1t2gu-xiOBlUy3ulZX8n9DZNuZhSvhWPa2FWtgUDQDPEmWsnpTwusooVwjvkq4aHYxaK2qa1o8UVtJg9yvmPMLvkMR36QNYuhI',
  destinationCoordinate: null,
  routeCoordinates: [],
  locationErrorMessage: null,
  navStep: {
    instruction: 'Turn right onto Tech Way',
    distanceLabel: 'In 500 feet',
    icon: 'return-up-forward',
  },
  passengers: [
    {
      id: 'p1',
      name: 'Sarah M.',
      avatarUri:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCaYzKdgLZtG_IFlmglf83KiepEEvaY5ytGqjpPZA6_zIY4GvetugKl08qdRaEF7JRRULcJRswmg293DUWtjtADXeyysa5AFdC-9EbwktNMrg5HMzzHhOUKgcJzkNp4pWLzK2sa9MArjLOIhUBGG2PVJPK1OXcJf5VWBxQ_Wr6wbUIqX4U7smUP3RpoJKharq-r_doEihsNa1vxMOqyE6_NHiGek0P1CWbHvQppz3ACN0w1hxaEndYnrIdkR1LStrdE5D_Y8hX0mus',
      isOnline: true,
    },
    {
      id: 'p2',
      name: 'David K.',
      avatarUri:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA-aumMGLgEFXYxY5sSCvsxWiilErVurEIuKD7pBo9UQoubErtG_tBhUh-e1nAR33f6LQB0rbvjN6tdJMUp7iBuBOIaUHmNkAOHJ03CnwonsCTcHfSWXo7ope1KO-XvXzn3t92_2IINh1_rITiyW30TzqBOajykuI65vYrphaLwWW20QZM7px_Ilf6kAWQjJhpEmWbOXjsiV_pt_-NlGz-1gzY1B3G9sfVzN6dHSmSOdvhm6_i8sGAS9YK51NGVvXEhKdJoL7Yoc3s',
      isOnline: true,
    },
  ],
};

export const getDriverActiveTripPath = (
  rideTypeOrParams:
    | DriverRideKind
    | {
        rideType?: DriverRideKind;
        rideId?: string;
        destination?: string;
      } = 'assured',
) => {
  if (typeof rideTypeOrParams === 'string') {
    return {
      pathname: ROUTES.myRidesActiveTrip,
      params: { rideType: rideTypeOrParams, rideId: '', destination: '' },
    };
  }

  return {
    pathname: ROUTES.myRidesActiveTrip,
    params: {
      rideType: rideTypeOrParams.rideType ?? 'assured',
      rideId: rideTypeOrParams.rideId ?? '',
      destination: rideTypeOrParams.destination ?? '',
    },
  };
};
