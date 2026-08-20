import React, { Fragment, useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { REFER_EARN_SCREEN, REFERRAL_STATUS_LABEL } from '@/features/profile/constants';
import { useReferEarn } from '@/features/profile/hooks';
import type { ReferralStatus } from '@/features/profile/types';
import { referTokens, styles } from './ReferEarnScreen.styles';

const statusUi = (status: ReferralStatus) => {
  if (status === 'successful') {
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
  const {
    code,
    perks,
    history,
    copied,
    goBack,
    openHelp,
    copyCode,
    shareCode,
    viewAllHistory,
  } = useReferEarn();

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
            color={referTokens.ON_SURFACE}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            {REFER_EARN_SCREEN.title}
          </Text>

        <IconButton
          icon="help-circle-outline"
          onPress={openHelp}
          color={referTokens.ON_SURFACE_VARIANT}
          accessibilityLabel="Help"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            {REFER_EARN_SCREEN.heroTitle}
            {'\n'}
            <Text style={styles.heroHighlight}>{REFER_EARN_SCREEN.heroHighlight}</Text>
          </Text>
          <Text style={styles.heroSubtitle}>{REFER_EARN_SCREEN.heroSubtitle}</Text>
          <View style={styles.perkRow}>
            {perks.map((perk) => {
              const isPrimary = perk.tone === 'primary';
              return (
                <View
                  key={perk.id}
                  style={[styles.perkChip, isPrimary ? styles.perkPrimary : styles.perkNeutral]}
                >
                  <Ionicons
                    name={perk.icon}
                    size={18}
                    color={
                      isPrimary
                        ? referTokens.ON_SECONDARY_CONTAINER
                        : referTokens.ON_TERTIARY_FIXED
                    }
                  />
                  <Text
                    style={[
                      styles.perkLabel,
                      isPrimary ? styles.perkLabelPrimary : styles.perkLabelNeutral,
                    ]}
                  >
                    {perk.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={styles.cardEyebrow}>{REFER_EARN_SCREEN.exclusiveLabel}</Text>
            <Text style={styles.cardTitle}>{REFER_EARN_SCREEN.shareCodeTitle}</Text>
          </View>

          <View style={styles.codeRow}>
            <View style={styles.codeBox}>
              <Text style={styles.codeText} numberOfLines={1}>
                {code}
            </Text>

              <Pressable
                style={styles.copyButton}
                onPress={copyCode}
                accessibilityRole="button"
                accessibilityLabel={copied ? REFER_EARN_SCREEN.copiedLabel : REFER_EARN_SCREEN.copyLabel}
                hitSlop={8}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copied ? referTokens.SUCCESS : referTokens.PRIMARY}
                />
                <Text style={[styles.copyLabel, copied && styles.copyLabelDone]}>
                  {copied ? REFER_EARN_SCREEN.copiedLabel : REFER_EARN_SCREEN.copyLabel}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              onPress={shareCode}
              accessibilityRole="button"
              accessibilityLabel={REFER_EARN_SCREEN.shareLabel}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={styles.shareLabel}>{REFER_EARN_SCREEN.shareLabel}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>{REFER_EARN_SCREEN.statusTitle}</Text>
            <View style={styles.earnedBadge}>
              <Text style={styles.earnedLabel}>{REFER_EARN_SCREEN.totalEarnedLabel}</Text>
            </View>
          </View>

          {history.map((item, index) => {
            const ui = statusUi(item.status);
            return (
              <Fragment key={item.id}>
                <View style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <View
                      style={[
                        styles.avatar,
                        index % 2 === 0 ? styles.avatarPrimary : styles.avatarSecondary,
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={22}
                        color={
                          index % 2 === 0
                            ? referTokens.ON_PRIMARY_FIXED
                            : referTokens.ON_SURFACE
                        }
                      />
                    </View>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyName}>{item.name}</Text>
                      <Text style={styles.historyDetail}>{item.detail}</Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={ui.amount}>{item.amountLabel}</Text>
                    <View style={[styles.statusBadge, ui.badge]}>
                      <Ionicons name={ui.icon} size={14} color={ui.color} />
                      <Text style={[styles.statusLabel, ui.label]}>
                        {REFERRAL_STATUS_LABEL[item.status]}
                      </Text>
                    </View>
                  </View>
                </View>
              </Fragment>
            );
          })}

          <Pressable
            style={styles.viewAllWrap}
            onPress={viewAllHistory}
            accessibilityRole="button"
            accessibilityLabel={REFER_EARN_SCREEN.viewAllLabel}
          >
            <Text style={styles.viewAllLabel}>{REFER_EARN_SCREEN.viewAllLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
