import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { locationConsentService } from '../services/locationConsent.service';
import { locationPermissionService } from '../services/locationPermission.service';
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
  const [disclosureVisible, setDisclosureVisible] = useState(false);
  const [settingsGuideVisible, setSettingsGuideVisible] = useState(false);
  const [loading, setLoading] = useState(false);
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
            setSettingsGuideVisible(false);
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
      setDisclosureVisible(true);
      return false;
    }

    if (current.requiresSettings) {
      setSettingsGuideVisible(true);
      return false;
    }

    // Has consent, attempt direct request
    setLoading(true);
    try {
      const result = await locationPermissionService.requestBackgroundPermissionAfterConsent();
      await refreshSnapshot();
      if (result.backgroundGranted) {
        options?.onPermissionResolved?.(true);
        return true;
      }
      if (result.settingsRequired) {
        setSettingsGuideVisible(true);
      }
      options?.onPermissionResolved?.(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [options, refreshSnapshot]);

  const handleConsent = useCallback(async () => {
    setLoading(true);
    try {
      await locationConsentService.recordConsent('consented');
      setDisclosureVisible(false);

      const result = await locationPermissionService.requestBackgroundPermissionAfterConsent();
      await refreshSnapshot();

      if (result.backgroundGranted) {
        options?.onPermissionResolved?.(true);
      } else if (result.settingsRequired) {
        setSettingsGuideVisible(true);
        options?.onPermissionResolved?.(false);
      } else {
        options?.onPermissionResolved?.(false);
      }
    } finally {
      setLoading(false);
    }
  }, [options, refreshSnapshot]);

  const handleDecline = useCallback(async () => {
    await locationConsentService.recordConsent('declined');
    setDisclosureVisible(false);
    await refreshSnapshot();
    options?.onPermissionResolved?.(false);
  }, [options, refreshSnapshot]);

  const handleOpenSettings = useCallback(() => {
    setSettingsGuideVisible(false);
    locationPermissionService.openSettings();
  }, []);

  const handleDismissSettingsGuide = useCallback(() => {
    setSettingsGuideVisible(false);
  }, []);

  return {
    disclosureVisible,
    settingsGuideVisible,
    loading,
    snapshot,
    refreshSnapshot,
    checkAndPromptIfNeeded,
    handleConsent,
    handleDecline,
    handleOpenSettings,
    handleDismissSettingsGuide,
  };
};
