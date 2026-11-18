import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLearningState } from '../../components/AppState';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import PronunciationButton from '../../components/PronunciationButton';
import SignVideo from '../../components/SignVideo';
import { SIGNS } from '../../data/signs';
import { colors, radius, spacing } from '../../theme';

export default function SignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { savedSignIds, toggleSavedSign } = useLearningState();

  const index = SIGNS.findIndex((s) => s.id === id);
  const sign = SIGNS[index];

  if (!sign) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.empty}>Hindi makita ang senyas na ito.</Text>
          <PrimaryButton label="Bumalik sa diksiyonaryo" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const next = SIGNS[index + 1];
  const saved = savedSignIds.includes(sign.id);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>DIKSIYONARYO NG MGA SENYAS</Text>
        <SignVideo
          videoSource={sign.videoSource}
          title={sign.title}
          meaning={sign.meaning}
          height={220}
        />

        <View style={styles.card}>
          <View style={styles.vocabularyHeading}>
            <View style={styles.wordCopy}>
              <Text style={styles.small}>TALASALITAAN NG MGA SENYAS</Text>
              <Text style={styles.word}>{sign.title}</Text>
            </View>
            <PronunciationButton title={sign.title} meaning={sign.meaning} />
          </View>
          <Text style={styles.meaning}>{sign.meaning}</Text>
        </View>

        <View style={styles.instructionCard}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>Galaw at Hugis ng Kamay</Text>
          </View>
          <Text style={styles.body}>{sign.description}</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={saved ? 'Naitabi na' : 'Itabi'}
            variant="secondary"
            flex
            onPress={() => toggleSavedSign(sign.id)}
          />
          <PrimaryButton
            label={next ? 'Susunod  →' : 'Tapos na'}
            flex
            onPress={() => (next ? router.replace(`/sign/${next.id}`) : router.back())}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  empty: { fontSize: 16, color: colors.muted },
  kicker: { fontSize: 11, color: colors.muted, fontWeight: '600', letterSpacing: 1 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: 4, elevation: 1 },
  vocabularyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  wordCopy: { flex: 1, gap: spacing.xs },
  small: { fontSize: 11, color: colors.muted, fontWeight: '600', letterSpacing: 1 },
  word: { fontSize: 24, fontWeight: '700', color: colors.text },
  meaning: { fontSize: 16, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  instructionCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, elevation: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
