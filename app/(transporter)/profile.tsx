import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { apiClient } from "../services/backService";
import { fetchTransporterProfile, updateTransporterProfile } from "../services/trip";
import { fetchUserProfile, updateUserPhone } from "../services/user";
import { getToken, getUserId, getUserRole } from "../utils/tokenStorage";

export default function TransporterProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    bio: "",
    profileImageUrl: "",
    vehicleType: "",
    licensePlate: "",
  });

  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");

  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneText, setPhoneText] = useState("");

  const [editingVehicleType, setEditingVehicleType] = useState(false);
  const [vehicleTypeText, setVehicleTypeText] = useState("");

  const [editingLicensePlate, setEditingLicensePlate] = useState(false);
  const [licensePlateText, setLicensePlateText] = useState("");

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userId = await getUserId();
      const role = await getUserRole();

      if (!userId) {
        setLoading(false);
        return;
      }

      if (role !== "TRANSPORTER") {
        router.replace("/(sender)/profile" as any);
        return;
      }

      const userData = await fetchUserProfile(userId);
      const transporterProfile = await fetchTransporterProfile(userId);

      setUserInfo({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || "",
        role,
        bio: transporterProfile?.bio || "",
        profileImageUrl: transporterProfile?.photoUrl || "",
        vehicleType: transporterProfile?.vehicleType || "",
        licensePlate: transporterProfile?.licensePlate || "",
      });

      setBioText(transporterProfile?.bio || "");
      setPhoneText(userData.phone || "");
      setVehicleTypeText(transporterProfile?.vehicleType || "");
      setLicensePlateText(transporterProfile?.licensePlate || "");

    } catch (error) {
      console.error("Load profile error:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // ================= PHOTO =================

  const uploadProfilePhoto = async (uri: string) => {
    try {
      const userId = await getUserId();
      const token = await getToken();

      if (!userId || !token) return;

      const formData = new FormData();

      const filename = uri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("file", {
        uri,
        name: filename,
        type,
      } as any);

      const response = await apiClient.post(
        `/catalog/transporters/${userId}/photo`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserInfo((prev) => ({
        ...prev,
        profileImageUrl: response.data.photoUrl,
      }));

      Alert.alert("Success", "Photo updated");

    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Upload failed");
    }
  };

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      uploadProfilePhoto(uri);
    }
  };

  // ================= SAVE =================

  const handleSaveBio = async () => {
    const userId = await getUserId();
    if (!userId) return;

    setLoading(true);

    try {
      await updateTransporterProfile(userId, {
        bio: bioText,
        displayName: `${userInfo.firstName} ${userInfo.lastName}`,
        pricingPerKg: 0,
      });

      setUserInfo({ ...userInfo, bio: bioText });
      setEditingBio(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async () => {
    const userId = await getUserId();
    if (!userId) return;

    setLoading(true);

    try {
      await updateUserPhone(userId, phoneText);
      setUserInfo({ ...userInfo, phone: phoneText });
      setEditingPhone(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicleType = async () => {
    const userId = await getUserId();
    if (!userId) return;

    setLoading(true);

    try {
      await updateTransporterProfile(userId, {
        vehicleType: vehicleTypeText,
        displayName: `${userInfo.firstName} ${userInfo.lastName}`,
        pricingPerKg: 0,
      });

      setUserInfo({ ...userInfo, vehicleType: vehicleTypeText });
      setEditingVehicleType(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLicensePlate = async () => {
    const userId = await getUserId();
    if (!userId) return;

    setLoading(true);

    try {
      await updateTransporterProfile(userId, {
        licensePlate: licensePlateText,
        displayName: `${userInfo.firstName} ${userInfo.lastName}`,
        pricingPerKg: 0,
      });

      setUserInfo({ ...userInfo, licensePlate: licensePlateText });
      setEditingLicensePlate(false);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const avatarUri = selectedImage || userInfo.profileImageUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
            />
          ) : (
            <Feather name="truck" size={48} color="#fff" />
          )}
        </View>

        <TouchableOpacity onPress={pickProfileImage} style={styles.photoButton}>
          <Text style={styles.photoButtonText}>Change photo</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Transporter Profile</Text>
      </View>

      <ProfileCard label="Bio" value={userInfo.bio} editing={editingBio} setEditing={setEditingBio} text={bioText} setText={setBioText} onSave={handleSaveBio} />
      <ProfileCard label="Phone" value={userInfo.phone} editing={editingPhone} setEditing={setEditingPhone} text={phoneText} setText={setPhoneText} onSave={handleSavePhone} />
      <ProfileCard label="Vehicle Type" value={userInfo.vehicleType} editing={editingVehicleType} setEditing={setEditingVehicleType} text={vehicleTypeText} setText={setVehicleTypeText} onSave={handleSaveVehicleType} />
      <ProfileCard label="License Plate" value={userInfo.licensePlate} editing={editingLicensePlate} setEditing={setEditingLicensePlate} text={licensePlateText} setText={setLicensePlateText} onSave={handleSaveLicensePlate} />

    </ScrollView>
  );
}

function ProfileCard({ label, value, editing, setEditing, text, setText, onSave }: any) {
  return (
    <View style={styles.card}>
      <View style={styles.bioHeader}>
        <Text style={styles.cardTitle}>{label}</Text>
        <TouchableOpacity
          onPress={() => editing ? onSave() : setEditing(true)}
          style={styles.editButton}
        >
          <Feather name={editing ? "check" : "edit-2"} size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {editing ? (
        <TextInput
          style={styles.bioInput}
          value={text}
          onChangeText={setText}
        />
      ) : (
        <Text style={styles.bioText}>{value || "Not set"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },

  header: { alignItems: "center", marginBottom: 24 },

  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  title: { fontSize: 22, fontWeight: "bold" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  bioHeader: { flexDirection: "row", justifyContent: "space-between" },

  cardTitle: { fontSize: 16, fontWeight: "600" },

  bioInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },

  bioText: { marginTop: 8 },

  editButton: { padding: 6 },

  photoButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },

  photoButtonText: { color: "#fff" },
});
