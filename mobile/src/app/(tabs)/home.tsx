import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLearningState, useUserState } from "../../components/AppState";
import PrimaryButton from "../../components/PrimaryButton";
import SearchField from "../../components/SearchField";
import SignVideo from "../../components/SignVideo";
import { SIGNS } from "../../data/signs";
import { colors, radius, spacing } from "../../theme";

export default function HomeScreen() {
  const router = useRouter();
  const { lessonsCompleted, streak } = useLearningState();
  const { user } = useUserState();
  const featuredSign = SIGNS[0];
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? SIGNS.filter((sign) =>
          `${sign.title} ${sign.meaning}`.toLowerCase().includes(term),
        ).slice(0, 3)
      : [];
  }, [query]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>ESPASYO MO SA PAG-AARAL</Text>
          <Text style={styles.title}>Kumusta, {user?.name ?? "Mag-aaral"}</Text>
          <Text style={styles.subtitle}>
            Handa ka na bang magsanay ng FSL ngayong araw?
          </Text>
        </View>

        <View style={styles.searchGroup}>
          <SearchField
            label="Maghanap ng mga senyas"
            placeholder="Maghanap ng mga senyas..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => router.push("/dictionary")}
          />
          {results.map((sign) => (
            <Pressable
              key={sign.id}
              style={styles.searchResult}
              onPress={() => router.push(`/sign/${sign.id}`)}
            >
              <Text style={styles.resultTitle}>{sign.title}</Text>
              <Text style={styles.resultMeaning}>{sign.meaning}</Text>
            </Pressable>
          ))}
          {query.length > 0 && results.length === 0 ? (
            <Text style={styles.noResults}>Walang katugmang senyas.</Text>
          ) : null}
        </View>
        <View style={styles.card}>
          <View style={styles.sectionHeading}>
            <Text style={styles.heroCardTitle}>Aralin Ngayong Araw</Text>
            <Text style={styles.tag}>YUNIT 1</Text>
          </View>
          <Text style={styles.lessonTitle}>Mga Pang-araw-araw na Pagbati</Text>
          <SignVideo
            videoSource={featuredSign.videoSource}
            title={featuredSign.title}
            meaning={featuredSign.meaning}
            height={160}
            previewLabel="Unang Senyas: Kumusta"
          />
          <PrimaryButton
            label="Simulan ang Aralin  →"
            onPress={() => router.push("/lesson")}
          />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.cardTitle}>Buod ng Iyong Pag-aaral</Text>
          <Pressable onPress={() => router.push("/progress")}>
            <Text style={styles.link}>Tingnan lahat</Text>
          </Pressable>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{lessonsCompleted}</Text>
            <Text style={styles.statCaption}>natapos na aralin</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, styles.streakNum]}>
              {String(streak).padStart(2, "0")}
            </Text>
            <Text style={styles.statCaption}>sunod-sunod na araw</Text>
          </View>
        </View>

        <View style={styles.drill}>
          <View style={styles.drillIcon}>
            <Text style={styles.hand}>A</Text>
          </View>
          <View style={styles.drillCopy}>
            <Text style={styles.cardTitle}>
              Pagsasanay sa Pagbaybay Gamit ang Daliri
            </Text>
            <Text style={styles.subtitle}>
              Sanayin ang alpabeto, isang senyas sa bawat pagkakataon.
            </Text>
          </View>
          <PrimaryButton
            label="Magsanay"
            onPress={() =>
              router.push({ pathname: "/lesson", params: { unit: "1" } })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  greeting: { gap: spacing.xs },
  eyebrow: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: colors.muted },
  searchGroup: { gap: spacing.xs },
  searchResult: {
    minHeight: 44,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTitle: { color: colors.text, fontSize: 14, fontWeight: "600" },
  resultMeaning: { color: colors.muted, fontSize: 13 },
  noResults: { color: colors.muted, fontSize: 13, padding: spacing.sm },
  card: {
    backgroundColor: colors.slate,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    elevation: 2,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  heroCardTitle: { fontSize: 16, fontWeight: "600", color: colors.onPrimary },
  lessonTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.onPrimary,
    marginTop: -spacing.sm,
  },
  tag: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 1,
  },
  link: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    elevation: 1,
  },
  statNum: { fontSize: 26, fontWeight: "700", color: colors.text },
  streakNum: { color: colors.accent },
  statCaption: { fontSize: 12, color: colors.muted },
  drill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  drillIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  hand: { color: colors.text, fontSize: 20, fontWeight: "700" },
  drillCopy: { gap: spacing.xs },
});
