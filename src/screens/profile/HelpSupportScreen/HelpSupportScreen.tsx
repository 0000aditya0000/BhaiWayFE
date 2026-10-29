import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { HELP_SUPPORT_SCREEN } from '@/features/support/constants';
import { useHelpSupportHome } from '@/features/support/hooks';
import {
  formatSupportDateTime,
  formatSupportStatusLabel,
} from '@/features/support/utils';
import { helpTokens, styles } from './HelpSupportScreen.styles';

const statusStyles = (status: string) => {
  const key = status.trim().toUpperCase();
  if (key === 'RESOLVED') {
    return {
      badge: styles.statusResolved,
      label: styles.statusLabelResolved,
    };
  }
  return {
    badge: styles.statusProgress,
    label: styles.statusLabelProgress,
  };
};

export const HelpSupportScreen = () => {
  const {
    query,
    setQuery,
    categories,
    recentTickets,
    loadingRecent,
    recentError,
    goBack,
    openCategory,
    openTicket,
    viewAllTickets,
    raiseTicket,
    emailSupport,
    retryRecent,
  } = useHelpSupportHome();

  const handleGoBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleGoBack}
          color={helpTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {HELP_SUPPORT_SCREEN.title}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchWrap}>
          <Ionicons
            name="search"
            size={22}
            color={helpTokens.OUTLINE}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={HELP_SUPPORT_SCREEN.searchPlaceholder}
            placeholderTextColor={helpTokens.OUTLINE}
            returnKeyType="search"
            accessibilityLabel={HELP_SUPPORT_SCREEN.searchPlaceholder}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{HELP_SUPPORT_SCREEN.categoriesHeading}</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                style={({ pressed }) => [
                  styles.categoryCard,
                  pressed && { borderColor: helpTokens.PRIMARY },
                ]}
                onPress={() => openCategory(category.id)}
                accessibilityRole="button"
                accessibilityLabel={`${category.title}. ${category.subtitle}`}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon} size={22} color={helpTokens.PRIMARY} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
              </Pressable>
            ))}
            {categories.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No categories match your search.</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{HELP_SUPPORT_SCREEN.recentHeading}</Text>
            <Pressable
              onPress={viewAllTickets}
              accessibilityRole="button"
              accessibilityLabel={HELP_SUPPORT_SCREEN.viewAllLabel}
              hitSlop={8}
            >
              <Text style={styles.viewAll}>{HELP_SUPPORT_SCREEN.viewAllLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.ticketsList}>
            {loadingRecent ? (
              <ActivityIndicator color={helpTokens.PRIMARY} />
            ) : recentError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{recentError}</Text>
                <Pressable onPress={retryRecent} accessibilityRole="button">
                  <Text style={styles.viewAll}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              recentTickets.map((ticket) => {
                const statusStyle = statusStyles(String(ticket.status));
                return (
                  <Pressable
                    key={ticket.id}
                    style={({ pressed }) => [
                      styles.ticketCard,
                      pressed && { transform: [{ scale: 1.01 }] },
                    ]}
                    onPress={() => openTicket(ticket.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${ticket.reference}. ${formatSupportStatusLabel(String(ticket.status))}`}
                  >
                    <View style={styles.ticketLeft}>
                      <View style={styles.ticketIcon}>
                        <Ionicons
                          name="ticket-outline"
                          size={22}
                          color={helpTokens.SECONDARY}
                        />
                      </View>
                      <View style={styles.ticketMeta}>
                        <Text style={styles.ticketTitle} numberOfLines={1}>
                          {ticket.reference}
                        </Text>
                        <Text style={styles.ticketDate} numberOfLines={1}>
                          {ticket.subject || formatSupportDateTime(ticket.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, statusStyle.badge]}>
                      <Text style={[styles.statusLabel, statusStyle.label]}>
                        {formatSupportStatusLabel(String(ticket.status))}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
            {!loadingRecent && !recentError && recentTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{HELP_SUPPORT_SCREEN.emptyRecent}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.contactActions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryActionButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
            onPress={raiseTicket}
            accessibilityRole="button"
            accessibilityLabel={HELP_SUPPORT_SCREEN.raiseTicketLabel}
          >
            <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.primaryActionLabel}>{HELP_SUPPORT_SCREEN.raiseTicketLabel}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.emailButton,
              pressed && { backgroundColor: 'rgba(88, 94, 114, 0.05)', transform: [{ scale: 0.97 }] },
            ]}
            onPress={emailSupport}
            accessibilityRole="button"
            accessibilityLabel={HELP_SUPPORT_SCREEN.emailLabel}
          >
            <Ionicons name="mail-outline" size={22} color={helpTokens.SECONDARY} />
            <Text style={styles.emailLabel}>{HELP_SUPPORT_SCREEN.emailLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
