import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { Circle, G, Svg } from 'react-native-svg';
import { colors, radius, spacing } from '../theme';

const HOLD_DURATION_MS = 1200;
const HOLD_RING_SIZE = 48;
const HOLD_RING_RADIUS = 19;
const HOLD_RING_CIRCUMFERENCE = 2 * Math.PI * HOLD_RING_RADIUS;

type Props = {
  targetSignId: string;
  onVerified: (signId: string) => void;
};

export default function SignGestureDetector({ targetSignId, onVerified }: Props) {
  return (
    <View style={styles.container}>
      <CameraView facing="front" style={StyleSheet.absoluteFill} />
      <HoldToVerify key={targetSignId} onVerified={() => onVerified(targetSignId)} />
    </View>
  );
}

function HoldToVerify({ onVerified }: { onVerified: () => void }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [verified, setVerified] = useState(false);
  const holdStartedAtRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const callbackRef = useRef(onVerified);

  useEffect(() => {
    callbackRef.current = onVerified;
  }, [onVerified]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const updateHoldProgress = (timestamp: number) => {
    const startedAt = holdStartedAtRef.current;
    if (startedAt === null || !isHoldingRef.current) return;

    const progress = Math.min((timestamp - startedAt) / HOLD_DURATION_MS, 1);
    setHoldProgress(progress);

    if (progress === 1) {
      isHoldingRef.current = false;
      holdStartedAtRef.current = null;
      setVerified(true);
      callbackRef.current();
      frameRef.current = null;
      return;
    }

    frameRef.current = requestAnimationFrame(updateHoldProgress);
  };

  const startHolding = () => {
    if (verified || isHoldingRef.current) return;
    isHoldingRef.current = true;
    frameRef.current = requestAnimationFrame((timestamp) => {
      if (!isHoldingRef.current) return;
      holdStartedAtRef.current = timestamp;
      frameRef.current = requestAnimationFrame(updateHoldProgress);
    });
  };

  const stopHolding = () => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    holdStartedAtRef.current = null;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setHoldProgress(0);
  };

  return (
    <View style={styles.overlay}>
      <View pointerEvents="none" style={styles.guide}>
        <View style={styles.guideLabel}>
          <Text style={styles.guideLabelText}>Kamay dito</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pindutin at Panatilihin ang Hugis"
        accessibilityHint="Pindutin nang 1.2 segundo habang ginagawa ang hugis ng kamay."
        onPressIn={startHolding}
        onPressOut={stopHolding}
        style={({ pressed }) => [styles.holdButton, pressed && styles.holdButtonPressed]}
      >
        <View
          style={styles.holdRing}
          accessibilityRole="progressbar"
          accessibilityLabel="Pag-usad ng kumpirmasyon"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(holdProgress * 100) }}
        >
          <Svg width={HOLD_RING_SIZE} height={HOLD_RING_SIZE}>
            <G rotation={-90} origin={`${HOLD_RING_SIZE / 2}, ${HOLD_RING_SIZE / 2}`}>
              <Circle
                cx={HOLD_RING_SIZE / 2}
                cy={HOLD_RING_SIZE / 2}
                r={HOLD_RING_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={4}
              />
              <Circle
                cx={HOLD_RING_SIZE / 2}
                cy={HOLD_RING_SIZE / 2}
                r={HOLD_RING_RADIUS}
                fill="none"
                stroke={verified ? '#22C55E' : '#5EEAD4'}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={HOLD_RING_CIRCUMFERENCE}
                strokeDashoffset={HOLD_RING_CIRCUMFERENCE * (1 - holdProgress)}
              />
            </G>
          </Svg>
          <Text style={styles.ringLabel}>{Math.round(holdProgress * 100)}%</Text>
        </View>
        <Text style={styles.holdButtonText}>
          {verified ? 'Nakumpirma ang Hugis' : 'Pindutin at Panatilihin ang Hugis'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: StyleSheet.absoluteFill,
  guide: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    width: '76%',
    height: '54%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: radius.md,
    backgroundColor: 'rgba(13,148,136,0.12)',
  },
  guideLabel: {
    position: 'absolute',
    top: -13,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  guideLabelText: { color: colors.onPrimary, fontSize: 12, fontWeight: '700' },
  holdButton: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.sm,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(15,23,42,0.86)',
  },
  holdButtonPressed: { backgroundColor: 'rgba(13,148,136,0.94)' },
  holdRing: { width: HOLD_RING_SIZE, height: HOLD_RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  holdButtonText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
