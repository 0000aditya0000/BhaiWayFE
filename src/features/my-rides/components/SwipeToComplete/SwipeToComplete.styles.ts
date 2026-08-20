import { StyleSheet } from 'react-native';

import { colors } from '@/shared/theme';

export const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E1E3E4',
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 64,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#434655',
    textAlign: 'center',
  },
  labelCompleted: {
    color: '#059669',
    opacity: 1,
  },
  handle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4B61C4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 2,
  },
  handleCompleted: {
    backgroundColor: '#10B981',
  },
});
