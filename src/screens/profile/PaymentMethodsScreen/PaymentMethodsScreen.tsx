import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, Button, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { usePaymentMethods } from '@/features/profile/hooks';
import { paymentMethodsTokens, styles } from './PaymentMethodsScreen.styles';

export const PaymentMethodsScreen = () => {
  const {
    title,
    heroTitle,
    heroSubtitle,
    emptyTitle,
    emptySubtitle,
    addLabel,
    methods,
    loading,
    refreshing,
    error,
    deletingId,
    goBack,
    refresh,
    retry,
    addPaymentMethod,
    requestDelete,
    methodTitle,
    methodSubtitle,
  } = usePaymentMethods();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={paymentMethodsTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="card-outline" size={26} color={paymentMethodsTokens.PRIMARY} />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>{heroTitle}</Text>
              <Text style={styles.summarySubtitle}>{heroSubtitle}</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={paymentMethodsTokens.PRIMARY} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{error}</Text>
            <Button label="Retry" onPress={retry} accessibilityLabel="Retry" />
          </View>
        ) : methods.length === 0 ? (
          <View style={styles.methodCard}>
            <View style={styles.methodAccent} />
            <View style={styles.methodBody}>
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="add" size={20} color={paymentMethodsTokens.PRIMARY} />
                </View>
                <Text style={styles.emptyTitle}>{emptyTitle}</Text>
                <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
              </View>
              <Pressable
                style={styles.actionButton}
                onPress={addPaymentMethod}
                accessibilityRole="button"
                accessibilityLabel={addLabel}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{addLabel}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {methods.map((method) => {
              const active = method.isActive;
              return (
                <View
                  key={method.id}
                  style={[styles.methodCard, !active && { opacity: 0.62 }]}
                >
                  <View style={styles.methodAccent} />
                  <View style={styles.methodBody}>
                    <View style={styles.methodHeader}>
                      <View style={styles.methodIconWrap}>
                        <Ionicons
                          name={method.type === 'UPI' ? 'phone-portrait-outline' : 'business-outline'}
                          size={22}
                          color={paymentMethodsTokens.PRIMARY}
                        />
                      </View>
                      <View style={styles.methodHeaderText}>
                        <Text style={styles.methodTitle}>{methodTitle(method)}</Text>
                        <Text style={styles.methodSubtitle}>{methodSubtitle(method)}</Text>
                        {method.type === 'BANK_ACCOUNT' && method.ifscCode ? (
                          <Text style={styles.methodSubtitle}>IFSC: {method.ifscCode}</Text>
                        ) : null}
                      </View>
                      <View style={active ? styles.linkedBadge : styles.pendingBadge}>
                        <Text style={active ? styles.linkedBadgeText : styles.pendingBadgeText}>
                          {active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      style={[styles.actionButton, styles.actionButtonSecondary]}
                      onPress={() => requestDelete(method)}
                      disabled={deletingId === method.id}
                      accessibilityRole="button"
                      accessibilityLabel="Remove payment method"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={paymentMethodsTokens.PRIMARY}
                      />
                      <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                        {deletingId === method.id ? 'Removing…' : 'Remove'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <Pressable
              style={styles.actionButton}
              onPress={addPaymentMethod}
              accessibilityRole="button"
              accessibilityLabel={addLabel}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{addLabel}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <AppFooter />
    </SafeAreaView>
  );
};
