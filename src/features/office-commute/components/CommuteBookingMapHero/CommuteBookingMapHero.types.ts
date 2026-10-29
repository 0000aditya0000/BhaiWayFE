export interface CommuteBookingMapHeroProps {
  pickup: { latitude: number; longitude: number };
  dropoff: { latitude: number; longitude: number };
  routeCoordinates: Array<{ latitude: number; longitude: number }>;
  distanceLabel: string;
  durationLabel: string;
  matchPercent: number | null;
  matchCaption: string;
}
