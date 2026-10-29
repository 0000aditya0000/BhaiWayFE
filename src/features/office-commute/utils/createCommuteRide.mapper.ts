import {
  isValidApiCoordinatePair,
  toApiDepartureTime,
} from '@/features/offer-ride/utils/createRide.mapper';
import type { CreateRideDto } from '@/features/offer-ride/api/rides.types';
import {
  ROUTE_SELECTION_USER_MESSAGES,
  selectionMatchesEndpoints,
  toRouteEndpoints,
} from '@/features/offer-ride/utils/routeSelection';
import { toCivilDateFromDate } from '@/features/ride-search/utils/rideSearch.mapper';

import { COMMUTE_SERIES_COPY } from '../constants/commute-series.constants';
import type { PublishCommuteDraft } from '../types';
import {
  excludeWeekdaysFromIncluded,
  isReturnTimeAfterOutbound,
  PUBLISH_WEEKDAY_REQUIRED_MESSAGE,
  weekdayIdFromCivilDate,
} from './commuteSeries.utils';

export type MapCommuteCreateRideResult =
  | { ok: true; payload: CreateRideDto }
  | { ok: false; message: string };

export const mapPublishCommuteDraftToCreateRide = (
  draft: PublishCommuteDraft,
  vehicleId: string,
  departureDate: Date,
): MapCommuteCreateRideResult => {
  const source = draft.startLocation.trim();
  const destination = draft.officeLocation.trim();
  if (!source) {
    return { ok: false, message: 'Please select a pickup location on the map.' };
  }
  if (!destination) {
    return { ok: false, message: 'Please select a drop-off location on the map.' };
  }

  const start = draft.startLocationDetail;
  const office = draft.officeLocationDetail;
  if (!start || !office) {
    return {
      ok: false,
      message:
        'Commute rides require map locations. Go back and confirm both pickup and drop-off on the map.',
    };
  }

  const endpoints = toRouteEndpoints(
    start.latitude,
    start.longitude,
    office.latitude,
    office.longitude,
  );
  if (
    !endpoints ||
    !isValidApiCoordinatePair(endpoints.sourceLatitude, endpoints.sourceLongitude) ||
    !isValidApiCoordinatePair(endpoints.destinationLatitude, endpoints.destinationLongitude)
  ) {
    return {
      ok: false,
      message:
        'Invalid pickup or drop-off coordinates. Re-select both locations on the map and try again.',
    };
  }

  const selection = draft.routeSelection;
  if (!selection?.selectionToken?.trim()) {
    return { ok: false, message: ROUTE_SELECTION_USER_MESSAGES.required };
  }
  if (!selectionMatchesEndpoints(selection, endpoints)) {
    return { ok: false, message: ROUTE_SELECTION_USER_MESSAGES.stale };
  }

  const price = Number(String(draft.pricePerSeat).replace(/[^\d.]/g, ''));
  const apiDepartureTime = toApiDepartureTime(draft.departureTime.trim());
  if (!apiDepartureTime) {
    return { ok: false, message: 'Please select a valid departure time.' };
  }

  const payload: CreateRideDto = {
    rideType: 'COMMUTE',
    vehicleId: vehicleId.trim(),
    source,
    destination,
    routeSelectionToken: selection.selectionToken,
    sourceLatitude: endpoints.sourceLatitude,
    sourceLongitude: endpoints.sourceLongitude,
    destinationLatitude: endpoints.destinationLatitude,
    destinationLongitude: endpoints.destinationLongitude,
    departureDate: toCivilDateFromDate(departureDate),
    departureTime: apiDepartureTime,
    totalSeats: Math.max(1, Math.floor(draft.seats)),
    pricePerSeat: Number.isFinite(price) && price > 0 ? price : 0,
    maxTwoInBackSeat: true,
    noSmoking: true,
    noPets: true,
    luggageAllowed: true,
    notes: null,
  };

  if (!(payload.pricePerSeat > 0)) {
    return { ok: false, message: 'Please enter a valid price per seat.' };
  }

  if (draft.recurringDays.length > 0) {
    const publishWeekday = weekdayIdFromCivilDate(payload.departureDate);
    if (publishWeekday && !draft.recurringDays.includes(publishWeekday)) {
      return { ok: false, message: PUBLISH_WEEKDAY_REQUIRED_MESSAGE };
    }
    payload.recurring = true;
    payload.excludeWeekdays = excludeWeekdaysFromIncluded(draft.recurringDays);
  }

  if (draft.returningBack) {
    const returnTime = toApiDepartureTime(draft.returnDepartureTime.trim());
    if (!returnTime) {
      return { ok: false, message: COMMUTE_SERIES_COPY.missingReturnTimeMessage };
    }
    if (!isReturnTimeAfterOutbound(apiDepartureTime, returnTime)) {
      return { ok: false, message: COMMUTE_SERIES_COPY.returnTimeOrderMessage };
    }

    const reverseEndpoints = toRouteEndpoints(
      office.latitude,
      office.longitude,
      start.latitude,
      start.longitude,
    );
    const returnSelection = draft.returnRouteSelection;
    if (!returnSelection?.selectionToken?.trim()) {
      return { ok: false, message: COMMUTE_SERIES_COPY.missingReturnRouteMessage };
    }
    if (!reverseEndpoints || !selectionMatchesEndpoints(returnSelection, reverseEndpoints)) {
      return { ok: false, message: COMMUTE_SERIES_COPY.missingReturnRouteMessage };
    }
    if (returnSelection.selectionToken.trim() === selection.selectionToken.trim()) {
      return { ok: false, message: COMMUTE_SERIES_COPY.missingReturnRouteMessage };
    }

    payload.returnEnabled = true;
    payload.returnDepartureTime = returnTime;
    payload.returnRouteSelectionToken = returnSelection.selectionToken;
    payload.returnSource = destination;
    payload.returnDestination = source;
  }

  return { ok: true, payload };
};
