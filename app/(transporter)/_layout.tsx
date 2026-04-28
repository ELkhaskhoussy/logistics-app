import { Stack } from 'expo-router';

export default function TransporterLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
                name="trip-details"
                options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            />
        </Stack>
    );
}
