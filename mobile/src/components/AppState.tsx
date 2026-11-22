import * as Haptics from 'expo-haptics';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type LearningState = {
  lessonsCompleted: number;
  completedLessonIds: string[];
  streak: number;
  learnedSignIds: string[];
  savedSignIds: string[];
  completeLesson: (lessonId: string) => void;
  markSignLearned: (signId: string) => void;
  toggleSavedSign: (signId: string) => void;
  resetProgress: () => void;
};

export type LearningPreferences = {
  subtitlesByDefault: boolean;
  hapticFeedback: boolean;
  defaultSlowMotion: boolean;
  voicePronunciation: boolean;
};

type SettingsState = {
  preferences: LearningPreferences;
  setPreference: <Key extends keyof LearningPreferences>(key: Key, value: LearningPreferences[Key]) => void;
  triggerHapticFeedback: () => void;
};

export type UserProfile = {
  name: string;
  nickname: string;
  email: string;
  fslLevel: FslLevel;
  dailyGoal: DailyGoal;
};

export type FslLevel = 'Baguhan' | 'May Kaalaman' | 'Sanay';
export type DailyGoal = '5 min/araw' | '10 min/araw' | '15 min/araw';
export type UserRegistrationDetails = {
  nickname: string;
  fslLevel: FslLevel;
  dailyGoal: DailyGoal;
};

type UserState = {
  user: UserProfile | null;
  logIn: (email: string) => void;
  updateProfile: (name: string, email: string, details?: UserRegistrationDetails) => void;
  logOut: () => void;
};

const LearningContext = createContext<LearningState | null>(null);
const UserContext = createContext<UserState | null>(null);
const SettingsContext = createContext<SettingsState | null>(null);

function displayNameFromEmail(email: string) {
  const prefix = email.split('@')[0]?.split('+')[0]?.replace(/[._-]+/g, ' ').trim();
  return prefix
    ? prefix.split(/\s+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    : 'Mag-aaral';
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [savedSignIds, setSavedSignIds] = useState<string[]>([]);
  const [learnedSignIds, setLearnedSignIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accountProfiles, setAccountProfiles] = useState<Record<string, UserProfile>>({});
  const [preferences, setPreferences] = useState<LearningPreferences>({
    subtitlesByDefault: true,
    hapticFeedback: false,
    defaultSlowMotion: false,
    voicePronunciation: true,
  });

  const value = useMemo<LearningState>(
    () => ({
      lessonsCompleted: completedLessonIds.length,
      completedLessonIds,
      streak,
      learnedSignIds,
      savedSignIds,
      completeLesson: (lessonId) => {
        if (!completedLessonIds.includes(lessonId)) {
          setCompletedLessonIds((ids) => [...ids, lessonId]);
          setStreak(1);
        }
      },
      markSignLearned: (signId) => {
        setLearnedSignIds((ids) => ids.includes(signId) ? ids : [...ids, signId]);
      },
      toggleSavedSign: (signId) => {
        setSavedSignIds((ids) => ids.includes(signId) ? ids.filter((id) => id !== signId) : [...ids, signId]);
        setLearnedSignIds((ids) => ids.includes(signId) ? ids : [...ids, signId]);
      },
      resetProgress: () => {
        setCompletedLessonIds([]);
        setSavedSignIds([]);
        setLearnedSignIds([]);
        setStreak(0);
      },
    }),
    [completedLessonIds, learnedSignIds, savedSignIds, streak],
  );

  const settingsValue = useMemo<SettingsState>(() => ({
    preferences,
    setPreference: (key, nextValue) => {
      setPreferences((currentPreferences) => ({ ...currentPreferences, [key]: nextValue }));
    },
    triggerHapticFeedback: () => {
      if (preferences.hapticFeedback) void Haptics.selectionAsync();
    },
  }), [preferences]);

  const userValue = useMemo<UserState>(() => ({
    user,
    logIn: (email) => {
      const normalizedEmail = email.trim().toLowerCase();
      setUser(accountProfiles[normalizedEmail] ?? {
        name: displayNameFromEmail(normalizedEmail),
        nickname: displayNameFromEmail(normalizedEmail),
        email: normalizedEmail,
        fslLevel: 'Baguhan',
        dailyGoal: '5 min/araw',
      });
    },
    updateProfile: (name, email, details) => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim();
      setAccountProfiles((accounts) => {
        const nextProfile: UserProfile = {
          name: normalizedName,
          nickname: details?.nickname.trim() || user?.nickname || normalizedName,
          email: normalizedEmail,
          fslLevel: details?.fslLevel ?? user?.fslLevel ?? 'Baguhan',
          dailyGoal: details?.dailyGoal ?? user?.dailyGoal ?? '5 min/araw',
        };
        const nextAccounts = { ...accounts, [normalizedEmail]: nextProfile };
        if (user && user.email !== normalizedEmail) delete nextAccounts[user.email];
        return nextAccounts;
      });
      setUser({
        name: normalizedName,
        nickname: details?.nickname.trim() || user?.nickname || normalizedName,
        email: normalizedEmail,
        fslLevel: details?.fslLevel ?? user?.fslLevel ?? 'Baguhan',
        dailyGoal: details?.dailyGoal ?? user?.dailyGoal ?? '5 min/araw',
      });
    },
    logOut: () => setUser(null),
  }), [accountProfiles, user]);

  return (
    <SettingsContext.Provider value={settingsValue}>
      <UserContext.Provider value={userValue}>
        <LearningContext.Provider value={value}>{children}</LearningContext.Provider>
      </UserContext.Provider>
    </SettingsContext.Provider>
  );
}

export function useLearningState() {
  const state = useContext(LearningContext);
  if (!state) throw new Error('useLearningState must be used inside LearningProvider.');
  return state;
}

export function useUserState() {
  const state = useContext(UserContext);
  if (!state) throw new Error('useUserState must be used inside LearningProvider.');
  return state;
}

export function useSettingsState() {
  const state = useContext(SettingsContext);
  if (!state) throw new Error('useSettingsState must be used inside LearningProvider.');
  return state;
}
