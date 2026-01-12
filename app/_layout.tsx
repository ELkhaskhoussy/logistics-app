import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(role-selection)" options={{ headerShown: false }} />
            <Stack.Screen name="(sender)" options={{ headerShown: false }} />
            <Stack.Screen name="(transporter)" options={{ headerShown: false }} />
        </Stack>
    );
}
