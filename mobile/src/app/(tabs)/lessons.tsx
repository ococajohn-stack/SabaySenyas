import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLearningState } from "../../components/AppState";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, MIN_TOUCH, radius, spacing } from "../../theme";

const UNIT_TITLES = ["Mga Batayan ng FSL", "Pang-araw-araw na Pakikipag-usap", "Mga Tao at Lugar", "Araw-araw na Usapan"];
const BASE_PROGRESS = [4, 4, 3, 3];
const UNITS = [1, 2, 3, 4].map((n) => ({
  id: String(n),
  number: `0${n}`,
  title: UNIT_TITLES[n - 1],
}));

export default function LessonsScreen() {
  const router = useRouter();
  const { lessonsCompleted, completedLessonIds } = useLearningState();
  const unitProgress = BASE_PROGRESS.map((progress, index) => {
    const additional = completedLessonIds.filter((id) => id.startsWith(`unit-${index + 1}-`)).length;
    return Math.min(5, progress + additional);
  });
  const completedUnits = unitProgress.filter((progress) => progress === 5).length;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>Mga Aralin</Text>
          <Text style={styles.subtitle}>
            Linangin ang iyong kakayahan sa Wikang Pasenyas ng Pilipinas (FSL) nang paisa-isang hakbang.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.small}>Kabuuang progreso</Text>
          <Text style={styles.bigText}>{lessonsCompleted} na aralin ang natapos</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(100, lessonsCompleted / 20 * 100)}%` }]} />
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Mga Yunit</Text>
          <Text style={styles.small}>{completedUnits} sa 4 na yunit ang natapos</Text>
        </View>

        {UNITS.map((unit, index) => (
          <Pressable
            key={unit.id}
            style={styles.row}
            onPress={() => router.push({ pathname: "/lesson", params: { unit: unit.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Yunit ${unit.number}, ${unit.title}, ${unitProgress[index]} sa 5 aralin`}
          >
            <View style={styles.number}>
              <Text style={styles.numberText}>{unit.number}</Text>
            </View>
            <View style={styles.unitBody}>
              <View style={styles.unitHeading}>
                <Text style={styles.rowTitle}>{unit.title}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </View>
              <Text style={styles.rowSub}>{unitProgress[index]} sa 5 aralin</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${unitProgress[index] / 5 * 100}%` }]} />
              </View>
            </View>
          </Pressable>
        ))}

        <PrimaryButton
          label="Sanayin ang Lahat ng 9 na Senyas"
          variant="secondary"
          onPress={() => router.push("/practice")}
        />
        <PrimaryButton
          label="Ipagpatuloy ang Pag-aaral  →"
          onPress={() => router.push("/lesson")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  hero: { backgroundColor: colors.slate, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs, elevation: 2 },
  title: { fontSize: 28, fontWeight: "700", color: colors.onPrimary },
  subtitle: { fontSize: 14, color: "#CBD5E1" },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 8,
    marginBottom: spacing.sm,
    elevation: 1,
  },
  small: { fontSize: 12, color: colors.muted },
  bigText: { fontSize: 18, fontWeight: "700", color: colors.text },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: { height: 8, backgroundColor: colors.primary },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    elevation: 1,
  },
  number: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.sm,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: { fontSize: 14, fontWeight: "600", color: colors.text },
  unitBody: { flex: 1, gap: spacing.sm },
  unitHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  rowSub: { fontSize: 14, color: colors.muted },
});
