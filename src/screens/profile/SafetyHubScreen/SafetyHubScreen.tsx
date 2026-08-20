import React, { useCallback, useEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { SAFETY_HUB_SCREEN } from '@/features/profile/constants';
import { useSafetyHub } from '@/features/profile/hooks';
import { safetyTokens, styles } from './SafetyHubScreen.styles';

export const SafetyHubScreen = () => {
  const {
    contacts,
    reportOptions,
    goBack,
    openInfo,
    manageContacts,
    triggerSos,
    openReport,
    chatWithSupport,
  } = useSafetyHub();

  const glow = useSharedValue(0.25);

  useEffect(() => {
    glow.value = withRepeat(withTiming(0.55, { duration: 1000 }), -1, true);
  }, [glow]);

  const sosGlowStyle = useAnimatedStyle(() => ({
    shadowColor: safetyTokens.ERROR,
    shadowOpacity: glow.value,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  }));

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={safetyTokens.PRIMARY}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            {SAFETY_HUB_SCREEN.title}
          </Text>

        <IconButton
          icon="information-circle-outline"
          onPress={openInfo}
          color={safetyTokens.PRIMARY}
          accessibilityLabel="Safety information"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{SAFETY_HUB_SCREEN.emergencyHeading}</Text>

          <View style={styles.cardsStack}>
            <View style={styles.trustedCard}>
              <View>
                <View style={styles.trustedHeader}>
                  <Text style={styles.trustedTitle}>{SAFETY_HUB_SCREEN.trustedTitle}</Text>
                  <Pressable
                    onPress={manageContacts}
                    accessibilityRole="button"
                    accessibilityLabel={SAFETY_HUB_SCREEN.trustedManageLabel}
                    hitSlop={8}
                  >
                    <Text style={styles.manageLabel}>{SAFETY_HUB_SCREEN.trustedManageLabel}</Text>
                  </Pressable>
                </View>
                <Text style={styles.trustedBody}>{SAFETY_HUB_SCREEN.trustedBody}</Text>
              </View>

              <View style={styles.avatarRow}>
                {contacts.map((contact, index) =>
                  contact.avatarUri ? (
                    <Image
                      key={contact.id}
                      source={{ uri: contact.avatarUri }}
                      style={[styles.avatar, index > 0 && styles.avatarOverlap]}
                      accessibilityIgnoresInvertColors
                      accessibilityLabel={contact.name}
                    />
                  ) : (
                    <View
                      key={contact.id}
                      style={[styles.avatar, styles.avatarInitials, index > 0 && styles.avatarOverlap]}
                    >
                      <Text style={styles.avatarInitialsText}>
                        {contact.initials ?? contact.name.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  ),
                )}
                <Pressable
                  style={styles.addAvatar}
                  onPress={manageContacts}
                  accessibilityRole="button"
                  accessibilityLabel="Add trusted contact"
                >
                  <Ionicons name="add" size={18} color={safetyTokens.PRIMARY} />
                </Pressable>
              </View>
            </View>

            <Animated.View style={sosGlowStyle}>
              <Pressable
                style={({ pressed }) => [
                  styles.sosCard,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
                onPress={triggerSos}
                accessibilityRole="button"
                accessibilityLabel={SAFETY_HUB_SCREEN.sosTitle}
              >
                <View style={styles.sosIcon}>
                  <Ionicons name="warning" size={28} color={safetyTokens.ERROR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosTitle}>{SAFETY_HUB_SCREEN.sosTitle}</Text>
                  <Text style={styles.sosBody}>{SAFETY_HUB_SCREEN.sosBody}</Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{SAFETY_HUB_SCREEN.reportHeading}</Text>
          {reportOptions.map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.reportCard,
                pressed && { backgroundColor: safetyTokens.SURFACE_LOW },
              ]}
              onPress={() => openReport(option.id)}
              accessibilityRole="button"
              accessibilityLabel={`${option.title}. ${option.subtitle}`}
            >
              <View style={styles.reportIcon}>
                <Ionicons name={option.icon} size={22} color={safetyTokens.SECONDARY} />
              </View>
              <View style={styles.reportMeta}>
                <Text style={styles.reportTitle}>{option.title}</Text>
                <Text style={styles.reportSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#C4C5D7" />
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{SAFETY_HUB_SCREEN.contactHeading}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.chatButton,
              pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
            ]}
            onPress={chatWithSupport}
            accessibilityRole="button"
            accessibilityLabel={SAFETY_HUB_SCREEN.chatLabel}
          >
            <Ionicons name="chatbubble" size={22} color={safetyTokens.ON_PRIMARY_CONTAINER} />
            <Text style={styles.chatLabel}>{SAFETY_HUB_SCREEN.chatLabel}</Text>
          </Pressable>
          <Text style={styles.responseTime}>{SAFETY_HUB_SCREEN.responseTimeLabel}</Text>
        </View>
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
