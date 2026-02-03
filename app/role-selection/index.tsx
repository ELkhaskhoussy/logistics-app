import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useAuth } from '../../scripts/context/AuthContext';
import apiClient from '../networking/client';
import { ENDPOINTS } from '../networking/endpoints';
import { saveAuthData } from '../utils/tokenStorage';

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function RoleSelection() {
  const router = useRouter();

  const { login } = useAuth();

  const handleSelectRole = async (role: "SENDER" | "TRANSPORTER") => {

    const googleUserRaw = localStorage.getItem("googleUser");

    // ==========================
    // NORMAL SIGNUP FLOW
    // ==========================
    if (!googleUserRaw) {

      if (role === "SENDER") {
        router.replace("/register-sender");
      } else {
        router.replace("/register-transporter");
      }

      return;
    }

    // ==========================
    // GOOGLE SIGNUP FLOW
    // ==========================

    const googleUser = JSON.parse(googleUserRaw);

    try {
      console.log('[ROLE-SELECTION] 🎯 Selected role:', role);

      const response = await apiClient.post(
        ENDPOINTS.AUTH.GOOGLE_REGISTER,
        {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          imageUrl: googleUser.imageUrl,
          role: role,
        }
      );

      const data = response.data;
      console.log('[ROLE-SELECTION] 📦 Backend response:', data);
      console.log('[ROLE-SELECTION] 👤 userRole from backend:', data.userRole);
      console.log('[ROLE-SELECTION] 🆔 userId from backend:', data.userId);

      if (!data.token) {
        throw new Error(data.message || "Google register failed");
      }

      // Save session
      console.log('[ROLE-SELECTION] 💾 Saving to AuthContext...');
      login(data);
      console.log('[ROLE-SELECTION] 💾 Saving to tokenStorage...');
      await saveAuthData(data.token, data.userRole, data.userId);

      // Verify what was saved
      const savedRole = localStorage.getItem('user_role');
      console.log('[ROLE-SELECTION] ✅ Verified saved role in localStorage:', savedRole);

      // cleanup temp google data
      localStorage.removeItem("googleUser");

      // Redirect based on role
      console.log('[ROLE-SELECTION] 🚀 About to redirect...');
      if (data.userRole === "SENDER") {
        console.log('[ROLE-SELECTION] → Redirecting to SENDER search');
        router.replace("/(sender)/search" as any);
      } else if (data.userRole === "TRANSPORTER") {
        console.log('[ROLE-SELECTION] → Redirecting to TRANSPORTER dashboard');
        router.replace("/(transporter)/dashboard" as any);
      } else {
        console.error('[ROLE-SELECTION] ⚠️ Unknown role from backend:', data.userRole);
        alert('Unknown role: ' + data.userRole);
      }

    } catch (error: any) {
      console.error('[ROLE-SELECTION] ❌ Error:', error);
      const errorMessage = error.response?.data?.message || error.message || "Registration failed";
      alert(errorMessage);
    }
  };



  return (
    <View style={styles.minHScreen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.h1}>How will you use the app?</Text>
          <Text style={styles.subtitle}>
            Choose your account type to continue
          </Text>
        </View>

        <View style={styles.grid}>
          {/* Sender Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelectRole("SENDER")}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <View style={styles.iconContainer}>
                  <Feather name="package" size={40} color="#2563EB" />
                </View>
              </View>
              <Text style={styles.cardTitle}>I want to Send Packages</Text>
              <Text style={styles.cardDescription}>
                Find reliable transporters for your shipments
              </Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.ul}>
                <Text style={styles.li}>• Search available transporters</Text>
                <Text style={styles.li}>• View reviews and ratings</Text>
                <Text style={styles.li}>• Contact drivers directly</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Transporter Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelectRole("TRANSPORTER")}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <View style={styles.iconContainer}>
                  <Feather name="truck" size={40} color="#2563EB" />
                </View>
              </View>
              <Text style={styles.cardTitle}>I am a Transporter</Text>
              <Text style={styles.cardDescription}>
                Offer your transport services and earn money
              </Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.ul}>
                <Text style={styles.li}>• Publish your trips</Text>
                <Text style={styles.li}>• Manage bookings</Text>
                <Text style={styles.li}>• Build your reputation</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  minHScreen: {
    minHeight: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  container: {
    width: "100%",
    maxWidth: 672,
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  h1: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    color: "#6B7280",
    textAlign: "center",
    fontSize: 16,
  },
  grid: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  card: {
    flex: 1,
    minWidth: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  ul: {
    gap: 8,
  },
  li: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
});
