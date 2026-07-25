import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Card from '../../components/meridian/Card';
import Glow from '../../components/meridian/Glow';
import GradientButton from '../../components/meridian/GradientButton';
import { fonts, M } from '../../constants/meridian';
import { useAuth } from '../../scripts/context/AuthContext';
import { getUserById, updateUserPhone } from '../services/user';
import { isValidPhone, onlyPhone } from '../utils/inputFilters';

export default function SenderProfileScreen() {
  const router = useRouter();
  const { logout, userId, loading: authLoading } = useAuth();

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '', imageUrl: '' });
  const [phone, setPhone] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && userId) loadUserInfo();
    }, [authLoading, userId])
  );

  const loadUserInfo = async () => {
    if (!userId) { setLoading(false); return; }
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
      if (!isUploading) setImage(data.imageUrl);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.7 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      uploadImage(uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, 'profile.jpg');
      const uploadResponse = await fetch(`http://localhost:8080/users/${userId}/upload-profile-photo`, { method: 'POST', body: formData });
      const photoUrl = await uploadResponse.text();
      setImage(photoUrl);
      Alert.alert('Success', 'Profile photo updated');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (phone && !isValidPhone(phone)) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide (au moins 8 chiffres).');
      return;
    }
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
        <ActivityIndicator size="large" color={M.warm1} />
        <Text style={styles.loadingText}>Chargement du profil…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HERO */}
      <View style={styles.hero}>
        <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
        <Glow color="#38BDF8" size={200} style={{ alignSelf: 'center', top: -20 }} />
        <Pressable onPress={pickImage} disabled={isUploading} style={styles.avatarWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatarImg} />
          ) : (
            <LinearGradient colors={[M.blue, M.cool]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarGrad}>
              <Feather name="user" size={38} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.camBadge}>
            {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="camera" size={13} color="#fff" />}
          </View>
        </Pressable>
        <Text style={styles.name}>{userInfo.firstName} {userInfo.lastName}</Text>
        <Text style={styles.role}>Sender · {userInfo.phone ? 'Membre' : userInfo.role}</Text>
      </View>

      {/* INFO CARD */}
      <View style={styles.body}>
        <Card style={{ overflow: 'hidden' }}>
          <InfoRow icon="mail" label="Email" value={userInfo.email} />
          <View style={styles.rowDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Feather name="phone" size={17} color={M.blue} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              {isEditing ? (
                <TextInput value={phone} onChangeText={(t) => setPhone(onlyPhone(t))} style={styles.input} keyboardType="phone-pad" placeholderTextColor={M.textFaint} />
              ) : (
                <Text style={styles.infoValue}>{userInfo.phone || 'Non renseigné'}</Text>
              )}
            </View>
          </View>
          <View style={styles.rowDivider} />
          <InfoRow icon="briefcase" label="Rôle" value={userInfo.role} last />
        </Card>

        {!isEditing ? (
          <Pressable style={styles.outlineBtn} onPress={() => setIsEditing(true)}>
            <Feather name="edit-2" size={15} color={M.text} />
            <Text style={styles.outlineTxt}>Modifier le téléphone</Text>
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <Pressable style={[styles.outlineBtn, { flex: 1, marginTop: 0 }]} onPress={() => setIsEditing(false)}>
              <Text style={styles.outlineTxt}>Annuler</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <GradientButton label="Enregistrer" onPress={handleSave} />
            </View>
          </View>
        )}

        <Pressable style={styles.logout} onPress={handleLogout}>
          <Feather name="log-out" size={15} color={M.warm1} />
          <Text style={styles.logoutTxt}>Se déconnecter</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, last }: any) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.infoIcon}><Feather name={icon} size={17} color={M.blue} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: M.textMut, fontFamily: fonts.body },

  hero: { overflow: 'hidden', alignItems: 'center', paddingTop: 44, paddingBottom: 44 },
  avatarWrap: { width: 88, height: 88 },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarGrad: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  camBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14,
    backgroundColor: M.warm1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: M.ink,
  },
  name: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 14 },
  role: { fontSize: 12, color: M.onInkMut, marginTop: 3, fontFamily: fonts.body },

  body: { paddingHorizontal: 20, marginTop: -20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: M.page, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: M.textFaint, fontFamily: fonts.body },
  infoValue: { fontSize: 15, color: M.text, fontWeight: '500', fontFamily: fonts.body },
  rowDivider: { height: 1, backgroundColor: M.hair, marginHorizontal: 16 },
  input: { borderWidth: 1, borderColor: M.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4, fontSize: 15, color: M.text, fontFamily: fonts.body },

  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: M.line, marginTop: 14,
  },
  outlineTxt: { fontSize: 15, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16,
    backgroundColor: '#FBEBE7', marginTop: 12,
  },
  logoutTxt: { fontSize: 14, fontWeight: '600', color: M.warm1, fontFamily: fonts.body },
});
