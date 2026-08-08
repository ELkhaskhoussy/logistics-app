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

/** Phone/tablet browser? Decides popup vs full-page redirect (see below). */
function isMobileWeb(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent);
}

function randomToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Keys used to carry CSRF/replay protection across the redirect. */
export const GOOGLE_STATE_KEY = "google_oauth_state";
export const GOOGLE_NONCE_KEY = "google_oauth_nonce";

/**
 * Send the whole tab to Google instead of opening a popup.
 *
 * Why: expo-auth-session's web flow always calls window.open(). On a phone that
 * opens a *new tab*, and while the user picks an account the OS routinely
 * discards the original tab to free memory. On return the opener is gone, the
 * token is never delivered, and the app boots fresh on the landing page — which
 * is exactly the "I have to click Se connecter again" symptom.
 *
 * A full-page redirect has no second tab, no opener and no postMessage, so
 * there is nothing to lose. Google returns to "/" with #id_token=..., which
 * app/index.tsx already knows how to exchange.
 */
function startGoogleRedirect(): null {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  if (!clientId || typeof window === "undefined") return null;

  const state = randomToken();
  // Google requires a nonce for the id_token (implicit) response type.
  const nonce = randomToken();
  try {
    sessionStorage.setItem(GOOGLE_STATE_KEY, state);
    sessionStorage.setItem(GOOGLE_NONCE_KEY, nonce);
  } catch {
    // Private mode can block sessionStorage — sign-in still works, we just
    // cannot verify state on return.
  }

  const params = new URLSearchParams({
    client_id: clientId,
    // Must match the origin already authorised in the Google console, which is
    // what the desktop popup flow uses too.
    redirect_uri: window.location.origin,
    response_type: "id_token",
    scope: "openid profile email",
    nonce,
    state,
    prompt: "select_account",
  });

  window.location.assign(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  return null;
}

// ─── Web implementation ────────────────────────────────────────────────────
function useGoogleAuthWeb() {
  // Dynamic require avoids the module being bundled for native
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Google = require("expo-auth-session/providers/google");

  const redirectUri =
    typeof window !== "undefined" ? window.location.origin : "";

  const [, response, expoPromptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
    redirectUri,
  });

  // Desktop keeps the popup (it works and preserves the current page).
  // Mobile takes the redirect path.
  const promptAsync = async (...args: unknown[]) => {
    if (isMobileWeb()) return startGoogleRedirect();
    return expoPromptAsync(...args);
  };

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
