import type { SelectedDrivingRoute } from '@/features/offer-ride/api/routeOptions.types';

import type { CommuteSelectedLocation } from './location.types';

export type WeekdayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface WeekdayOption {
  id: WeekdayId;
  label: string;
}

export interface PublishCommuteDraft {
  startLocation: string;
  officeLocation: string;
  startLocationDetail: CommuteSelectedLocation | null;
  officeLocationDetail: CommuteSelectedLocation | null;
  /** Display date as DD/MM/YYYY (same as regular publish). */
  departureDate: string;
  departureTime: string;
  seats: number;
  recurringDays: WeekdayId[];
  returningBack: boolean;
  /** Same-day return wall-clock time (HH:mm). Empty when return is disabled. */
  returnDepartureTime: string;
  pricePerSeat: string;
  /**
   * In-session driver-selected outbound route. Not a long-term identifier — tokens expire.
   * Cleared when pickup/drop-off coordinates change.
   */
  routeSelection: SelectedDrivingRoute | null;
  /**
   * In-session reverse (office → home) route. Independent of the outbound token.
   * Cleared when pickup/drop-off coordinates change.
   */
  returnRouteSelection: SelectedDrivingRoute | null;
}
