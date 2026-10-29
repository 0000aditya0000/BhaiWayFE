let splashAnimationCompleted = false;
/** True once this JS runtime has started (or finished) the animated splash. */
let splashPlaybackClaimed = false;

/** True after the animated splash has finished for this JS runtime. */
export const isSplashAnimationCompleted = (): boolean => splashAnimationCompleted;

/** Idempotent completion guard — returns true only the first time. */
export const markSplashAnimationCompleted = (): boolean => {
  if (splashAnimationCompleted) {
    return false;
  }
  splashAnimationCompleted = true;
  splashPlaybackClaimed = true;
  return true;
};

/**
 * Claim exclusive ownership of the animated splash for this JS runtime.
 * Returns true only for the first caller — remounts must not restart the video.
 */
export const claimSplashPlayback = (): boolean => {
  if (splashAnimationCompleted || splashPlaybackClaimed) {
    return false;
  }
  splashPlaybackClaimed = true;
  return true;
};

export const isSplashPlaybackClaimed = (): boolean => splashPlaybackClaimed;

/**
 * Whether this launch should still play the animated splash.
 */
export const shouldPlaySplashAnimation = (): boolean => !splashAnimationCompleted;
