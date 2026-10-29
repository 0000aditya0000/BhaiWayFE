import type { ActiveRideView } from './activeRide.mapper';

export interface ActiveRidesUiState {
  items: ActiveRideView[];
  selectedKey: string | null;
  hasLoaded: boolean;
  lastError: string | null;
}

export const INITIAL_ACTIVE_RIDES_STATE: ActiveRidesUiState = {
  items: [],
  selectedKey: null,
  hasLoaded: false,
  lastError: null,
};

const pickSelectedKey = (
  items: readonly ActiveRideView[],
  previousKey: string | null,
): string | null => {
  if (items.length === 0) {
    return null;
  }
  if (previousKey && items.some((item) => item.key === previousKey)) {
    return previousKey;
  }
  return items[0]?.key ?? null;
};

export const reduceActiveRidesSuccess = (
  current: ActiveRidesUiState,
  items: readonly ActiveRideView[],
): ActiveRidesUiState => ({
  items: [...items],
  selectedKey: pickSelectedKey(items, current.selectedKey),
  hasLoaded: true,
  lastError: null,
});

/** Network failure: keep last items if any; never invent a completed/empty trip. */
export const reduceActiveRidesFailure = (
  current: ActiveRidesUiState,
  message: string,
): ActiveRidesUiState => ({
  ...current,
  hasLoaded: true,
  lastError: message,
});

export const reduceActiveRidesSelect = (
  current: ActiveRidesUiState,
  key: string,
): ActiveRidesUiState => {
  if (!current.items.some((item) => item.key === key)) {
    return current;
  }
  return { ...current, selectedKey: key };
};

export const selectedActiveRide = (
  state: ActiveRidesUiState,
): ActiveRideView | null =>
  state.items.find((item) => item.key === state.selectedKey) ?? state.items[0] ?? null;

export const isActiveRideContainerVisible = (state: ActiveRidesUiState): boolean =>
  state.items.length > 0;
