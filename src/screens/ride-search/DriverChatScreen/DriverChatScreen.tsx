import React, { useCallback } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  Avatar,
  IconButton,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { DRIVER_CHAT_SCREEN } from '@/features/ride-search/constants';
import { useDriverChat } from '@/features/ride-search/hooks';
import type { ChatMessage } from '@/features/ride-search/types';
import { styles } from './DriverChatScreen.styles';

const MessageBubble = ({
  item,
  selfSender,
}: {
  item: ChatMessage;
  selfSender: 'user' | 'driver';
}) => {
  const isSelf = item.sender === selfSender;

  return (
    <View style={isSelf ? styles.messageBlockRight : styles.messageBlockLeft}>
      <View style={isSelf ? styles.bubbleRight : styles.bubbleLeft}>
        <Text style={isSelf ? styles.messageTextRight : styles.messageTextLeft}>{item.text}</Text>
      </View>
      {isSelf ? (
        <View style={styles.metaRight}>
          <Text style={styles.metaRightText}>{item.timeLabel}</Text>
          <Ionicons
            name={item.status === 'read' ? 'checkmark-done' : 'checkmark'}
            size={14}
            color="#374BB1"
          />
        </View>
      ) : (
        <Text style={styles.metaLeft}>{item.timeLabel}</Text>
      )}
    </View>
  );
};

export const DriverChatScreen = () => {
  const params = useLocalSearchParams<{
    driverName?: string;
    carModel?: string;
    threadId?: string;
    perspective?: string;
    routeLabel?: string;
    tripTimeLabel?: string;
    avatarUri?: string;
  }>();

  const perspectiveParam = getSearchParam(params.perspective);
  const {
    profile,
    messages,
    draft,
    quickReplies,
    listRef,
    perspective,
    selfSender,
    callLabel,
    setDraft,
    sendMessage,
    goBack,
    callDriver,
    openMore,
    attachFile,
  } = useDriverChat({
    driverName: getSearchParam(params.driverName),
    carModel: getSearchParam(params.carModel),
    threadId: getSearchParam(params.threadId),
    perspective: perspectiveParam === 'driver' ? 'driver' : 'rider',
    routeLabel: getSearchParam(params.routeLabel),
    tripTimeLabel: getSearchParam(params.tripTimeLabel),
    avatarUri: getSearchParam(params.avatarUri),
  });

  const isDriverView = perspective === 'driver';
  const hasDraft = draft.trim().length > 0;

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleSend = useCallback(() => {
    triggerLightHaptic();
    sendMessage();
  }, [sendMessage]);

  const handleQuickReply = useCallback(
    (text: string) => {
      triggerLightHaptic();
      sendMessage(text);
    },
    [sendMessage],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubble item={item} selfSender={selfSender} />
    ),
    [selfSender],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={colors.primary}
            accessibilityLabel="Go back"
          />
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <Avatar
                size={40}
                uri={profile.avatarUri}
                accessibilityLabel={`${profile.name} photo`}
              />
            </View>
            <View style={{ flexShrink: 1 }}>
              <View style={styles.peerNameRow}>
                <Text style={styles.peerName} numberOfLines={1}>
                  {profile.name}
                </Text>
                {profile.verified ? (
                  <Ionicons name="checkmark-circle" size={16} color="#4B61C4" />
                ) : null}
              </View>
              {isDriverView ? (
                <Text style={styles.roleLabel}>
                  {profile.roleLabel || DRIVER_CHAT_SCREEN.riderRoleLabel}
                </Text>
              ) : (
                <View style={styles.statusRow}>
                  <Text style={styles.onlineLabel}>{DRIVER_CHAT_SCREEN.onlineLabel}</Text>
                  <Text style={styles.vehicleLabel}>• {profile.vehicleLabel}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="call-outline"
            onPress={callDriver}
            color="#434655"
            accessibilityLabel={callLabel}
          />
          <IconButton
            icon="ellipsis-vertical"
            onPress={openMore}
            color="#434655"
            accessibilityLabel="More options"
          />
        </View>
      </View>

      {profile.routeLabel ? (
        <View style={styles.tripBanner}>
          <View style={styles.tripBannerLeft}>
            <Ionicons name="navigate-outline" size={18} color="#374BB1" />
            <Text style={styles.tripRoute} numberOfLines={1}>
              {profile.routeLabel}
            </Text>
          </View>
          {profile.tripTimeLabel ? (
            <Text style={styles.tripTime}>{profile.tripTimeLabel}</Text>
          ) : null}
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.dayChipWrap}>
            <View style={styles.dayChip}>
              <Text style={styles.dayChipText}>{DRIVER_CHAT_SCREEN.todayLabel}</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
      />

      <View style={styles.quickWrap}>
        <View style={styles.quickRow}>
          {quickReplies.map((reply) => (
            <Pressable
              key={reply}
              style={({ pressed }) => [
                styles.quickChip,
                pressed && { backgroundColor: 'rgba(55, 75, 177, 0.05)', transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => handleQuickReply(reply)}
              accessibilityRole="button"
              accessibilityLabel={reply}
            >
              <Text style={styles.quickLabel}>{reply}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.composer}>
        <View style={styles.inputRow}>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && { transform: [{ scale: 0.9 }] }]}
            onPress={attachFile}
            accessibilityRole="button"
            accessibilityLabel="Attach file"
          >
            <Ionicons name="add" size={22} color="#434655" />
          </Pressable>
          <View style={styles.inputShell}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={DRIVER_CHAT_SCREEN.inputPlaceholder}
              placeholderTextColor="rgba(67,70,85,0.5)"
              returnKeyType="send"
              onSubmitEditing={handleSend}
              accessibilityLabel="Message input"
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              hasDraft && styles.sendButtonActive,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
            onPress={handleSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <AppFooter activeTab={isDriverView ? 'rides' : 'inbox'} />
    </SafeAreaView>
  );
};
