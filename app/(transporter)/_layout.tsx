import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TransporterLayout() {
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
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add-trip"
                options={{
                    title: 'Add Trip',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="plus-circle" size={size} color={color} />
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
        </Tabs>
    );
}
