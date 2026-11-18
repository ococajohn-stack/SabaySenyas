import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Pressable, StyleSheet } from 'react-native';
import { useSettingsState } from './AppState';
import { colors, MIN_TOUCH } from '../theme';

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
      accessibilityLabel={`Pakinggan ang bigkas ng ${title}`}
      style={styles.button}
      onPress={() => {
        Speech.speak(`${title}. ${meaning}`, { language: 'fil-PH', rate: 0.9 });
        triggerHapticFeedback();
      }}
    >
      <Ionicons name="volume-high" size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: '#CCFBF1',
  },
});
