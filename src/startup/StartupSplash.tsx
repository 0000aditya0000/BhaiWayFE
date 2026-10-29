import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { Audio, ResizeMode, Video, type AVPlaybackStatus, type Video as VideoType } from 'expo-av';

import {
  SPLASH_ANIMATION_DURATION_MS,
  SPLASH_BACKGROUND_COLOR,
  SPLASH_MIN_ELAPSED_MS,
} from './splashMeta';
import {
  claimSplashPlayback,
  isSplashAnimationCompleted,
  isSplashPlaybackClaimed,
} from './startupSession';

// Frame-accurate H.264 export of assets/BhaiWay Splash Screen.gif (npm run generate:brand-assets).
const splashVideoModule = require('../../assets/splash.mp4');
const splashEnd = require('../../assets/splash-end.png');

type SplashVideoSource = { uri: string; overrideFileExtensionAndroid?: 'mp4' };

const logSplash = (message: string, extra?: Record<string, unknown>): void => {
  if (extra) {
    console.log(`[StartupSplash] ${message}`, extra);
    return;
  }
  console.log(`[StartupSplash] ${message}`);
};

/**
 * Resolve a playable file URI for release APKs.
 * Module-scope Image.resolveAssetSource often yields an unplayable Android resource
 * URI without an extension; ExoPlayer needs a real file (or overrideFileExtensionAndroid).
 */
const loadSplashVideoSource = async (): Promise<SplashVideoSource | null> => {
  try {
    const asset = Asset.fromModule(splashVideoModule as number);
    await asset.downloadAsync();
    const uri = (asset.localUri || asset.uri || '').trim();
    if (!uri) {
      logSplash('video asset URI empty after downloadAsync');
      return null;
    }
    logSplash('video asset ready', {
      hasLocalUri: Boolean(asset.localUri),
      type: asset.type,
      platform: Platform.OS,
    });
    if (Platform.OS === 'android') {
      return { uri, overrideFileExtensionAndroid: 'mp4' };
    }
    return { uri };
  } catch (error) {
    logSplash('Asset.fromModule failed — falling back to resolveAssetSource', {
      message: error instanceof Error ? error.message : String(error),
    });
    const resolved = Image.resolveAssetSource(splashVideoModule);
    if (!resolved?.uri) {
      return null;
    }
    return Platform.OS === 'android'
      ? { uri: resolved.uri, overrideFileExtensionAndroid: 'mp4' }
      : { uri: resolved.uri };
  }
};

export interface StartupSplashProps {
  /** When false, hold the end frame (e.g. waiting for bootstrap after animation). */
  playAnimation?: boolean;
  /** Called only after the first video frame is painted — hide native splash then. */
  onReady?: () => void;
  onAnimationComplete: () => void;
}

export const StartupSplash = ({
  playAnimation = true,
  onReady,
  onAnimationComplete,
}: StartupSplashProps) => {
  const videoRef = useRef<VideoType | null>(null);
  const readyNotifiedRef = useRef(false);
  const completionHandledRef = useRef(false);
  const playbackStartedAtRef = useRef<number | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playAttemptedRef = useRef(false);
  const firstFrameRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onCompleteRef = useRef(onAnimationComplete);
  onReadyRef.current = onReady;
  onCompleteRef.current = onAnimationComplete;

  // Claim once per JS runtime — remounts must not restart the video.
  const [ownsPlayback] = useState(() => {
    if (isSplashAnimationCompleted()) {
      return false;
    }
    if (isSplashPlaybackClaimed()) {
      return false;
    }
    return claimSplashPlayback();
  });

  const [videoSource, setVideoSource] = useState<SplashVideoSource | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const shouldAnimate = playAnimation && ownsPlayback && !isSplashAnimationCompleted();

  const notifyReady = useCallback(() => {
    if (readyNotifiedRef.current) {
      return;
    }
    readyNotifiedRef.current = true;
    logSplash('native splash hide allowed (JS splash ready)');
    onReadyRef.current?.();
  }, []);

  const handleComplete = useCallback(() => {
    if (completionHandledRef.current) {
      return;
    }
    completionHandledRef.current = true;
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    onCompleteRef.current();
  }, []);

  /**
   * Never complete before SPLASH_MIN_ELAPSED_MS from real playback start.
   * Spurious expo-av `didJustFinish` events were finishing the splash early.
   */
  const tryComplete = useCallback(
    (reason: string) => {
      if (completionHandledRef.current) {
        return;
      }
      const startedAt = playbackStartedAtRef.current;
      if (startedAt == null) {
        logSplash('ignore complete before playback start', { reason });
        return;
      }
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs < SPLASH_MIN_ELAPSED_MS) {
        logSplash('ignore early complete', { reason, elapsedMs });
        return;
      }
      handleComplete();
    },
    [handleComplete],
  );

  const markPlaybackStarted = useCallback(() => {
    if (playbackStartedAtRef.current != null) {
      return;
    }
    playbackStartedAtRef.current = Date.now();
    logSplash('playback started');
    // Authoritative end-of-splash: hold overlay for the full brand duration.
    if (!completeTimerRef.current) {
      completeTimerRef.current = setTimeout(() => {
        handleComplete();
      }, SPLASH_ANIMATION_DURATION_MS);
    }
  }, [handleComplete]);

  const markFirstFrame = useCallback(() => {
    if (firstFrameRef.current) {
      return;
    }
    firstFrameRef.current = true;
    logSplash('first frame displayed');
    notifyReady();
    markPlaybackStarted();
  }, [markPlaybackStarted, notifyReady]);

  /** Video unavailable — solid canvas only; do not freeze on a static poster. */
  const abandonVideo = useCallback(
    (reason: string, detail?: Record<string, unknown>) => {
      logSplash('video playback failed', { reason, ...detail });
      setVideoFailed((prev) => {
        if (!prev) {
          // Keep native splash until this JS layer is painted, then finish on timer.
          notifyReady();
          markPlaybackStarted();
        }
        return true;
      });
    },
    [markPlaybackStarted, notifyReady],
  );

  const ensurePlaying = useCallback(async () => {
    if (!shouldAnimate || playAttemptedRef.current || videoFailed || !videoSource) {
      return;
    }
    playAttemptedRef.current = true;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch {
      // Non-fatal — muted splash video can still play without audio mode.
    }
    try {
      const status = await videoRef.current?.getStatusAsync();
      if (status?.isLoaded && !status.isPlaying) {
        logSplash('playAsync kickstart');
        await videoRef.current?.playAsync();
      }
    } catch (error) {
      abandonVideo('playAsync', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [abandonVideo, shouldAnimate, videoFailed, videoSource]);

  const handlePlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if ('error' in status && status.error) {
          abandonVideo('playbackStatus', { error: String(status.error) });
        }
        return;
      }

      if (status.isPlaying) {
        markFirstFrame();
      }

      // Real finish is fine, but never before the minimum brand duration.
      if (status.didJustFinish && !status.isLooping) {
        tryComplete('didJustFinish');
      }
    },
    [abandonVideo, markFirstFrame, tryComplete],
  );

  // Resolve video URI after mount (release APK-safe).
  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const source = await loadSplashVideoSource();
      if (cancelled) {
        return;
      }
      if (!source) {
        abandonVideo('asset_resolve');
        return;
      }
      setVideoSource(source);
    })();
    return () => {
      cancelled = true;
    };
  }, [abandonVideo, shouldAnimate]);

  useEffect(() => {
    if (!shouldAnimate) {
      // Remount after claim / already finished — hold end frame and finish.
      if (!ownsPlayback || isSplashAnimationCompleted()) {
        notifyReady();
        handleComplete();
      }
      return;
    }

    // Safety net if playback never starts (broken player).
    const safetyTimer = setTimeout(() => {
      if (playbackStartedAtRef.current == null) {
        logSplash('playback never started — completing via safety timer');
        markPlaybackStarted();
        notifyReady();
      }
      tryComplete('safety');
    }, SPLASH_ANIMATION_DURATION_MS + 2000);

    // Hide native splash if first-frame callback never fires (avoid hanging forever).
    // Prefer keeping the solid-color native splash over a blank RN view.
    const readyFallback = setTimeout(() => {
      if (!readyNotifiedRef.current) {
        logSplash('ready fallback — hiding native splash without confirmed first frame');
        notifyReady();
        if (playbackStartedAtRef.current == null) {
          markPlaybackStarted();
        }
      }
    }, 4000);

    return () => {
      clearTimeout(safetyTimer);
      clearTimeout(readyFallback);
    };
    // Intentionally stable: do not re-run when callback identities change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- single-run splash lifecycle
  }, [shouldAnimate, ownsPlayback]);

  useEffect(() => {
    if (!videoSource || videoFailed) {
      return;
    }
    const kickstart = setTimeout(() => {
      void ensurePlaying();
    }, 50);
    return () => clearTimeout(kickstart);
  }, [ensurePlaying, videoFailed, videoSource]);

  useEffect(() => {
    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
    };
  }, []);

  // End frame while waiting for bootstrap, or if this instance does not own playback.
  if (!shouldAnimate) {
    return (
      <View style={styles.container} pointerEvents="none">
        <Image
          source={splashEnd}
          style={styles.media}
          resizeMode="cover"
          onLoad={notifyReady}
          accessibilityLabel="BhaiWay splash screen"
        />
      </View>
    );
  }

  // Solid canvas only while resolving / if video failed — never a static logo poster.
  return (
    <View style={styles.container} pointerEvents="none">
      {!videoFailed && videoSource ? (
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          isMuted
          usePoster={false}
          progressUpdateIntervalMillis={100}
          onLoad={() => {
            logSplash('video loaded');
            void ensurePlaying();
          }}
          onPlaybackStatusUpdate={handlePlaybackStatus}
          onReadyForDisplay={() => {
            markFirstFrame();
            void ensurePlaying();
          }}
          onError={(error) => {
            abandonVideo('onError', {
              error: typeof error === 'string' ? error : JSON.stringify(error),
            });
          }}
          accessibilityLabel="BhaiWay splash screen"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BACKGROUND_COLOR,
    zIndex: 999,
    elevation: 999,
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
