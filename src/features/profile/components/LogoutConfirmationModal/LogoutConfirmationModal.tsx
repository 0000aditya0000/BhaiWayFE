import React from 'react';
import { Image, Modal, Pressable, View } from 'react-native';

import { PROFILE_SCREEN } from '../../constants';
import { styles } from './LogoutConfirmationModal.styles';
import type { LogoutConfirmationModalProps } from './LogoutConfirmationModal.types';
import { AppText as Text } from '@/shared/components';

const logoSource = require('../../../../../assets/icon.png');

export const LogoutConfirmationModal = ({
  visible,
  onConfirm,
  onCancel,
}: LogoutConfirmationModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
    statusBarTranslucent
  >
    <Pressable
      style={styles.overlay}
      onPress={onCancel}
      accessibilityRole="button"
      accessibilityLabel="Dismiss logout confirmation"
    >
      <Pressable
        style={styles.card}
        onPress={(event) => event.stopPropagation()}
        accessibilityRole="none"
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Image
              source={logoSource}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="BhaiWay logo"
              accessibilityIgnoresInvertColors
            />
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title} accessibilityRole="header">
            {PROFILE_SCREEN.logOutTitle}
          </Text>
          <Text style={styles.message}>{PROFILE_SCREEN.logOutMessage}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel={PROFILE_SCREEN.logOutConfirm}
          >
            <Text style={styles.confirmLabel}>{PROFILE_SCREEN.logOutConfirm}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && {
                opacity: 0.9,
                transform: [{ scale: 0.97 }],
                backgroundColor: '#F3F4F5',
              },
            ]}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={PROFILE_SCREEN.logOutCancel}
          >
            <Text style={styles.cancelLabel}>{PROFILE_SCREEN.logOutCancel}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);
