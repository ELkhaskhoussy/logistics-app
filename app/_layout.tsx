import Toast from "react-native-toast-message";
import { Stack } from "expo-router";
import { AuthProvider } from "../scripts/context/AuthContext"; // ✅ ADD THIS
import "./global.css";

export default function RootLayout() {
  return (
    <AuthProvider> {/* ✅ WRAP EVERYTHING */}
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(role-selection)" options={{ headerShown: false }} />
          <Stack.Screen name="(sender)" options={{ headerShown: false }} />
          <Stack.Screen name="(transporter)" options={{ headerShown: false }} />
        </Stack>

        <Toast />
      </>
    </AuthProvider>
  );
}