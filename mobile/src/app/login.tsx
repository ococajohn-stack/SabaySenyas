import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserState } from '../components/AppState';
import PrimaryButton from '../components/PrimaryButton';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

export default function LoginScreen() {
  const router = useRouter();
  const { logIn, updateProfile } = useUserState();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const creatingAccount = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if ((creatingAccount && !name.trim()) || !/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 6) {
      setError(creatingAccount
        ? 'Enter your full name, a valid email, and a password with at least 6 characters.'
        : 'Enter a valid email and a password with at least 6 characters.');
      return;
    }
    setError('');
    if (creatingAccount) {
      updateProfile(name, email);
    } else {
      logIn(email);
    }
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.heading}>
          <Text style={styles.brand}>SABAYSENYAS</Text>
          <Text style={styles.badge}>AUTHENTICATION</Text>
          <Text style={styles.title}>{creatingAccount ? 'Create account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>{creatingAccount ? 'Start learning FSL today.' : 'Log in to continue learning.'}</Text>
        </View>

        <View style={styles.fieldGroup}>
          {creatingAccount ? (
            <>
              <Text style={styles.label}>Full Name</Text>
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
            </>
          ) : null}
          <Text style={styles.label}>Email</Text>
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
            returnKeyType="next"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            accessibilityLabel="Password"
            autoCapitalize="none"
            placeholder="At least 6 characters"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={(value) => { setPassword(value); setError(''); }}
            returnKeyType="done"
          />
          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label={creatingAccount ? 'Create Account  →' : 'Log In  →'} onPress={submit} />
          <PrimaryButton label="Continue as guest" variant="secondary" onPress={() => router.replace('/home')} />
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={20} color={colors.muted} />
          <Text style={styles.noticeText}>Guest mode lets you explore lessons and signs. Your progress is kept on this device for this session.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.lg },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  heading: { gap: spacing.sm },
  brand: { alignSelf: 'flex-start', borderRadius: radius.pill, backgroundColor: colors.surface, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  badge: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: spacing.sm },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 15 },
  fieldGroup: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
  input: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md, color: colors.text, fontSize: 16 },
  error: { color: colors.text, fontSize: 13 },
  actions: { gap: spacing.sm },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  noticeText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
});
