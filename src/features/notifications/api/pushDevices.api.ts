import { ENDPOINTS, httpClient } from '@/network';

import type { RegisterPushDeviceDto } from './pushDevices.types';

/** POST /notifications/devices — register or refresh FCM token (JWT user). */
export const registerPushDevice = async (body: RegisterPushDeviceDto): Promise<void> => {
  await httpClient.post(ENDPOINTS.notifications.devices, {
    token: body.token,
    platform: body.platform,
    ...(body.deviceId?.trim() ? { deviceId: body.deviceId.trim() } : {}),
    ...(body.appVersion?.trim() ? { appVersion: body.appVersion.trim() } : {}),
  });
};

/** DELETE /notifications/devices/:token — unregister on logout. */
export const unregisterPushDevice = async (token: string): Promise<void> => {
  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }
  await httpClient.delete(ENDPOINTS.notifications.deviceByToken(trimmed));
};
