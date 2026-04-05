import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
} from "react-native";

import { useAuth } from "../../scripts/context/AuthContext";
import { getUserById } from "../services/user";
import {
  fetchTransporterProfile,
  updateTransporterProfile,
} from "../services/trip";

import * as ImagePicker from "expo-image-picker";

export default function TransporterProfileScreen() {
  const router = useRouter();
  const { userId, role, logout, loading: authLoading } = useAuth();

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    bio: "",
    vehicleType: "",
    licensePlate: "",
    imageUrl: "",
  });

  const [formData, setFormData] = useState({
    bio: "",
    vehicleType: "",
    licensePlate: "",
  });

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && userId) {
        loadUserInfo();
      }
    }, [authLoading, userId])
  );

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
      // STEP 1: instant user load
      const userData = await getUserById(Number(userId));

      const baseData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role,
        bio: "",
        vehicleType: "",
        licensePlate: "",
        imageUrl: userData.imageUrl || "",
      };

      setUserInfo(baseData);

      // prevent image override during upload
      if (!isUploading) {
        setImage(baseData.imageUrl);
      }

      setFormData({
        bio: "",
        vehicleType: "",
        licensePlate: "",
      });

      setLoading(false);

      // STEP 2: background fetch
      fetchTransporterProfile(Number(userId))
        .then((transporter) => {
          if (!transporter) return;

          const updated = {
            ...baseData,
            bio: transporter.bio || "",
            vehicleType: transporter.vehicleType || "",
            licensePlate: transporter.licensePlate || "",
          };

          setUserInfo(updated);
          setFormData({
            bio: updated.bio,
            vehicleType: updated.vehicleType,
            licensePlate: updated.licensePlate,
          });
        })
        .catch(() => {
          console.log("Transporter profile not found");
        });

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not load profile");
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri); // instant preview
      uploadImage(uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);

      const formData = new FormData();

      formData.append("file", {
        uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(
        `http://localhost:8080/users/${userId}/upload-profile-photo`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const photoUrl = await response.text();

      setImage(photoUrl);

      Alert.alert("Success", "Profile photo updated");

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateTransporterProfile(userId, formData);

      Alert.alert("Success", "Profile updated");

      setIsEditing(false);
      loadUserInfo();

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update profile");
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
      
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} disabled={isUploading}>
          <View style={styles.avatarContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.avatar} />
            ) : (
              <Feather name="truck" size={48} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.title}>Transporter Profile</Text>
        <Text style={styles.subtitle}>Tap image to change</Text>
      </View>

      <View style={styles.card}>
        <InfoRow icon="user" label="First Name" value={userInfo.firstName} />
        <InfoRow icon="user" label="Last Name" value={userInfo.lastName} />
        <InfoRow icon="mail" label="Email" value={userInfo.email} />
        <InfoRow icon="briefcase" label="Role" value={userInfo.role} />

        <EditableRow
          label="Bio"
          value={formData.bio}
          isEditing={isEditing}
          onChange={(text: string) =>
            setFormData({ ...formData, bio: text })
          }
        />

        <EditableRow
          label="Vehicle Type"
          value={formData.vehicleType}
          isEditing={isEditing}
          onChange={(text: string) =>
            setFormData({ ...formData, vehicleType: text })
          }
        />

        <EditableRow
          label="License Plate"
          value={formData.licensePlate}
          isEditing={isEditing}
          onChange={(text: string) =>
            setFormData({ ...formData, licensePlate: text })
          }
        />
      </View>

      {!isEditing ? (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.rowButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsEditing(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          logout();
          router.replace("/(auth)/login" as any);
        }}
      >
        <Feather name="log-out" size={20} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

/* COMPONENTS */

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

function EditableRow({ label, value, isEditing, onChange }: any) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChange}
            style={styles.input}
          />
        ) : (
          <Text style={styles.infoValue}>{value || "N/A"}</Text>
        )}
      </View>
    </View>
  );
}

/* STYLES */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },

  header: { alignItems: "center", marginBottom: 32, marginTop: 20 },

  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  title: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },

  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  infoContent: { marginLeft: 12 },
  infoLabel: { fontSize: 12, color: "#6B7280" },
  infoValue: { fontSize: 16, color: "#111827", fontWeight: "500" },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },

  editButton: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  rowButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#6B7280",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: { color: "#FFFFFF", fontWeight: "600" },

  logoutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },

  logoutButtonText: { color: "#FFFFFF", fontWeight: "600" },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
});