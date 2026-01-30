import * as Google from "expo-auth-session/providers/google";
<<<<<<< HEAD
import * as WebBrowser from "expo-web-browser";
=======
>>>>>>> 234c6a2 (Continue with google+updated profiles)

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {

  const redirectUri = window.location.origin;

<<<<<<< HEAD
  console.log('🔐 [GOOGLE-AUTH] Redirect URI:', redirectUri);
  console.log('🔐 [GOOGLE-AUTH] Client ID:', '780914339608-eba2vlf90sluifam0pfpd0dh0iic7i5d.apps.googleusercontent.com');

=======
>>>>>>> 234c6a2 (Continue with google+updated profiles)
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "780914339608-eba2vlf90sluifam0pfpd0dh0iic7i5d.apps.googleusercontent.com",

    scopes: ["openid", "profile", "email"],
    responseType: "id_token",

    redirectUri,
  });

<<<<<<< HEAD
  // Log when response changes
  if (response) {
    console.log('🔐 [GOOGLE-AUTH] Response received:', response.type);
    if (response.type === 'error') {
      console.error('🔐 [GOOGLE-AUTH] Error:', response.error);
    }
  }

  return { promptAsync, response };
=======
  return { promptAsync };
>>>>>>> 234c6a2 (Continue with google+updated profiles)
}
