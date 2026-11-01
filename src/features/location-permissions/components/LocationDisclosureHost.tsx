import React, { useSyncExternalStore } from 'react';

import { locationDisclosureStore } from '../store/locationDisclosureStore';
import { LocationDisclosureModal } from './LocationDisclosureModal';
import { LocationSettingsGuideModal } from './LocationSettingsGuideModal';

export const LocationDisclosureHost = (): React.ReactElement | null => {
  const state = useSyncExternalStore(
    locationDisclosureStore.subscribe,
    locationDisclosureStore.getSnapshot,
    locationDisclosureStore.getSnapshot,
  );

  return (
    <>
      <LocationDisclosureModal
        visible={state.visible}
        loading={state.loading}
        onConsent={locationDisclosureStore.handleConsent}
        onDecline={locationDisclosureStore.handleDecline}
      />
      <LocationSettingsGuideModal
        visible={state.settingsGuideVisible}
        onOpenSettings={locationDisclosureStore.handleOpenSettings}
        onDismiss={locationDisclosureStore.handleDismissSettingsGuide}
      />
    </>
  );
};

