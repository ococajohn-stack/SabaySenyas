import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, G, Svg } from 'react-native-svg';
import { useLearningState, useSettingsState } from '../components/AppState';
import PrimaryButton from '../components/PrimaryButton';
import SignGestureDetector, {
  type DetectorProgress,
  type DetectorStatus,
} from '../components/SignGestureDetector';
import { SIGNS } from '../data/signs';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

const HOLD_RING_SIZE = 48;
const HOLD_RING_RADIUS = 19;
const HOLD_RING_CIRCUMFERENCE = 2 * Math.PI * HOLD_RING_RADIUS;

const emptyProgress = (signId: string): DetectorProgress => ({
  signId,
  confidence: 0,
  holdProgress: 0,
  detected: false,
  message: 'Walang nakitang kamay — itapat ang iyong kamay sa loob ng gabay',
});

export default function PracticeScreen() {
  const router = useRouter();
  const { markSignLearned } = useLearningState();
  const { triggerHapticFeedback } = useSettingsState();
  const [permission, requestPermission] = useCameraPermissions();
  const [signIndex, setSignIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctBadge, setCorrectBadge] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [detectorStatus, setDetectorStatus] = useState<DetectorStatus>('loading');
  const [detectorMessage, setDetectorMessage] = useState('');
  const [detectorProgress, setDetectorProgress] = useState(() => emptyProgress(SIGNS[0].id));
  const verifiedSignRef = useRef<string | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSign = SIGNS[signIndex];
  const currentProgress = detectorProgress.signId === currentSign.id
    ? detectorProgress
    : emptyProgress(currentSign.id);

  useEffect(() => {
    if (permission?.canAskAgain) void requestPermission();
  }, [permission?.canAskAgain, requestPermission]);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    },
    [],
  );

  const advanceSign = (index: number) => {
    verifiedSignRef.current = null;
    if (index >= SIGNS.length - 1) {
      setCompleted(true);
      return;
    }
    setSignIndex(index + 1);
    setDetectorProgress(emptyProgress(SIGNS[index + 1].id));
  };

  const handleVerified = (signId: string) => {
    if (signId !== currentSign.id || verifiedSignRef.current === signId) return;
    verifiedSignRef.current = signId;
    setCorrectBadge(true);
    setScore((value) => value + 1);
    markSignLearned(signId);
    triggerHapticFeedback();
    advanceTimerRef.current = setTimeout(() => {
      setCorrectBadge(false);
      advanceSign(signIndex);
    }, 1000);
  };

  const skipSign = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    verifiedSignRef.current = null;
    setCorrectBadge(false);
    advanceSign(signIndex);
  };

  const restartPractice = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    verifiedSignRef.current = null;
    setSignIndex(0);
    setScore(0);
    setCorrectBadge(false);
    setDetectorProgress(emptyProgress(SIGNS[0].id));
    setDetectorStatus('loading');
    setDetectorMessage('');
    setCompleted(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.back}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Bumalik"
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>

        {completed ? (
          <View style={styles.completion}>
            <View style={styles.completionCard}>
              <View
                style={[
                  styles.completeIcon,
                  score === 0 && styles.retryIcon,
                  score > 0 && score < SIGNS.length && styles.progressIcon,
                ]}
              >
                <Ionicons
                  name={score === 0 ? 'refresh' : score === SIGNS.length ? 'trophy' : 'hand-left-outline'}
                  size={28}
                  color={score === 0 ? colors.accent : score === SIGNS.length ? colors.onPrimary : '#92400E'}
                />
              </View>
              <Text style={styles.completionTitle}>
                {score === 0
                  ? 'Subukan Muli! Wala pang tamang senyas'
                  : score === SIGNS.length
                    ? 'Mahusay! Natapos ang lahat ng pagsubok.'
                    : 'Magandang Simula! Tapos na ang Pagsasanay'}
              </Text>
              <Text style={styles.completionSubtitle}>
                {score === 0
                  ? 'Huwag mag-alala—panoorin muna ang mga bidyo sa Diksiyonaryo o Aralin at subukan ulit.'
                  : score === SIGNS.length
                    ? 'Nagawa mo nang tama ang lahat ng senyas. Ipagpatuloy ang pagsasanay!'
                    : 'Patuloy na magsanay upang maperpekto ang lahat ng senyas.'}
              </Text>
              <View style={styles.scorePill}>
                <Text style={styles.scorePillText}>Iskor: {score} / {SIGNS.length}</Text>
              </View>
              <View style={styles.practicedSigns}>
                <Text style={styles.practicedTitle}>Mga senyas na sinanay ({SIGNS.length})</Text>
                <View style={styles.signList}>
                  {SIGNS.map((sign) => (
                    <View key={sign.id} style={styles.signChip}>
                      <Text style={styles.signChipText}>{sign.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <PrimaryButton label="Ulitin ang Pagsasanay" onPress={restartPractice} />
              <PrimaryButton label="Bumalik sa Tahanan" variant="secondary" onPress={() => router.replace('/home')} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.heading}>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>INTERAKTIBONG PAGSASANAY</Text>
                <Text style={styles.title}>Sanayin ang mga Senyas</Text>
                <Text style={styles.meaning}>Ilagay sa gabay ang kamay na ginagamit sa bawat senyas at panatilihin ito upang magpatuloy.</Text>
              </View>
              <Text style={styles.score}>Iskor: {score} / {SIGNS.length}</Text>
            </View>

            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: SIGNS.length, now: signIndex + 1 }}
            >
              <View style={[styles.fill, { width: `${((signIndex + 1) / SIGNS.length) * 100}%` }]} />
            </View>
            <Text style={styles.progress}>Senyas {signIndex + 1} sa {SIGNS.length}</Text>

            <View style={styles.targetCard}>
              <Text style={styles.targetCategory}>{currentSign.category.toUpperCase()}</Text>
              <Text style={styles.targetTitle}>{currentSign.title}</Text>
              <Text style={styles.meaning}>{currentSign.meaning}</Text>
              <Text style={styles.cue}>{currentSign.description}</Text>
            </View>

            <View style={styles.cameraSection}>
              <Text style={styles.sectionTitle}>Ipakita ang senyas sa kamera</Text>
              <View style={styles.cameraFrame}>
                {permission?.granted ? (
                  Platform.OS === 'web' ? (
                    <View style={styles.permissionState}>
                      <Ionicons name="phone-portrait-outline" size={28} color={colors.primary} />
                      <Text style={styles.permissionText}>Gumamit ng Android o iPhone para sa live na pagkilala sa kamay.</Text>
                    </View>
                  ) : (
                    <>
                      <CameraView facing="front" style={StyleSheet.absoluteFill} />
                      <SignGestureDetector
                        targetSignId={currentSign.id}
                        onProgress={(progress) => {
                          if (progress.signId === currentSign.id) setDetectorProgress(progress);
                        }}
                        onVerified={handleVerified}
                        onStatusChange={(status, message) => {
                          setDetectorStatus(status);
                          setDetectorMessage(message ?? '');
                        }}
                      />
                    </>
                  )
                ) : (
                  <View style={styles.permissionState}>
                    <View style={styles.permissionIcon}>
                      <Ionicons name="camera-outline" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.permissionText}>Kailangan ng pahintulot sa kamera upang makita ang iyong pagsasanay.</Text>
                    {permission?.canAskAgain === false ? (
                      <Text style={styles.body}>Paganahin ang pahintulot sa mga setting ng iyong aparato upang magpatuloy.</Text>
                    ) : null}
                    <PrimaryButton label="Payagan ang Kamera" onPress={() => { void requestPermission(); }} />
                  </View>
                )}

                {permission?.granted && Platform.OS !== 'web' ? (
                  <View pointerEvents="none" style={styles.cameraOverlay}>
                    <View style={styles.alignmentFrame} />
                    <View style={styles.detectorStatusPill}>
                      <View
                        style={styles.holdRing}
                        accessibilityRole="progressbar"
                        accessibilityValue={{ min: 0, max: 100, now: Math.round(currentProgress.holdProgress * 100) }}
                      >
                        <Svg width={HOLD_RING_SIZE} height={HOLD_RING_SIZE}>
                          <G rotation={-90} origin={`${HOLD_RING_SIZE / 2}, ${HOLD_RING_SIZE / 2}`}>
                            <Circle
                              cx={HOLD_RING_SIZE / 2}
                              cy={HOLD_RING_SIZE / 2}
                              r={HOLD_RING_RADIUS}
                              fill="none"
                              stroke="rgba(255,255,255,0.28)"
                              strokeWidth={4}
                            />
                            <Circle
                              cx={HOLD_RING_SIZE / 2}
                              cy={HOLD_RING_SIZE / 2}
                              r={HOLD_RING_RADIUS}
                              fill="none"
                              stroke={correctBadge ? '#22C55E' : '#5EEAD4'}
                              strokeWidth={4}
                              strokeLinecap="round"
                              strokeDasharray={HOLD_RING_CIRCUMFERENCE}
                              strokeDashoffset={HOLD_RING_CIRCUMFERENCE * (1 - currentProgress.holdProgress)}
                            />
                          </G>
                        </Svg>
                        <Text style={styles.ringLabel}>{Math.round(currentProgress.holdProgress * 100)}%</Text>
                      </View>
                      <View style={styles.detectorCopy}>
                        {correctBadge ? (
                          <Text style={styles.correctBadge}>Napanatili ang kamay! ✅</Text>
                        ) : detectorStatus === 'error' ? (
                          <Text style={styles.detectorText}>{detectorMessage}</Text>
                        ) : currentProgress.holdProgress > 0 ? (
                          <Text style={styles.detectorText}>
                            Pinapanatili ang kamay sa gabay... {Math.round(currentProgress.holdProgress * 100)}%
                          </Text>
                        ) : (
                          <Text style={styles.detectorText}>
                            {detectorStatus === 'loading'
                              ? 'Inihahanda ang pagkilala...'
                              : currentProgress.message}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={styles.footerNote}>
              Awtomatikong sinusuri ng kamera ang hugis at galaw ng iyong kamay para sa senyas.
            </Text>

            <Pressable
              style={styles.skipButton}
              onPress={skipSign}
              accessibilityRole="button"
              accessibilityLabel="Laktawan ang senyas"
            >
              <Text style={styles.skipText}>Laktawan</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, justifyContent: 'center' },
  heading: { gap: spacing.xs },
  headingCopy: { gap: spacing.xs },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  meaning: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  score: { color: colors.text, fontSize: 14, fontWeight: '600' },
  track: { height: 7, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: colors.primary },
  progress: { color: colors.muted, fontSize: 13, textAlign: 'right', marginTop: -spacing.sm },
  targetCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    elevation: 1,
  },
  targetCategory: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  targetTitle: { color: colors.text, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  cue: { color: colors.text, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: spacing.xs },
  cameraSection: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cameraFrame: { height: 380, position: 'relative', overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.slate },
  permissionState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  permissionIcon: { width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  permissionText: { maxWidth: 280, color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 22, textAlign: 'center' },
  cameraOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: spacing.sm },
  alignmentFrame: { width: '82%', height: '74%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.62)', borderRadius: radius.md },
  detectorStatusPill: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  holdRing: { width: HOLD_RING_SIZE, height: HOLD_RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', color: '#fff', fontSize: 11, fontWeight: '700' },
  detectorCopy: { flex: 1, gap: 3 },
  detectorText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  correctBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, color: '#fff', backgroundColor: '#15803D', fontSize: 13, fontWeight: '700' },
  footerNote: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  skipButton: { minHeight: MIN_TOUCH, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  skipText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  completion: { flex: 1, justifyContent: 'center' },
  completionCard: {
    width: '100%',
    alignItems: 'stretch',
    gap: spacing.md,
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
  },
  completeIcon: { alignSelf: 'center', width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  retryIcon: { backgroundColor: '#FEF3C7' },
  progressIcon: { backgroundColor: '#FEF3C7' },
  completionTitle: { color: colors.text, fontSize: 23, fontWeight: '700', textAlign: 'center' },
  completionSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  scorePill: { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.chip },
  scorePillText: { color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  practicedSigns: { gap: spacing.sm, alignItems: 'center' },
  practicedTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  signList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
  signChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.chip },
  signChipText: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
