import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLearningState } from '../components/AppState';
import PrimaryButton from '../components/PrimaryButton';
import SignVideo from '../components/SignVideo';
import { SIGNS } from '../data/signs';
import { colors, radius, spacing } from '../theme';

const QUESTIONS = [
  { prompt: 'Ano ang ibig sabihin ng senyas na ipinapakita sa bidyo?', signId: '2', options: ['Salamat', 'Kumusta', 'Paalam', 'Ingat'], answer: 0 },
  { prompt: 'Ano ang ibig sabihin ng senyas na ipinapakita sa bidyo?', signId: '1', options: ['Tatay', 'Kumusta', 'Dalawa', 'Salamat'], answer: 1 },
  { prompt: 'Ano ang ibig sabihin ng senyas na ipinapakita sa bidyo?', signId: '4', options: ['Ingat', 'Nanay', 'Paalam', 'Isa'], answer: 2 },
];

export default function QuizScreen() {
  const router = useRouter();
  const { unit: unitParam } = useLocalSearchParams<{ unit?: string }>();
  const unit = unitParam ?? '1';
  const { completeLesson } = useLearningState();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [completed, setCompleted] = useState(false);
  const question = QUESTIONS[questionIndex];
  const demoSign = SIGNS.find((sign) => sign.id === question.signId);
  if (!demoSign) {
    throw new Error(`No sign is configured for quiz question ${questionIndex + 1}.`);
  }

  const checkAnswer = () => {
    if (selected === null) {
      setFeedback('Pumili muna ng sagot bago ito tiyakin.');
      return;
    }
    if (selected !== question.answer) {
      setFeedback('Hindi pa tama. Subukan ang ibang sagot.');
      return;
    }
    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((index) => index + 1);
      setSelected(null);
      setFeedback('');
      return;
    }
    completeLesson(`unit-${unit}-lesson-1`);
    setCompleted(true);
    setFeedback('Magaling! Natapos mo ang araling ito.');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YUNIT {unit} · MAIKLING PAGBABALIK-ARAL</Text>
        {completed ? (
          <View style={styles.complete}>
            <View style={styles.completeIcon}><Ionicons name="checkmark" size={28} color={colors.onPrimary} /></View>
            <Text style={styles.title}>Tapos na ang Aralin</Text>
            <Text style={styles.subtitle}>{feedback}</Text>
            <PrimaryButton label="Bumalik sa mga Aralin" onPress={() => router.replace('/lessons')} />
          </View>
        ) : (
          <>
            <View style={styles.progressHeading}>
              <Text style={styles.title}>Pagsusulit</Text>
              <Text style={styles.count}>{questionIndex + 1} / {QUESTIONS.length}</Text>
            </View>
            <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: QUESTIONS.length, now: questionIndex + 1 }}>
              <View style={[styles.fill, { width: `${(questionIndex + 1) / QUESTIONS.length * 100}%` }]} />
            </View>

            <Text style={styles.prompt}>{question.prompt}</Text>
            <SignVideo
              videoSource={demoSign.videoSource}
              title={demoSign.title}
              meaning={demoSign.meaning}
              height={170}
              captionsEnabledByDefault={false}
              showCaptions={false}
            />

            <View style={styles.options}>
              {question.options.map((option, index) => {
                const active = selected === index;
                return (
                  <Pressable
                    key={option}
                    onPress={() => { setSelected(index); setFeedback(''); }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
                    <View style={styles.optionLetter}><Text style={styles.letter}>{String.fromCharCode(65 + index)}</Text></View>
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
            {feedback ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text> : null}
            <PrimaryButton label="Tiyakin ang Sagot" onPress={checkAnswer} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  count: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  track: { height: 7, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: colors.primary },
  prompt: { color: colors.text, fontSize: 19, fontWeight: '600', lineHeight: 26 },
  options: { gap: spacing.sm },
  option: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, elevation: 1 },
  optionActive: { borderColor: colors.primary },
  radio: { width: 20, height: 20, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.primary },
  optionLetter: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  letter: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  optionText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  feedback: { color: colors.text, fontSize: 13, fontWeight: '500' },
  complete: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  completeIcon: { width: 60, height: 60, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: colors.muted, fontSize: 14, textAlign: 'center' },
});
