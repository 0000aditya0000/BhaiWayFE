import React, { useCallback } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { TRUSTED_CONTACTS_SCREEN } from '@/features/profile/constants';
import { useTrustedContacts } from '@/features/profile/hooks';
import { styles, trustedContactsTokens } from './TrustedContactsScreen.styles';

export const TrustedContactsScreen = () => {
  const router = useRouter();
  const {
    contacts,
    goBack,
    editContact,
    deleteContact,
    callContact,
    addContact,
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
      >
        <Text style={styles.subtitle}>{TRUSTED_CONTACTS_SCREEN.subtitle}</Text>

        <View style={styles.list}>
          {contacts.map((contact) => (
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
                    ]}
                    onPress={() => deleteContact(contact)}
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

              <Pressable
                style={styles.phoneRow}
                onPress={() => callContact(contact)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${contact.name}`}
              >
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={trustedContactsTokens.ON_SURFACE_VARIANT}
                />
                <Text style={styles.phoneLabel}>{contact.phoneLabel}</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [
              styles.emptyCard,
              pressed && {
                backgroundColor: trustedContactsTokens.SURFACE_LOWEST,
                borderColor: trustedContactsTokens.PRIMARY,
              },
            ]}
            onPress={addContact}
            accessibilityRole="button"
            accessibilityLabel={TRUSTED_CONTACTS_SCREEN.keepSafeLabel}
          >
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="person-add-outline"
                size={22}
                color={trustedContactsTokens.OUTLINE}
              />
            </View>
            <Text style={styles.emptyLabel}>{TRUSTED_CONTACTS_SCREEN.keepSafeLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.addButtonWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={addContact}
            accessibilityRole="button"
            accessibilityLabel={TRUSTED_CONTACTS_SCREEN.addContactLabel}
          >
            <Ionicons name="add" size={22} color={trustedContactsTokens.ON_PRIMARY_CONTAINER} />
            <Text style={styles.addLabel}>{TRUSTED_CONTACTS_SCREEN.addContactLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
