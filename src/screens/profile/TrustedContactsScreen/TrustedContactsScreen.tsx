import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { AppFooter, Button, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { TRUSTED_CONTACTS_SCREEN } from '@/features/profile/constants';
import { useTrustedContacts } from '@/features/profile/hooks';
import { styles, trustedContactsTokens } from './TrustedContactsScreen.styles';

export const TrustedContactsScreen = () => {
  const router = useRouter();
  const {
    contacts,
    loading,
    refreshing,
    error,
    deletingId,
    emptyTitle,
    emptySubtitle,
    addLabel,
    goBack,
    editContact,
    deleteContact,
    addContact,
    refresh,
    retry,
  } = useTrustedContacts();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleNotifications = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.notifications);
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={trustedContactsTokens.PRIMARY}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {TRUSTED_CONTACTS_SCREEN.title}
        </Text>

        <IconButton
          icon="notifications-outline"
          onPress={handleNotifications}
          color={trustedContactsTokens.PRIMARY}
          accessibilityLabel="Notifications"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
      >
        <Text style={styles.subtitle}>{TRUSTED_CONTACTS_SCREEN.subtitle}</Text>

        {loading && !refreshing ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <ActivityIndicator color={trustedContactsTokens.PRIMARY} />
            <Text style={styles.contactRelation}>{TRUSTED_CONTACTS_SCREEN.loadingLabel}</Text>
          </View>
        ) : error && contacts.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 16 }}>
            <Text style={styles.contactRelation}>{error}</Text>
            <Button
              label={TRUSTED_CONTACTS_SCREEN.retryLabel}
              onPress={retry}
              accessibilityLabel={TRUSTED_CONTACTS_SCREEN.retryLabel}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {contacts.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons
                    name="person-add-outline"
                    size={22}
                    color={trustedContactsTokens.OUTLINE}
                  />
                </View>
                <Text style={styles.emptyLabel}>{emptyTitle}</Text>
                <Text style={[styles.contactRelation, { textAlign: 'center', marginTop: 8 }]}>
                  {emptySubtitle}
                </Text>
              </View>
            ) : (
              contacts.map((contact) => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactTop}>
                    <View style={styles.contactIdentity}>
                      {contact.avatarUri ? (
                        <Image
                          source={{ uri: contact.avatarUri }}
                          style={styles.contactAvatar}
                          accessibilityIgnoresInvertColors
                          accessibilityLabel={contact.name}
                        />
                      ) : (
                        <View style={styles.contactInitials}>
                          <Text style={styles.initialsText}>
                            {contact.initials ?? contact.name.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactRelation}>{contact.relation}</Text>
                        <Text style={styles.phoneLabel}>{contact.phoneLabel}</Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.iconButton,
                          pressed && { backgroundColor: trustedContactsTokens.SURFACE_LOW },
                        ]}
                        onPress={() => editContact(contact)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${contact.name}`}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color={trustedContactsTokens.SECONDARY}
                        />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.iconButton,
                          pressed && {
                            backgroundColor: trustedContactsTokens.ERROR_CONTAINER,
                          },
                          deletingId === contact.id && { opacity: 0.5 },
                        ]}
                        onPress={() => deleteContact(contact)}
                        disabled={deletingId === contact.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${contact.name}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={trustedContactsTokens.SECONDARY}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.addButtonWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={addContact}
            accessibilityRole="button"
            accessibilityLabel={addLabel}
          >
            <Ionicons name="add" size={22} color={trustedContactsTokens.ON_PRIMARY_CONTAINER} />
            <Text style={styles.addLabel}>{addLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
