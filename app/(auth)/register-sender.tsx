import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Toast from "react-native-toast-message";

import { registerUser, completeGoogleProfile } from "../services/auth";
import { saveAuthData } from "../utils/tokenStorage";

export default function RegisterSenderScreen() {
  const router = useRouter();
  const { promptAsync } = useGoogleAuth();

  //  Detect Google onboarding user
  const isGoogleUser = !!localStorage.getItem("googleUser");

  const googleUser = isGoogleUser
    ? JSON.parse(localStorage.getItem("googleUser")!)
    : null;

  const [formData, setFormData] = useState({
    name: googleUser ? `${googleUser.firstName} ${googleUser.lastName}` : "",
    email: googleUser ? googleUser.email : "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Toast for Google users
  useEffect(() => {
    if (isGoogleUser) {
      Toast.show({
        type: "info",
        text1: "Complétez votre compte",
        text2: "Veuillez compléter les informations manquantes pour continuer",
        position: "top",
      });
    }
  }, []);

  //  Smart validation
  const validate = () => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.phone) newErrors.phone = true;

    if (!isGoogleUser) {
      if (!formData.name) newErrors.name = true;
      if (!formData.email) newErrors.email = true;
      if (!formData.password) newErrors.password = true;
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = true;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Toast.show({
        type: "error",
        text1: "Informations manquantes",
        text2: "Veuillez remplir tous les champs obligatoires.",
      });
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      //  GOOGLE COMPLETION FLOW
      if (isGoogleUser) {
        const response = await completeGoogleProfile({
          email: formData.email,
          phone: formData.phone,
          role: "SENDER",
        });

        await saveAuthData(
          response.token!,
          response.userRole!,
          response.userId!
        );

        localStorage.removeItem("googleUser");

        Toast.show({
          type: "success",
          text1: "Compte créé avec succès ",
        });

        router.replace("/search");
        return;
      }

      //  NORMAL SIGNUP FLOW
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;

      const response = await registerUser({
        firstName,
        lastName,
        email: formData.email,
        password: formData.password,
        role: "SENDER",
        phone: formData.phone,
      });

      await saveAuthData(
        response.token!,
        response.userRole!,
        response.userId!
      );

      router.replace("/search");

    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    errors[field] && styles.inputError,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Feather name="package" size={32} color="#fff" />
            </View>
            <Text style={styles.title}>Sender Registration</Text>
          </View>

          <View style={styles.content}>

            {/* FULL NAME */}
            {!isGoogleUser && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={inputStyle("name")}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                />
              </View>
            )}

            {/* EMAIL */}
            {!isGoogleUser && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={inputStyle("email")}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  keyboardType="email-address"
                />
              </View>
            )}

            {/* PHONE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={inputStyle("phone")}
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                keyboardType="phone-pad"
              />
            </View>

            {/* PASSWORD */}
            {!isGoogleUser && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={inputStyle("password")}
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  secureTextEntry
                />
              </View>
            )}

            {/* CONFIRM PASSWORD */}
            {!isGoogleUser && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={inputStyle("confirmPassword")}
                  value={formData.confirmPassword}
                  onChangeText={(text) =>
                    setFormData({ ...formData, confirmPassword: text })
                  }
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpButtonText}>
                  {isGoogleUser ? "Complete Account" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            {!isGoogleUser && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => promptAsync()}
                >
                  <Text>Continue with Google</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.signInContainer}>
              <Link href="/login">Already have an account? Sign in</Link>
            </View>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, maxWidth: 450, alignSelf: "center", width: "100%" },
  header: { alignItems: "center", padding: 24 },
  logoContainer: { backgroundColor: "#2563EB", padding: 16, borderRadius: 32 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 10 },
  content: { padding: 24 },
  inputGroup: { marginBottom: 16 },
  label: { marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 12 },
  inputError: { borderColor: "#EF4444" },
  signUpButton: { backgroundColor: "#2563EB", padding: 14, borderRadius: 8, alignItems: "center" },
  signUpButtonText: { color: "#fff", fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 10 },
  googleButton: { borderWidth: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  signInContainer: { marginTop: 16, alignItems: "center" },
});
