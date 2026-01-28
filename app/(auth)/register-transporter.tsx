import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { registerUser } from "../services/auth";
import { saveAuthData } from "../utils/tokenStorage";

const VEHICLE_TYPES = [
  { label: "Van", value: "van" },
  { label: "Truck", value: "truck" },
  { label: "Semi-Truck", value: "semi-truck" },
  { label: "Car", value: "car" },
];

export default function RegisterTransporterScreen() {
  const router = useRouter();
  const { promptAsync } = useGoogleAuth();

  const isGoogleUser = !!localStorage.getItem("googleUser");

  const googleUser = isGoogleUser
    ? JSON.parse(localStorage.getItem("googleUser")!)
    : null;

  const [formData, setFormData] = useState({
    name: googleUser ? `${googleUser.firstName} ${googleUser.lastName}` : "",
    email: googleUser ? googleUser.email : "",
    phone: "",
    vehicleType: "",
    licensePlate: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isGoogleUser) {
      Toast.show({
        type: "info",
        text1: "Complete your account",
        text2: "Choose your role to continue",
      });
    }
  }, []);

  const validate = () => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.phone) newErrors.phone = true;
    if (!formData.vehicleType) newErrors.vehicleType = true;
    if (!formData.licensePlate) newErrors.licensePlate = true;

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
        text1: "Missing fields",
        text2: "Please fill all required information",
      });
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;

      const response = await registerUser({
        firstName,
        lastName,
        email: formData.email,
        password: formData.password,
        role: "TRANSPORTER",
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        licensePlate: formData.licensePlate,
      });

      await saveAuthData(
        response.token!,
        response.userRole!,
        response.userId!
      );

      localStorage.removeItem("googleUser");

      router.replace("/dashboard");

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

  const selectVehicleType = (value: string) => {
    setFormData({ ...formData, vehicleType: value });
    setShowVehiclePicker(false);
  };

  const getVehicleTypeLabel = () => {
    const selected = VEHICLE_TYPES.find(v => v.value === formData.vehicleType);
    return selected ? selected.label : "Select vehicle type";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Feather name="truck" size={32} color="#fff" />
            </View>
            <Text style={styles.title}>Transporter Registration</Text>
          </View>

          <View style={styles.content}>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={inputStyle("phone")}
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Type</Text>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  errors.vehicleType && styles.inputError,
                ]}
                onPress={() => setShowVehiclePicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {getVehicleTypeLabel()}
                </Text>
                <Feather name="chevron-down" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Plate</Text>
              <TextInput
                style={inputStyle("licensePlate")}
                value={formData.licensePlate}
                onChangeText={(text) =>
                  setFormData({ ...formData, licensePlate: text })
                }
              />
            </View>

            {!isGoogleUser && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={inputStyle("password")}
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={inputStyle("confirmPassword")}
                    secureTextEntry
                    value={formData.confirmPassword}
                    onChangeText={(text) =>
                      setFormData({ ...formData, confirmPassword: text })
                    }
                  />
                </View>
              </>
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
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {!isGoogleUser && (
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => promptAsync()}
              >
                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.signInContainer}>
              <Link href="/login">Already have an account? Sign in</Link>
            </View>

          </View>
        </View>
      </ScrollView>

      <Modal visible={showVehiclePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowVehiclePicker(false)}
        >
          <View style={styles.modalContent}>
            {VEHICLE_TYPES.map(vehicle => (
              <TouchableOpacity
                key={vehicle.value}
                style={styles.modalOption}
                onPress={() => selectVehicleType(vehicle.value)}
              >
                <Text>{vehicle.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, maxWidth: 450, alignSelf: "center", width: "100%" },
  header: { alignItems: "center", padding: 24 },
  logoContainer: { backgroundColor: "#2563EB", padding: 16, borderRadius: 32 },
  title: { fontSize: 24, fontWeight: "bold" },
  content: { padding: 24 },
  inputGroup: { marginBottom: 16 },
  label: { marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 12 },
  inputError: { borderColor: "#EF4444" },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signUpButton: { backgroundColor: "#2563EB", padding: 14, borderRadius: 8, alignItems: "center" },
  signUpButtonText: { color: "#fff", fontWeight: "600" },
  googleButton: { borderWidth: 1, padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 },
  googleButtonText: { color: "#374151" },
  signInContainer: { marginTop: 16, alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 12 },
  modalOption: { padding: 12 },
pickerButtonText: {
  fontSize: 16,
},
});
