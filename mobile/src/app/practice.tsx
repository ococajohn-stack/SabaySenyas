import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLearningState } from '../components/AppState';
import PrimaryButton from '../components/PrimaryButton';
import SignVideo from '../components/SignVideo';
import { SIGNS } from '../data/signs';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

const COUNTDOWN_SECONDS = 3;

export default function PracticeScreen() {
  const router = useRouter();
  const { markSignLearned } = useLearningState();
  const [permission, requestPermission] = useCameraPermissions();
  const [signIndex, setSignIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gestureReady, setGestureReady] = useState(false);
  const [referenceVisible, setReferenceVisible] = useState(false);
  const [completed, setCompleted] = useState(false);
  const sign = SIGNS[signIndex];

  useEffect(() => {
    if (countdown === null) return undefined;
    const timer = setTimeout(() => {
      if (countdown === 1) {
        setCountdown(null);
        setGestureReady(true);
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const startCountdown = () => {
    setGestureReady(false);
    setCountdown(COUNTDOWN_SECONDS);
  };

  const confirmGesture = () => {
    markSignLearned(sign.id);
    setScore((currentScore) => currentScore + 1);
    setGestureReady(false);
    setReferenceVisible(false);

    if (signIndex === SIGNS.length - 1) {
      setCompleted(true);
    } else {
      setSignIndex((currentIndex) => currentIndex + 1);
    }
  };

  const cameraPreview = permission?.granted ? (
    <View style={[styles.cameraFrame, referenceVisible && styles.cameraCompact]}>
      <CameraView style={styles.camera} facing="front" />
      <View pointerEvents="none" style={styles.alignmentOverlay}>
        <View style={styles.alignmentFrame}>
          <Text style={styles.alignmentText}>Keep your upper body and hands in frame</Text>
        </View>
      </View>
      {countdown !== null ? (
        <View style={styles.countdownOverlay} accessibilityLiveRegion="polite">
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      ) : null}
    </View>
  ) : (
    <View style={styles.permissionCard}>
      <Ionicons name="camera-outline" size={32} color={colors.text} />
      <Text style={styles.cardTitle}>Camera access needed</Text>
      <Text style={styles.body}>
        Allow camera access to see yourself while practicing. Your camera preview is not recorded.
      </Text>
      {permission?.canAskAgain === false ? (
        <Text style={styles.body}>Camera access was denied. Enable it in your device settings to continue.</Text>
      ) : null}
      <PrimaryButton label="Allow Camera" onPress={requestPermission} />
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.back}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>

        {completed ? (
          <View style={styles.completion}>
            <View style={styles.completeIcon}>
              <Ionicons name="checkmark" size={28} color={colors.onPrimary} />
            </View>
            <Text style={styles.title}>Practice complete!</Text>
            <Text style={styles.body}>
              You confirmed all {SIGNS.length} signs. Your learned-sign progress has been updated.
            </Text>
            <Text style={styles.score}>Score: {score} / {SIGNS.length}</Text>
            <PrimaryButton label="Back to Lessons" onPress={() => router.replace('/lessons')} />
            <PrimaryButton label="Practice Again" variant="secondary" onPress={() => {
              setSignIndex(0);
              setScore(0);
              setCountdown(null);
              setGestureReady(false);
              setCompleted(false);
            }} />
          </View>
        ) : (
          <>
            <View style={styles.heading}>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>SHOW THE SIGN</Text>
                <Text style={styles.title}>Perform the sign for: {sign.title}</Text>
                <Text style={styles.meaning}>{sign.meaning}</Text>
              </View>
              <Text style={styles.score}>Score: {score} / {SIGNS.length}</Text>
            </View>

            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: SIGNS.length, now: signIndex + 1 }}
            >
              <View style={[styles.fill, { width: `${((signIndex + 1) / SIGNS.length) * 100}%` }]} />
            </View>
            <Text style={styles.progress}>Sign {signIndex + 1} of {SIGNS.length}</Text>

            <Pressable
              style={styles.referenceToggle}
              onPress={() => setReferenceVisible((visible) => !visible)}
              accessibilityRole="button"
              accessibilityState={{ expanded: referenceVisible }}
            >
              <Text style={styles.cardTitle}>Reference Video</Text>
              <Ionicons
                name={referenceVisible ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text}
              />
            </Pressable>
            {referenceVisible && permission?.granted ? (
              <View style={styles.comparison}>
                {cameraPreview}
                <View style={styles.referencePanel}>
                  <Text style={styles.referenceLabel}>Reference</Text>
                  <SignVideo
                    videoSource={sign.videoSource}
                    title={sign.title}
                    meaning={sign.meaning}
                    height={260}
                  />
                </View>
              </View>
            ) : (
              cameraPreview
            )}

            {permission?.granted ? (
              gestureReady ? (
                <View style={styles.actions}>
                  <PrimaryButton label="I Performed It" onPress={confirmGesture} />
                  <PrimaryButton label="Try Again" variant="secondary" onPress={startCountdown} />
                </View>
              ) : (
                <PrimaryButton
                  label={countdown === null ? 'Perform Gesture' : `Starting in ${countdown}...`}
                  onPress={startCountdown}
                  disabled={countdown !== null}
                />
              )
            ) : null}
            <Text style={styles.disclaimer}>
              Your score is based on your self-check; the camera does not evaluate gestures.
            </Text>
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
  meaning: { color: colors.muted, fontSize: 16 },
  score: { color: colors.text, fontSize: 14, fontWeight: '600' },
  track: { height: 7, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: colors.primary },
  progress: { color: colors.muted, fontSize: 13, textAlign: 'right', marginTop: -spacing.sm },
  cameraFrame: { height: 360, position: 'relative', overflow: 'hidden', borderRadius: radius.md, backgroundColor: '#000' },
  cameraCompact: { height: 260, flex: 1 },
  comparison: { flexDirection: 'row', gap: spacing.sm },
  referencePanel: { flex: 1, gap: spacing.xs },
  referenceLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  camera: { flex: 1 },
  alignmentOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignmentFrame: {
    width: '76%',
    height: '82%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: radius.md,
  },
  alignmentText: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  countdownText: { color: '#fff', fontSize: 72, fontWeight: '700' },
  permissionCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  referenceToggle: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  actions: { gap: spacing.sm },
  disclaimer: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  completion: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  completeIcon: { width: 60, height: 60, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
