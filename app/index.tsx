import { Redirect } from "expo-router";

/**
 * App entry point — always redirect to login.
 * After the user authenticates, the login screen redirects
 * them to the correct dashboard based on their role.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
