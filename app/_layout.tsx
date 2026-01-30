import Toast from "react-native-toast-message";
import { Stack } from "expo-router";
import { AuthProvider } from "../scripts/context/AuthContext";

import "./global.css";

export default function RootLayout() {
  return (
    <>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>

      <Toast />
    </>
  );
}
