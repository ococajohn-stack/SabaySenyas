import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLearningState } from "../../components/AppState";
import PrimaryButton from "../../components/PrimaryButton";
import { CATEGORIES, SIGNS } from "../../data/signs";
import { colors, radius, spacing } from "../../theme";

export default function ProgressScreen() {
  const router = useRouter();
  const { lessonsCompleted, streak, learnedSignIds } = useLearningState();
  const learned = SIGNS.filter((sign) => learnedSignIds.includes(sign.id));

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>Iyong Progreso</Text>
          <Text style={styles.subtitle}>
            Buod ng iyong mga narating sa pag-aaral ng Wikang Pasenyas ng
            Pilipinas (FSL)
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{lessonsCompleted}</Text>
            <Text style={styles.statLabel}>Mga aralin</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, styles.streakNum]}>
              {String(streak).padStart(2, "0")}
            </Text>
            <Text style={styles.statLabel}>Sunod-sunod na araw</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{learned.length}</Text>
            <Text style={styles.statLabel}>Natutuhang senyas</Text>
          </View>
        </View>

        <PrimaryButton
          label="Balikan ang mga Senyas"
          onPress={() => router.push("/dictionary")}
        />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Kasanayan sa Bawat Kategorya</Text>
          {CATEGORIES.map((category) => {
            const total = SIGNS.filter(
              (sign) => sign.category === category,
            ).length;
            const count = learned.filter(
              (sign) => sign.category === category,
            ).length;
            return (
              <View key={category} style={styles.categoryRow}>
                <View style={styles.categoryHeading}>
                  <Text style={styles.rowTitle}>{category}</Text>
                  <Text style={styles.small}>
                    {count} / {total}
                  </Text>
                </View>
                <View
                  style={styles.track}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max: total, now: count }}
                >
                  <View
                    style={[
                      styles.fill,
                      { width: `${total ? (count / total) * 100 : 0}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.categoryHeading}>
            <Text style={styles.sectionTitle}>Mga Natutuhang Senyas</Text>
            <Text style={styles.small}>{learned.length} na senyas</Text>
          </View>
          {learned.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="hand-left-outline"
                  size={25}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyText}>
                Wala pang natutuhang senyas. Simulan ang pag-aaral ngayon!
              </Text>
              <Pressable
                style={styles.dictionaryButton}
                onPress={() => router.push("/dictionary")}
                accessibilityRole="button"
              >
                <Ionicons
                  name="book-outline"
                  size={17}
                  color={colors.onPrimary}
                />
                <Text style={styles.dictionaryButtonText}>
                  Buksan ang Diksiyonaryo
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.signPills}>
              {learned.map((sign) => (
                <Pressable
                  key={sign.id}
                  style={styles.signPill}
                  onPress={() => router.push(`/sign/${sign.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${sign.title}, ${sign.category}`}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.signPillText}>{sign.title}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    elevation: 1,
  },
  hero: {
    backgroundColor: colors.slate,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    elevation: 2,
    marginBottom: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.onPrimary },
  subtitle: { fontSize: 14, color: "#CBD5E1" },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
    elevation: 1,
  },
  statNum: { fontSize: 22, fontWeight: "700", color: colors.text },
  streakNum: { color: colors.accent },
  statLabel: { fontSize: 12, color: colors.muted, textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  small: { fontSize: 12, color: colors.muted },
  categoryRow: { gap: spacing.xs },
  categoryHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: { height: 8, backgroundColor: colors.primary },
  rowTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  emptyState: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    maxWidth: 280,
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  dictionaryButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  dictionaryButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  signPills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  signPill: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  signPillText: { color: colors.text, fontSize: 13, fontWeight: "600" },
});
