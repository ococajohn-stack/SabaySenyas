import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { colors } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons
        name={icon}
        size={size}
        color={focused ? colors.onPrimary : typeof color === 'number' ? colors.primary : color ?? colors.primary}
      />
    </View>
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 70, paddingTop: 7, paddingBottom: 8, backgroundColor: colors.card, borderTopColor: colors.border, elevation: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home" options={tab('Tahanan', 'home-outline')} />
      <Tabs.Screen name="dictionary" options={tab('Diksiyonaryo', 'book-outline')} />
      <Tabs.Screen name="lessons" options={tab('Aralin', 'school-outline')} />
      <Tabs.Screen name="progress" options={tab('Progreso', 'stats-chart-outline')} />
      <Tabs.Screen name="profile" options={tab('Profile', 'person-outline')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: { width: 42, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  iconContainerActive: { backgroundColor: colors.primary },
});
