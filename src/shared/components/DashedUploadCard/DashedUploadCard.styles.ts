import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#F3F4F5',
    borderWidth: 2,
    borderColor: '#374BB1',
    borderStyle: 'dashed',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardSuccess: {
    borderStyle: 'solid',
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(46, 125, 50, 0.06)',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4B61C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    color: '#374BB1',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#434655',
    textAlign: 'center',
    maxWidth: 280,
  },
  successTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
  meta: {
    fontSize: 16,
    lineHeight: 24,
    color: '#434655',
    textAlign: 'center',
  },
});
