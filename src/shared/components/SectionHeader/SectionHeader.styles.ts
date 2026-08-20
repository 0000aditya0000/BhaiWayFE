import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    width: 4,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#374BB1',
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    color: '#191C1D',
    flexShrink: 1,
  },
});
