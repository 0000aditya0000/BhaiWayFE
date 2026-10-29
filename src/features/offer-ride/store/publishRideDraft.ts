import { DEFAULT_PUBLISH_DRAFT } from '../constants/publish-ride.constants';
import type {
  LocationFieldType,
  OutstationRideTypeId,
  PublishRideDraft,
  SelectedLocation,
} from '../types';
import { toRouteEndpoints } from '../utils/routeSelection';

const draftEndpoints = (value: PublishRideDraft) =>
  toRouteEndpoints(
    value.originLocation?.latitude,
    value.originLocation?.longitude,
    value.destinationLocation?.latitude,
    value.destinationLocation?.longitude,
  );

const shouldClearRouteSelection = (
  current: PublishRideDraft,
  next: PublishRideDraft,
  partial: Partial<PublishRideDraft>,
): boolean => {
  if ('routeSelection' in partial) {
    return false;
  }
  const before = draftEndpoints(current);
  const after = draftEndpoints(next);
  if (!before && !after) {
    return false;
  }
  return (before == null) !== (after == null) || (before != null && after != null && (
    before.sourceLatitude !== after.sourceLatitude ||
    before.sourceLongitude !== after.sourceLongitude ||
    before.destinationLatitude !== after.destinationLatitude ||
    before.destinationLongitude !== after.destinationLongitude
  ));
};

type DraftListener = (draft: PublishRideDraft) => void;

let draft: PublishRideDraft = { ...DEFAULT_PUBLISH_DRAFT };
const listeners = new Set<DraftListener>();

const notify = (): void => {
  listeners.forEach((listener) => listener({ ...draft }));
};

export const publishRideDraft = {
  get: (): PublishRideDraft => ({ ...draft }),

  reset: (rideType: OutstationRideTypeId = 'regular'): void => {
    draft = {
      ...DEFAULT_PUBLISH_DRAFT,
      rideType,
    };
    notify();
  },

  update: (partial: Partial<PublishRideDraft>): void => {
    const next = { ...draft, ...partial };
    if (shouldClearRouteSelection(draft, next, partial)) {
      next.routeSelection = null;
    }
    draft = next;
    notify();
  },

  setLocation: (field: LocationFieldType, location: SelectedLocation): void => {
    if (field === 'origin') {
      draft = {
        ...draft,
        origin: location.address,
        originLocation: location,
        routeSelection: null,
      };
    } else {
      draft = {
        ...draft,
        destination: location.address,
        destinationLocation: location,
        routeSelection: null,
      };
    }
    notify();
  },

  subscribe: (listener: DraftListener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
