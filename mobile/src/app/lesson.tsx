import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import SignVideo from '../components/SignVideo';
import { SIGNS } from '../data/signs';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

const PRACTICE_INSTRUCTIONS = [
  'Panoorin ang buong pagpapakita.',
  'Pansinin ang hugis ng kamay at direksyon ng palad.',
  'Dahan-dahang subukan ang galaw.',
];

const UNIT_TITLES: Record<string, string> = {
  '1': 'Mga Pang-araw-araw na Pagbati',
  '2': 'Pang-araw-araw na Pakikipag-usap',
  '3': 'Mga Tao at Lugar',
  '4': 'Araw-araw na Usapan',
};

const LESSON_SIGN_IDS: Record<string, string> = {
  '1': '1',
  '2': '2',
  '3': '6',
  '4': '4',
};

export default function LessonScreen() {
  const router = useRouter();
  const { unit: unitParam } = useLocalSearchParams<{ unit?: string }>();
  const unit = unitParam && UNIT_TITLES[unitParam] ? unitParam : '1';
  const lessonSign = SIGNS.find((sign) => sign.id === LESSON_SIGN_IDS[unit]);
  if (!lessonSign) {
    throw new Error(`No sign is configured for lesson unit ${unit}.`);
  }
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Bumalik">
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <Text style={styles.small}>YUNIT {unit}</Text>
        <Text style={styles.title}>{UNIT_TITLES[unit]}</Text>
        <Text style={styles.subtitle}>Mga Batayan ng FSL · Aralin 1</Text>

        <View style={styles.video}>
          <SignVideo
            videoSource={lessonSign.videoSource}
            title={lessonSign.title}
            meaning={lessonSign.meaning}
            height={210}
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mga Tagubilin sa Pagsasanay</Text>
          {PRACTICE_INSTRUCTIONS.map((instruction, index) => (
            <View key={instruction} style={styles.instructionRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
              <Text style={styles.body}>{instruction}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cameraCard}>
          <View style={styles.cameraIcon}><Ionicons name="camera-outline" size={21} color={colors.text} /></View>
          <View style={styles.cameraCopy}>
            <Text style={styles.cardTitle}>Kamera para sa Pagsasanay</Text>
            <Text style={styles.cameraText}>Sanayin sa harap ng kamera ang hugis ng iyong kamay.</Text>
          </View>
          <Pressable style={styles.openButton} onPress={() => router.push('/practice')} accessibilityRole="button">
            <Text style={styles.openText}>Buksan</Text>
          </Pressable>
        </View>

        <PrimaryButton
          label="Simulan ang Pagsusulit  →"
          onPress={() => router.push({ pathname: '/quiz', params: { unit } })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, justifyContent: 'center' },
  small: { fontSize: 12, color: colors.muted, fontWeight: '600', letterSpacing: 0.5 },
  title: { fontSize: 25, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: -spacing.sm },
  video: { position: 'relative' },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  instructionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepNumber: { width: 26, height: 26, borderRadius: radius.pill, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  body: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  cameraCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, elevation: 1 },
  cameraIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cameraCopy: { flex: 1, gap: 2 },
  cameraText: { color: colors.muted, fontSize: 12 },
  openButton: { minHeight: MIN_TOUCH, minWidth: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.primary },
  openText: { color: colors.onPrimary, fontSize: 13, fontWeight: '600' },
});
