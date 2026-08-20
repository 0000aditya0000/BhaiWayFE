import React, { useCallback } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { InboxThreadCard } from '@/features/inbox/components';
import { INBOX_SCREEN } from '@/features/inbox/constants';
import { useInbox } from '@/features/inbox/hooks';
import type { InboxThread } from '@/features/inbox/types';
import { styles } from './InboxScreen.styles';

export const InboxScreen = () => {
  const {
    subtitle,
    emptyMessage,
    threads,
    openThread,
    openNotifications,
    mode,
  } = useInbox();

  const handleOpenThread = useCallback(
    (thread: InboxThread) => {
      triggerLightHaptic();
      openThread(thread);
    },
    [openThread],
  );

  const renderItem = useCallback(
    ({ item }: { item: InboxThread }) => (
      <InboxThreadCard thread={item} onPress={handleOpenThread} />
    ),
    [handleOpenThread],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{INBOX_SCREEN.title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="notifications-outline"
            onPress={openNotifications}
            color={colors.primary}
            accessibilityLabel="Open notifications"
          />
        </View>
      </View>

      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          threads.length === 0 && styles.listEmptyContent,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={mode === 'driving' ? 'people-outline' : 'car-outline'}
                size={28}
                color="#374BB1"
              />
            </View>
            <Text style={styles.emptyTitle}>{INBOX_SCREEN.emptyTitle}</Text>
            <Text style={styles.emptyMessage}>{emptyMessage}</Text>
          </View>
        }
      />

      <AppFooter activeTab="inbox" />
    </SafeAreaView>
  );
};
