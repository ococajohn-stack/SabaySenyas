import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSettingsState } from './AppState';
import { colors, MIN_TOUCH, spacing } from '../theme';

export default function PronunciationButton({
  title,
  meaning,
}: {
  title: string;
  meaning: string;
}) {
  const { triggerHapticFeedback } = useSettingsState();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pakinggan ang pagbigkas ng ${title}`}
      style={styles.button}
      onPress={() => {
        Speech.speak(`${title}. ${meaning}`, { language: 'fil-PH', rate: 0.9 });
        triggerHapticFeedback();
      }}
    >
      <Ionicons name="volume-medium-outline" size={21} color={colors.primary} />
      <Text style={styles.label}>Pakinggan</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: MIN_TOUCH,
    height: MIN_TOUCH,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  label: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
