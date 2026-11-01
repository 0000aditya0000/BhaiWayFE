import { locationConsentService } from '../services/locationConsent.service';
import { locationPermissionService } from '../services/locationPermission.service';

export interface LocationDisclosureCallbacks {
  onConsent?: () => void | Promise<void>;
  onDecline?: () => void | Promise<void>;
}

export interface LocationDisclosureState {
  visible: boolean;
  settingsGuideVisible: boolean;
  loading: boolean;
}

let state: LocationDisclosureState = {
  visible: false,
  settingsGuideVisible: false,
  loading: false,
};

let dismissedThisSession = false;
const listeners = new Set<() => void>();
let activeCallbacks: LocationDisclosureCallbacks | null = null;

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('[LocationDisclosureStore] listener error', e);
    }
  });
};

const setSnapshot = (next: Partial<LocationDisclosureState>) => {
  state = { ...state, ...next };
  notify();
};

export const locationDisclosureStore = {
  getSnapshot: (): LocationDisclosureState => state,

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Prompts the disclosure modal on HomeScreen for new installations,
   * fresh registrations, or fresh logins when location permission has NOT yet been granted.
   * If permission is already granted, or user already consented in this install, it will NOT prompt.
   */
  promptHomeDisclosureIfNeeded: async (onConsent?: () => void | Promise<void>): Promise<boolean> => {
    if (dismissedThisSession) {
      return false;
    }

    // 1. If location permission is already granted, do not prompt
    const snapshot = await locationPermissionService.getSnapshot();
    if (snapshot.foregroundGranted) {
      return false;
    }

    // 2. If user already gave affirmative consent in this installation, do not re-prompt on every login
    const hasConsent = await locationConsentService.hasAffirmativeConsent();
    if (hasConsent) {
      return false;
    }

    // 3. User just registered or logged in after install/reinstall and location permission is not granted
    activeCallbacks = onConsent ? { onConsent } : null;
    setSnapshot({ visible: true, loading: false });
    return true;
  },

  /**
   * Request consent before proceeding with a location-sensitive flow.
   * If affirmative consent has already been granted AND background is granted, resolves true immediately.
   * Otherwise, opens the prominent disclosure modal and waits for user action.
   */
  requestConsent: async (callbacks?: LocationDisclosureCallbacks): Promise<boolean> => {
    const hasConsent = await locationConsentService.hasAffirmativeConsent();
    const snapshot = await locationPermissionService.getSnapshot();

    if (hasConsent && snapshot.backgroundGranted) {
      if (callbacks?.onConsent) {
        await callbacks.onConsent();
      }
      return true;
    }

    activeCallbacks = callbacks ?? null;
    setSnapshot({ visible: true, loading: false });
    return false;
  },

  promptDisclosureIfNeeded: async (): Promise<boolean> => {
    const hasConsent = await locationConsentService.hasAffirmativeConsent();
    if (!hasConsent) {
      setSnapshot({ visible: true, loading: false });
      return true;
    }
    return false;
  },

  handleConsent: async (): Promise<void> => {
    setSnapshot({ loading: true });
    try {
      await locationConsentService.recordConsent('consented');
      setSnapshot({ visible: false });

      const result = await locationPermissionService.requestBackgroundPermissionAfterConsent();

      if (result.settingsRequired && !result.backgroundGranted) {
        setSnapshot({ settingsGuideVisible: true });
      }

      const cb = activeCallbacks;
      activeCallbacks = null;
      if (cb?.onConsent) {
        await cb.onConsent();
      }
    } catch (error) {
      console.warn('[LocationDisclosureStore] handleConsent error', error);
    } finally {
      setSnapshot({ loading: false });
    }
  },

  handleDecline: async (): Promise<void> => {
    try {
      dismissedThisSession = true;
      await locationConsentService.recordConsent('declined');
      setSnapshot({ visible: false, settingsGuideVisible: false });

      const cb = activeCallbacks;
      activeCallbacks = null;
      if (cb?.onDecline) {
        await cb.onDecline();
      }
    } catch (error) {
      console.warn('[LocationDisclosureStore] handleDecline error', error);
    }
  },

  handleOpenSettings: (): void => {
    setSnapshot({ settingsGuideVisible: false });
    locationPermissionService.openSettings();
  },

  handleDismissSettingsGuide: (): void => {
    setSnapshot({ settingsGuideVisible: false });
  },

  _resetForTesting: (): void => {
    state = {
      visible: false,
      settingsGuideVisible: false,
      loading: false,
    };
    dismissedThisSession = false;
    activeCallbacks = null;
    listeners.clear();
  },
};
