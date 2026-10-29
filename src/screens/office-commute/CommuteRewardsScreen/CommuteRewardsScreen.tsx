import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COMMUTE_REWARDS_LIST_SCREEN, useCommuteRewardsList } from '@/features/commute-rewards';
import { AppFooter, AppText as Text, Button, IconButton, ScreenHeader } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';

import { styles } from './CommuteRewardsScreen.styles';

const formatDateRange = (startsAt: string, endsAt: string): string => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const fmt = (d: Date) =>
    Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
};

export const CommuteRewardsScreen = () => {
  const {
    campaigns,
    state,
    errorMessage,
    refreshing,
    refresh,
    retry,
    openCampaign,
    openClaims,
    goBack,
  } = useCommuteRewardsList();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title={COMMUTE_REWARDS_LIST_SCREEN.title}
        onBack={handleBack}
        right={
          <View style={styles.headerActions}>
            <IconButton
              icon="time-outline"
              onPress={openClaims}
              color={colors.primary}
              accessibilityLabel={COMMUTE_REWARDS_LIST_SCREEN.claimsCta}
            />
          </View>
        }
      />

      {state === 'loading' ? (
        <View style={styles.centerState} accessibilityLabel="Loading rewards">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      {state === 'error' ? (
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>{COMMUTE_REWARDS_LIST_SCREEN.loadErrorTitle}</Text>
          <Text style={styles.centerBody}>
            {errorMessage || COMMUTE_REWARDS_LIST_SCREEN.loadErrorBody}
          </Text>
          <Button label={COMMUTE_REWARDS_LIST_SCREEN.retryLabel} onPress={retry} />
        </View>
      ) : null}

      {state === 'empty' ? (
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>{COMMUTE_REWARDS_LIST_SCREEN.emptyTitle}</Text>
          <Text style={styles.centerBody}>{COMMUTE_REWARDS_LIST_SCREEN.emptyBody}</Text>
          <Button label={COMMUTE_REWARDS_LIST_SCREEN.claimsCta} onPress={openClaims} />
        </View>
      ) : null}

      {state === 'ready' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.centerBody}>{COMMUTE_REWARDS_LIST_SCREEN.subtitle}</Text>
          {campaigns.map((campaign) => (
            <Pressable
              key={campaign.id}
              style={styles.card}
              onPress={() => {
                triggerLightHaptic();
                openCampaign(campaign.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Open ${campaign.title}`}
            >
              <Text style={styles.cardTitle}>{campaign.title}</Text>
              {campaign.description ? (
                <Text style={styles.cardMeta} numberOfLines={3}>
                  {campaign.description}
                </Text>
              ) : null}
              <Text style={styles.cardMeta}>
                {formatDateRange(campaign.startsAt, campaign.endsAt)} · {campaign.timezone}
              </Text>
              {campaign.qualifyingTrips != null ? (
                <Text style={styles.cardMeta}>
                  Qualifying trips: {campaign.qualifyingTrips}
                </Text>
              ) : null}
              <Text style={styles.cardCta}>View milestones</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <AppFooter />
    </SafeAreaView>
  );
};
