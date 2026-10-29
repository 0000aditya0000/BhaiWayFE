import React from 'react';
import { View } from 'react-native';

import { AppText as Text, AppTextInput as TextInput } from '@/shared/components';

import { RATING_COMMENT_MAX_LENGTH } from '../../constants/rating-task.constants';
import { styles } from './RatingCommentInput.styles';

export interface RatingCommentInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export const RatingCommentInput = ({
  value,
  onChange,
  label = 'Add a comment (optional)',
  placeholder = 'Share your experience...',
  maxLength = RATING_COMMENT_MAX_LENGTH,
  disabled = false,
}: RatingCommentInputProps) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="rgba(67, 70, 85, 0.5)"
      multiline
      numberOfLines={4}
      maxLength={maxLength}
      editable={!disabled}
      textAlignVertical="top"
      accessibilityLabel={label}
    />
    <Text style={styles.counter}>
      {value.length}/{maxLength}
    </Text>
  </View>
);
