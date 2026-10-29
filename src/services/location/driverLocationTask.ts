import * as TaskManager from 'expo-task-manager';

import { DRIVER_LOCATION_TASK_NAME } from './driverLocationPublisher.logic';

type NativeCoords = {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
};

type NativeLocation = {
  coords: NativeCoords;
  timestamp?: number;
};

/**
 * Must be imported from the app entry so TaskManager.defineTask runs in global scope.
 * The handler dynamically imports the publisher to avoid a circular load and to recover
 * after Android foreground-service JS restart.
 */
if (!TaskManager.isTaskDefined(DRIVER_LOCATION_TASK_NAME)) {
  TaskManager.defineTask(DRIVER_LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.log('[LiveLocation][driver] native task error', error.message);
      return;
    }
    const locations = (data as { locations?: NativeLocation[] } | undefined)?.locations;
    const last = locations?.[locations.length - 1];
    if (!last?.coords) {
      return;
    }
    const { driverLocationPublisher } = await import('./driverLocationPublisher');
    await driverLocationPublisher.ingestNative(last);
  });
}
