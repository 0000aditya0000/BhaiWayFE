import { toRouteEndpoints } from '@/features/offer-ride/utils/routeSelection';

import { DEFAULT_PUBLISH_COMMUTE_DRAFT } from '../constants/select-location.constants';
import { commutePublishIdempotencyStore } from '../utils/commuteSeries.utils';
import type {
  CommuteLocationField,
  CommuteSelectedLocation,
  PublishCommuteDraft,
} from '../types';

const draftEndpoints = (value: PublishCommuteDraft) =>
  toRouteEndpoints(
    value.startLocationDetail?.latitude,
    value.startLocationDetail?.longitude,
    value.officeLocationDetail?.latitude,
    value.officeLocationDetail?.longitude,
  );

const shouldClearRouteSelection = (
  current: PublishCommuteDraft,
  next: PublishCommuteDraft,
): boolean => {
  const before = draftEndpoints(current);
  const after = draftEndpoints(next);
  if (!before && !after) {
    return false;
  }
  return (
    (before == null) !== (after == null) ||
    (before != null &&
      after != null &&
      (before.sourceLatitude !== after.sourceLatitude ||
        before.sourceLongitude !== after.sourceLongitude ||
        before.destinationLatitude !== after.destinationLatitude ||
        before.destinationLongitude !== after.destinationLongitude))
  );
};

type DraftListener = (draft: PublishCommuteDraft) => void;

let draft: PublishCommuteDraft = { ...DEFAULT_PUBLISH_COMMUTE_DRAFT };
const listeners = new Set<DraftListener>();

const notify = (): void => {
  listeners.forEach((listener) => listener({ ...draft }));
};

export const publishCommuteDraft = {
  get: (): PublishCommuteDraft => ({ ...draft }),

  reset: (): void => {
    draft = { ...DEFAULT_PUBLISH_COMMUTE_DRAFT };
    commutePublishIdempotencyStore.clear();
    notify();
  },

  update: (partial: Partial<PublishCommuteDraft>): void => {
    const next = { ...draft, ...partial };
    if (shouldClearRouteSelection(draft, next)) {
      if (!('routeSelection' in partial)) {
        next.routeSelection = null;
      }
      if (!('returnRouteSelection' in partial)) {
        next.returnRouteSelection = null;
      }
    }
    if ('returningBack' in partial && next.returningBack === false) {
      if (!('returnDepartureTime' in partial)) {
        next.returnDepartureTime = '';
      }
      if (!('returnRouteSelection' in partial)) {
        next.returnRouteSelection = null;
      }
    }
    draft = next;
    notify();
  },

  setLocation: (field: CommuteLocationField, location: CommuteSelectedLocation): void => {
    if (field === 'start') {
      draft = {
        ...draft,
        startLocation: location.placeName || location.address,
        startLocationDetail: location,
        routeSelection: null,
        returnRouteSelection: null,
      };
    } else {
      draft = {
        ...draft,
        officeLocation: location.placeName || location.address,
        officeLocationDetail: location,
        routeSelection: null,
        returnRouteSelection: null,
      };
    }
    notify();
  },

  subscribe: (listener: DraftListener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
