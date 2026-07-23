import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { fonts, M } from '../../../constants/meridian';

export default function TransporterTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: M.warm2,
        tabBarInactiveTintColor: M.onInkFaint,
        tabBarStyle: {
          backgroundColor: M.ink,
          borderTopWidth: 0,
          height: 66,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontFamily: fonts.display, fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Trips', tabBarIcon: ({ color, size }) => <Feather name="truck" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="add-trip"
        options={{ title: 'Add Trip', tabBarIcon: ({ color, size }) => <Feather name="plus-circle" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
