import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  COMMUTE_REWARDS_CLAIMS_SCREEN,
  formatClaimStatusLabel,
  useCommuteRewardClaims,
} from '@/features/commute-rewards';
import { AppFooter, AppText as Text, Button, ScreenHeader } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';

import { styles } from './CommuteRewardClaimsScreen.styles';

export const CommuteRewardClaimsScreen = () => {
  const { claims, state, errorMessage, refreshing, refresh, retry, goBack } =
    useCommuteRewardClaims();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title={COMMUTE_REWARDS_CLAIMS_SCREEN.title} onBack={handleBack} />

      {state === 'loading' ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      {state === 'error' ? (
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>{COMMUTE_REWARDS_CLAIMS_SCREEN.loadErrorTitle}</Text>
          <Text style={styles.centerBody}>
            {errorMessage || COMMUTE_REWARDS_CLAIMS_SCREEN.loadErrorBody}
          </Text>
          <Button label={COMMUTE_REWARDS_CLAIMS_SCREEN.retryLabel} onPress={retry} />
        </View>
      ) : null}

      {state === 'empty' ? (
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>{COMMUTE_REWARDS_CLAIMS_SCREEN.emptyTitle}</Text>
          <Text style={styles.centerBody}>{COMMUTE_REWARDS_CLAIMS_SCREEN.emptyBody}</Text>
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
          {claims.map((claim) => (
            <View key={claim.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {claim.milestoneTitle || claim.campaignTitle || 'Reward claim'}
              </Text>
              {claim.campaignTitle && claim.milestoneTitle ? (
                <Text style={styles.cardMeta}>{claim.campaignTitle}</Text>
              ) : null}
              {claim.prizeDescription ? (
                <Text style={styles.cardMeta}>{claim.prizeDescription}</Text>
              ) : null}
              {claim.prizeValueCapInr != null && claim.prizeValueCapInr > 0 ? (
                <Text style={styles.cardMeta}>
                  Prize cap ₹{claim.prizeValueCapInr.toLocaleString('en-IN')}
                </Text>
              ) : null}
              {claim.createdAt ? (
                <Text style={styles.cardMeta}>
                  {new Date(claim.createdAt).toLocaleString('en-IN')}
                </Text>
              ) : null}
              <Text style={styles.status}>{formatClaimStatusLabel(claim.status)}</Text>
              {claim.reason ? <Text style={styles.cardMeta}>{claim.reason}</Text> : null}
            </View>
          ))}
        </ScrollView>
      ) : null}

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
