import Toast from 'react-native-toast-message';
import { Stack } from "expo-router";
import { AuthProvider } from "../scripts/context/AuthContext";
import { View } from "react-native";
import "./global.css";

// Force Expo Router to always start from the index route.
// Without this, Expo Router restores the last visited screen from AsyncStorage,
// which caused the app to bypass login and land directly on /(sender)/search.
export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  return (
   <>
  <AuthProvider>
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(role-selection)" />
        <Stack.Screen name="(sender)" />
        <Stack.Screen name="(transporter)" />
        <Stack.Screen name="shipment/[id]" />
      </Stack>
    </View>
  </AuthProvider>

  
  <Toast />
</>

  );
}