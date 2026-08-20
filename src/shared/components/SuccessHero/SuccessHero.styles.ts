import { StyleSheet } from 'react-native';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  iconWrap: {
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(55, 75, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(55, 75, 177, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#374BB1',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({
      color: '#374BB1',
      opacity: 0.28,
      radius: 16,
      offsetY: 6,
      elevation: 8,
    }),
  },
  title: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#374BB1',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#434655',
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 32,
  },
});
