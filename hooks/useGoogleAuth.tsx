import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {

  const redirectUri = window.location.origin;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "780914339608-eba2vlf90sluifam0pfpd0dh0iic7i5d.apps.googleusercontent.com",

    scopes: ["openid", "profile", "email"],
    responseType: "id_token",

    redirectUri,
  });

  return { promptAsync };
}
