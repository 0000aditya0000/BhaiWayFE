import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';
import { styles } from './DashedUploadCard.styles';
import type { DashedUploadCardProps } from './DashedUploadCard.types';
import { AppText as Text } from '../AppText';

export const DashedUploadCard = React.memo(
  ({
    status = 'idle',
    title,
    subtitle,
    uploadingLabel = 'Processing...',
    uploadedLabel = 'Uploaded Successfully',
    uploadedMeta,
    onPress,
    disabled = false,
    style,
    idleIcon,
  }: DashedUploadCardProps) => (
    <Pressable
      style={[styles.card, status === 'uploaded' && styles.cardSuccess, style]}
      onPress={onPress}
      disabled={disabled || status === 'uploading'}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || status === 'uploading', busy: status === 'uploading' }}
    >
      {status === 'uploading' ? (
        <>
          <ActivityIndicator size="large" color="#374BB1" />
          <Text style={styles.title}>{uploadingLabel}</Text>
        </>
      ) : status === 'uploaded' ? (
        <>
          <Ionicons name="checkmark-circle" size={52} color="#2E7D32" />
          <Text style={styles.successTitle}>{uploadedLabel}</Text>
          {uploadedMeta ? <Text style={styles.meta}>{uploadedMeta}</Text> : null}
        </>
      ) : (
        <>
          {idleIcon ?? (
            <View style={styles.iconCircle}>
              <Ionicons name="camera" size={28} color={colors.white} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </>
      )}
    </Pressable>
  ),
);

DashedUploadCard.displayName = 'DashedUploadCard';
