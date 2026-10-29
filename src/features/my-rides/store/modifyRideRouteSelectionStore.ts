import type { SelectedDrivingRoute } from '@/features/offer-ride/api/routeOptions.types';
import type { MapLatLng } from '@/shared/maps';

export interface ModifyRoutePrime {
  rideId: string;
  origin: string;
  destination: string;
}

export interface ModifyRouteResult {
  origin: string;
  destination: string;
  originCoordinate: MapLatLng;
  destinationCoordinate: MapLatLng;
  routeSelection: SelectedDrivingRoute;
}

let prime: ModifyRoutePrime | null = null;
let result: ModifyRouteResult | null = null;

export const modifyRideRouteSelectionStore = {
  prime(value: ModifyRoutePrime): void {
    prime = { ...value };
    result = null;
  },

  getPrime(): ModifyRoutePrime | null {
    return prime ? { ...prime } : null;
  },

  setResult(value: ModifyRouteResult): void {
    result = { ...value, routeSelection: { ...value.routeSelection } };
  },

  consumeResult(): ModifyRouteResult | null {
    const next = result;
    result = null;
    return next;
  },

  clear(): void {
    prime = null;
    result = null;
  },
};
