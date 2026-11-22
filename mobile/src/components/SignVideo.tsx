import { Ionicons } from "@expo/vector-icons";
import {
    useVideoPlayer,
    VideoView,
    type VideoPlayer,
    type VideoSource,
} from "expo-video";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { useSettingsState } from "./AppState";

function setPlayerPlaybackRate(player: VideoPlayer, playbackRate: number) {
  player.playbackRate = playbackRate;
}

type Props = {
  videoSource: VideoSource;
  title: string;
  meaning: string;
  height?: number;
  captionsEnabledByDefault?: boolean;
  showCaptions?: boolean;
  previewLabel?: string;
};

export default function SignVideo({
  videoSource,
  title,
  meaning,
  height = 220,
  captionsEnabledByDefault,
  showCaptions = true,
  previewLabel,
}: Props) {
  const { preferences, triggerHapticFeedback } = useSettingsState();
  const defaultPlaybackRate = preferences.defaultSlowMotion ? 0.5 : 1;
  const [captionOverride, setCaptionOverride] = useState<boolean | null>(null);
  const [playbackRateOverride, setPlaybackRateOverride] = useState<{
    slowMotionEnabled: boolean;
    rate: number;
  } | null>(null);
  const [previewVisible, setPreviewVisible] = useState(true);
  const captionsEnabled = showCaptions && (
    captionOverride ??
    captionsEnabledByDefault ??
    preferences.subtitlesByDefault
  );
  const playbackRate =
    playbackRateOverride?.slowMotionEnabled === preferences.defaultSlowMotion
      ? playbackRateOverride.rate
      : defaultPlaybackRate;
  const player = useVideoPlayer(videoSource, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.playbackRate = defaultPlaybackRate;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    setPlayerPlaybackRate(player, playbackRate);
  }, [playbackRate, player]);

  const togglePlaybackRate = () => {
    const nextPlaybackRate = playbackRate === 1 ? 0.5 : 1;
    setPlayerPlaybackRate(player, nextPlaybackRate);
    setPlaybackRateOverride({
      slowMotionEnabled: preferences.defaultSlowMotion,
      rate: nextPlaybackRate,
    });
    triggerHapticFeedback();
  };

  return (
    <View style={[styles.container, { height }]}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        style={styles.video}
        onFirstFrameRender={() => setPreviewVisible(false)}
      />
      {previewLabel && previewVisible ? (
        <View pointerEvents="none" style={styles.preview}>
          <View style={styles.previewIcon}>
            <Ionicons
              name="hand-left-outline"
              size={30}
              color={colors.onPrimary}
            />
          </View>
          <Text style={styles.previewLabel}>{previewLabel}</Text>
        </View>
      ) : null}
      <Pressable
        style={styles.speedButton}
        onPress={togglePlaybackRate}
        accessibilityRole="button"
        accessibilityLabel={`Bilis ng bidyo: ${playbackRate} ulit`}
      >
        <Text style={styles.ccText}>{playbackRate === 1 ? "1x" : "0.5x"}</Text>
      </Pressable>
      {showCaptions ? (
        <Pressable
          style={styles.ccButton}
          onPress={() => {
            setCaptionOverride(!captionsEnabled);
            triggerHapticFeedback();
          }}
          accessibilityRole="button"
          accessibilityLabel={
            captionsEnabled ? "Itago ang paliwanag" : "Ipakita ang paliwanag"
          }
          accessibilityState={{ selected: captionsEnabled }}
        >
          <Text style={styles.ccText}>
            {captionsEnabled ? "Itago" : "Ipakita"}
          </Text>
        </Pressable>
      ) : null}
      {captionsEnabled ? (
        <View
          style={styles.subtitle}
          accessibilityLabel={`${title}: ${meaning}`}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meaning}>{meaning}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: { width: "100%", height: "100%" },
  preview: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.slate,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  speedButton: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    minWidth: 48,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  ccButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  ccText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  subtitle: {
    position: "absolute",
    bottom: spacing.sm,
    alignSelf: "center",
    maxWidth: "90%",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  meaning: { color: "#fff", fontSize: 12, textAlign: "center" },
});
