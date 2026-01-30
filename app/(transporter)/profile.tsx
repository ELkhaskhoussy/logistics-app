import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../../scripts/context/AuthContext";
import { getUserById } from "../services/user";
import { fetchTransporterProfile } from "../services/trip";

export default function TransporterProfileScreen() {
  const router = useRouter();
  const { userId, role, logout,loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);

  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    bio: "",
    vehicleType: "",
    licensePlate: "",
  });

useEffect(() => {
  if (!authLoading && userId) {
    loadUserInfo();
  }
}, [authLoading, userId]);


  const loadUserInfo = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (role !== "TRANSPORTER") {
      router.replace("/(sender)/profile" as any);
      return;
    }

    try {
      const userData = await getUserById(Number(userId));
      const transporterProfile = await fetchTransporterProfile(Number(userId));

      setUserInfo({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role,
        bio: transporterProfile?.bio || "Not set",
        vehicleType: transporterProfile?.vehicleType || "Not set",
        licensePlate: transporterProfile?.licensePlate || "Not set",
      });

    } catch (error) {
      console.error("Profile load error:", error);
      Alert.alert("Error", "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Feather name="truck" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Transporter Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.card}>

        <InfoRow icon="user" label="First Name" value={userInfo.firstName} />
        <InfoRow icon="user" label="Last Name" value={userInfo.lastName} />
        <InfoRow icon="mail" label="Email" value={userInfo.email} />
        <InfoRow icon="briefcase" label="Role" value={userInfo.role} />

        <InfoRow icon="info" label="Bio" value={userInfo.bio} />
        <InfoRow icon="truck" label="Vehicle Type" value={userInfo.vehicleType} />
        <InfoRow icon="hash" label="License Plate" value={userInfo.licensePlate} />

      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          logout();
          router.replace("/(auth)/login" as any);
        }}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={20} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={20} color="#6B7280" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "N/A"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },

  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  infoContent: {
    marginLeft: 12,
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },

  logoutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },

  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
