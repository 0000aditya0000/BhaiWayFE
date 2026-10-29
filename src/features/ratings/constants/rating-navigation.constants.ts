import { ROUTES } from '@/config';

export const getDriverRatePassengersPath = (params: {
  rideId: string;
  destination?: string;
}) => ({
  pathname: ROUTES.myRidesRatePassengers,
  params: {
    rideId: params.rideId,
    destination: params.destination ?? '',
  },
});
