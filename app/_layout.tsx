import Toast, { ToastConfig } from 'react-native-toast-message';
import { Stack } from "expo-router";
import { AuthProvider } from "../scripts/context/AuthContext";
import { View } from "react-native";
import "./global.css";

export default function RootLayout() {
  return (
   <>
  <AuthProvider>
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(role-selection)" />
        <Stack.Screen name="(sender)" />
        <Stack.Screen name="(transporter)" />
      </Stack>
    </View>
  </AuthProvider>

  
  <Toast />
</>

  );
}