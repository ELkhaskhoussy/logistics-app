import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { getToken, getUserRole } from "./utils/tokenStorage";

export default function Index() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      console.log('[INDEX] 🔍 Loading auth state...');

      const token = await getToken();
      const role = await getUserRole();

      console.log('[INDEX] 🔑 Token exists:', !!token);
      console.log('[INDEX] 👤 Role loaded:', role);
      console.log('[INDEX] 📝 Role type:', typeof role);

      if (!token) {
        console.log('[INDEX] → No token, redirecting to login');
        setRedirectTo("/(auth)/login");
        return;
      }

      // Handle role-based routing
      if (role === "TRANSPORTER") {
        console.log('[INDEX] ✅ Role is TRANSPORTER → dashboard');
        setRedirectTo("/(transporter)/dashboard");
      } else if (role === "SENDER") {
        console.log('[INDEX] ✅ Role is SENDER → search');
        setRedirectTo("/(sender)/search");
      } else {
        // Safe default: redirect to login if role is unknown/missing
        console.warn('[INDEX] ⚠️ Unknown role:', role, '→ redirecting to login');
        setRedirectTo("/(auth)/login");
      }
    };

    init();
  }, []);

  if (!redirectTo) return null;

  return <Redirect href={redirectTo as any} />;
}
