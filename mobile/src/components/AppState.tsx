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
  email: string;
};

type UserState = {
  user: UserProfile | null;
  logIn: (email: string) => void;
  updateProfile: (name: string, email: string) => void;
  logOut: () => void;
};

const LearningContext = createContext<LearningState | null>(null);
const UserContext = createContext<UserState | null>(null);
const SettingsContext = createContext<SettingsState | null>(null);

function displayNameFromEmail(email: string) {
  const prefix = email.split('@')[0]?.split('+')[0]?.replace(/[._-]+/g, ' ').trim();
  return prefix
    ? prefix.split(/\s+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    : 'Learner';
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [savedSignIds, setSavedSignIds] = useState<string[]>([]);
  const [learnedSignIds, setLearnedSignIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accountNames, setAccountNames] = useState<Record<string, string>>({});
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
      setUser({
        name: accountNames[normalizedEmail] ?? displayNameFromEmail(normalizedEmail),
        email: normalizedEmail,
      });
    },
    updateProfile: (name, email) => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim();
      setAccountNames((accounts) => {
        const nextAccounts = { ...accounts, [normalizedEmail]: normalizedName };
        if (user && user.email !== normalizedEmail) delete nextAccounts[user.email];
        return nextAccounts;
      });
      setUser({ name: normalizedName, email: normalizedEmail });
    },
    logOut: () => setUser(null),
  }), [accountNames, user]);

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
