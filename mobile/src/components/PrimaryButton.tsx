import { Pressable, StyleSheet, Text } from 'react-native';
import { useSettingsState } from './AppState';
import { colors, MIN_TOUCH, radius } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  flex?: boolean;
  disabled?: boolean;
};

export default function PrimaryButton({ label, onPress, variant = 'primary', flex, disabled = false }: Props) {
  const { triggerHapticFeedback } = useSettingsState();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        onPress();
        triggerHapticFeedback();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        flex && { flex: 1 },
        pressed && { opacity: 0.8 },
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, { color: isPrimary ? colors.onPrimary : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: MIN_TOUCH, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface },
  disabled: { opacity: 0.6 },
  label: { fontSize: 16, fontWeight: '600' },
});
