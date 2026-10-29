export interface MyRidesRouteMapProps {
  pickup: {
    latitude: number;
    longitude: number;
  } | null;
  dropoff: {
    latitude: number;
    longitude: number;
  } | null;
  pickupLabel?: string;
  dropoffLabel?: string;
  onExpandPress?: () => void;
  height?: number;
}
