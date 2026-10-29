import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
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
import { CHAT_SCREEN, useConversationChat } from '@/features/chat';
import type { ChatUiMessage } from '@/features/chat';
import { styles } from './DriverChatScreen.styles';

const MessageBubble = ({
  item,
  onRetry,
}: {
  item: ChatUiMessage;
  onRetry: (message: ChatUiMessage) => void;
}) => {
  const isSelf = item.isMine;

  return (
    <Pressable
      onPress={() => {
        if (item.localStatus === 'failed') {
          onRetry(item);
        }
      }}
      disabled={item.localStatus !== 'failed'}
      style={isSelf ? styles.messageBlockRight : styles.messageBlockLeft}
    >
      <View style={isSelf ? styles.bubbleRight : styles.bubbleLeft}>
        <Text style={isSelf ? styles.messageTextRight : styles.messageTextLeft}>{item.text}</Text>
      </View>
      {isSelf ? (
        <View style={styles.metaRight}>
          <Text style={styles.metaRightText}>
            {item.localStatus === 'failed'
              ? 'Failed · tap to retry'
              : item.localStatus === 'pending'
                ? 'Sending…'
                : item.timeLabel}
          </Text>
          {item.localStatus === 'sent' || item.localStatus === 'read' ? (
            <Ionicons
              name={item.localStatus === 'read' ? 'checkmark-done' : 'checkmark'}
              size={14}
              color="#374BB1"
            />
          ) : null}
        </View>
      ) : (
        <Text style={styles.metaLeft}>{item.timeLabel}</Text>
      )}
    </Pressable>
  );
};

export const DriverChatScreen = () => {
  const params = useLocalSearchParams<{
    conversationId?: string;
    bookingId?: string;
    driverName?: string;
    carModel?: string;
    threadId?: string;
    perspective?: string;
    routeLabel?: string;
    tripTimeLabel?: string;
    avatarUri?: string;
  }>();

  const perspectiveParam = getSearchParam(params.perspective);
  const conversationId =
    getSearchParam(params.conversationId) || getSearchParam(params.threadId);
  const bookingId = getSearchParam(params.bookingId);

  const {
    loading,
    errorMessage,
    isClosed,
    peerName,
    peerSubtitle,
    routeLabel,
    tripTimeLabel,
    avatarUri,
    messages,
    draft,
    quickReplies,
    listRef,
    perspective,
    peerTyping,
    loadingOlder,
    hasMoreOlder,
    setDraft,
    sendMessage,
    retryFailedMessage,
    loadOlderMessages,
    onMessagesScroll,
    goBack,
    canCallPeer,
    callPeer,
  } = useConversationChat({
    conversationId,
    bookingId,
    peerName: getSearchParam(params.driverName),
    peerSubtitle: getSearchParam(params.carModel),
    routeLabel: getSearchParam(params.routeLabel),
    tripTimeLabel: getSearchParam(params.tripTimeLabel),
    avatarUri: getSearchParam(params.avatarUri),
    perspective: perspectiveParam === 'driver' ? 'driver' : 'rider',
  });

  const isDriverView = perspective === 'driver';
  const hasDraft = draft.trim().length > 0;
  const canCompose = !isClosed && !loading && !errorMessage;

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleCall = useCallback(() => {
    triggerLightHaptic();
    callPeer();
  }, [callPeer]);

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
    ({ item }: { item: ChatUiMessage }) => (
      <MessageBubble item={item} onRetry={retryFailedMessage} />
    ),
    [retryFailedMessage],
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
              <Avatar size={40} uri={avatarUri} accessibilityLabel={`${peerName} photo`} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <View style={styles.peerNameRow}>
                <Text style={styles.peerName} numberOfLines={1}>
                  {peerName}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.roleLabel} numberOfLines={1}>
                  {peerTyping ? CHAT_SCREEN.peerTyping : peerSubtitle}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="call-outline"
            onPress={handleCall}
            color={canCallPeer ? colors.primary : '#9AA0B4'}
            accessibilityLabel={isDriverView ? 'Call passenger' : 'Call driver'}
          />
        </View>
      </View>

      {routeLabel ? (
        <View style={styles.tripBanner}>
          <View style={styles.tripBannerLeft}>
            <Ionicons name="navigate-outline" size={18} color="#374BB1" />
            <Text style={styles.tripRoute} numberOfLines={1}>
              {routeLabel}
            </Text>
          </View>
          {tripTimeLabel ? <Text style={styles.tripTime}>{tripTimeLabel}</Text> : null}
        </View>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.metaLeft}>{CHAT_SCREEN.loading}</Text>
        </View>
      ) : errorMessage && messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={styles.peerName}>{CHAT_SCREEN.unavailableTitle}</Text>
          <Text style={[styles.metaLeft, { textAlign: 'center', marginTop: 8 }]}>
            {errorMessage}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            hasMoreOlder ? (
              <Pressable
                onPress={loadOlderMessages}
                disabled={loadingOlder}
                style={styles.dayChipWrap}
              >
                <View style={styles.dayChip}>
                  <Text style={styles.dayChipText}>
                    {loadingOlder ? CHAT_SCREEN.loadingOlder : CHAT_SCREEN.loadOlder}
                  </Text>
                </View>
              </Pressable>
            ) : messages.length === 0 ? (
              <View style={styles.dayChipWrap}>
                <View style={styles.dayChip}>
                  <Text style={styles.dayChipText}>{CHAT_SCREEN.emptyMessages}</Text>
                </View>
              </View>
            ) : null
          }
          extraData={messages.length}
          onScroll={onMessagesScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {isClosed ? (
        <View style={styles.tripBanner}>
          <Text style={styles.tripRoute}>{CHAT_SCREEN.closedBanner}</Text>
        </View>
      ) : null}

      {canCompose ? (
        <>
          <View style={styles.quickWrap}>
            <View style={styles.quickRow}>
              {quickReplies.map((reply: string) => (
                <Pressable
                  key={reply}
                  style={({ pressed }) => [
                    styles.quickChip,
                    pressed && {
                      backgroundColor: 'rgba(55, 75, 177, 0.05)',
                      transform: [{ scale: 0.97 }],
                    },
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
              <View style={[styles.inputShell, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={CHAT_SCREEN.inputPlaceholder}
                  placeholderTextColor="rgba(67,70,85,0.5)"
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  maxLength={CHAT_SCREEN.maxLength}
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
        </>
      ) : null}

      <AppFooter activeTab={isDriverView ? 'rides' : 'inbox'} />
    </SafeAreaView>
  );
};
