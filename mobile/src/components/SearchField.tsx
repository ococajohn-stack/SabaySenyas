import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

type Props = TextInputProps & { label: string };

export default function SearchField({ label, style, ...props }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.placeholder,
  },
  input: { flex: 1, color: colors.text, fontSize: 16 },
});
