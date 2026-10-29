import React, { useEffect, useMemo } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ROUTES } from '@/config';
import { Button, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { scrollKeyboardDismissMode } from '@/shared/utils/platform';
import { LogoCard } from '@/features/auth/components';
import { authSession } from '@/store';
import { styles } from './WelcomeScreen.styles';

const DESCRIPTION_TEXT =
  'Experience the next generation of professional connectivity. Streamline your workflow, collaborate with precision, and drive momentum with our intuitive platform designed for modern enterprises.';

export const WelcomeScreen = () => {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (authSession.isAuthenticated()) {
      router.replace(ROUTES.home);
    }
  }, [router]);

  const responsive = useMemo(() => {
    const availableHeight = Math.max(height - insets.top - insets.bottom, 1);
    const horizontalPadding = Math.max(width * 0.06, 20);
    const contentWidth = Math.min(width - horizontalPadding * 2, 520);
    const isCompact = availableHeight < 700;
    const isShort = availableHeight < 640;

    return {
      availableHeight,
      horizontalPadding,
      contentWidth,
      logoScale: isShort ? 0.88 : isCompact ? 0.94 : 1,
      headingGap: availableHeight * (isShort ? 0.018 : 0.022),
      descriptionGap: availableHeight * (isShort ? 0.02 : 0.024),
      buttonsGap: availableHeight * (isShort ? 0.028 : 0.036),
      headingSize: width < 360 ? 34 : width < 400 ? 40 : 46,
      headingLineHeight: width < 360 ? 40 : width < 400 ? 46 : 52,
      descriptionSize: width < 360 ? 16 : 18,
      descriptionLineHeight: width < 360 ? 26 : width < 400 ? 30 : 34,
      verticalPadding: Math.max(availableHeight * 0.02, 8),
    };
  }, [width, height, insets.top, insets.bottom]);

  const screenOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const buttonsTranslateY = useSharedValue(40);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withDelay(100, withSpring(1, { damping: 14, stiffness: 120 }));
    buttonsTranslateY.value = withDelay(300, withSpring(0, { damping: 16, stiffness: 110 }));
    buttonsOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, [buttonsOpacity, buttonsTranslateY, logoScale, screenOpacity]);

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Animated.View style={[styles.container, screenAnimatedStyle]}>
        <LinearGradient
          colors={[colors.gradientGlowStart, colors.gradientGlowEnd]}
          style={styles.gradientGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: responsive.horizontalPadding,
              paddingVertical: responsive.verticalPadding,
              minHeight: responsive.availableHeight,
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardDismissMode={scrollKeyboardDismissMode}
        >
          <View style={[styles.content, { width: responsive.contentWidth }]}>
            <View
              style={[
                styles.logoWrapper,
                { transform: [{ scale: responsive.logoScale }] },
              ]}
            >
              <LogoCard scale={logoScale} />
            </View>

            <View style={[styles.headingContainer, { marginTop: responsive.headingGap }]}>
              <Text
                style={[
                  styles.headingLine,
                  { fontSize: responsive.headingSize, lineHeight: responsive.headingLineHeight },
                ]}
              >
                Welcome to
              </Text>
              <Text
                style={[
                  styles.headingBrand,
                  { fontSize: responsive.headingSize, lineHeight: responsive.headingLineHeight },
                ]}
              >
                BhaiWay
              </Text>
              <Text style={styles.tagline}>You Daily Commute Re-Imagined</Text>
            </View>

            <Text
              style={[
                styles.description,
                {
                  marginTop: responsive.descriptionGap,
                  fontSize: responsive.descriptionSize,
                  lineHeight: responsive.descriptionLineHeight,
                },
              ]}
            >
              {DESCRIPTION_TEXT}
            </Text>

            <Animated.View
              style={[
                styles.buttonsContainer,
                { marginTop: responsive.buttonsGap },
                buttonsAnimatedStyle,
              ]}
            >
              <Button
                label="Sign Up Free"
                variant="primary"
                showArrow
                onPress={() => router.push(ROUTES.phone)}
                accessibilityLabel="Sign up for a free account"
              />
              <Button
                label="Login to Account"
                variant="secondary"
                onPress={() => router.push(ROUTES.account)}
                accessibilityLabel="Login to your account"
              />
            </Animated.View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};
