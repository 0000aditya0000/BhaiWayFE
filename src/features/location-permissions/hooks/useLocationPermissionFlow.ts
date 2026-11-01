import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { locationConsentService } from '../services/locationConsent.service';
import { locationPermissionService } from '../services/locationPermission.service';
import { locationDisclosureStore } from '../store/locationDisclosureStore';
import type { LocationPermissionSnapshot } from '../types/locationPermission.types';

export interface UseLocationPermissionFlowResult {
  disclosureVisible: boolean;
  settingsGuideVisible: boolean;
  loading: boolean;
  snapshot: LocationPermissionSnapshot | null;
  refreshSnapshot: () => Promise<LocationPermissionSnapshot>;
  checkAndPromptIfNeeded: () => Promise<boolean>;
  handleConsent: () => Promise<void>;
  handleDecline: () => Promise<void>;
  handleOpenSettings: () => void;
  handleDismissSettingsGuide: () => void;
}

export const useLocationPermissionFlow = (options?: {
  onPermissionResolved?: (granted: boolean) => void;
}): UseLocationPermissionFlowResult => {
  const storeState = useSyncExternalStore(
    locationDisclosureStore.subscribe,
    locationDisclosureStore.getSnapshot,
    locationDisclosureStore.getSnapshot,
  );

  const [snapshot, setSnapshot] = useState<LocationPermissionSnapshot | null>(null);

  const refreshSnapshot = useCallback(async () => {
    const next = await locationPermissionService.getSnapshot();
    setSnapshot(next);
    return next;
  }, []);

  useEffect(() => {
    void refreshSnapshot();
  }, [refreshSnapshot]);

  // Re-check permissions when user returns from device Settings
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        void refreshSnapshot().then((next) => {
          if (next.backgroundGranted) {
            locationDisclosureStore.handleDismissSettingsGuide();
            options?.onPermissionResolved?.(true);
          }
        });
      }
    });
    return () => {
      sub.remove();
    };
  }, [options, refreshSnapshot]);

  const checkAndPromptIfNeeded = useCallback(async (): Promise<boolean> => {
    const current = await refreshSnapshot();
    if (current.backgroundGranted && current.hasAffirmativeConsent) {
      options?.onPermissionResolved?.(true);
      return true;
    }

    if (!current.hasAffirmativeConsent) {
      void locationDisclosureStore.requestConsent({
        onConsent: async () => {
          const updated = await refreshSnapshot();
          options?.onPermissionResolved?.(updated.backgroundGranted);
        },
        onDecline: () => {
          options?.onPermissionResolved?.(false);
        },
      });
      return false;
    }

    if (current.requiresSettings) {
      locationDisclosureStore.handleDismissSettingsGuide();
      return false;
    }

    return false;
  }, [options, refreshSnapshot]);

  const handleConsent = useCallback(async () => {
    await locationDisclosureStore.handleConsent();
    const updated = await refreshSnapshot();
    options?.onPermissionResolved?.(updated.backgroundGranted);
  }, [options, refreshSnapshot]);

  const handleDecline = useCallback(async () => {
    await locationDisclosureStore.handleDecline();
    await refreshSnapshot();
    options?.onPermissionResolved?.(false);
  }, [options, refreshSnapshot]);

  return {
    disclosureVisible: storeState.visible,
    settingsGuideVisible: storeState.settingsGuideVisible,
    loading: storeState.loading,
    snapshot,
    refreshSnapshot,
    checkAndPromptIfNeeded,
    handleConsent,
    handleDecline,
    handleOpenSettings: locationDisclosureStore.handleOpenSettings,
    handleDismissSettingsGuide: locationDisclosureStore.handleDismissSettingsGuide,
  };
};
