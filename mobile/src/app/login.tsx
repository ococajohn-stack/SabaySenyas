import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserState, type DailyGoal, type FslLevel } from '../components/AppState';
import PrimaryButton from '../components/PrimaryButton';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

export default function LoginScreen() {
  const router = useRouter();
  const { logIn, updateProfile } = useUserState();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const creatingAccount = mode === 'signup';
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fslLevel, setFslLevel] = useState<FslLevel>('Baguhan');
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>('5 min/araw');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (creatingAccount && (!name.trim() || !nickname.trim())) {
      setError('Ilagay ang buong pangalan at palayaw.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Ilagay ang wastong adres ng email.');
      return;
    }
    if (password.length < 6) {
      setError('Ang kontrasenyas ay dapat may hindi bababa sa 6 na karakter.');
      return;
    }
    if (creatingAccount && password !== confirmPassword) {
      setError('Hindi magkatugma ang dalawang kontrasenyas.');
      return;
    }
    if (creatingAccount && !acceptedTerms) {
      setError('Sumang-ayon muna sa Mga Tuntunin at Patakaran sa Privacy.');
      return;
    }
    setError('');
    if (creatingAccount) {
      updateProfile(name, email, { nickname, fslLevel, dailyGoal });
    } else {
      logIn(email);
    }
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Bumalik" style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.heading}>
          <Text style={styles.brand}>SABAYSENYAS</Text>
          <Text style={styles.badge}>{creatingAccount ? 'PAGPAPAREHISTRO' : 'PAGPAPATUNAY NG PAGKAKAKILANLAN'}</Text>
          <Text style={styles.title}>{creatingAccount ? 'Gumawa ng account' : 'Maligayang pagbabalik'}</Text>
          <Text style={styles.subtitle}>{creatingAccount ? 'Simulan ang pag-aaral ng FSL ngayon.' : 'Mag-log In upang ipagpatuloy ang pag-aaral.'}</Text>
        </View>

        <View style={styles.fieldGroup}>
          {creatingAccount ? (
            <>
              <Text style={styles.label}>Buong pangalan</Text>
              <TextInput
                accessibilityLabel="Buong pangalan"
                autoCapitalize="words"
                autoComplete="name"
                placeholder="Ilagay ang buong pangalan"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={name}
                onChangeText={(value) => { setName(value); setError(''); }}
                returnKeyType="next"
              />
              <Text style={styles.label}>Palayaw / Pangalan sa App</Text>
              <TextInput
                accessibilityLabel="Palayaw / Pangalan sa App"
                autoCapitalize="words"
                placeholder="Halimbawa: Juan"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={nickname}
                onChangeText={(value) => { setNickname(value); setError(''); }}
                returnKeyType="next"
              />
            </>
          ) : null}
          <Text style={styles.label}>Adres ng email</Text>
          <TextInput
            accessibilityLabel="Adres ng email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="halimbawa@halimbawa.ph"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
            onChangeText={(value) => { setEmail(value); setError(''); }}
            returnKeyType="next"
          />
          <Text style={styles.label}>Kontrasenyas</Text>
          <View style={styles.passwordInput}>
            <TextInput
              accessibilityLabel="Kontrasenyas"
              autoCapitalize="none"
              autoComplete={creatingAccount ? 'new-password' : 'current-password'}
              placeholder="Hindi bababa sa 6 na karakter"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              style={styles.passwordTextInput}
              value={password}
              onChangeText={(value) => { setPassword(value); setError(''); }}
              returnKeyType={creatingAccount ? 'next' : 'done'}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Itago ang kontrasenyas' : 'Ipakita ang kontrasenyas'}
              onPress={() => setShowPassword((visible) => !visible)}
              style={styles.eyeButton}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.muted} />
            </Pressable>
          </View>
          {creatingAccount ? (
            <>
              <Text style={styles.label}>Kumpirmahin ang kontrasenyas</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  accessibilityLabel="Kumpirmahin ang kontrasenyas"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  placeholder="Ilagay muli ang kontrasenyas"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordTextInput}
                  value={confirmPassword}
                  onChangeText={(value) => { setConfirmPassword(value); setError(''); }}
                  returnKeyType="done"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? 'Itago ang kontrasenyas' : 'Ipakita ang kontrasenyas'}
                  onPress={() => setShowConfirmPassword((visible) => !visible)}
                  style={styles.eyeButton}
                >
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.muted} />
                </Pressable>
              </View>

              <Text style={styles.label}>Antas sa FSL</Text>
              <View style={styles.chipRow}>
                {(['Baguhan', 'May Kaalaman', 'Sanay'] as const).map((level) => (
                  <Pressable
                    key={level}
                    accessibilityRole="button"
                    accessibilityState={{ selected: fslLevel === level }}
                    onPress={() => setFslLevel(level)}
                    style={[styles.choiceChip, fslLevel === level && styles.choiceChipSelected]}
                  >
                    <Text style={[styles.choiceText, fslLevel === level && styles.choiceTextSelected]}>{level}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Pang-araw-araw na Layunin</Text>
              <View style={styles.chipRow}>
                {(['5 min/araw', '10 min/araw', '15 min/araw'] as const).map((goal) => (
                  <Pressable
                    key={goal}
                    accessibilityRole="button"
                    accessibilityState={{ selected: dailyGoal === goal }}
                    onPress={() => setDailyGoal(goal)}
                    style={[styles.choiceChip, dailyGoal === goal && styles.choiceChipSelected]}
                  >
                    <Text style={[styles.choiceText, dailyGoal === goal && styles.choiceTextSelected]}>{goal}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                onPress={() => { setAcceptedTerms((checked) => !checked); setError(''); }}
                style={styles.termsRow}
              >
                <Ionicons
                  name={acceptedTerms ? 'checkbox' : 'square-outline'}
                  size={23}
                  color={acceptedTerms ? colors.primary : colors.muted}
                />
                <Text style={styles.termsText}>Sumasang-ayon ako sa Mga Tuntunin at Patakaran sa Privacy ng SabaySenyas.</Text>
              </Pressable>
            </>
          ) : null}
          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label={creatingAccount ? 'Gumawa ng Account  →' : 'Mag-log In  →'} onPress={submit} />
          <PrimaryButton label="Magpatuloy bilang bisita" variant="secondary" onPress={() => router.replace('/home')} />
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={20} color={colors.muted} />
          <Text style={styles.noticeText}>Sa paggamit bilang bisita, maaari mong tingnan ang mga aralin at senyas. Nananatili sa aparatong ito ang iyong progreso habang ginagamit ang app.</Text>
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
  input: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, color: colors.text, fontSize: 16 },
  passwordInput: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  passwordTextInput: { flex: 1, minHeight: 50, paddingHorizontal: spacing.md, color: colors.text, fontSize: 16 },
  eyeButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  choiceChip: { minHeight: 40, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: colors.card, paddingHorizontal: spacing.sm },
  choiceChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  choiceTextSelected: { color: colors.onPrimary },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  termsText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
  error: { color: colors.danger, fontSize: 13 },
  actions: { gap: spacing.sm },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  noticeText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
});
