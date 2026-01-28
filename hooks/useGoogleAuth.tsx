import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useAuth } from "../scripts/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

type GooglePayload = {
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

export function useGoogleAuth() {
  const { login } = useAuth();
  const router = useRouter();

  const redirectUri = window.location.origin;


  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "780914339608-eba2vlf90sluifam0pfpd0dh0iic7i5d.apps.googleusercontent.com",

    scopes: ["openid", "profile", "email"],
    responseType: "id_token",

    extraParams: {
      nonce: "nonce",
    },

    redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      sendTokenToBackend();
    }
  }, [response]);

  const sendTokenToBackend = async () => {
  try {

    const idToken = (response as any)?.params?.id_token;

    if (!idToken) return;

    const res = await fetch("http://192.168.1.19:8081/users/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
      }),
    });

    const data = await res.json();

    console.log("🚀 BACKEND RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data.message || "Google login failed");
    }

    // Save google user for prefilling
    if (data.email) {
      localStorage.setItem(
        "googleUser",
        JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          imageUrl: data.imageUrl,
        })
      );
    }

    //  SINGLE SOURCE OF TRUTH
    switch (data.nextStep) {

      case "ROLE_SELECTION":
        router.replace("/role-selection");
        break;

      case "COMPLETE_PROFILE":
        router.replace(
          data.userRole === "SENDER"
            ? "/register-sender"
            : "/register-transporter"
        );
        break;

      case "SEARCH":
        login(data);
        router.replace("/search");
        break;

      case "DASHBOARD":
        login(data);
        router.replace("/dashboard");
        break;

      default:
        console.error("Unknown nextStep:", data.nextStep);
    }

  } catch (error) {
    console.error("❌ Google login error:", error);
  }
};


  return { promptAsync };
}
