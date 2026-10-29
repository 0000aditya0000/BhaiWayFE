import { pushDebugLog } from './pushDebug';
import { usePushNotificationsBootstrap } from './usePushNotificationsBootstrap';

// Module evaluation proof — appears even if the component never mounts.
pushDebugLog('stage: bootstrap module evaluated');

let mountLogged = false;

/** Side-effect component — registration only; router is wired separately. */
export const PushNotificationsBootstrap = (): null => {
  // Render-path proof — once per JS runtime (not every re-render).
  if (!mountLogged) {
    mountLogged = true;
    pushDebugLog('stage: bootstrap mounted');
  }
  usePushNotificationsBootstrap();
  return null;
};
