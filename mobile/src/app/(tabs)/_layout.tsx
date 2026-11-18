import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { colors } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={icon} size={size} color={typeof color === 'number' ? colors.primary : color ?? colors.primary} />
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border, elevation: 0 },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen name="home" options={tab('Home', 'home-outline')} />
      <Tabs.Screen name="dictionary" options={tab('Dictionary', 'book-outline')} />
      <Tabs.Screen name="lessons" options={tab('Lessons', 'school-outline')} />
      <Tabs.Screen name="progress" options={tab('Progress', 'stats-chart-outline')} />
      <Tabs.Screen name="profile" options={tab('Profile', 'person-outline')} />
    </Tabs>
  );
}
