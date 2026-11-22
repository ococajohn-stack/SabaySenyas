import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, G, Svg } from 'react-native-svg';
import FingerspellingHand from '../components/FingerspellingHand';
import PrimaryButton from '../components/PrimaryButton';
import SignGestureDetector, {
  type DetectorProgress,
  type DetectorStatus,
} from '../components/SignGestureDetector';
import SignVideo from '../components/SignVideo';
import { FINGERSPELLING_LETTERS } from '../data/fingerspelling';
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

const HOLD_RING_SIZE = 42;
const HOLD_RING_RADIUS = 16;
const HOLD_RING_CIRCUMFERENCE = 2 * Math.PI * HOLD_RING_RADIUS;

const EMPTY_PROGRESS = (signId: string): DetectorProgress => ({
  signId,
  confidence: 0,
  holdProgress: 0,
  detected: false,
  message: 'Walang nakitang kamay — itapat ang iyong kamay sa loob ng gabay',
});

export default function LessonScreen() {
  const router = useRouter();
  const { unit: unitParam } = useLocalSearchParams<{ unit?: string }>();
  const unit = unitParam && UNIT_TITLES[unitParam] ? unitParam : '1';
  const lessonSign = SIGNS.find((sign) => sign.id === LESSON_SIGN_IDS[unit]);
  if (!lessonSign) {
    throw new Error(`No sign is configured for lesson unit ${unit}.`);
  }
  const letters = lessonSign.title.toUpperCase().replace(/[^A-Z]/g, '').split('');
  const [permission, requestPermission] = useCameraPermissions();
  const [letterIndex, setLetterIndex] = useState(0);
  const [detectorStatus, setDetectorStatus] = useState<DetectorStatus>('loading');
  const [detectorMessage, setDetectorMessage] = useState('');
  const [progress, setProgress] = useState(() => EMPTY_PROGRESS(`letter:${letters[0]}:0`));
  const [finished, setFinished] = useState(false);
  const verifiedTargetRef = useRef<string | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentLetter = letters[letterIndex];
  const currentTarget = `letter:${currentLetter}:${letterIndex}`;
  const currentProgress = progress.signId === currentTarget ? progress : EMPTY_PROGRESS(currentTarget);
  const reference = FINGERSPELLING_LETTERS.find((item) => item.letter === currentLetter);

  useEffect(() => {
    if (permission?.canAskAgain) void requestPermission();
  }, [permission?.canAskAgain, requestPermission]);

  useEffect(() => () => {
    if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
  }, []);

  const finishWord = () => {
    if (finished) return;
    setFinished(true);
    navigationTimerRef.current = setTimeout(() => {
      router.replace({ pathname: '/quiz', params: { unit } });
    }, 900);
  };

  const advanceLetter = (verified: boolean) => {
    if (finished) return;
    if (verified) void Haptics.selectionAsync();
    if (letterIndex + 1 >= letters.length) {
      finishWord();
      return;
    }
    const nextIndex = letterIndex + 1;
    setLetterIndex(nextIndex);
    verifiedTargetRef.current = null;
    setProgress(EMPTY_PROGRESS(`letter:${letters[nextIndex]}:${nextIndex}`));
  };

  const handleVerified = (target: string) => {
    if (target !== currentTarget || verifiedTargetRef.current === target || finished) return;
    verifiedTargetRef.current = target;
    advanceLetter(true);
  };

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

        <View style={styles.practiceCard}>
          <Text style={styles.cardTitle}>Baybayin ang {lessonSign.title}</Text>
          <Text style={styles.cameraText}>Ipakita ang hugis ng kasalukuyang letra at panatilihin ang kamay sa loob ng gabay.</Text>
          <View style={styles.letterTiles} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: letters.length, now: finished ? letters.length : letterIndex }}>
            {letters.map((letter, index) => {
              const isComplete = finished || index < letterIndex;
              const isActive = !finished && index === letterIndex;
              return (
                <View
                  key={`${letter}-${index}`}
                  accessibilityLabel={`Letra ${letter}${isComplete ? ', kumpleto' : isActive ? ', kasalukuyan' : ''}`}
                  style={[
                    styles.letterTile,
                    isComplete && styles.letterTileComplete,
                    isActive && styles.letterTileActive,
                  ]}
                >
                  <Text style={[
                    styles.letterText,
                    isComplete && styles.letterTextComplete,
                    isActive && styles.letterTextActive,
                  ]}>{letter}</Text>
                  {isComplete ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={10} color={colors.onPrimary} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
          <Text style={styles.letterProgress}>
            {finished ? 'Kumpleto ang pagbaybay!' : `Letra ${letterIndex + 1} sa ${letters.length} · ${currentLetter}`}
          </Text>

          <View style={styles.referenceCard}>
            <View style={styles.referenceVisual}>
              {reference ? <FingerspellingHand item={reference} size={122} /> : null}
            </View>
            <View style={styles.referenceCopy}>
              <Text style={styles.referenceLabel}>Hugis ng letrang {currentLetter}</Text>
              <Text style={styles.referenceCue}>{reference?.cue}</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>Subukan sa harap ng kamera</Text>
          <View style={styles.cameraFrame}>
            {permission?.granted && Platform.OS !== 'web' ? (
              <>
                <CameraView facing="front" style={StyleSheet.absoluteFill} />
                <SignGestureDetector
                  targetSignId={currentTarget}
                  onProgress={(nextProgress) => {
                    if (nextProgress.signId === currentTarget) setProgress(nextProgress);
                  }}
                  onVerified={handleVerified}
                  onStatusChange={(status, message) => {
                    setDetectorStatus(status);
                    setDetectorMessage(message ?? '');
                  }}
                />
                <View pointerEvents="none" style={styles.alignmentFrame} />
                <View pointerEvents="none" style={styles.cameraStatus}>
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
                          stroke={finished ? '#22C55E' : '#5EEAD4'}
                          strokeWidth={4}
                          strokeLinecap="round"
                          strokeDasharray={HOLD_RING_CIRCUMFERENCE}
                          strokeDashoffset={HOLD_RING_CIRCUMFERENCE * (1 - currentProgress.holdProgress)}
                        />
                      </G>
                    </Svg>
                    <Text style={styles.ringLabel}>{Math.round(currentProgress.holdProgress * 100)}%</Text>
                  </View>
                  <Text style={styles.cameraStatusText}>
                    {finished
                      ? 'Tapos na!'
                      : detectorStatus === 'error'
                        ? detectorMessage
                        : currentProgress.holdProgress > 0
                          ? `Panatilihin ang kamay sa gabay... ${Math.round(currentProgress.holdProgress * 100)}%`
                          : detectorStatus === 'loading'
                            ? 'Inihahanda ang pagkilala...'
                            : currentProgress.message}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.permissionState}>
                <Ionicons name="camera-outline" size={28} color={colors.primary} />
                <Text style={styles.permissionText}>
                  {Platform.OS === 'web'
                    ? 'Gumamit ng Android o iPhone para sa live na pagkilala sa kamay.'
                    : 'Kailangan ng pahintulot sa kamera upang suriin ang bawat letra.'}
                </Text>
                {permission?.canAskAgain === false ? (
                  <Text style={styles.permissionText}>Paganahin ang pahintulot sa mga setting ng iyong aparato.</Text>
                ) : null}
                {Platform.OS !== 'web' && permission?.granted !== true ? (
                  <PrimaryButton label="Payagan ang Kamera" onPress={() => { void requestPermission(); }} />
                ) : null}
              </View>
            )}
          </View>
          <Pressable
            style={styles.skipButton}
            onPress={() => advanceLetter(false)}
            accessibilityRole="button"
            accessibilityLabel="Laktawan ang Letra"
          >
            <Text style={styles.skipText}>Laktawan ang Letra</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
          <Text style={styles.detectorNote}>
            Awtomatikong sinusuri ng kamera ang hugis ng iyong kamay para sa bawat letra.
          </Text>
        </View>

        {finished ? <Text style={styles.finishNote}>Mahusay! Dadalhin ka na sa Pagsusulit.</Text> : null}
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
  practiceCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, elevation: 1 },
  cameraText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  letterTiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingVertical: spacing.xs },
  letterTile: { position: 'relative', minWidth: 36, height: 40, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  letterTileActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  letterTileComplete: { backgroundColor: '#15803D', borderColor: '#15803D' },
  letterText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  letterTextActive: { color: colors.onPrimary },
  letterTextComplete: { color: colors.onPrimary },
  checkBadge: { position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: radius.pill, backgroundColor: '#166534', borderWidth: 1, borderColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  letterProgress: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  referenceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.sm, gap: spacing.sm },
  referenceVisual: { width: 122, height: 122, alignItems: 'center', justifyContent: 'center' },
  referenceCopy: { flex: 1, gap: spacing.xs },
  referenceLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  referenceCue: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  cameraFrame: { height: 260, position: 'relative', overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.slate, alignItems: 'center', justifyContent: 'center' },
  alignmentFrame: { position: 'absolute', width: '76%', height: '76%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.62)', borderRadius: radius.md },
  cameraStatus: { position: 'absolute', bottom: spacing.sm, left: spacing.sm, right: spacing.sm, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.sm, backgroundColor: 'rgba(15, 23, 42, 0.78)', paddingHorizontal: spacing.sm },
  holdRing: { width: HOLD_RING_SIZE, height: HOLD_RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  cameraStatusText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  permissionState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  permissionText: { color: colors.text, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  skipButton: { minHeight: MIN_TOUCH, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  skipText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  detectorNote: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  finishNote: { color: colors.primary, textAlign: 'center', fontSize: 14, fontWeight: '700' },
});
