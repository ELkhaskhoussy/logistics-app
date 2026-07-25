import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useAuth } from "../scripts/context/AuthContext";
import LandingScreen from "../components/LandingScreen";
import { authenticateWithGoogle, registerWithGoogle } from "./services/auth";
import { saveGoogleUser } from "./utils/tokenStorage";

/**
 * App entry point.
 *
 * Normally this just redirects to login. But on mobile web the Google OAuth
 * flow is a full-page redirect that lands back here at "/" with the id_token
 * in the URL fragment (e.g. "/#id_token=..."). The previous unconditional
 * <Redirect> navigated away before anything could read that fragment, so the
 * token was lost and the user bounced back to login.
 *
 * Here we intercept that returning token and exchange it with the backend.
 * We only do this when we are NOT inside an OAuth popup: on desktop the flow
 * runs in a popup (window.opener is set) that hands the result back to the
 * original tab via expo-auth-session, so in that case we fall through to the
 * normal redirect and let the login screen finish the sign-in.
 */

function getHashParams(): URLSearchParams | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return raw ? new URLSearchParams(raw) : null;
}

function isOAuthPopup(): boolean {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    !!window.opener &&
    window.opener !== window
  );
}

function getReturnedIdToken(): string | null {
  if (isOAuthPopup()) return null; // let the popup path complete normally
  return getHashParams()?.get("id_token") ?? null;
}

export default function Index() {
  const router = useRouter();
  const { login, token, role, loading } = useAuth();
  // Compute on first render so we never flash the <Redirect> (which would
  // navigate away and discard the token) when a token is present.
  const [processing] = useState(() => getReturnedIdToken() !== null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const idToken = getReturnedIdToken();
    if (!idToken) return;
    handled.current = true;

    // Strip the token from the URL so it isn't reprocessed or left in history.
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }

    (async () => {
      try {
        const data = await authenticateWithGoogle(idToken);

        if (data.needsRoleSelection) {
          // Public signup is Sender-only — register the Google user as SENDER.
          const senderData = await registerWithGoogle({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            imageUrl: data.imageUrl,
            role: "SENDER",
          });
          await login(senderData);
          router.replace("/search");
          return;
        }

        if (data.token) {
          await login(data);
          if (data.userRole === "SENDER") {
            router.replace("/search");
          } else if (data.userRole === "TRANSPORTER") {
            router.replace("/dashboard");
          } else {
            router.replace("/(auth)/login");
          }
          return;
        }

        router.replace("/(auth)/login");
      } catch (err) {
        console.error("Google login error:", err);
        router.replace("/(auth)/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (processing || loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0A1626" }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  // Logged-in users skip the landing and go straight to their space.
  if (token) {
    return <Redirect href={role === "TRANSPORTER" ? "/dashboard" : "/search"} />;
  }

  // Guests see the public landing page (browse-before-signup).
  return <LandingScreen />;
}
