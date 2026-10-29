import 'react-native-gesture-handler';
import '@/services/location/driverLocationTask';
import { useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { DigiLockerProvider } from '@cashfreepayments/react-native-digilocker';
import { ROOT_SCREEN_INDEX } from '@/config';
import { setAuthTokenProvider } from '@/network';
import { ReduxProvider, authSession } from '@/store';
import { AppAlertModal } from '@/shared/components';
import { colors } from '@/shared/theme';
import { AadhaarRewardHost } from '@/features/profile/components/AadhaarRewardHost';
import { PushNavigationRouterBridge } from '@/features/notifications/push/PushNavigationRouterBridge';
import { PushNotificationsBootstrap } from '@/features/notifications/push/PushNotificationsBootstrap';
import {
  isSplashAnimationCompleted,
  markSplashAnimationCompleted,
  SPLASH_BACKGROUND_COLOR,
  DriverLocationTrackingBootstrap,
  StartupSplash,
  useAppBootstrap,
} from '@/startup';
import {
  isNestedRootSegment,
  stackAnimation,
  stackGestureOptions,
} from '@/shared/utils/platform';
import { setupGlobalKeyboardDismiss } from '@/shared/utils/setupGlobalKeyboardDismiss';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden during Fast Refresh.
});

setupGlobalKeyboardDismiss();
setAuthTokenProvider(() => authSession.getToken());

export default function RootLayout() {
  const [animationFinished, setAnimationFinished] = useState(() =>
    isSplashAnimationCompleted(),
  );
  const { ready: bootstrapReady } = useAppBootstrap();

  const hideNativeSplash = useCallback(() => {
    // Only after StartupSplash paints the first video/poster frame.
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  const handleSplashAnimationComplete = useCallback(() => {
    if (markSplashAnimationCompleted()) {
      setAnimationFinished(true);
    }
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  // Keep splash on top for the full animation. Do not mount Home underneath early —
  // that made the app visible before the splash finished.
  const showSplash = !animationFinished || !bootstrapReady;
  const showApp = bootstrapReady && animationFinished;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/*
          Stable shell slot (index 0) + splash overlay (index 1).
          Push bootstrap mounts only with showApp (after splash) so Android
          POST_NOTIFICATIONS is not requested under the opaque splash overlay.
        */}
        <View style={styles.shell} collapsable={false}>
          {showApp ? (
            <ReduxProvider>
              <DigiLockerProvider>
                <View style={styles.root}>
                  <PushNotificationsBootstrap />
                  <DriverLocationTrackingBootstrap />
                  <StatusBar style="dark" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: stackAnimation,
                      contentStyle: styles.screen,
                      ...stackGestureOptions,
                    }}
                  >
                    {ROOT_SCREEN_INDEX.map((screen) => (
                      <Stack.Screen
                        key={screen.id}
                        name={screen.segment}
                        options={{
                          title: screen.title,
                          gestureEnabled: !isNestedRootSegment(screen.segment),
                          fullScreenGestureEnabled: false,
                        }}
                      />
                    ))}
                  </Stack>
                  <PushNavigationRouterBridge />
                  <AppAlertModal />
                  <AadhaarRewardHost />
                </View>
              </DigiLockerProvider>
            </ReduxProvider>
          ) : (
            <View style={styles.shellPlaceholder} />
          )}
        </View>
        {showSplash ? (
          <StartupSplash
            playAnimation={!animationFinished}
            onReady={hideNativeSplash}
            onAnimationComplete={handleSplashAnimationComplete}
          />
        ) : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND_COLOR,
  },
  shell: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND_COLOR,
  },
  shellPlaceholder: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND_COLOR,
  },
  screen: {
    backgroundColor: colors.background,
  },
});
