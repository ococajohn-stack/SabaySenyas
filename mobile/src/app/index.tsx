import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../theme';

const FEATURES = ['Interaktibong Aralin', 'Komunidad', 'Mga Batayang Senyas'];
const WELCOME_VIDEO = require('../../assets/videos/kumusta.mp4');

export default function WelcomeScreen() {
  const router = useRouter();
  const player = useVideoPlayer(WELCOME_VIDEO, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <View style={styles.icon}>
            <Ionicons name="hand-left-outline" size={26} color={colors.onPrimary} />
          </View>
          <Text style={styles.title}>SabaySenyas</Text>
          <Text style={styles.subtitle}>Matuto ng Filipino Sign Language, nang magkasama.</Text>
        </View>

        <View style={styles.preview}>
          <VideoView
            player={player}
            contentFit="cover"
            nativeControls={false}
            style={styles.previewVideo}
          />
          <View style={styles.greetingPill}>
            <Text style={styles.greetingText}>Kumusta! 👋</Text>
          </View>
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.pill}>
              <Text style={styles.pillText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Mag-log In  →" onPress={() => router.push('/login')} />
          <PrimaryButton
            label="Gumawa ng Account"
            variant="secondary"
            onPress={() => router.push({ pathname: '/login', params: { mode: 'signup' } })}
          />
          <PrimaryButton label="Subukan bilang Bisita  ›" variant="secondary" onPress={() => router.push('/home')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  brand: { alignItems: 'center', gap: spacing.sm, backgroundColor: colors.slate, borderRadius: radius.md, padding: spacing.lg },
  icon: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.onPrimary, fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: '#CBD5E1', fontSize: 15, textAlign: 'center' },
  preview: { aspectRatio: 4 / 3, width: '100%', borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  previewVideo: { width: '100%', height: '100%' },
  greetingPill: { position: 'absolute', left: spacing.md, bottom: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: 'rgba(0, 0, 0, 0.68)' },
  greetingText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  features: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.sm },
  pill: { borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  pillText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  actions: { gap: spacing.sm },
});
