import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  COMMUTE_REWARDS_LIST_SCREEN,
  useCommuteRewardsList,
} from '@/features/commute-rewards';
import { REFER_EARN_SCREEN } from '@/features/profile/constants';
import { useReferEarn } from '@/features/profile/hooks';
import type { ReferralListItemUi } from '@/features/profile/utils/referrals.mapper';
import { AppFooter, Button, IconButton, AppText as Text } from '@/shared/components';
import { getSearchParam, triggerLightHaptic, showAppAlert } from '@/shared/utils';

import { referTokens, styles } from './ReferEarnScreen.styles';

type HubTab = 'referrals' | 'rewards';

const formatDateRange = (startsAt: string, endsAt: string): string => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const fmt = (d: Date) =>
    Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
};

const statusUi = (status: string) => {
  const key = status.toUpperCase();
  if (key === 'REWARDED') {
    return {
      badge: styles.statusSuccessful,
      label: styles.statusLabelSuccessful,
      amount: styles.amountSuccess,
      icon: 'checkmark-circle' as const,
      color: referTokens.SUCCESS,
    };
  }
  return {
    badge: styles.statusWaiting,
    label: styles.statusLabelWaiting,
    amount: styles.amountPending,
    icon: 'time-outline' as const,
    color: referTokens.WAITING,
  };
};

export const ReferEarnScreen = () => {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab = useMemo<HubTab>(() => {
    const raw = getSearchParam(params.tab)?.toLowerCase();
    return raw === 'rewards' ? 'rewards' : 'referrals';
  }, [params.tab]);
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const refer = useReferEarn();
  const rewards = useCommuteRewardsList();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    refer.goBack();
  }, [refer]);

  const handleHelp = useCallback(() => {
    triggerLightHaptic();
    if (activeTab === 'rewards') {
      showAppAlert(REFER_EARN_SCREEN.rewardsHelpTitle, REFER_EARN_SCREEN.rewardsHelpMessage);
      return;
    }
    showAppAlert(REFER_EARN_SCREEN.helpTitle, REFER_EARN_SCREEN.helpMessage);
  }, [activeTab]);

  const selectTab = useCallback((tab: HubTab) => {
    triggerLightHaptic();
    setActiveTab(tab);
  }, []);

  const renderReferralItem = useCallback(
    ({ item, index }: { item: ReferralListItemUi; index: number }) => {
      const ui = statusUi(item.status);
      return (
        <View style={[styles.historyCard, { marginBottom: 12 }]}>
          <View style={styles.historyRow}>
            <View style={styles.historyLeft}>
              {item.profilePhoto ? (
                <Image source={{ uri: item.profilePhoto }} style={styles.avatarImage} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    index % 2 === 0 ? styles.avatarPrimary : styles.avatarSecondary,
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={index % 2 === 0 ? referTokens.PRIMARY : referTokens.ON_SURFACE}
                  />
                </View>
              )}
              <View style={styles.historyMeta}>
                <Text style={styles.historyName}>{item.name}</Text>
                <Text style={styles.historyDetail}>{item.detail}</Text>
              </View>
            </View>
            <View style={styles.historyRight}>
              <Text style={ui.amount}>{item.amountLabel}</Text>
              <View style={[styles.statusBadge, ui.badge]}>
                <Ionicons name={ui.icon} size={14} color={ui.color} />
                <Text style={[styles.statusLabel, ui.label]}>{item.statusLabel}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [],
  );

  const referralsHeader = (
    <View style={{ gap: 20, marginBottom: 8 }}>
      <LinearGradient
        colors={[referTokens.SECONDARY, referTokens.PRIMARY, referTokens.PRIMARY_DARK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroGlowOne} pointerEvents="none" />
        <View style={styles.heroGlowTwo} pointerEvents="none" />
        <View style={styles.heroBadge}>
          <Ionicons name="people-outline" size={14} color={referTokens.ON_PRIMARY} />
          <Text style={styles.heroBadgeLabel}>Referrals</Text>
        </View>
        <Text style={styles.heroTitle}>{refer.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{refer.heroSubtitle}</Text>
        <View style={styles.perkRow}>
          {refer.perks.map((perk) => (
            <View key={perk.id} style={styles.perkChip}>
              <Ionicons name={perk.icon} size={14} color={referTokens.ON_PRIMARY} />
              <Text style={styles.perkLabel}>{perk.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardEyebrow}>{REFER_EARN_SCREEN.exclusiveLabel}</Text>
          <Text style={styles.cardTitle}>{REFER_EARN_SCREEN.shareCodeTitle}</Text>
        </View>

        <View style={styles.codeRow}>
          <View style={styles.codeBox}>
            <Text style={styles.codeText} numberOfLines={1}>
              {refer.code || '—'}
            </Text>
            <Pressable
              style={styles.copyButton}
              onPress={refer.copyCode}
              disabled={!refer.code}
              accessibilityRole="button"
              accessibilityLabel={
                refer.copied ? REFER_EARN_SCREEN.copiedLabel : REFER_EARN_SCREEN.copyLabel
              }
              hitSlop={8}
            >
              <Ionicons
                name={refer.copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={refer.copied ? referTokens.SUCCESS : referTokens.PRIMARY}
              />
              <Text style={[styles.copyLabel, refer.copied && styles.copyLabelDone]}>
                {refer.copied ? REFER_EARN_SCREEN.copiedLabel : REFER_EARN_SCREEN.copyLabel}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.shareButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              !refer.code && { opacity: 0.55 },
            ]}
            onPress={refer.shareCode}
            disabled={!refer.code}
            accessibilityRole="button"
            accessibilityLabel={REFER_EARN_SCREEN.shareLabel}
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            <Text style={styles.shareLabel}>{REFER_EARN_SCREEN.shareLabel}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{REFER_EARN_SCREEN.statsReferralsLabel}</Text>
          <Text style={styles.statValue}>{refer.summary?.totalReferrals ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{REFER_EARN_SCREEN.statsCoinsLabel}</Text>
          <Text style={styles.statValue}>
            {refer.summary ? refer.summary.totalCoinsEarnedLabel.replace(' Coins', '') : '0'}
          </Text>
        </View>
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>{REFER_EARN_SCREEN.statusTitle}</Text>
        {refer.summary ? (
          <View style={styles.earnedBadge}>
            <Text style={styles.earnedLabel}>{refer.summary.totalCoinsEarnedLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderReferrals = () => {
    if (refer.loading && !refer.refreshing) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={referTokens.PRIMARY} />
          <Text style={styles.errorText}>{REFER_EARN_SCREEN.loadingLabel}</Text>
        </View>
      );
    }

    if (refer.error && refer.items.length === 0 && !refer.summary) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{refer.error}</Text>
          <Button
            label={REFER_EARN_SCREEN.retryLabel}
            onPress={refer.retry}
            accessibilityLabel={REFER_EARN_SCREEN.retryLabel}
          />
        </View>
      );
    }

    return (
      <FlatList
        data={refer.items}
        keyExtractor={(item) => item.id}
        renderItem={renderReferralItem}
        ListHeaderComponent={referralsHeader}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refer.refreshing} onRefresh={() => void refer.refresh()} />
        }
        onEndReached={() => {
          if (refer.hasMore) {
            refer.loadMore();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={[styles.historyCard, styles.emptyWrap]}>
            <Ionicons name="people-outline" size={28} color={referTokens.PRIMARY} />
            <Text style={styles.emptyTitle}>{refer.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{refer.emptySubtitle}</Text>
            <Pressable
              style={styles.inviteButton}
              onPress={refer.shareCode}
              accessibilityRole="button"
              accessibilityLabel={refer.inviteLabel}
            >
              <Text style={styles.inviteLabel}>{refer.inviteLabel}</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          refer.loadingMore ? (
            <ActivityIndicator color={referTokens.PRIMARY} style={styles.listFooter} />
          ) : null
        }
      />
    );
  };

  const renderRewards = () => {
    if (rewards.state === 'loading') {
      return (
        <View style={styles.centered} accessibilityLabel="Loading rewards">
          <ActivityIndicator size="large" color={referTokens.PRIMARY} />
        </View>
      );
    }

    if (rewards.state === 'error') {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{COMMUTE_REWARDS_LIST_SCREEN.loadErrorTitle}</Text>
          <Text style={styles.errorText}>
            {rewards.errorMessage || COMMUTE_REWARDS_LIST_SCREEN.loadErrorBody}
          </Text>
          <Button label={COMMUTE_REWARDS_LIST_SCREEN.retryLabel} onPress={rewards.retry} />
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={rewards.refreshing}
            onRefresh={rewards.refresh}
            tintColor={referTokens.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[referTokens.SECONDARY, referTokens.PRIMARY, referTokens.PRIMARY_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlowOne} pointerEvents="none" />
          <View style={styles.heroGlowTwo} pointerEvents="none" />
          <View style={styles.heroBadge}>
            <Ionicons name="trophy-outline" size={14} color={referTokens.ON_PRIMARY} />
            <Text style={styles.heroBadgeLabel}>Driver rewards</Text>
          </View>
          <Text style={styles.heroTitle}>{COMMUTE_REWARDS_LIST_SCREEN.title}</Text>
          <Text style={styles.heroSubtitle}>{COMMUTE_REWARDS_LIST_SCREEN.subtitle}</Text>
        </LinearGradient>

        <Pressable
          style={styles.claimsLink}
          onPress={() => {
            triggerLightHaptic();
            rewards.openClaims();
          }}
          accessibilityRole="button"
          accessibilityLabel={COMMUTE_REWARDS_LIST_SCREEN.claimsCta}
        >
          <Ionicons name="time-outline" size={18} color={referTokens.PRIMARY} />
          <Text style={styles.claimsLinkLabel}>{COMMUTE_REWARDS_LIST_SCREEN.claimsCta}</Text>
        </Pressable>

        {rewards.state === 'empty' ? (
          <View style={[styles.historyCard, styles.emptyWrap]}>
            <Ionicons name="trophy-outline" size={28} color={referTokens.PRIMARY} />
            <Text style={styles.emptyTitle}>{COMMUTE_REWARDS_LIST_SCREEN.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{COMMUTE_REWARDS_LIST_SCREEN.emptyBody}</Text>
          </View>
        ) : (
          rewards.campaigns.map((campaign) => (
            <Pressable
              key={campaign.id}
              style={({ pressed }) => [styles.rewardCard, pressed && { opacity: 0.92 }]}
              onPress={() => {
                triggerLightHaptic();
                rewards.openCampaign(campaign.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Open ${campaign.title}`}
            >
              <View style={styles.rewardCardTop}>
                <View style={styles.rewardIconWrap}>
                  <Ionicons name="ribbon-outline" size={22} color={referTokens.PRIMARY} />
                </View>
                <View style={styles.rewardCardBody}>
                  <Text style={styles.rewardCardTitle}>{campaign.title}</Text>
                  {campaign.description ? (
                    <Text style={styles.rewardCardMeta} numberOfLines={3}>
                      {campaign.description}
                    </Text>
                  ) : null}
                  <Text style={styles.rewardCardMeta}>
                    {formatDateRange(campaign.startsAt, campaign.endsAt)}
                    {campaign.timezone ? ` · ${campaign.timezone}` : ''}
                  </Text>
                  {campaign.qualifyingTrips != null ? (
                    <Text style={styles.rewardCardMeta}>
                      Qualifying trips: {campaign.qualifyingTrips}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.rewardCardCta}>
                <Text style={styles.rewardCardCtaLabel}>
                  {COMMUTE_REWARDS_LIST_SCREEN.viewMilestonesCta}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={referTokens.PRIMARY} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={referTokens.ON_SURFACE}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {REFER_EARN_SCREEN.title}
        </Text>
        <View style={styles.headerRight}>
          <IconButton
            icon="help-circle-outline"
            onPress={handleHelp}
            color={referTokens.ON_SURFACE_VARIANT}
            accessibilityLabel="Help"
          />
        </View>
      </View>

      <View style={styles.tabBar} accessibilityRole="tablist">
        <Pressable
          style={[styles.tab, activeTab === 'referrals' && styles.tabActive]}
          onPress={() => selectTab('referrals')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'referrals' }}
          accessibilityLabel={REFER_EARN_SCREEN.tabReferrals}
        >
          <Text
            style={[styles.tabLabel, activeTab === 'referrals' && styles.tabLabelActive]}
          >
            {REFER_EARN_SCREEN.tabReferrals}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'rewards' && styles.tabActive]}
          onPress={() => selectTab('rewards')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'rewards' }}
          accessibilityLabel={REFER_EARN_SCREEN.tabRewards}
        >
          <Text style={[styles.tabLabel, activeTab === 'rewards' && styles.tabLabelActive]}>
            {REFER_EARN_SCREEN.tabRewards}
          </Text>
        </Pressable>
      </View>

      {activeTab === 'referrals' ? renderReferrals() : renderRewards()}

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
