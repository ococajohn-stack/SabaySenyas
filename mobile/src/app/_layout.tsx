import { Stack } from 'expo-router';
import { LearningProvider } from '../components/AppState';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <LearningProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign/[id]" />
        <Stack.Screen name="lesson" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="practice" />
      </Stack>
    </LearningProvider>
  );
}
