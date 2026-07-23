import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { fonts, M } from '../../constants/meridian';

export default function SenderLayout() {
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
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Feather name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
