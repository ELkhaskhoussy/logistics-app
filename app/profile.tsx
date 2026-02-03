import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { getUserRole } from "./utils/tokenStorage";

/**
 * Smart profile router - redirects to the correct role-specific profile page
 * This handles the ambiguous /profile URL by checking the user's role
 */
export default function ProfileRouter() {
    const [redirectTo, setRedirectTo] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            console.log('[PROFILE-ROUTER] 🔍 Checking user role...');
            const role = await getUserRole();
            console.log('[PROFILE-ROUTER] 👤 Role:', role);

            if (role === "TRANSPORTER") {
                console.log('[PROFILE-ROUTER] ✅ Redirecting to transporter profile');
                setRedirectTo("/(transporter)/profile");
            } else if (role === "SENDER") {
                console.log('[PROFILE-ROUTER] ✅ Redirecting to sender profile');
                setRedirectTo("/(sender)/profile");
            } else {
                console.warn('[PROFILE-ROUTER] ⚠️ Unknown role, redirecting to login');
                setRedirectTo("/(auth)/login");
            }
        };

        init();
    }, []);

    if (!redirectTo) return null;

    return <Redirect href={redirectTo as any} />;
}
