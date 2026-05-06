import { Platform, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

/**
 * Google auth hook — web only.
 *
 * expo-auth-session/providers/google depends on the native `ExpoCryptoAES`
 * module which is NOT included in Expo Go. Importing it unconditionally on
 * native crashes the entire app before any screen renders.
 *
 * Solution: lazy-import the Google provider only on web; on native (Expo Go
 * or bare) return a no-op promptAsync so the rest of the app works fine.
 */

// ─── Web implementation ────────────────────────────────────────────────────
function useGoogleAuthWeb() {
  // Dynamic require avoids the module being bundled for native
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Google = require("expo-auth-session/providers/google");

  const redirectUri =
    typeof window !== "undefined" ? window.location.origin : "";

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "780914339608-eba2vlf90sluifam0pfpd0dh0iic7i5d.apps.googleusercontent.com",
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
    redirectUri,
  });

  return { promptAsync, response };
}

// ─── Native stub (Expo Go / bare) ─────────────────────────────────────────
function useGoogleAuthNative() {
  const promptAsync = async () => {
    Alert.alert(
      "Google Sign-In Unavailable",
      "Google Sign-In requires a development build and is not supported in Expo Go.\n\nPlease use your email and password to sign in.",
      [{ text: "OK" }]
    );
    return null;
  };
  return { promptAsync, response: null };
}

// ─── Export the right one ──────────────────────────────────────────────────
export const useGoogleAuth =
  Platform.OS === "web" ? useGoogleAuthWeb : useGoogleAuthNative;

