import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function SenderLayout() {
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
            {/* Hide results from tabs - now integrated in search screen */}
            <Tabs.Screen
                name="results"
                options={{
                    href: null,
                }}
            />
            {/* Hide transporter-profile from tabs */}
            <Tabs.Screen
                name="transporter-profile"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="transporter"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
