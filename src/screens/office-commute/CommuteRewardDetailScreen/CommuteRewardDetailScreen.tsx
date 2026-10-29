import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  canClaimMilestone,
  COMMUTE_REWARDS_DETAIL_SCREEN,
  formatClaimStatusLabel,
  useCommuteRewardCampaign,
  type CommuteRewardMilestoneDto,
} from '@/features/commute-rewards';
import { AppFooter, AppText as Text, Button, IconButton } from '@/shared/components';
import { getSearchParam, triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';

import { rewardDetailTokens, styles } from './CommuteRewardDetailScreen.styles';

type MilestoneVisualState = 'locked' | 'active' | 'claimable' | 'review' | 'done';

const formatDateRange = (startsAt: string, endsAt: string): string => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const fmt = (d: Date) =>
    Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
};

const formatWindowEnd = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const clampProgress = (current: number | null, required: number): number => {
  if (!required || required <= 0) {
    return 0;
  }
  const value = current == null ? 0 : Math.max(0, current);
  return Math.max(0, Math.min(1, value / required));
};

const getMilestoneState = (milestone: CommuteRewardMilestoneDto): MilestoneVisualState => {
  const status = String(milestone.claimStatus ?? 'NONE').toUpperCase();
  if (status === 'FULFILLED' || status === 'CLAIMED' || status === 'APPROVED') {
    return 'done';
  }
  if (status === 'UNDER_REVIEW' || status === 'PENDING') {
    return 'review';
  }
  if (canClaimMilestone(milestone)) {
    return 'claimable';
  }
  if ((milestone.qualifyingTrips ?? 0) > 0 || milestone.thresholdMet === true) {
    return 'active';
  }
  return 'locked';
};

const statusCopy = (
  milestone: CommuteRewardMilestoneDto,
  visual: MilestoneVisualState,
): { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] } => {
  if (visual === 'claimable') {
    return { label: COMMUTE_REWARDS_DETAIL_SCREEN.eligibleLabel, icon: 'gift-outline' };
  }
  if (visual === 'done') {
    return {
      label: formatClaimStatusLabel(milestone.claimStatus),
      icon: 'checkmark-circle',
    };
  }
  if (visual === 'review') {
    return {
      label: formatClaimStatusLabel(milestone.claimStatus),
      icon: 'time-outline',
    };
  }
  if (visual === 'active') {
    return { label: 'In progress', icon: 'flash-outline' };
  }
  return { label: COMMUTE_REWARDS_DETAIL_SCREEN.notEligibleLabel, icon: 'lock-closed-outline' };
};

const AnimatedProgressBar = ({
  progress,
  color,
  trackStyle,
  fillStyle,
}: {
  progress: number;
  color: string;
  trackStyle: object;
  fillStyle: object;
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const width = useSharedValue(0);

  useEffect(() => {
    if (trackWidth <= 0) {
      return;
    }
    width.value = withSpring(trackWidth * progress, {
      damping: 18,
      stiffness: 120,
      mass: 0.7,
    });
  }, [progress, trackWidth, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: color,
  }));

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View style={trackStyle} onLayout={onLayout}>
      <Animated.View style={[fillStyle, animatedStyle]} />
    </View>
  );
};

const ClaimPulseButton = ({
  label,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (disabled) {
      scale.value = withTiming(1, { duration: 160 });
      return;
    }
    scale.value = withRepeat(
      withSequence(withTiming(1.03, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false,
    );
  }, [disabled, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.claimBtn,
          disabled && styles.claimBtnDisabled,
          pressed && !disabled && { opacity: 0.92 },
        ]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name="sparkles-outline" size={18} color={rewardDetailTokens.ON_PRIMARY} />
        <Text style={styles.claimBtnLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const MilestoneCard = ({
  milestone,
  index,
  isLast,
  expanded,
  claiming,
  claimBusy,
  onToggle,
  onClaim,
}: {
  milestone: CommuteRewardMilestoneDto;
  index: number;
  isLast: boolean;
  expanded: boolean;
  claiming: boolean;
  claimBusy: boolean;
  onToggle: () => void;
  onClaim: () => void;
}) => {
  const visual = getMilestoneState(milestone);
  const status = statusCopy(milestone, visual);
  const progress = clampProgress(milestone.qualifyingTrips, milestone.requiredTrips);
  const percent = Math.round(progress * 100);
  const windowEnd = formatWindowEnd(milestone.windowEndAt);
  const fillColor =
    visual === 'claimable' || visual === 'done'
      ? rewardDetailTokens.SUCCESS
      : visual === 'review'
        ? rewardDetailTokens.WARNING
        : rewardDetailTokens.PRIMARY;

  const nodeStyle = [
    styles.node,
    visual === 'done' && styles.nodeDone,
    visual === 'active' && styles.nodeActive,
    visual === 'claimable' && styles.nodeClaimable,
    visual === 'review' && styles.nodeClaimable,
  ];

  const chipStyle = [
    styles.statusChip,
    visual === 'claimable' && styles.statusChipClaimable,
    visual === 'review' && styles.statusChipReview,
    visual === 'done' && styles.statusChipDone,
  ];

  const chipTextStyle = [
    styles.statusChipText,
    visual === 'claimable' && styles.statusChipTextClaimable,
    visual === 'review' && styles.statusChipTextReview,
  ];

  const nodeIcon =
    visual === 'done'
      ? ('checkmark' as const)
      : visual === 'claimable'
        ? ('gift' as const)
        : visual === 'review'
          ? ('hourglass' as const)
          : visual === 'active'
            ? ('navigate' as const)
            : ('lock-closed' as const);

  return (
    <Animated.View
      entering={FadeInUp.duration(360).delay(Math.min(80 + index * 70, 360))}
      style={styles.milestoneRow}
    >
      <View style={styles.railCol}>
        <View style={[styles.railLineTop, index === 0 && { opacity: 0 }]} />
        <View style={nodeStyle}>
          <Ionicons
            name={nodeIcon}
            size={14}
            color={
              visual === 'locked' ? rewardDetailTokens.ON_SURFACE_VARIANT : rewardDetailTokens.ON_PRIMARY
            }
          />
        </View>
        <View
          style={[
            styles.railLineBottom,
            isLast && { minHeight: 0, flex: 0 },
            (visual === 'done' || visual === 'claimable') && styles.railLineDone,
          ]}
        />
      </View>

      <View style={styles.cardCol}>
        <View
          style={[
            styles.milestoneCard,
            visual === 'claimable' && styles.milestoneCardClaimable,
          ]}
        >
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onToggle();
            }}
            style={({ pressed }) => [
              styles.milestonePressable,
              pressed && styles.milestoneCardPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${milestone.title}, ${status.label}`}
          >
            <View style={styles.milestoneTop}>
              <View style={styles.milestoneTitleWrap}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                {milestone.prizeValueCapInr > 0 ? (
                  <Text style={styles.milestonePrize}>
                    {COMMUTE_REWARDS_DETAIL_SCREEN.prizeCapLabel(milestone.prizeValueCapInr)}
                  </Text>
                ) : null}
              </View>
              <View style={chipStyle}>
                <Ionicons
                  name={status.icon}
                  size={12}
                  color={
                    visual === 'claimable'
                      ? rewardDetailTokens.SUCCESS
                      : visual === 'review'
                        ? rewardDetailTokens.WARNING
                        : rewardDetailTokens.PRIMARY
                  }
                />
                <Text style={chipTextStyle}>{status.label}</Text>
              </View>
            </View>

            {milestone.prizeDescription ? (
              <Text style={styles.prizeBody} numberOfLines={expanded ? undefined : 2}>
                {milestone.prizeDescription}
              </Text>
            ) : null}

            <View style={styles.progressBlock}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>
                  {COMMUTE_REWARDS_DETAIL_SCREEN.tripsProgress(
                    milestone.qualifyingTrips,
                    milestone.requiredTrips,
                  )}
                </Text>
                <Text style={styles.progressPercent}>{percent}%</Text>
              </View>
              <AnimatedProgressBar
                progress={progress}
                color={fillColor}
                trackStyle={styles.milestoneTrack}
                fillStyle={styles.milestoneFill}
              />
            </View>

            <View style={styles.expandHint}>
              <Text style={styles.expandHintLabel}>
                {expanded ? 'Hide details' : 'View details'}
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={rewardDetailTokens.PRIMARY}
              />
            </View>
          </Pressable>

          {expanded ? (
            <Animated.View entering={FadeInDown.duration(220)} style={styles.detailsWrap}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color={rewardDetailTokens.PRIMARY} />
                <Text style={styles.detailText}>
                  {COMMUTE_REWARDS_DETAIL_SCREEN.windowLabel(milestone.windowMonths)}
                </Text>
              </View>
              {milestone.remainingTrips != null && milestone.remainingTrips > 0 ? (
                <View style={styles.detailRow}>
                  <Ionicons name="flag-outline" size={16} color={rewardDetailTokens.PRIMARY} />
                  <Text style={styles.detailText}>
                    {milestone.remainingTrips} trips remaining in window
                  </Text>
                </View>
              ) : null}
              {windowEnd ? (
                <View style={styles.detailRow}>
                  <Ionicons name="alarm-outline" size={16} color={rewardDetailTokens.PRIMARY} />
                  <Text style={styles.detailText}>Window ends {windowEnd}</Text>
                </View>
              ) : null}
            </Animated.View>
          ) : null}

          {visual === 'claimable' ? (
            <ClaimPulseButton
              label={
                claiming
                  ? COMMUTE_REWARDS_DETAIL_SCREEN.claimingLabel
                  : COMMUTE_REWARDS_DETAIL_SCREEN.claimLabel
              }
              disabled={claimBusy}
              onPress={() => {
                triggerSuccessHaptic();
                onClaim();
              }}
              accessibilityLabel={`Claim ${milestone.title}`}
            />
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
};

export const CommuteRewardDetailScreen = () => {
  const params = useLocalSearchParams<{ campaignId?: string }>();
  const campaignId = getSearchParam(params.campaignId);
  const {
    campaign,
    state,
    errorMessage,
    claimingMilestoneId,
    refresh,
    retry,
    claimMilestone,
    goBack,
    openClaims,
  } = useCommuteRewardCampaign(campaignId);

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!campaign || seeded) {
      return;
    }
    const firstFocus =
      campaign.milestones.find((item) => canClaimMilestone(item)) ??
      campaign.milestones.find((item) => getMilestoneState(item) === 'active') ??
      campaign.milestones[0];
    if (firstFocus) {
      setExpandedIds({ [firstFocus.id]: true });
    }
    setSeeded(true);
  }, [campaign, seeded]);

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleOpenClaims = useCallback(() => {
    triggerLightHaptic();
    openClaims();
  }, [openClaims]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const overall = useMemo(() => {
    if (!campaign) {
      return { current: 0, target: 0, ratio: 0, label: '0 / 0' };
    }
    const sorted = [...campaign.milestones].sort((a, b) => a.requiredTrips - b.requiredTrips);
    const nextOpen =
      sorted.find((item) => getMilestoneState(item) !== 'done') ?? sorted[sorted.length - 1];
    const target = nextOpen?.requiredTrips ?? sorted[sorted.length - 1]?.requiredTrips ?? 0;
    const current =
      campaign.qualifyingTrips ??
      nextOpen?.qualifyingTrips ??
      Math.max(0, ...sorted.map((item) => item.qualifyingTrips ?? 0));
    const ratio = clampProgress(current, target || 1);
    return {
      current,
      target,
      ratio,
      label: target > 0 ? `${current} / ${target}` : `${current}`,
    };
  }, [campaign]);

  const completedCount = useMemo(() => {
    if (!campaign) {
      return 0;
    }
    return campaign.milestones.filter((item) => getMilestoneState(item) === 'done').length;
  }, [campaign]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={rewardDetailTokens.ON_SURFACE}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {campaign?.title ?? COMMUTE_REWARDS_DETAIL_SCREEN.title}
        </Text>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <IconButton
            icon="time-outline"
            onPress={handleOpenClaims}
            color={rewardDetailTokens.PRIMARY}
            accessibilityLabel="Claim history"
          />
        </View>
      </View>

      {state === 'loading' ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={rewardDetailTokens.PRIMARY} />
        </View>
      ) : null}

      {state === 'error' ? (
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>{COMMUTE_REWARDS_DETAIL_SCREEN.loadErrorTitle}</Text>
          <Text style={styles.centerBody}>
            {errorMessage || COMMUTE_REWARDS_DETAIL_SCREEN.loadErrorBody}
          </Text>
          <Button label={COMMUTE_REWARDS_DETAIL_SCREEN.retryLabel} onPress={retry} />
        </View>
      ) : null}

      {state === 'ready' && campaign ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refresh}
              tintColor={rewardDetailTokens.PRIMARY}
            />
          }
        >
          <Animated.View entering={FadeInDown.duration(380)}>
            <LinearGradient
              colors={[
                rewardDetailTokens.SECONDARY,
                rewardDetailTokens.PRIMARY,
                rewardDetailTokens.PRIMARY_DARK,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroGlowOne} pointerEvents="none" />
              <View style={styles.heroGlowTwo} pointerEvents="none" />
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="trophy-outline" size={14} color={rewardDetailTokens.ON_PRIMARY} />
                  <Text style={styles.heroBadgeLabel}>Campaign</Text>
                </View>
                {campaign.isActive ? (
                  <View style={styles.heroActiveChip}>
                    <Text style={styles.heroActiveLabel}>Active</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.heroTitle}>{campaign.title}</Text>
              {campaign.description ? (
                <Text style={styles.heroBody}>{campaign.description}</Text>
              ) : null}
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaChip}>
                  <Ionicons name="calendar-outline" size={13} color={rewardDetailTokens.ON_PRIMARY} />
                  <Text style={styles.heroMetaText}>
                    {formatDateRange(campaign.startsAt, campaign.endsAt)}
                  </Text>
                </View>
                <View style={styles.heroMetaChip}>
                  <Ionicons name="globe-outline" size={13} color={rewardDetailTokens.ON_PRIMARY} />
                  <Text style={styles.heroMetaText}>{campaign.timezone}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(380).delay(60)} style={styles.overallCard}>
            <View style={styles.overallHeader}>
              <Text style={styles.overallTitle}>Your progress</Text>
              <Text style={styles.overallValue}>{overall.label}</Text>
            </View>
            <Text style={styles.overallHint}>
              Qualifying Office Commute trips toward the next milestone
            </Text>
            <AnimatedProgressBar
              progress={overall.ratio}
              color={rewardDetailTokens.PRIMARY}
              trackStyle={styles.progressTrack}
              fillStyle={styles.progressFill}
            />
            <View style={styles.progressTicks}>
              <Text style={styles.progressTickLabel}>Start</Text>
              <Text style={styles.progressTickLabel}>
                {Math.round(overall.ratio * 100)}% complete
              </Text>
              <Text style={styles.progressTickLabel}>
                {overall.target > 0 ? `${overall.target} trips` : 'Goal'}
              </Text>
            </View>
          </Animated.View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{COMMUTE_REWARDS_DETAIL_SCREEN.milestonesTitle}</Text>
            <Text style={styles.sectionCount}>
              {completedCount}/{campaign.milestones.length} done
            </Text>
          </View>

          {campaign.milestones.length === 0 ? (
            <View style={styles.emptyMilestones}>
              <Ionicons name="flag-outline" size={28} color={rewardDetailTokens.PRIMARY} />
              <Text style={styles.centerBody}>{COMMUTE_REWARDS_DETAIL_SCREEN.emptyMilestones}</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {[...campaign.milestones]
                .sort((a, b) => a.sortOrder - b.sortOrder || a.requiredTrips - b.requiredTrips)
                .map((milestone, index, list) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    index={index}
                    isLast={index === list.length - 1}
                    expanded={Boolean(expandedIds[milestone.id])}
                    claiming={claimingMilestoneId === milestone.id}
                    claimBusy={Boolean(claimingMilestoneId)}
                    onToggle={() => toggleExpanded(milestone.id)}
                    onClaim={() => claimMilestone(milestone.id)}
                  />
                ))}
            </View>
          )}
        </ScrollView>
      ) : null}

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
