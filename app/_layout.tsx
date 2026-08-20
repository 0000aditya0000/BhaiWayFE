import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { ROOT_SCREEN_INDEX, env } from '@/config';
import {
  applySheetProfileToSession,
  hydrateDemoData,
  hydrateSessionFromSheet,
} from '@/DemoData';
import { setAuthTokenProvider } from '@/network';
import { authSession, ReduxProvider } from '@/store';
import { authService } from '@/features/auth/services';
import { AppAlertModal } from '@/shared/components';
import { colors, useBhaiWayFonts } from '@/shared/theme';
import {
  isNestedRootSegment,
  stackAnimation,
  stackGestureOptions,
} from '@/shared/utils/platform';
import { setupGlobalKeyboardDismiss } from '@/shared/utils/setupGlobalKeyboardDismiss';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden in fast refresh.
});

setupGlobalKeyboardDismiss();
setAuthTokenProvider(() => authSession.getToken());
void hydrateDemoData();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useBhaiWayFonts();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await authSession.hydrate();
      if (authSession.isAuthenticated()) {
        const useSheetProfile = env.useMocks && !env.useMsg91Otp;
        if (useSheetProfile) {
          try {
            await hydrateSessionFromSheet();
            applySheetProfileToSession();
          } catch (error) {
            console.log('[auth] sheet rehydrate skipped', error);
          }
        } else {
          try {
            await authService.hydrateAuthenticatedUser();
          } catch (error) {
            console.log('[auth] GET /users/me rehydrate skipped', error);
          }
        }
      }
      if (!cancelled) {
        setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && authReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [authReady, fontsLoaded, fontError]);

  if ((!fontsLoaded && !fontError) || !authReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ReduxProvider>
          <View style={styles.root}>
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
                    // Nested stacks handle their own one-screen-back swipe.
                    // Disabling root gesture here prevents jumping to Home/Login.
                    gestureEnabled: !isNestedRootSegment(screen.segment),
                    fullScreenGestureEnabled: false,
                  }}
                />
              ))}
            </Stack>
            <AppAlertModal />
          </View>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    backgroundColor: colors.background,
  },
});
