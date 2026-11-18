import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLearningState, useSettingsState, useUserState, type LearningPreferences } from '../../components/AppState';
import PrimaryButton from '../../components/PrimaryButton';
import { SIGNS } from '../../data/signs';
import { colors, MIN_TOUCH, radius, spacing } from '../../theme';

const PREFERENCES: {
  key: keyof LearningPreferences;
  title: string;
  description: string;
}[] = [
  { key: 'subtitlesByDefault', title: 'Subtitles (CC) by Default', description: 'Show sign captions when a video opens.' },
  { key: 'hapticFeedback', title: 'Haptic Feedback', description: 'Feel a light vibration for button feedback.' },
  { key: 'defaultSlowMotion', title: 'Default Slow-Motion (0.5x)', description: 'Start sign videos at a slower speed.' },
  { key: 'voicePronunciation', title: 'Voice Pronunciation', description: 'Show spoken word pronunciation controls.' },
];

const ETIQUETTE_TIPS = [
  { title: 'Keep visual attention', body: 'Face your conversation partner and maintain comfortable eye contact while signing.' },
  { title: 'Use facial expressions', body: 'Facial expressions help communicate meaning and tone. Keep them natural and clear.' },
  { title: 'Give your signing space', body: 'Keep your hands and upper body visible, with enough space to make each sign clearly.' },
];

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length > 1
    ? `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase()
    : (words[0]?.slice(0, 2) ?? 'L').toUpperCase();
}

function SettingRow({
  title,
  description,
  value,
  onValueChange,
  last,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last: boolean;
}) {
  return (
    <View style={[styles.settingRow, !last && styles.divider]}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityRole="switch"
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, logOut } = useUserState();
  const { completedLessonIds, learnedSignIds, resetProgress } = useLearningState();
  const { preferences, setPreference, triggerHapticFeedback } = useSettingsState();
  const [editing, setEditing] = useState(false);
  const [showEtiquette, setShowEtiquette] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState('');
  const displayName = user?.name ?? 'Learner';
  const greetingIds = SIGNS.filter((sign) => sign.category === 'Greetings').map((sign) => sign.id);

  const badges = [
    { title: 'First Sign', icon: 'hand-left-outline' as const, earned: learnedSignIds.length > 0 },
    { title: 'Greetings Pro', icon: 'chatbubbles-outline' as const, earned: greetingIds.every((id) => learnedSignIds.includes(id)) },
    { title: 'Quiz Starter', icon: 'school-outline' as const, earned: completedLessonIds.length > 0 },
    { title: 'FSL Ally', icon: 'people-outline' as const, earned: learnedSignIds.length >= SIGNS.length },
  ];

  const beginEditing = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setError('');
    setEditing(true);
  };

  const saveProfile = () => {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter your full name and a valid email address.');
      return;
    }
    updateProfile(name, email);
    setEditing(false);
    setError('');
  };

  const handleLogOut = () => {
    logOut();
    router.replace('/');
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset progress?',
      'This clears learned signs, saved signs, completed lessons, and quiz progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset Progress', style: 'destructive', onPress: resetProgress },
      ],
    );
  };

  const updateSetting = (key: keyof LearningPreferences, value: boolean) => {
    setPreference(key, value);
    if (key === 'hapticFeedback' && value) {
      void Haptics.selectionAsync();
    } else {
      triggerHapticFeedback();
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.pageHeading}>
          <Text style={styles.title}>Profile &amp; Settings</Text>
          <Text style={styles.subtitle}>Your learning journey, your way.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar} accessibilityLabel={`${getInitials(displayName)} profile initials`}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.email} numberOfLines={1}>{user?.email ?? 'Guest learner'}</Text>
              <View style={styles.levelPill}>
                <Text style={styles.levelText}>FSL Beginner</Text>
              </View>
            </View>
          </View>
          <PrimaryButton label="Edit Profile" variant="secondary" onPress={beginEditing} />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionHint}>Earn badges as you learn</Text>
        </View>
        <View style={styles.badgesGrid}>
          {badges.map((badge) => (
            <View key={badge.title} style={[styles.badgeCard, badge.earned && styles.badgeCardEarned]}>
              <View style={[styles.badgeIcon, badge.earned && styles.badgeIconEarned]}>
                <Ionicons name={badge.icon} size={19} color={badge.earned ? colors.onPrimary : colors.muted} />
              </View>
              <Text style={[styles.badgeTitle, !badge.earned && styles.unearnedText]}>{badge.title}</Text>
              <Text style={styles.badgeStatus}>{badge.earned ? 'Earned' : 'Keep learning'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Accessibility &amp; Learning</Text>
        </View>
        <View style={styles.card}>
          {PREFERENCES.map((setting, index) => (
            <SettingRow
              key={setting.key}
              title={setting.title}
              description={setting.description}
              value={preferences[setting.key]}
              onValueChange={(value) => updateSetting(setting.key, value)}
              last={index === PREFERENCES.length - 1}
            />
          ))}
        </View>

        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowEtiquette(true)}
            style={({ pressed }) => [styles.navigationRow, pressed && styles.pressed]}
          >
            <View style={styles.rowIcon}><Ionicons name="heart-outline" size={20} color={colors.text} /></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>FSL Etiquette &amp; Tips</Text>
              <Text style={styles.rowSubtitle}>Helpful reminders for respectful communication</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <View style={styles.rowIcon}><Ionicons name="hand-left-outline" size={20} color={colors.text} /></View>
            <View style={styles.rowCopy}>
              <View style={styles.aboutHeading}>
                <Text style={styles.rowTitle}>About SabaySenyas</Text>
                <Text style={styles.version}>v1.0.0</Text>
              </View>
              <Text style={styles.rowSubtitle}>Learn Filipino Sign Language through visual lessons, practice, and everyday signs.</Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={confirmReset}
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.text} />
          <Text style={styles.resetText}>Reset Progress</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log Out"
          onPress={handleLogOut}
          style={({ pressed }) => [styles.logOut, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Text style={styles.logOutText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={editing} animationType="slide" transparent onRequestClose={() => setEditing(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeading}>
              <View style={styles.modalTitleGroup}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSubtitle}>Update your account details.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close Edit Profile"
                onPress={() => setEditing(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              accessibilityLabel="Full Name"
              autoCapitalize="words"
              autoComplete="name"
              placeholder="Your full name"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={name}
              onChangeText={(value) => { setName(value); setError(''); }}
              returnKeyType="next"
            />
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={email}
              onChangeText={(value) => { setEmail(value); setError(''); }}
              returnKeyType="done"
            />
            {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <PrimaryButton label="Save Changes" onPress={saveProfile} />
              <PrimaryButton label="Cancel" variant="secondary" onPress={() => setEditing(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEtiquette} animationType="fade" transparent onRequestClose={() => setShowEtiquette(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeading}>
              <View style={styles.modalTitleGroup}>
                <Text style={styles.modalTitle}>FSL Etiquette &amp; Tips</Text>
                <Text style={styles.modalSubtitle}>Small habits that support clear communication.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close FSL Etiquette tips"
                onPress={() => setShowEtiquette(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            {ETIQUETTE_TIPS.map((tip, index) => (
              <View key={tip.title} style={styles.tipRow}>
                <View style={styles.tipNumber}><Text style={styles.tipNumberText}>{index + 1}</Text></View>
                <View style={styles.tipCopy}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipBody}>{tip.body}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.disclaimer}>Sign preferences and conventions can vary. Follow the lead of the people you are communicating with.</Text>
            <PrimaryButton label="Got It" onPress={() => setShowEtiquette(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  pageHeading: { gap: spacing.xs, paddingVertical: spacing.xs },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.muted },
  profileCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 68, height: 68, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.onPrimary, fontSize: 23, fontWeight: '700' },
  profileInfo: { flex: 1, gap: spacing.xs },
  name: { color: colors.text, fontSize: 20, fontWeight: '700' },
  email: { color: colors.muted, fontSize: 14 },
  levelPill: { alignSelf: 'flex-start', borderRadius: radius.pill, backgroundColor: colors.bg, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  levelText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  sectionHint: { color: colors.muted, fontSize: 12 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeCard: { width: '48%', minHeight: 112, flexGrow: 1, alignItems: 'flex-start', justifyContent: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm },
  badgeCardEarned: { backgroundColor: colors.surface, borderColor: colors.primary },
  badgeIcon: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  badgeIconEarned: { backgroundColor: colors.primary },
  badgeTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  unearnedText: { color: colors.muted },
  badgeStatus: { color: colors.muted, fontSize: 11 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md },
  settingRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm },
  settingCopy: { flex: 1, gap: 3 },
  settingTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  settingDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  navigationRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aboutRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowIcon: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  aboutHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  version: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  resetButton: { minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  resetText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  logOut: { minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger },
  logOutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  modalBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.38)', padding: spacing.md },
  modalCard: { backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md, gap: spacing.md, maxHeight: '90%' },
  modalHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  modalTitleGroup: { flex: 1, gap: spacing.xs },
  modalTitle: { color: colors.text, fontSize: 21, fontWeight: '700' },
  modalSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  closeButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', marginTop: -spacing.xs, marginRight: -spacing.xs },
  inputLabel: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: -spacing.sm },
  input: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md, color: colors.text, fontSize: 16 },
  error: { color: colors.danger, fontSize: 13 },
  modalActions: { gap: spacing.sm, marginTop: spacing.xs },
  tipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  tipNumber: { width: 28, height: 28, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  tipNumberText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  tipCopy: { flex: 1, gap: spacing.xs },
  tipTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  tipBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.sm },
});
