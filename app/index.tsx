import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { getToken, getUserRole } from "./utils/tokenStorage";

export default function Index() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const token = await getToken();
      const role = await getUserRole();

      if (!token) {
        setRedirectTo("/(auth)/login");
        return;
      }

      if (role === "TRANSPORTER") {
        setRedirectTo("/(transporter)/dashboard");
      } else {
        setRedirectTo("/(sender)/search");
      }
    };

    init();
  }, []);

  if (!redirectTo) return null;

  return <Redirect href={redirectTo as any} />;
}
