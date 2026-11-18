import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

// Stand-in for the sign video until real clips are added.
export default function VideoPlaceholder({ height = 200, label = 'Video' }: { height?: number; label?: string }) {
  return (
    <View style={[styles.box, { height }]} accessibilityLabel={`${label} placeholder`}>
      <View style={styles.play}>
        <Ionicons name="play" size={22} color={colors.onPrimary} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surface, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 8 },
  play: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, color: colors.muted },
});
