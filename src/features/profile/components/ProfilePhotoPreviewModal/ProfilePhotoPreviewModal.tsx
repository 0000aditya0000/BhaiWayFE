import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText as Text } from '@/shared/components';

export interface ProfilePhotoPreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  name: string;
  onClose: () => void;
}

export const ProfilePhotoPreviewModal = ({
  visible,
  imageUri,
  name,
  onClose,
}: ProfilePhotoPreviewModalProps) => {
  if (!imageUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close photo preview"
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>

          <View style={styles.imageWrap}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              accessibilityLabel={`${name} profile photo enlarged`}
            />
          </View>

          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    maxHeight: 420,
    borderRadius: 20,
  },
  name: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
});
