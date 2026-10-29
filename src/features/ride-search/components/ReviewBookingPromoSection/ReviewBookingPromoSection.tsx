import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { colors } from '@/shared/theme';

import { formatBookingAmount, REVIEW_BOOKING_SCREEN } from '../../constants';
import { styles } from './ReviewBookingPromoSection.styles';

export interface ReviewBookingPromoSectionProps {
  value: string;
  applied: boolean;
  applying?: boolean;
  discount: number;
  error?: string | null;
  onChange: (value: string) => void;
  onApply: () => void;
  onClear?: () => void;
  onViewAvailableCoupons?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const ReviewBookingPromoSection = React.memo(
  ({
    value,
    applied,
    applying = false,
    discount,
    error,
    onChange,
    onApply,
    onClear,
    onViewAvailableCoupons,
    onFocus,
    onBlur,
  }: ReviewBookingPromoSectionProps) => (
    <View style={styles.card}>
      <Text style={styles.title}>{REVIEW_BOOKING_SCREEN.promoTitle}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={REVIEW_BOOKING_SCREEN.promoPlaceholder}
          placeholderTextColor={colors.textPlaceholder}
          autoCapitalize="characters"
          editable={!applying}
          accessibilityLabel="Promo code input"
        />
        <Pressable
          style={[styles.applyButton, applying ? styles.applyButtonDisabled : null]}
          onPress={onApply}
          disabled={applying}
          accessibilityRole="button"
          accessibilityLabel="Apply promo code"
          android_ripple={{ color: 'rgba(255, 255, 255, 0.25)' }}
        >
          {applying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.applyLabel}>{REVIEW_BOOKING_SCREEN.applyLabel}</Text>
          )}
        </Pressable>
      </View>
      {onViewAvailableCoupons ? (
        <Pressable
          style={styles.viewAvailableRow}
          onPress={onViewAvailableCoupons}
          disabled={applying}
          accessibilityRole="button"
          accessibilityLabel="View available coupons"
        >
          <Ionicons name="ticket-outline" size={18} color={colors.primary} />
          <Text style={styles.viewAvailableLink}>View Available Coupons</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {applied ? (
        <View style={styles.successRow}>
          <View style={styles.successLeft}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.successText}>
              {value
                ? discount > 0
                  ? `Promo code ${value} applied successfully!`
                  : `Promo code ${value} applied`
                : REVIEW_BOOKING_SCREEN.promoSuccess}
            </Text>
          </View>
          <View style={styles.successRight}>
            {discount > 0 ? (
              <Text style={styles.discount}>- {formatBookingAmount(discount)}</Text>
            ) : null}
            {onClear ? (
              <Pressable
                onPress={onClear}
                accessibilityRole="button"
                accessibilityLabel="Remove promo code"
              >
                <Text style={styles.clearLabel}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  ),
);

ReviewBookingPromoSection.displayName = 'ReviewBookingPromoSection';
