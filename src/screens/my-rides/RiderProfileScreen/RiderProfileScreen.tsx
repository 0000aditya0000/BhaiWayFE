import React, { useCallback } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  IconButton,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { RIDER_PROFILE_SCREEN } from '@/features/my-rides/constants';
import { useRiderProfile } from '@/features/my-rides/hooks';
import { styles } from './RiderProfileScreen.styles';

export const RiderProfileScreen = () => {
  const { profile, goBack, messageRider } = useRiderProfile();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleMessage = useCallback(() => {
    triggerLightHaptic();
    messageRider();
  }, [messageRider]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={colors.primary}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header">
          {RIDER_PROFILE_SCREEN.title}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <Image
                source={{ uri: profile.avatarUri }}
                style={styles.avatarImage}
                accessibilityLabel={`${profile.name} photo`}
              />
            </View>
            {profile.verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
              </View>
            ) : null}
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.name}>{profile.name}</Text>
            {profile.verifiedEmployee ? (
              <View style={styles.employeeChip}>
                <Ionicons name="id-card" size={16} color={colors.primary} />
                <Text style={styles.employeeChipLabel}>
                  {RIDER_PROFILE_SCREEN.verifiedEmployeeLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <LinearGradient
            colors={['#374BB1', '#4B61C4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trustCard}
          >
            <View style={styles.trustInner}>
              <View>
                <Text style={styles.trustLabel}>{RIDER_PROFILE_SCREEN.trustLabel}</Text>
                <Text style={styles.trustValue}>{profile.trustScorePercent}%</Text>
                <Text style={styles.trustHint}>{RIDER_PROFILE_SCREEN.trustHint}</Text>
              </View>
              <Ionicons name="shield-checkmark" size={48} color="rgba(255,255,255,0.2)" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.corporateCard}>
          <View style={styles.companyLogoWrap}>
            <Image
              source={{ uri: profile.companyLogoUri }}
              style={styles.companyLogo}
              resizeMode="contain"
              accessibilityLabel={`${profile.company} logo`}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{profile.company}</Text>
            <Text style={styles.jobTitle}>{profile.jobTitle}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.ridesLabel}</Text>
            <Text style={styles.statLabel}>{RIDER_PROFILE_SCREEN.ridesStatLabel}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.rating.toFixed(1)}</Text>
            <Ionicons name="star" size={14} color={colors.primary} />
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { fontSize: 18, lineHeight: 24, marginTop: 4 }]}>
              {profile.memberSinceMonth}
            </Text>
            <Text style={styles.statLabel}>{profile.memberSinceYear}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{RIDER_PROFILE_SCREEN.socialTitle}</Text>
          <View style={styles.socialCard}>
            <View style={styles.mutualRow}>
              <View style={styles.mutualLeft}>
                <Ionicons name="people-outline" size={22} color="#585E72" />
                <Text style={styles.mutualLabel}>
                  {RIDER_PROFILE_SCREEN.mutualConnectionsLabel}
                </Text>
              </View>
              <View style={styles.mutualAvatars}>
                {profile.mutualConnections.map((connection, index) => (
                  <View
                    key={connection.id}
                    style={[styles.mutualAvatar, index === 0 && styles.mutualAvatarFirst]}
                  >
                    <Image
                      source={{ uri: connection.avatarUri }}
                      style={styles.mutualAvatarImage}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View>
              <Text style={styles.preferencesTitle}>
                {RIDER_PROFILE_SCREEN.preferencesLabel}
              </Text>
              <View style={styles.chipsRow}>
                {profile.preferences.map((preference) => (
                  <View key={preference} style={styles.chip}>
                    <Text style={styles.chipLabel}>{preference}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{RIDER_PROFILE_SCREEN.feedbackTitle}</Text>
          <View style={styles.feedbackCard}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={40}
              color={colors.primary}
              style={styles.quoteIcon}
            />
            <Text style={styles.feedbackQuote}>"{profile.feedbackQuote}"</Text>
            <View style={styles.feedbackAuthorRow}>
              <View style={styles.feedbackDot} />
              <Text style={styles.feedbackAuthor}>{profile.feedbackAuthor}</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.messageBtn,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleMessage}
            accessibilityRole="button"
            accessibilityLabel={RIDER_PROFILE_SCREEN.messageLabel}
          >
            <Ionicons name="chatbubble" size={18} color="#EAEBFF" />
            <Text style={styles.messageLabel}>{RIDER_PROFILE_SCREEN.messageLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
