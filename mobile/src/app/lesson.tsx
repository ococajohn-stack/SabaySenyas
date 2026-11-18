import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import SignVideo from '../components/SignVideo';
import { SIGNS } from '../data/signs';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

const STEPS = [
  { title: 'Get ready to sign', instructions: ['Watch the full demonstration.', 'Notice the handshape and palm direction.', 'Try the movement slowly.'] },
  { title: 'Shape your hand', instructions: ['Relax your shoulders and hands.', 'Form the handshape shown in the video.', 'Check your palm direction.'] },
  { title: 'Practice the movement', instructions: ['Start from the demonstrated position.', 'Move smoothly and keep the handshape.', 'Repeat the sign three times.'] },
  { title: 'Put it together', instructions: ['Review the sign from start to finish.', 'Practice at a comfortable pace.', 'Try once without looking at the video.'] },
  { title: 'Ready to review?', instructions: ['Make the sign one more time.', 'Think about what the sign means.', 'Continue to a short knowledge check.'] },
];

const UNIT_TITLES: Record<string, string> = {
  '1': 'Everyday Greetings',
  '2': 'Everyday Communication',
  '3': 'People & Places',
  '4': 'Daily Conversations',
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
  const [step, setStep] = useState(1);
  const progress = step / STEPS.length;
  const currentStep = STEPS[step - 1];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={styles.progressRow}>
          <Text style={styles.small}>UNIT {unit}</Text>
          <Text style={styles.small}>Step {step} of {STEPS.length}</Text>
        </View>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: STEPS.length, now: step }}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>

        <Text style={styles.title}>{UNIT_TITLES[unit]}</Text>
        <Text style={styles.subtitle}>FSL Basics · Lesson 1</Text>

        <View style={styles.video}>
          <SignVideo
            videoSource={lessonSign.videoSource}
            title={lessonSign.title}
            meaning={lessonSign.meaning}
            height={210}
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Practice Instructions</Text>
          <Text style={styles.stepTitle}>{currentStep.title}</Text>
          {currentStep.instructions.map((instruction, index) => (
            <View key={instruction} style={styles.instructionRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
              <Text style={styles.body}>{instruction}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cameraCard}>
          <View style={styles.cameraIcon}><Ionicons name="camera-outline" size={21} color={colors.text} /></View>
          <View style={styles.cameraCopy}>
            <Text style={styles.cardTitle}>Self-Practice Camera</Text>
            <Text style={styles.cameraText}>Practice your handshape on camera.</Text>
          </View>
          <Pressable style={styles.openButton} onPress={() => router.push('/practice')} accessibilityRole="button">
            <Text style={styles.openText}>Open</Text>
          </Pressable>
        </View>

        <PrimaryButton
          label="Next Step  →"
          onPress={() => step === STEPS.length
            ? router.push({ pathname: '/quiz', params: { unit } })
            : setStep((value) => value + 1)}
        />
        {step > 1 ? <PrimaryButton label="Previous Step" variant="secondary" onPress={() => setStep((value) => value - 1)} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, justifyContent: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { fontSize: 12, color: colors.muted, fontWeight: '600', letterSpacing: 0.5 },
  track: { height: 7, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: colors.primary },
  title: { fontSize: 25, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: -spacing.sm },
  video: { position: 'relative' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  stepTitle: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  instructionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepNumber: { width: 26, height: 26, borderRadius: radius.pill, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  body: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  cameraCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  cameraIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cameraCopy: { flex: 1, gap: 2 },
  cameraText: { color: colors.muted, fontSize: 12 },
  openButton: { minHeight: MIN_TOUCH, minWidth: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surface },
  openText: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
