import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CURRENT_LOCATION_ALERTS } from '@/shared/maps';
import { getSearchParam, showAppAlert } from '@/shared/utils';
import {
  CURRENT_LOCATION_MAP_DELTA,
  DEFAULT_MAP_COORDINATE,
  DEFAULT_MAP_DELTA,
} from '@/features/ride-search/constants';
import {
  resolvePlaceDetails,
  reverseGeocodeCoordinate,
  searchPlaces,
  fetchNearbyPlaces,
  placesErrorMessage,
  isPlacesCancelled,
  createPlacesSessionToken,
} from '@/features/ride-search/services';
import { getRecentPlaceDetails, recentPlacesStore } from '@/features/ride-search/store';
import type {
  MapRegion,
  PlacesAutocompletePrediction,
  SelectedDestination,
} from '@/features/ride-search/types';
import {
  getRouteTooCloseMessage,
  regionForPrecisePlace,
  resolveCurrentPlace,
} from '@/features/ride-search/utils';
import {
  panKeepZoom,
  useSearchIdleZoom,
  zoomToPointerRegion,
} from '@/features/ride-search/hooks/useSearchIdleZoom';
import { SELECT_COMMUTE_LOCATION_SCREEN } from '../constants';
import { publishCommuteDraft } from '../store';
import type {
  CommuteLocationField,
  CommuteSelectedLocation,
  PublishCommuteDraft,
} from '../types';

const toRegion = (
  latitude: number,
  longitude: number,
  delta: { latitudeDelta: number; longitudeDelta: number } = DEFAULT_MAP_DELTA,
): MapRegion => ({
  latitude,
  longitude,
  ...delta,
});

const isCommuteLocationField = (value: string): value is CommuteLocationField =>
  value === 'start' || value === 'office';

/** Nothing pre-selected — map opens at the default coordinate with a blank search. */
const emptySelection = (): CommuteSelectedLocation => ({
  placeName: '',
  address: '',
  latitude: DEFAULT_MAP_COORDINATE.latitude,
  longitude: DEFAULT_MAP_COORDINATE.longitude,
});

const resolveInitialSelection = (
  field: CommuteLocationField,
  draft: PublishCommuteDraft,
): CommuteSelectedLocation => {
  const existing =
    field === 'start' ? draft.startLocationDetail : draft.officeLocationDetail;
  return existing ?? emptySelection();
};

export const useSelectCommuteLocation = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ field?: string }>();
  const fieldParam = getSearchParam(params.field);
  const initialField: CommuteLocationField = isCommuteLocationField(fieldParam)
    ? fieldParam
    : 'start';

  // Local active field — switching Leaving from ↔ Drop-off stays on one screen.
  const [field, setField] = useState<CommuteLocationField>(initialField);
  const copy = SELECT_COMMUTE_LOCATION_SCREEN[field];

  const [draft, setDraft] = useState<PublishCommuteDraft>(() => publishCommuteDraft.get());
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [predictions, setPredictions] = useState<PlacesAutocompletePrediction[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlacesAutocompletePrediction[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<PlacesAutocompletePrediction[]>(() =>
    recentPlacesStore.get(),
  );
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<CommuteSelectedLocation>(() =>
    resolveInitialSelection(initialField, publishCommuteDraft.get()),
  );
  const [region, setRegion] = useState<MapRegion>(() => {
    const initial = resolveInitialSelection(initialField, publishCommuteDraft.get());
    return toRegion(initial.latitude, initial.longitude);
  });
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const requestIdRef = useRef(0);
  const geocodeIdRef = useRef(0);
  const skipNextRegionGeocode = useRef(true);
  const preserveListSelectionRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionTokenRef = useRef(createPlacesSessionToken());
  const regionRef = useRef(region);
  regionRef.current = region;
  const fieldRef = useRef(field);
  fieldRef.current = field;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const searchModeRef = useRef(searchMode);
  searchModeRef.current = searchMode;

  const { scheduleIdleZoom, bumpSearchActivity, flushZoomNow, clearIdleZoom } =
    useSearchIdleZoom(setRegion);

  useEffect(() => publishCommuteDraft.subscribe(setDraft), []);
  useEffect(() => recentPlacesStore.subscribe(setRecentPlaces), []);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const existing = await Location.getForegroundPermissionsAsync();
        let status = existing.status;
        if (status !== Location.PermissionStatus.GRANTED) {
          const requested = await Location.requestForegroundPermissionsAsync();
          status = requested.status;
        }
        if (status !== Location.PermissionStatus.GRANTED || cancelled) {
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: false,
        });
        if (cancelled) {
          return;
        }
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        // Keep default selection if GPS is unavailable.
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadNearbySuggestions = useCallback(async () => {
    const coordinate = userLocation ?? {
      latitude: regionRef.current.latitude,
      longitude: regionRef.current.longitude,
    };
    try {
      const results = await fetchNearbyPlaces(coordinate);
      setNearbyPlaces(results);
    } catch {
      setNearbyPlaces([]);
    }
  }, [userLocation]);

  const activateField = useCallback(
    (nextField: CommuteLocationField, options?: { openSearch?: boolean }) => {
      const openSearchNext = options?.openSearch ?? true;
      const next = resolveInitialSelection(nextField, publishCommuteDraft.get());

      abortRef.current?.abort();
      requestIdRef.current += 1;
      sessionTokenRef.current = createPlacesSessionToken();

      setField(nextField);
      fieldRef.current = nextField;
      skipNextRegionGeocode.current = true;
      setSelected(next);
      setRegion(toRegion(next.latitude, next.longitude));
      setQuery('');
      setPredictions([]);
      setLoading(false);

      if (openSearchNext) {
        setSearchMode(true);
        void loadNearbySuggestions();
      } else {
        setSearchMode(false);
      }
    },
    [loadNearbySuggestions],
  );

  const applyCoordinate = useCallback(async (latitude: number, longitude: number) => {
    const geocodeId = ++geocodeIdRef.current;
    setGeocoding(true);
    try {
      const destination = await reverseGeocodeCoordinate({ latitude, longitude });
      if (geocodeIdRef.current === geocodeId && !preserveListSelectionRef.current) {
        setSelected(destination);
      }
    } finally {
      if (geocodeIdRef.current === geocodeId) {
        setGeocoding(false);
      }
    }
  }, []);

  // Fresh search results always belong to the active field only.
  useEffect(() => {
    if (!searchMode) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 1) {
      abortRef.current?.abort();
      setPredictions([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    const activeFieldAtStart = field;
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const results = await searchPlaces(
            trimmed,
            userLocation ?? {
              latitude: region.latitude,
              longitude: region.longitude,
            },
            {
              signal: controller.signal,
              sessionToken: sessionTokenRef.current,
            },
          );
          // Drop stale responses if the user switched Leaving from ↔ Drop-off.
          if (requestIdRef.current === requestId && fieldRef.current === activeFieldAtStart) {
            setPredictions(results);
          }
        } catch (error) {
          if (
            controller.signal.aborted ||
            isPlacesCancelled(error) ||
            requestIdRef.current !== requestId
          ) {
            return;
          }
          setPredictions([]);
          showAppAlert('Search failed', placesErrorMessage(error));
        } finally {
          if (requestIdRef.current === requestId) {
            setLoading(false);
          }
        }
      })();
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, region.latitude, region.longitude, userLocation, searchMode, field]);

  useEffect(() => {
    if (searchMode) {
      void loadNearbySuggestions();
    }
  }, [searchMode, field, loadNearbySuggestions]);

  const handleRegionChangeComplete = useCallback(
    (next: MapRegion) => {
      const moved =
        Math.abs(regionRef.current.latitude - next.latitude) > 0.0002 ||
        Math.abs(regionRef.current.longitude - next.longitude) > 0.0002;

      setRegion(next);

      if (skipNextRegionGeocode.current) {
        skipNextRegionGeocode.current = false;
        return;
      }

      if (preserveListSelectionRef.current) {
        return;
      }

      if (moved) {
        setSelected((prev) => ({ ...prev, boundary: undefined }));
        void applyCoordinate(next.latitude, next.longitude);
        if (searchModeRef.current) {
          bumpSearchActivity(
            { latitude: next.latitude, longitude: next.longitude },
            zoomToPointerRegion(next.latitude, next.longitude),
          );
        }
      }
    },
    [applyCoordinate, bumpSearchActivity],
  );

  const markUserMapGesture = useCallback(() => {
    preserveListSelectionRef.current = false;
  }, []);

  /**
   * Save the chosen place into the active field only, then return to the form.
   * Start and office are selected in separate visits — not chained here.
   */
  const commitFieldSelection = useCallback(
    (
      destination: SelectedDestination,
      forField: CommuteLocationField,
      options?: { revealMap?: boolean },
    ) => {
      const currentDraft = publishCommuteDraft.get();
      const other =
        forField === 'start'
          ? currentDraft.officeLocationDetail
          : currentDraft.startLocationDetail;
      if (
        other &&
        Number.isFinite(other.latitude) &&
        Number.isFinite(other.longitude)
      ) {
        const tooCloseMessage = getRouteTooCloseMessage(
          { latitude: destination.latitude, longitude: destination.longitude },
          { latitude: other.latitude, longitude: other.longitude },
          'office',
        );
        if (tooCloseMessage) {
          showAppAlert('Locations too close', tooCloseMessage);
          return false;
        }
      }

      Keyboard.dismiss();
      geocodeIdRef.current += 1;
      setGeocoding(false);
      preserveListSelectionRef.current = true;
      recentPlacesStore.add(destination);
      publishCommuteDraft.setLocation(forField, destination);

      setQuery('');
      setPredictions([]);
      setSelected(destination);
      if (options?.revealMap !== false) {
        setSearchMode(false);
        skipNextRegionGeocode.current = true;
        setRegion(panKeepZoom(destination.latitude, destination.longitude, regionRef.current));
        scheduleIdleZoom(regionForPrecisePlace(destination));
      }
      if (router.canGoBack()) {
        router.back();
      }
      return true;
    },
    [router, scheduleIdleZoom],
  );

  const selectPrediction = useCallback(
    async (prediction: PlacesAutocompletePrediction) => {
      if (selecting) {
        return;
      }

      const activeField = fieldRef.current;
      setSelecting(true);
      try {
        if (prediction.placeId.startsWith('recent:')) {
          const cached = getRecentPlaceDetails(prediction.placeId);
          if (cached) {
            commitFieldSelection(cached, activeField);
            return;
          }
        }

        const destination = await resolvePlaceDetails(prediction);
        commitFieldSelection(destination, activeField);
        sessionTokenRef.current = createPlacesSessionToken();
      } catch (error) {
        showAppAlert('Location unavailable', placesErrorMessage(error));
      } finally {
        setSelecting(false);
      }
    },
    [commitFieldSelection, selecting],
  );

  const locateMe = useCallback(async (options?: { updateMap?: boolean }) => {
    try {
      setGeocoding(true);
      const result = await resolveCurrentPlace();
      if (!result.ok) {
        showAppAlert(result.title, result.message);
        return null;
      }
      const precise = result.place;
      setUserLocation({
        latitude: precise.latitude,
        longitude: precise.longitude,
      });
      skipNextRegionGeocode.current = true;
      if (options?.updateMap !== false) {
        clearIdleZoom();
        flushZoomNow(toRegion(precise.latitude, precise.longitude, CURRENT_LOCATION_MAP_DELTA));
      }
      setSelected(precise);
      return precise;
    } catch {
      showAppAlert(
        CURRENT_LOCATION_ALERTS.unavailable.title,
        CURRENT_LOCATION_ALERTS.unavailable.message,
      );
      return null;
    } finally {
      setGeocoding(false);
    }
  }, [clearIdleZoom, flushZoomNow]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (!searchModeRef.current) {
        return;
      }
      const pointer = selectedRef.current;
      bumpSearchActivity({
        latitude: pointer.latitude,
        longitude: pointer.longitude,
      });
    },
    [bumpSearchActivity],
  );

  const openSearch = useCallback(() => {
    setQuery('');
    setPredictions([]);
    sessionTokenRef.current = createPlacesSessionToken();
    setSearchMode(true);
    void loadNearbySuggestions();
    const pointer = selectedRef.current;
    bumpSearchActivity({
      latitude: pointer.latitude,
      longitude: pointer.longitude,
    });
  }, [bumpSearchActivity, loadNearbySuggestions]);

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchMode(false);
    setQuery('');
    setPredictions([]);
    clearIdleZoom();
  }, [clearIdleZoom]);

  const pickCurrentLocation = useCallback(async () => {
    if (selecting) {
      return;
    }
    Keyboard.dismiss();
    setSelecting(true);
    try {
      const destination = await locateMe({ updateMap: false });
      if (!destination) {
        return;
      }
      commitFieldSelection(destination, fieldRef.current, { revealMap: false });
    } catch {
      showAppAlert(
        CURRENT_LOCATION_ALERTS.unavailable.title,
        CURRENT_LOCATION_ALERTS.unavailable.message,
      );
    } finally {
      setSelecting(false);
    }
  }, [commitFieldSelection, locateMe, selecting]);

  const openField = useCallback(
    (nextField: CommuteLocationField) => {
      if (nextField === field && searchMode) {
        return;
      }
      activateField(nextField, { openSearch: true });
    },
    [activateField, field, searchMode],
  );

  const confirm = useCallback(() => {
    if (!selected.placeName.trim()) {
      showAppAlert(
        'Select a location',
        field === 'start'
          ? 'Please choose a pickup point on the map.'
          : 'Please choose a drop-off point on the map.',
      );
      return;
    }

    commitFieldSelection(selected, field);
  }, [commitFieldSelection, field, selected]);

  const goBack = useCallback(() => {
    if (searchMode) {
      closeSearch();
      return;
    }
    router.back();
  }, [closeSearch, router, searchMode]);

  const isSearching = query.trim().length >= 1;
  const nearbyWithoutRecent = nearbyPlaces.filter(
    (place) =>
      !recentPlaces.some(
        (recent) =>
          recent.placeId === place.placeId ||
          recent.placeName.toLowerCase() === place.placeName.toLowerCase(),
      ),
  );

  const suggestionSections = useMemo(
    () =>
      isSearching
        ? [
            {
              title: 'Suggestions',
              data: predictions,
              icon: 'search' as const,
            },
          ]
        : [
            ...(recentPlaces.length > 0
              ? [
                  {
                    title: 'Recent',
                    data: recentPlaces,
                    icon: 'time-outline' as const,
                  },
                ]
              : []),
            ...(nearbyWithoutRecent.length > 0
              ? [
                  {
                    title: 'Nearby',
                    data: nearbyWithoutRecent,
                    icon: 'navigate-outline' as const,
                  },
                ]
              : []),
          ],
    [isSearching, nearbyWithoutRecent, predictions, recentPlaces],
  );

  const suggestions = suggestionSections.flatMap((section) => section.data);

  return {
    field,
    copy,
    draft,
    query,
    setQuery: handleQueryChange,
    searchMode,
    openSearch,
    closeSearch,
    openField,
    pickCurrentLocation,
    suggestions,
    suggestionSections,
    showingRecent: !isSearching,
    isSearching,
    loading,
    geocoding,
    selecting,
    region,
    selected,
    handleRegionChangeComplete,
    markUserMapGesture,
    selectPrediction,
    locateMe,
    confirm,
    goBack,
  };
};
