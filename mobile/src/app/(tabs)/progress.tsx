import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLearningState } from "../../components/AppState";
import PrimaryButton from "../../components/PrimaryButton";
import { SIGNS } from "../../data/signs";
import { colors, radius, spacing } from "../../theme";

export default function ProgressScreen() {
  const router = useRouter();
  const { lessonsCompleted, streak, learnedSignIds } = useLearningState();
  const learned = SIGNS.filter((sign) => learnedSignIds.includes(sign.id));

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>
          Your Filipino Sign Language milestone summary
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statNum}>{lessonsCompleted}</Text><Text style={styles.statLabel}>Lessons</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{String(streak).padStart(2, "0")}</Text><Text style={styles.statLabel}>Day Streak</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{learned.length}</Text><Text style={styles.statLabel}>Signs Learned</Text></View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Learned Signs</Text>
          <Text style={styles.small}>{learned.length} signs</Text>
        </View>

        {learned.map((s) => (
          <Pressable
            key={s.id}
            style={styles.row}
            onPress={() => router.push(`/sign/${s.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`${s.title}, ${s.meaning}`}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{s.title}</Text>
              <Text style={styles.rowSub}>{s.category}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.text} />
          </Pressable>
        ))}

        <PrimaryButton
          label="Review Signs"
          onPress={() => router.push("/dictionary")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing.sm },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 22, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted, textAlign: "center" },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  small: { fontSize: 12, color: colors.muted },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  rowSub: { fontSize: 14, color: colors.muted },
});
