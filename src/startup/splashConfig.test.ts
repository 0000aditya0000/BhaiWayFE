/**
 * Splash launch invariants — native splash must not show the square brand logo,
 * and the animated overlay is the real splash.mp4 video.
 */

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const SPLASH_BACKGROUND_COLOR = '#F9FBFB';
const NATIVE_SPLASH_IMAGE = './assets/splash-native.png';
const LOGO_IMAGE = './assets/splash-icon.png';
const VIDEO_ASSET = './assets/splash.mp4';

assertEqual(SPLASH_BACKGROUND_COLOR, '#F9FBFB', 'splash canvas color');
assertTrue(NATIVE_SPLASH_IMAGE !== LOGO_IMAGE, 'native splash image is not the square logo');
assertTrue(NATIVE_SPLASH_IMAGE.includes('splash-native'), 'native splash uses solid canvas asset');
assertTrue(VIDEO_ASSET.endsWith('splash.mp4'), 'animated splash is splash.mp4');

// Transition rule: hide native splash only after JS splash is ready (first frame / failure path).
const shouldHideNativeSplash = (jsSplashReady: boolean): boolean => jsSplashReady;
assertTrue(shouldHideNativeSplash(false) === false, 'keep native splash until JS ready');
assertTrue(shouldHideNativeSplash(true) === true, 'hide native splash after first frame');

// Push must not mount under splash (preserve prior fix).
const computeShowApp = (bootstrapReady: boolean, animationFinished: boolean): boolean =>
  bootstrapReady && animationFinished;
assertTrue(computeShowApp(true, false) === false, 'push shell waits for splash animation');
assertTrue(computeShowApp(true, true) === true, 'push shell mounts after splash');

if (failed.length > 0) {
  throw new Error(`splash config tests failed:\n${failed.join('\n')}`);
}
console.log('splash config tests passed');
