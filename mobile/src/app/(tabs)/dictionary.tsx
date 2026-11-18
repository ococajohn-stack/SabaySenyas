import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchField from '../../components/SearchField';
import { CATEGORIES, SIGNS } from '../../data/signs';
import { colors, MIN_TOUCH, radius, spacing } from '../../theme';

export default function DictionaryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('Lahat');
  const [ascending, setAscending] = useState(true);

  const results = useMemo(
    () => SIGNS
      .filter((sign) => (category === 'Lahat' || sign.category === category)
        && `${sign.title} ${sign.meaning}`.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => ascending ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)),
    [query, category, ascending],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={results}
        keyExtractor={(sign) => sign.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.hero}>
              <Text style={styles.title}>Diksiyonaryo</Text>
              <Text style={styles.subtitle}>Tuklasin ang mga senyas sa Wikang Pasenyas ng Pilipinas (FSL)</Text>
            </View>
            <SearchField label="Maghanap sa diksiyonaryo" placeholder="Maghanap ng mga senyas..." value={query} onChangeText={setQuery} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {['Lahat', ...CATEGORIES].map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.resultsHeading}>
              <Text style={styles.count}>Mga senyas ({results.length})</Text>
              <Pressable onPress={() => setAscending((value) => !value)} style={styles.sort} accessibilityRole="button">
                <Text style={styles.sortText}>{ascending ? 'A–Z' : 'Z–A'}</Text>
                <Ionicons name={ascending ? 'arrow-down' : 'arrow-up'} size={15} color={colors.text} />
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Walang nahanap na senyas. Sumubok ng ibang salita o kategorya.</Text>}
        renderItem={({ item, index }) => (
          <Pressable
            style={[styles.row, index === results.length - 1 && styles.lastRow]}
            onPress={() => router.push(`/sign/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.meaning}`}
          >
            <View style={styles.thumb}>
              <Ionicons name="hand-left-outline" size={20} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowSub}>{item.meaning}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.sm, paddingBottom: spacing.md },
  hero: { backgroundColor: colors.slate, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs, elevation: 2 },
  title: { fontSize: 28, fontWeight: '700', color: colors.onPrimary },
  subtitle: { fontSize: 14, color: '#CBD5E1' },
  chips: { gap: spacing.sm, paddingVertical: spacing.sm },
  chip: { minHeight: MIN_TOUCH, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.onPrimary },
  resultsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  sort: { minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  sortText: { fontSize: 13, fontWeight: '600', color: colors.text },
  count: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  empty: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 72, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, elevation: 1 },
  lastRow: { marginBottom: spacing.sm },
  separator: { height: spacing.sm },
  thumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 14, color: colors.muted },
});
