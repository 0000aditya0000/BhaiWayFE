import { StyleSheet } from 'react-native';

import { colors } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    height: 48,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    zIndex: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  metrics: {
    width: '100%',
    gap: 16,
    marginBottom: 8,
  },
  metricCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.5)',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...createShadow({ color: colors.shadow, opacity: 0.05, radius: 12, offsetY: 4, elevation: 3 }),
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#585E72',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: '#374BB1',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374BB1',
  },
  statusValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#374BB1',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(51, 94, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: '#374BB1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    ...createShadow({ color: '#374BB1', opacity: 0.25, radius: 12, offsetY: 6, elevation: 6 }),
  },
  ctaLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.white,
    textTransform: 'uppercase',
  },
});
