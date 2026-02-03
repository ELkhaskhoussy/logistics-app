import { Feather } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { apiClient } from '../services/backService';

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
    View
} from 'react-native';
import { logoutUser } from '../services/auth';
import { fetchTransporterProfile, updateTransporterProfile } from '../services/trip';
import { fetchUserProfile, updateUserPhone } from '../services/user';
import { getToken, getUserId, getUserRole } from '../utils/tokenStorage';

export default function TransporterProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [userInfo, setUserInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        bio: '',
        profileImageUrl: '',
        vehicleType: '',
        licensePlate: '',
    });
    const [editingBio, setEditingBio] = useState(false);
    const [bioText, setBioText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // New state for vehicle fields
    const [editingPhone, setEditingPhone] = useState(false);
    const [phoneText, setPhoneText] = useState('');
    const [editingVehicleType, setEditingVehicleType] = useState(false);
    const [vehicleTypeText, setVehicleTypeText] = useState('');
    const [editingLicensePlate, setEditingLicensePlate] = useState(false);
    const [licensePlateText, setLicensePlateText] = useState('');

    useEffect(() => {
        const init = async () => {
            const role = await getUserRole();

            if (role !== "TRANSPORTER") {
                router.replace("/(sender)/profile" as any);
                return;
            }

            loadUserInfo();
        };

        init();
    }, []);


    const loadUserInfo = async () => {
        const role = await getUserRole();
        const userId = await getUserId();

        if (!userId) {
            console.error('[PROFILE] No userId found in storage');
            setLoading(false);
            return;
        }

        try {
            console.log('[PROFILE] Loading user data for ID:', userId);
            const userData = await fetchUserProfile(userId);

            // Fetch transporter profile
            const transporterProfile = await fetchTransporterProfile(userId);
            console.log('[PROFILE] 📸 Transporter profile fetched:', transporterProfile);
            console.log('[PROFILE] 📸 PhotoUrl from backend:', transporterProfile?.photoUrl);

            // Construct full URL for photo if it exists
            const photoUrl = transporterProfile?.photoUrl;
            const fullPhotoUrl = photoUrl ? `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.16:8080'}${photoUrl}` : '';
            console.log('[PROFILE] 📸 Full photo URL constructed:', fullPhotoUrl);

            setUserInfo({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone || '',
                role: role || userData.role,
                bio: transporterProfile?.bio || '',
                profileImageUrl: fullPhotoUrl,
                vehicleType: transporterProfile?.vehicleType || '',
                licensePlate: transporterProfile?.licensePlate || '',
            });
            setBioText(transporterProfile?.bio || '');
            setPhoneText(userData.phone || '');
            setVehicleTypeText(transporterProfile?.vehicleType || '');
            setLicensePlateText(transporterProfile?.licensePlate || '');
        } catch (error) {
            console.error('[PROFILE] Failed to load user data:', error);
            Alert.alert('Erreur', 'Impossible de charger les données du profil');
        } finally {
            setLoading(false);
        }
    };
    const uploadProfilePhoto = async (fileOrUri: any) => {
        try {
            const userId = await getUserId();
            if (!userId) {
                Alert.alert("Error", "User not found");
                return;
            }

            const formData = new FormData();

            if (Platform.OS === "web") {
                formData.append("file", fileOrUri);
            } else {
                const uri = fileOrUri;
                const filename = uri.split("/").pop() || "profile.jpg";
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : "image/jpeg";

                formData.append("file", {
                    uri,
                    name: filename,
                    type,
                } as any);
            }
            const token = await getToken();

            const response = await apiClient.post(
                `/catalog/transporters/${userId}/photo`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            console.log('[PROFILE] 📸 Upload response:', response.data);
            // photoUrl from backend is relative (e.g., /uploads/filename.jpg)
            // Construct full URL for display
            const photoUrl = response.data.photoUrl;
            console.log('[PROFILE] 📸 PhotoUrl from upload response:', photoUrl);
            const fullPhotoUrl = photoUrl ? `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.16:8080'}${photoUrl}` : '';
            console.log('[PROFILE] 📸 Full URL after upload:', fullPhotoUrl);

            setUserInfo((prev) => ({
                ...prev,
                profileImageUrl: fullPhotoUrl,
            }));

            Alert.alert("Success", "Profile photo saved!");
        } catch (error: any) {
            console.log("❌ Upload error FULL:", error);
            console.log("❌ Upload error status:", error?.response?.status);
            console.log("❌ Upload error data:", error?.response?.data);

            Alert.alert(
                "Upload error",
                `${error?.response?.status || ""} ${JSON.stringify(error?.response?.data || error?.message)}`
            );
        }
    };

    const pickProfileImage = async () => {
        //  WEB
        if (Platform.OS === "web") {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";

            input.onchange = (event: any) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const imageUrl = URL.createObjectURL(file);

                setSelectedImage(imageUrl);
                setSelectedFile(file);
                uploadProfilePhoto(file);
            };

            input.click();
            return;
        }

        //  MOBILE
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permission.status !== "granted") {
                Alert.alert(
                    "Permission needed",
                    "We need access to your gallery to choose a profile photo."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0].uri);
                uploadProfilePhoto(result.assets[0].uri);
            }
        } catch (err) {
            console.log("Image pick error:", err);
            Alert.alert("Error", "Failed to pick image.");
        }
    };



    const handleSaveBio = async () => {
        setLoading(true);
        try {
            const userId = await getUserId();
            if (!userId) return;

            await updateTransporterProfile(userId, {
                bio: bioText,
                displayName: `${userInfo.firstName} ${userInfo.lastName}`,
                pricingPerKg: 0,
            });

            setUserInfo({ ...userInfo, bio: bioText });
            setEditingBio(false);
            Alert.alert('Succès', 'Bio mise à jour');
        } catch (error) {
            console.error('[PROFILE] Failed to update bio:', error);
            Alert.alert('Erreur', 'Échec de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePhone = async () => {
        setLoading(true);
        try {
            const userId = await getUserId();
            if (!userId) return;

            await updateUserPhone(userId, phoneText);

            setUserInfo({ ...userInfo, phone: phoneText });
            setEditingPhone(false);
            Alert.alert('Succès', 'Numéro de téléphone mis à jour');
        } catch (error) {
            console.error('[PROFILE] Failed to update phone:', error);
            Alert.alert('Erreur', 'Échec de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVehicleType = async () => {
        setLoading(true);
        try {
            const userId = await getUserId();
            if (!userId) return;

            await updateTransporterProfile(userId, {
                vehicleType: vehicleTypeText,
                displayName: `${userInfo.firstName} ${userInfo.lastName}`,
                pricingPerKg: 0,
            });

            setUserInfo({ ...userInfo, vehicleType: vehicleTypeText });
            setEditingVehicleType(false);
            Alert.alert('Succès', 'Type de véhicule mis à jour');
        } catch (error) {
            console.error('[PROFILE] Failed to update vehicle type:', error);
            Alert.alert('Erreur', 'Échec de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLicensePlate = async () => {
        setLoading(true);
        try {
            const userId = await getUserId();
            if (!userId) return;

            await updateTransporterProfile(userId, {
                licensePlate: licensePlateText,
                displayName: `${userInfo.firstName} ${userInfo.lastName}`,
                pricingPerKg: 0,
            });

            setUserInfo({ ...userInfo, licensePlate: licensePlateText });
            setEditingLicensePlate(false);
            Alert.alert('Succès', `Plaque d'immatriculation mise à jour`);
        } catch (error) {
            console.error('[PROFILE] Failed to update license plate:', error);
            Alert.alert('Erreur', 'Échec de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        console.log('🔴 [PROFILE] handleLogout called - button clicked!');

        try {
            console.log('[PROFILE] Calling logoutUser...');
            await logoutUser();
            console.log('✅ [PROFILE] Logout successful, token cleared');
            console.log('[PROFILE] Navigating to login...');
            router.push('/(auth)/login' as any);
        } catch (error) {
            console.error('❌ [PROFILE] Logout failed:', error);
            Alert.alert('Erreur', 'Échec de la déconnexion. Veuillez réessayer.');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Chargement du profil...</Text>
            </View>
        );
=======
import { getApiBaseUrl } from '../networking/config';

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
  View
} from 'react-native';
import { logoutUser } from '../services/auth';
import { getTransporterProfile, updateTransporterProfile } from '../services/transporter';
import { getUserById, updateUserPhone } from '../services/user';
import { getUserId, getUserRole } from '../utils/tokenStorage';

export default function TransporterProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    bio: '',
    profileImageUrl: '',
    vehicleType: '',
    licensePlate: '',
  });
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // New state for vehicle fields
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneText, setPhoneText] = useState('');
  const [editingVehicleType, setEditingVehicleType] = useState(false);
  const [vehicleTypeText, setVehicleTypeText] = useState('');
  const [editingLicensePlate, setEditingLicensePlate] = useState(false);
  const [licensePlateText, setLicensePlateText] = useState('');

  useEffect(() => {
    const init = async () => {
      const role = await getUserRole();

      console.log('[TRANSPORTER-PROFILE] 🔍 Role from storage:', role);
      console.log('[TRANSPORTER-PROFILE] 🔍 Role type:', typeof role);
      console.log('[TRANSPORTER-PROFILE] 🔍 Role === "TRANSPORTER":', role === "TRANSPORTER");
      console.log('[TRANSPORTER-PROFILE] 🔍 Role !== "TRANSPORTER":', role !== "TRANSPORTER");

      if (role !== "TRANSPORTER") {
        console.warn('[TRANSPORTER-PROFILE] ⚠️ Not a transporter! Redirecting to sender profile');
        console.warn('[TRANSPORTER-PROFILE] ⚠️ Expected: "TRANSPORTER", Got:', role);
        // router.replace("/(sender)/profile" as any);
        // return;
      }

      console.log('[TRANSPORTER-PROFILE] ✅ Role check passed, loading user info');
      loadUserInfo();
    };

    init();
  }, []);


  const loadUserInfo = async () => {
    const role = await getUserRole();
    const userId = await getUserId();

    if (!userId) {
      console.error('[PROFILE] No userId found in storage');
      setLoading(false);
      return;
>>>>>>> ddf968e (fixing last rebase)
    }
    const avatarUri = selectedImage || userInfo.profileImageUrl;

<<<<<<< HEAD
    // 🔍 Debug: Log what's being used for avatar
    console.log('[PROFILE] 🖼️ selectedImage:', selectedImage);
    console.log('[PROFILE] 🖼️ userInfo.profileImageUrl:', userInfo.profileImageUrl);
    console.log('[PROFILE] 🖼️ Final avatarUri:', avatarUri);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {avatarUri ? (
                        <Image
                            source={{ uri: avatarUri }}
                            style={{ width: 96, height: 96, borderRadius: 48 }}
                            onError={(error) => {
                                console.error('[PROFILE] ❌ Image failed to load:', error.nativeEvent.error);
                                console.error('[PROFILE] ❌ Failed URI:', avatarUri);
                            }}
                            onLoad={() => {
                                console.log('[PROFILE] ✅ Image loaded successfully:', avatarUri);
                            }}
                        />
                    ) : (
                        <Feather name="truck" size={48} color="#FFFFFF" />
                    )}
                </View>
                <TouchableOpacity onPress={pickProfileImage} style={styles.photoButton}>
                    <Text style={styles.photoButtonText}>Change profile photo</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Transporter Profile</Text>
                <Text style={styles.subtitle}>Gérez votre compte</Text>
            </View>

            {/* Profile Info Card */}
            <View style={styles.card}>
                <View style={styles.infoRow}>
                    <Feather name="user" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Prénom</Text>
                        <Text style={styles.infoValue}>{userInfo.firstName || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Feather name="user" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Nom</Text>
                        <Text style={styles.infoValue}>{userInfo.lastName || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Feather name="mail" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{userInfo.email || 'N/A'}</Text>
                    </View>
                </View>

                {userInfo.phone && (
                    <View style={styles.infoRow}>
                        <Feather name="phone" size={20} color="#6B7280" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Téléphone</Text>
                            <Text style={styles.infoValue}>{userInfo.phone}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <Feather name="briefcase" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Rôle</Text>
                        <Text style={styles.infoValue}>{userInfo.role}</Text>
                    </View>
                </View>
            </View>

            {/* Bio Section */}
            <View style={styles.card}>
                <View style={styles.bioHeader}>
                    <Text style={styles.cardTitle}>Bio</Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (editingBio) {
                                handleSaveBio();
                            } else {
                                setEditingBio(true);
                            }
                        }}
                        style={styles.editButton}
                    >
                        <Feather
                            name={editingBio ? "check" : "edit-2"}
                            size={18}
                            color="#2563EB"
                        />
                    </TouchableOpacity>
                </View>

                {editingBio ? (

                    <TextInput
                        style={styles.bioInput}
                        placeholder="Décrivez votre service de transport..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={4}
                        value={bioText}
                        onChangeText={setBioText}
                        textAlignVertical="top"
                    />
                ) : (
                    <Text style={styles.bioText}>
                        {userInfo.bio || 'Aucune bio ajoutée. Cliquez sur l\'icône pour en ajouter une.'}
                    </Text>
                )}
            </View>

            {/* Phone Number Section */}
            <View style={styles.card}>
                <View style={styles.bioHeader}>
                    <Text style={styles.cardTitle}>Numéro de téléphone</Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (editingPhone) {
                                handleSavePhone();
                            } else {
                                setEditingPhone(true);
                            }
                        }}
                        style={styles.editButton}
                    >
                        <Feather
                            name={editingPhone ? "check" : "edit-2"}
                            size={18}
                            color="#2563EB"
                        />
                    </TouchableOpacity>
                </View>

                {editingPhone ? (
                    <TextInput
                        style={styles.bioInput}
                        placeholder="+216 XX XXX XXX"
                        placeholderTextColor="#9CA3AF"
                        value={phoneText}
                        onChangeText={setPhoneText}
                        keyboardType="phone-pad"
                    />
                ) : (
                    <Text style={styles.bioText}>
                        {userInfo.phone || 'Aucun numéro. Cliquez sur l\'icône pour en ajouter un.'}
                    </Text>
                )}
            </View>

            {/* Vehicle Type Section */}
            <View style={styles.card}>
                <View style={styles.bioHeader}>
                    <Text style={styles.cardTitle}>Type de véhicule</Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (editingVehicleType) {
                                handleSaveVehicleType();
                            } else {
                                setEditingVehicleType(true);
                            }
                        }}
                        style={styles.editButton}
                    >
                        <Feather
                            name={editingVehicleType ? "check" : "edit-2"}
                            size={18}
                            color="#2563EB"
                        />
                    </TouchableOpacity>
                </View>

                {editingVehicleType ? (
                    <TextInput
                        style={styles.bioInput}
                        placeholder="Van, Camion, Voiture..."
                        placeholderTextColor="#9CA3AF"
                        value={vehicleTypeText}
                        onChangeText={setVehicleTypeText}
                    />
                ) : (
                    <Text style={styles.bioText}>
                        {userInfo.vehicleType || 'Aucun type de véhicule. Cliquez sur l\'icône pour en ajouter un.'}
                    </Text>
                )}
            </View>

            {/* License Plate Section */}
            <View style={styles.card}>
                <View style={styles.bioHeader}>
                    <Text style={styles.cardTitle}>Plaque d'immatriculation</Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (editingLicensePlate) {
                                handleSaveLicensePlate();
                            } else {
                                setEditingLicensePlate(true);
                            }
                        }}
                        style={styles.editButton}
                    >
                        <Feather
                            name={editingLicensePlate ? "check" : "edit-2"}
                            size={18}
                            color="#2563EB"
                        />
                    </TouchableOpacity>
                </View>

                {editingLicensePlate ? (
                    <TextInput
                        style={styles.bioInput}
                        placeholder="123 TUN 4567"
                        placeholderTextColor="#9CA3AF"
                        value={licensePlateText}
                        onChangeText={setLicensePlateText}
                    />
                ) : (
                    <Text style={styles.bioText}>
                        {userInfo.licensePlate || 'Aucune plaque. Cliquez sur l\'icône pour en ajouter une.'}
                    </Text>
                )}
            </View>

            {/* Stats Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Statistiques</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Feather name="package" size={24} color="#2563EB" />
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Livraisons</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Feather name="map-pin" size={24} color="#10B981" />
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Trajets</Text>
                    </View>
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Feather name="log-out" size={20} color="#FFFFFF" />
                <Text style={styles.logoutButtonText}>Déconnexion</Text>
            </TouchableOpacity>

            {/* App Info */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Tunisia-France Link</Text>
                <Text style={styles.footerText}>Version 1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    avatarContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 60,
        backgroundColor: '#E5E7EB',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    bioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    editButton: {
        padding: 8,
    },
    bioText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    bioInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 100,
        color: '#111827',
        backgroundColor: '#FFFFFF',
    },
    logoutButton: {
        backgroundColor: '#DC2626',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        marginBottom: 32,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    photoButton: {
        marginTop: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "#2563EB",
    },
    photoButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 13,
    },

});
=======
    try {
      console.log('[PROFILE] Loading user data for ID:', userId);
      const userData = await getUserById(Number(userId));

      let transporterProfile = null;
      try {
        // Fetch transporter profile
        transporterProfile = await getTransporterProfile(userId);
        console.log('[PROFILE] 📸 Transporter profile fetched:', transporterProfile);
      } catch (profileError: any) {
        if (profileError.response?.status === 404) {
          console.log('[PROFILE] ℹ️ Transporter profile not found (404) - displaying basic user info');
        } else {
          console.error('[PROFILE] ⚠️ Failed to fetch transporter profile:', profileError);
        }
      }

      // Construct full URL for photo if it exists
      const photoUrl = transporterProfile?.photoUrl;
      const baseUrl = getApiBaseUrl();
      const fullPhotoUrl = photoUrl ? `${baseUrl}${photoUrl}` : '';
      console.log('[PROFILE] 📸 Full photo URL constructed:', fullPhotoUrl);

      setUserInfo({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || '',
        role: role || userData.role,
        bio: transporterProfile?.bio || '',
        profileImageUrl: fullPhotoUrl,
        vehicleType: transporterProfile?.vehicleType || '',
        licensePlate: transporterProfile?.licensePlate || '',
      });
      setBioText(transporterProfile?.bio || '');
      setPhoneText(userData.phone || '');
      setVehicleTypeText(transporterProfile?.vehicleType || '');
      setLicensePlateText(transporterProfile?.licensePlate || '');
    } catch (error) {
      console.error('[PROFILE] Failed to load user data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du profil');
    } finally {
      setLoading(false);
    }
  };
  const uploadProfilePhoto = async (fileOrUri: any) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        Alert.alert("Error", "User not found");
        return;
      }

      const formData = new FormData();

      if (Platform.OS === "web") {
        formData.append("file", fileOrUri);
      } else {
        const uri = fileOrUri;
        const filename = uri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("file", {
          uri,
          name: filename,
          type,
        } as any);
      }

      // Use uploadTransporterPhoto service
      const response = await uploadTransporterPhoto(Number(userId), formData);

      console.log('[PROFILE] 📸 Upload response:', response);
      // photoUrl from backend is relative (e.g., /uploads/filename.jpg)
      // Construct full URL for display
      const photoUrl = response.photoUrl;
      console.log('[PROFILE] 📸 PhotoUrl from upload response:', photoUrl);
      const baseUrl = getApiBaseUrl();
      const fullPhotoUrl = photoUrl ? `${baseUrl}${photoUrl}` : '';
      console.log('[PROFILE] 📸 Full URL after upload:', fullPhotoUrl);

      setUserInfo((prev) => ({
        ...prev,
        profileImageUrl: fullPhotoUrl,
      }));

      Alert.alert("Success", "Profile photo saved!");
    } catch (error: any) {
      console.log("❌ Upload error FULL:", error);
      console.log("❌ Upload error status:", error?.response?.status);
      console.log("❌ Upload error data:", error?.response?.data);

      Alert.alert(
        "Upload error",
        `${error?.response?.status || ""} ${JSON.stringify(error?.response?.data || error?.message)}`
      );
    }
  };

  const pickProfileImage = async () => {
    //  WEB
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = (event: any) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);

        setSelectedImage(imageUrl);
        setSelectedFile(file);
        uploadProfilePhoto(file);
      };

      input.click();
      return;
    }

    //  MOBILE
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need access to your gallery to choose a profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.log("Image pick error:", err);
      Alert.alert("Error", "Failed to pick image.");
    }
  };



  const handleSaveBio = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      if (!userId) return;

      await updateTransporterProfile(userId, {
        bio: bioText,
        displayName: `${userInfo.firstName} ${userInfo.lastName}`,
        pricingPerKg: 0,
      });

      setUserInfo({ ...userInfo, bio: bioText });
      setEditingBio(false);
      Alert.alert('Succès', 'Bio mise à jour');
    } catch (error) {
      console.error('[PROFILE] Failed to update bio:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      if (!userId) return;

      await updateUserPhone(userId, phoneText);

      setUserInfo({ ...userInfo, phone: phoneText });
      setEditingPhone(false);
      Alert.alert('Succès', 'Numéro de téléphone mis à jour');
    } catch (error) {
      console.error('[PROFILE] Failed to update phone:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicleType = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      if (!userId) return;

      await updateTransporterProfile(userId, {
        vehicleType: vehicleTypeText,
        displayName: `${userInfo.firstName} ${userInfo.lastName}`,
        pricingPerKg: 0,
      });

      setUserInfo({ ...userInfo, vehicleType: vehicleTypeText });
      setEditingVehicleType(false);
      Alert.alert('Succès', 'Type de véhicule mis à jour');
    } catch (error) {
      console.error('[PROFILE] Failed to update vehicle type:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLicensePlate = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      if (!userId) return;

      await updateTransporterProfile(userId, {
        licensePlate: licensePlateText,
        displayName: `${userInfo.firstName} ${userInfo.lastName}`,
        pricingPerKg: 0,
      });

      setUserInfo({ ...userInfo, licensePlate: licensePlateText });
      setEditingLicensePlate(false);
      Alert.alert('Succès', `Plaque d'immatriculation mise à jour`);
    } catch (error) {
      console.error('[PROFILE] Failed to update license plate:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('🔴 [PROFILE] handleLogout called - button clicked!');

    try {
      console.log('[PROFILE] Calling logoutUser...');
      await logoutUser();
      console.log('✅ [PROFILE] Logout successful, token cleared');
      console.log('[PROFILE] Navigating to login...');
      router.push('/(auth)/login' as any);
    } catch (error) {
      console.error('❌ [PROFILE] Logout failed:', error);
      Alert.alert('Erreur', 'Échec de la déconnexion. Veuillez réessayer.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }
  const avatarUri = selectedImage || userInfo.profileImageUrl;

  // 🔍 Debug: Log what's being used for avatar
  console.log('[PROFILE] 🖼️ selectedImage:', selectedImage);
  console.log('[PROFILE] 🖼️ userInfo.profileImageUrl:', userInfo.profileImageUrl);
  console.log('[PROFILE] 🖼️ Final avatarUri:', avatarUri);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
              onError={(error) => {
                console.error('[PROFILE] ❌ Image failed to load:', error.nativeEvent.error);
                console.error('[PROFILE] ❌ Failed URI:', avatarUri);
              }}
              onLoad={() => {
                console.log('[PROFILE] ✅ Image loaded successfully:', avatarUri);
              }}
            />
          ) : (
            <Feather name="truck" size={48} color="#FFFFFF" />
          )}
        </View>
        <TouchableOpacity onPress={pickProfileImage} style={styles.photoButton}>
          <Text style={styles.photoButtonText}>Change profile photo</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transporter Profile</Text>
        <Text style={styles.subtitle}>Gérez votre compte</Text>
      </View>

      {/* Profile Info Card */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Feather name="user" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Prénom</Text>
            <Text style={styles.infoValue}>{userInfo.firstName || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="user" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Nom</Text>
            <Text style={styles.infoValue}>{userInfo.lastName || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="mail" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userInfo.email || 'N/A'}</Text>
          </View>
        </View>

        {userInfo.phone && (
          <View style={styles.infoRow}>
            <Feather name="phone" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{userInfo.phone}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Feather name="briefcase" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Rôle</Text>
            <Text style={styles.infoValue}>{userInfo.role}</Text>
          </View>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.card}>
        <View style={styles.bioHeader}>
          <Text style={styles.cardTitle}>Bio</Text>
          <TouchableOpacity
            onPress={() => {
              if (editingBio) {
                handleSaveBio();
              } else {
                setEditingBio(true);
              }
            }}
            style={styles.editButton}
          >
            <Feather
              name={editingBio ? "check" : "edit-2"}
              size={18}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>

        {editingBio ? (

          <TextInput
            style={styles.bioInput}
            placeholder="Décrivez votre service de transport..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={bioText}
            onChangeText={setBioText}
            textAlignVertical="top"
          />
        ) : (
          <Text style={styles.bioText}>
            {userInfo.bio || 'Aucune bio ajoutée. Cliquez sur l\'icône pour en ajouter une.'}
          </Text>
        )}
      </View>

      {/* Phone Number Section */}
      <View style={styles.card}>
        <View style={styles.bioHeader}>
          <Text style={styles.cardTitle}>Numéro de téléphone</Text>
          <TouchableOpacity
            onPress={() => {
              if (editingPhone) {
                handleSavePhone();
              } else {
                setEditingPhone(true);
              }
            }}
            style={styles.editButton}
          >
            <Feather
              name={editingPhone ? "check" : "edit-2"}
              size={18}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>

        {editingPhone ? (
          <TextInput
            style={styles.bioInput}
            placeholder="+216 XX XXX XXX"
            placeholderTextColor="#9CA3AF"
            value={phoneText}
            onChangeText={setPhoneText}
            keyboardType="phone-pad"
          />
        ) : (
          <Text style={styles.bioText}>
            {userInfo.phone || 'Aucun numéro. Cliquez sur l\'icône pour en ajouter un.'}
          </Text>
        )}
      </View>

      {/* Vehicle Type Section */}
      <View style={styles.card}>
        <View style={styles.bioHeader}>
          <Text style={styles.cardTitle}>Type de véhicule</Text>
          <TouchableOpacity
            onPress={() => {
              if (editingVehicleType) {
                handleSaveVehicleType();
              } else {
                setEditingVehicleType(true);
              }
            }}
            style={styles.editButton}
          >
            <Feather
              name={editingVehicleType ? "check" : "edit-2"}
              size={18}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>

        {editingVehicleType ? (
          <TextInput
            style={styles.bioInput}
            placeholder="Van, Camion, Voiture..."
            placeholderTextColor="#9CA3AF"
            value={vehicleTypeText}
            onChangeText={setVehicleTypeText}
          />
        ) : (
          <Text style={styles.bioText}>
            {userInfo.vehicleType || 'Aucun type de véhicule. Cliquez sur l\'icône pour en ajouter un.'}
          </Text>
        )}
      </View>

      {/* License Plate Section */}
      <View style={styles.card}>
        <View style={styles.bioHeader}>
          <Text style={styles.cardTitle}>Plaque d'immatriculation</Text>
          <TouchableOpacity
            onPress={() => {
              if (editingLicensePlate) {
                handleSaveLicensePlate();
              } else {
                setEditingLicensePlate(true);
              }
            }}
            style={styles.editButton}
          >
            <Feather
              name={editingLicensePlate ? "check" : "edit-2"}
              size={18}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>

        {editingLicensePlate ? (
          <TextInput
            style={styles.bioInput}
            placeholder="123 TUN 4567"
            placeholderTextColor="#9CA3AF"
            value={licensePlateText}
            onChangeText={setLicensePlateText}
          />
        ) : (
          <Text style={styles.bioText}>
            {userInfo.licensePlate || 'Aucune plaque. Cliquez sur l\'icône pour en ajouter une.'}
          </Text>
        )}
      </View>

      {/* Stats Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Statistiques</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather name="package" size={24} color="#2563EB" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Livraisons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Feather name="map-pin" size={24} color="#10B981" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Trajets</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={20} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tunisia-France Link</Text>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    padding: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  photoButton: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },
  photoButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },

});
>>>>>>> ddf968e (fixing last rebase)
