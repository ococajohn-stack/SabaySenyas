import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLearningState } from '../../components/AppState';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
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
          <Text style={styles.empty}>This sign could not be found.</Text>
          <PrimaryButton label="Back to dictionary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const next = SIGNS[index + 1];
  const saved = savedSignIds.includes(sign.id);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>SIGN DICTIONARY</Text>
        <SignVideo
          videoSource={sign.videoSource}
          title={sign.title}
          meaning={sign.meaning}
          height={220}
        />

        <View style={styles.card}>
          <View style={styles.vocabularyHeading}>
            <Text style={styles.small}>SIGN VOCABULARY</Text>
          </View>
          <Text style={styles.word}>{sign.title}</Text>
          <Text style={styles.meaning}>{sign.meaning}</Text>
        </View>

        <View style={styles.instructionCard}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>Movement &amp; Handshape</Text>
          </View>
          <Text style={styles.body}>{sign.description}</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={saved ? 'Saved' : 'Save'}
            variant="secondary"
            flex
            onPress={() => toggleSavedSign(sign.id)}
          />
          <PrimaryButton
            label={next ? 'Next  →' : 'Done'}
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
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  vocabularyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  small: { fontSize: 11, color: colors.muted, fontWeight: '600', letterSpacing: 1 },
  word: { fontSize: 24, fontWeight: '700', color: colors.text },
  meaning: { fontSize: 16, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  instructionCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
