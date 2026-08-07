import Toast from 'react-native-toast-message';
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { AuthProvider } from "../scripts/context/AuthContext";
import { View } from "react-native";
import "./global.css";

// MUST run at the root, not inside a screen.
// The Google OAuth popup returns to "/" (index), which never imports the
// useGoogleAuth hook — so calling this there meant the popup never completed:
// it just rendered the landing page and hung. Calling it here guarantees the
// popup closes and posts the token back to the opener, whatever route it lands on.
WebBrowser.maybeCompleteAuthSession();

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
        <Stack.Screen name="notifications" />
      </Stack>
    </View>
  </AuthProvider>

  
  <Toast />
</>

  );
}