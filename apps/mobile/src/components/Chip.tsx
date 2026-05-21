import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../lib/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
}

export const Chip = ({ label, active, onPress }: Props) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  label: { color: colors.fg, fontSize: 13, fontWeight: '500' },
  labelActive: { color: colors.brandFg, fontWeight: '700' },
});
