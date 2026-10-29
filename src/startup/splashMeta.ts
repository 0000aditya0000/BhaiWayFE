/** Matches the GIF canvas background (rgb 249, 251, 251). */
export const SPLASH_BACKGROUND_COLOR = '#F9FBFB';

/** Sum of per-frame GIF delays — exact duration of assets/BhaiWay Splash Screen.gif. */
export const SPLASH_ANIMATION_DURATION_MS = 4000;

/** Reject spurious early didJustFinish events from the native player. */
export const SPLASH_MIN_ELAPSED_MS = SPLASH_ANIMATION_DURATION_MS - 500;
