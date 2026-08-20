import type { ReactNode } from 'react';

import { APP_CONFIG } from '@/config/constants';
import { colors, typography } from '@/shared/theme';
import { AppTopBar } from '../AppTopBar/AppTopBar';
import { IconButton } from '../IconButton/IconButton';
import { AppText as Text } from '../AppText';

export interface BrandTopBarProps {
  onMenuPress: () => void;
  right: ReactNode;
}

export const BrandTopBar = ({ onMenuPress, right }: BrandTopBarProps) => (
  <AppTopBar
    left={
      <IconButton
        icon="arrow-back"
        onPress={onMenuPress}
        size={26}
        color={colors.primary}
        accessibilityLabel="Go back"
      />
    }
    center={
      <Text
        style={[
          typography.title,
          { color: colors.primary, textAlign: 'center', width: '100%' },
        ]}
        accessibilityRole="header"
      >
        {APP_CONFIG.name}
      </Text>
    }
    right={right}
  />
);
