import React, { useCallback, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { AppFooter, AppText as Text, ScreenHeader } from '@/shared/components';
import { appModeStore } from '@/store';
import { myRidesSurfaceStore } from '@/features/my-rides/store';
import { IncentiveBanner, RideTypeCard } from '@/features/offer-ride/components';
import {
  OUTSTATION_INCENTIVE,
  OUTSTATION_RIDE_INTRO,
  OUTSTATION_RIDE_SCREEN,
  OUTSTATION_RIDE_TYPES,
  getPublishRidePath,
} from '@/features/offer-ride/constants';
import type { OutstationRideTypeOption } from '@/features/offer-ride/types';
import { styles } from './PublishCarpoolRideScreen.styles';

export const PublishCarpoolRideScreen = () => {
  const router = useRouter();

  useEffect(() => {
    myRidesSurfaceStore.setStandard();
    appModeStore.setDriving();
  }, []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.home);
  }, [router]);

  const handleSelect = useCallback(
    (option: OutstationRideTypeOption) => {
      router.push(getPublishRidePath(option.id));
    },
    [router],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title={OUTSTATION_RIDE_SCREEN.title} onBack={handleBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(320)}>
          <IncentiveBanner message={OUTSTATION_INCENTIVE.message} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(340)} style={styles.intro}>
          <Text style={styles.introTitle} accessibilityRole="header">
            {OUTSTATION_RIDE_INTRO.title}
          </Text>
          <Text style={styles.introSubtitle}>{OUTSTATION_RIDE_INTRO.subtitle}</Text>
        </Animated.View>

        <View style={styles.cards}>
          {OUTSTATION_RIDE_TYPES.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeInDown.delay(90 + index * 70).duration(360)}
            >
              <RideTypeCard
                title={option.title}
                icon={option.icon}
                iconVariant={option.iconVariant}
                description={option.description}
                buttonLabel={option.buttonLabel}
                buttonVariant={option.buttonVariant}
                highlighted={option.highlighted}
                badge={option.badge}
                note={option.note}
                perks={option.perks}
                onSelect={() => handleSelect(option)}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <AppFooter />
    </SafeAreaView>
  );
};
