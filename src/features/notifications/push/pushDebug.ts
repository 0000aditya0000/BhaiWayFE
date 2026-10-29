/**
 * Temporary push diagnostics for release APK / OTA verification.
 * Always on. Never log JWT, FCM secrets, or full tokens.
 */
export const pushDebugLog = (message: string, extra?: Record<string, unknown>): void => {
  if (extra) {
    console.log(`[PUSH] ${message}`, extra);
    return;
  }
  console.log(`[PUSH] ${message}`);
};

export const pushDebugError = (message: string, extra?: Record<string, unknown>): void => {
  if (extra) {
    console.log(`[PUSH] ERROR ${message}`, extra);
    return;
  }
  console.log(`[PUSH] ERROR ${message}`);
};
