import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CouponDto } from '../api/coupons.types';
import { formatCouponBenefitHeadline } from '../constants/available-coupons.constants';
import { AppText as Text } from '@/shared/components';

import { couponTicketStyles as styles, couponTicketTokens } from './CouponTicketCard.styles';

export interface CouponTicketChip {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}

export interface CouponTicketCardProps {
  coupon: CouponDto;
  chips: CouponTicketChip[];
  badge?: { label: string; tone: 'applied' | 'inactive' };
  ctaLabel: string;
  ctaBusy?: boolean;
  ctaDisabled?: boolean;
  ctaVariant?: 'apply' | 'copy' | 'applied';
  ctaIcon?: React.ComponentProps<typeof Ionicons>['name'];
  descriptionLines?: number;
  onPressCta: () => void;
  accessibilityLabel: string;
}

export const CouponTicketCard = React.memo(
  ({
    coupon,
    chips,
    badge,
    ctaLabel,
    ctaBusy = false,
    ctaDisabled = false,
    ctaVariant = 'apply',
    ctaIcon,
    descriptionLines = 2,
    onPressCta,
    accessibilityLabel,
  }: CouponTicketCardProps) => {
    const headline = formatCouponBenefitHeadline(coupon);
    const isApplied = ctaVariant === 'applied' || badge?.tone === 'applied';
    const isInactive = badge?.tone === 'inactive' || !coupon.isActive;
    const isCopied = ctaVariant === 'copy' && Boolean(ctaIcon === 'checkmark');

    return (
      <View
        style={[
          styles.ticket,
          isApplied && styles.ticketApplied,
          isInactive && !isApplied && styles.ticketInactive,
        ]}
      >
        <View style={styles.ticketInner}>
          <View
            style={[
              styles.accentRail,
              isApplied && styles.accentRailApplied,
              isInactive && !isApplied && styles.accentRailInactive,
            ]}
          />
          <View style={styles.ticketBody}>
            <View style={styles.ticketTop}>
              <Text style={styles.headline}>{headline}</Text>
              {badge ? (
                <View
                  style={
                    badge.tone === 'applied' ? styles.appliedBadge : styles.inactiveBadge
                  }
                >
                  <Text
                    style={
                      badge.tone === 'applied'
                        ? styles.appliedBadgeLabel
                        : styles.inactiveBadgeLabel
                    }
                  >
                    {badge.label}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.title}>{coupon.title}</Text>
            {coupon.description ? (
              <Text style={styles.description} numberOfLines={descriptionLines}>
                {coupon.description}
              </Text>
            ) : null}
            {chips.length > 0 ? (
              <View style={styles.metaRow}>
                {chips.map((chip) => (
                  <View key={`${chip.icon}-${chip.label}`} style={styles.metaChip}>
                    <Ionicons
                      name={chip.icon}
                      size={12}
                      color={couponTicketTokens.OUTLINE}
                    />
                    <Text style={styles.metaChipLabel}>{chip.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.perforated}>
          <View style={styles.notchLeft} />
          <View style={styles.dashLine} />
          <View style={styles.notchRight} />
        </View>

        <View style={styles.ticketFooter}>
          <View style={styles.codeBox}>
            <Text style={styles.codeBoxLabel}>{coupon.code}</Text>
          </View>
          <Pressable
            style={[
              styles.applyButton,
              (ctaBusy || ctaDisabled) && styles.applyButtonDisabled,
              isApplied && styles.applyButtonApplied,
              isCopied && styles.applyButtonCopied,
            ]}
            disabled={ctaBusy || ctaDisabled}
            onPress={onPressCta}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
          >
            {ctaBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                {ctaIcon ? (
                  <Ionicons
                    name={ctaIcon}
                    size={16}
                    color={
                      isCopied
                        ? couponTicketTokens.PRIMARY
                        : isApplied
                          ? couponTicketTokens.SUCCESS_TEXT
                          : '#FFFFFF'
                    }
                  />
                ) : null}
                <Text
                  style={[
                    styles.applyLabel,
                    isApplied && styles.applyLabelApplied,
                    isCopied && styles.copyLabelCopied,
                  ]}
                >
                  {ctaLabel}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  },
);

CouponTicketCard.displayName = 'CouponTicketCard';
