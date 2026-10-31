import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CURRENT_LOCATION_ALERTS } from '@/shared/maps';
import { getSearchParam, showAppAlert } from '@/shared/utils';
import {
  CURRENT_LOCATION_MAP_DELTA,
  DEFAULT_MAP_COORDINATE,
  DEFAULT_MAP_DELTA,
  getLocationPickerCopy,
} from '../constants';
import {
  resolvePlaceDetails,
  reverseGeocodeCoordinate,
  searchPlaces,
  fetchNearbyPlaces,
  placesErrorMessage,
  isPlacesCancelled,
  createPlacesSessionToken,
} from '../services';
import { getRecentPlaceDetails, locationPickerBridge, recentPlacesStore } from '../store';
import type {
  LocationFieldType,
  MapRegion,
  PlacesAutocompletePrediction,
  SelectedDestination,
} from '../types';
import { regionForPrecisePlace, getNearbyAreaSearchLabel, resolveCurrentPlace } from '../utils';

const toRegion = (
  latitude: number,
  longitude: number,
  delta: { latitudeDelta: number; longitudeDelta: number } = DEFAULT_MAP_DELTA,
): MapRegion => ({
  latitude,
  longitude,
  ...delta,
});

const isLocationField = (value: string): value is LocationFieldType =>
  value === 'origin' || value === 'destination';

export const useSelectDestination = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ field?: string }>();
  const fieldParam = getSearchParam(params.field);
  const field: LocationFieldType = isLocationField(fieldParam) ? fieldParam : 'destination';
  const copy = getLocationPickerCopy(field);
  const [query, setQuery] = useState('');
  // Open map first (same for starting point and destination); search is opt-in.
  const [searchMode, setSearchMode] = useState(false);
  const [predictions, setPredictions] = useState<PlacesAutocompletePrediction[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlacesAutocompletePrediction[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<PlacesAutocompletePrediction[]>(() =>
    recentPlacesStore.get(),
  );
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [region, setRegion] = useState<MapRegion>(
    toRegion(DEFAULT_MAP_COORDINATE.latitude, DEFAULT_MAP_COORDINATE.longitude),
  );
  const [selected, setSelected] = useState<SelectedDestination>({
    placeName: '',
    address: '',
    latitude: DEFAULT_MAP_COORDINATE.latitude,
    longitude: DEFAULT_MAP_COORDINATE.longitude,
  });
  // Only filled when the user picks a place from search — keeps the map
  // search box blank for GPS / map-drag reverse-geocode updates.
  const [searchedPlaceName, setSearchedPlaceName] = useState('');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const requestIdRef = useRef(0);
  const geocodeIdRef = useRef(0);
  const skipNextRegionGeocode = useRef(true);
  /** Keep list-picked place until the user manually moves the map. */
  const preserveListSelectionRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionTokenRef = useRef(createPlacesSessionToken());
  const regionRef = useRef(region);
  regionRef.current = region;

  useEffect(() => recentPlacesStore.subscribe(setRecentPlaces), []);

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

        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(next);
        if (preserveListSelectionRef.current) {
          return;
        }
        skipNextRegionGeocode.current = true;
        setRegion(toRegion(next.latitude, next.longitude));
        // Center the map on GPS, but do not fill the search box — that stays
        // blank until the user searches for a place.
        await applyCoordinate(next.latitude, next.longitude);
      } catch {
        // Keep selection blank if GPS is unavailable.
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [applyCoordinate]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      abortRef.current?.abort();
      setPredictions([]);
      setLoading(false);
      return;
    }

    // Area label prefilled from "Use current location" — show nearby list, not text search.
    if (
      searchedPlaceName.trim().length > 0 &&
      trimmed.toLowerCase() === searchedPlaceName.trim().toLowerCase()
    ) {
      abortRef.current?.abort();
      setPredictions([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
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
          if (requestIdRef.current === requestId) {
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
  }, [query, region.latitude, region.longitude, searchedPlaceName, userLocation]);

  const loadNearbySuggestions = useCallback(async (coordinateOverride?: {
    latitude: number;
    longitude: number;
  }) => {
    const coordinate = coordinateOverride ??
      userLocation ?? {
        latitude: region.latitude,
        longitude: region.longitude,
      };
    try {
      const results = await fetchNearbyPlaces(coordinate);
      setNearbyPlaces(results);
    } catch {
      setNearbyPlaces([]);
    }
  }, [region.latitude, region.longitude, userLocation]);

  useEffect(() => {
    if (searchMode) {
      void loadNearbySuggestions();
    }
  }, [searchMode, loadNearbySuggestions]);

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

      // Programmatic camera moves (list pick) must not replace the place.
      if (preserveListSelectionRef.current) {
        return;
      }

      if (moved) {
        // Dragging updates the pin / confirm panel only — clear search-box text.
        setSearchedPlaceName('');
        setSelected((prev) => ({ ...prev, boundary: undefined }));
        void applyCoordinate(next.latitude, next.longitude);
      }
    },
    [applyCoordinate],
  );

  const markUserMapGesture = useCallback(() => {
    if (preserveListSelectionRef.current) {
      preserveListSelectionRef.current = false;
      setSearchedPlaceName('');
    }
  }, []);

  const applySelectedPlace = useCallback((destination: SelectedDestination) => {
    Keyboard.dismiss();
    // Cancel any in-flight reverse-geocode (bootstrap / map drag) so it cannot
    // overwrite the place the user just picked from search.
    geocodeIdRef.current += 1;
    setGeocoding(false);
    preserveListSelectionRef.current = true;
    setQuery('');
    setPredictions([]);
    setSearchMode(false);
    setSelected(destination);
    setSearchedPlaceName(destination.placeName);
    skipNextRegionGeocode.current = true;
    setRegion(regionForPrecisePlace(destination));
    recentPlacesStore.add(destination);
    sessionTokenRef.current = createPlacesSessionToken();
  }, []);

  const selectPrediction = useCallback(
    async (prediction: PlacesAutocompletePrediction) => {
      if (selecting) {
        return;
      }

      setSelecting(true);
      try {
        if (prediction.placeId.startsWith('recent:')) {
          const cached = getRecentPlaceDetails(prediction.placeId);
          if (cached) {
            applySelectedPlace(cached);
            return;
          }
        }

        const destination = await resolvePlaceDetails(prediction);
        applySelectedPlace(destination);
      } catch (error) {
        showAppAlert('Location unavailable', placesErrorMessage(error));
      } finally {
        setSelecting(false);
      }
    },
    [applySelectedPlace, selecting],
  );

  const locateMe = useCallback(async (options?: { showInSearchBox?: boolean; updateMap?: boolean }) => {
    try {
      setGeocoding(true);
      const result = await resolveCurrentPlace();
      if (!result.ok) {
        showAppAlert(result.title, result.message);
        return null;
      }

      const preciseLocation = result.place;
      setUserLocation({
        latitude: preciseLocation.latitude,
        longitude: preciseLocation.longitude,
      });
      preserveListSelectionRef.current = false;
      skipNextRegionGeocode.current = true;
      if (options?.updateMap !== false) {
        setRegion(
          toRegion(
            preciseLocation.latitude,
            preciseLocation.longitude,
            CURRENT_LOCATION_MAP_DELTA,
          ),
        );
      }
      setSelected(preciseLocation);

      if (options?.showInSearchBox) {
        setSearchedPlaceName(getNearbyAreaSearchLabel(preciseLocation));
      }

      return preciseLocation;
    } catch {
      showAppAlert(
        CURRENT_LOCATION_ALERTS.unavailable.title,
        CURRENT_LOCATION_ALERTS.unavailable.message,
      );
      return null;
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const openSearch = useCallback(() => {
    setQuery('');
    setPredictions([]);
    sessionTokenRef.current = createPlacesSessionToken();
    setSearchMode(true);
    void loadNearbySuggestions();
  }, [loadNearbySuggestions]);

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchMode(false);
    setQuery('');
    setPredictions([]);
  }, []);

  const pickCurrentLocation = useCallback(async () => {
    if (selecting) {
      return;
    }
    Keyboard.dismiss();
    setSelecting(true);
    try {
      // Do not remount the map underneath search — that crashes on Android
      // when we immediately router.back() after GPS.
      const location = await locateMe({ showInSearchBox: true, updateMap: false });
      if (!location) {
        return;
      }

      geocodeIdRef.current += 1;
      preserveListSelectionRef.current = true;
      recentPlacesStore.add(location);
      locationPickerBridge.publish(field, location);
      if (router.canGoBack()) {
        router.back();
      }
    } catch {
      showAppAlert(
        CURRENT_LOCATION_ALERTS.unavailable.title,
        CURRENT_LOCATION_ALERTS.unavailable.message,
      );
    } finally {
      setSelecting(false);
    }
  }, [field, locateMe, router, selecting]);

  const confirm = useCallback(() => {
    if (!selected.placeName.trim()) {
      showAppAlert(
        'Select a location',
        field === 'origin'
          ? 'Please choose a starting point on the map.'
          : 'Please choose a destination on the map.',
      );
      return;
    }

    recentPlacesStore.add(selected);
    locationPickerBridge.publish(field, selected);
    router.back();
  }, [field, router, selected]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const isAreaPrefill =
    searchedPlaceName.trim().length > 0 &&
    query.trim().length > 0 &&
    query.trim().toLowerCase() === searchedPlaceName.trim().toLowerCase();
  const isSearching = query.trim().length >= 1 && !isAreaPrefill;
  const nearbyWithoutRecent = nearbyPlaces.filter(
    (place) =>
      !recentPlaces.some(
        (recent) =>
          recent.placeId === place.placeId ||
          recent.placeName.toLowerCase() === place.placeName.toLowerCase(),
      ),
  );

  const suggestionSections = isSearching
    ? [
        {
          title: 'Suggestions',
          data: predictions,
          icon: 'search' as const,
        },
      ]
    : [
        {
          title: 'Nearby places',
          data: nearbyWithoutRecent,
          icon: 'navigate-outline' as const,
        },
        ...(recentPlaces.length > 0
          ? [
              {
                title: 'Recent',
                data: recentPlaces,
                icon: 'time-outline' as const,
              },
            ]
          : []),
      ];

  const suggestions = suggestionSections.flatMap((section) => section.data);

  return {
    field,
    copy,
    query,
    setQuery: handleQueryChange,
    searchMode,
    openSearch,
    closeSearch,
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
    searchedPlaceName,
    handleRegionChangeComplete,
    markUserMapGesture,
    selectPrediction,
    locateMe,
    confirm,
    goBack,
  };
};
