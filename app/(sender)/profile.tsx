import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
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
} from 'react-native';

import { getUserById, updateUserPhone } from '../services/user';
import { useAuth } from '../../scripts/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function SenderProfileScreen() {
  const router = useRouter();
  const { logout, userId, loading: authLoading } = useAuth();

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // ✅ NEW

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    imageUrl: '',
  });

  const [phone, setPhone] = useState('');

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

    try {
      const userData = await getUserById(Number(userId));

      const data = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role,
        imageUrl: userData.imageUrl || '',
      };

      setUserInfo(data);
      setPhone(data.phone);

      // ✅ FIX: prevent flicker
      if (!isUploading) {
        setImage(data.imageUrl);
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load profile');
    } finally {
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
      setIsUploading(true); // ✅ lock

      const formData = new FormData();

      formData.append('file', {
        uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch(
        `http://localhost:8080/users/${userId}/upload-profile-photo`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const photoUrl = await response.text();

      setImage(photoUrl);

      Alert.alert('Success', 'Profile photo updated');

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Upload failed');
    } finally {
      setIsUploading(false); // ✅ unlock
    }
  };

  const handleSave = async () => {
    try {
      await updateUserPhone(userId, { phone });

      Alert.alert('Success', 'Phone updated');

      setIsEditing(false);
      loadUserInfo();

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update phone');
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as any);
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
        <TouchableOpacity onPress={pickImage} disabled={isUploading}>
          <View style={styles.avatarContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.avatar} />
            ) : (
              <Feather name="user" size={48} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.title}>Sender Profile</Text>
        <Text style={styles.subtitle}>Tap image to change</Text>
      </View>

      {/* Info */}
      <View style={styles.card}>
        <InfoRow icon="user" label="First Name" value={userInfo.firstName} />
        <InfoRow icon="user" label="Last Name" value={userInfo.lastName} />
        <InfoRow icon="mail" label="Email" value={userInfo.email} />

        <View style={styles.infoRow}>
          <Feather name="phone" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>

            {isEditing ? (
              <TextInput
                value={phone}
                onChangeText={(text: string) => setPhone(text)}
                style={styles.input}
              />
            ) : (
              <Text style={styles.infoValue}>
                {userInfo.phone || 'Not set'}
              </Text>
            )}
          </View>
        </View>

        <InfoRow icon="briefcase" label="Role" value={userInfo.role} />
      </View>

      {/* Buttons */}
      {!isEditing ? (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.buttonText}>Edit Phone</Text>
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

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={20} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

/* COMPONENT */

function InfoRow({ icon, label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={20} color="#6B7280" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );
}

/* STYLES */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },

  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },

  header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },

  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },

  avatar: { width: '100%', height: '100%' },

  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  infoContent: { marginLeft: 12, flex: 1 },
  infoLabel: { fontSize: 12, color: '#6B7280' },
  infoValue: { fontSize: 16, color: '#111827', fontWeight: '500' },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },

  editButton: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },

  rowButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  saveButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: { color: '#FFFFFF', fontWeight: '600' },

  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },

  logoutButtonText: { color: '#FFFFFF', fontWeight: '600' },
});