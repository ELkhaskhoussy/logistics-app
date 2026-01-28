import { Feather } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useAuth } from "../../scripts/context/AuthContext";
import { useEffect } from "react";

export default function SenderLayout() {

  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/(auth)/login" as any);
    }
  }, [token, loading]);

  if (loading) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="results"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="transporter-profile"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="transporter"
        options={{ href: null }}
      />
    </Tabs>
  );
}
