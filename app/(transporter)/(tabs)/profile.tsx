import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Card from '../../../components/meridian/Card';
import Glow from '../../../components/meridian/Glow';
import GradientButton from '../../../components/meridian/GradientButton';
import { fonts, M } from '../../../constants/meridian';
import { useAuth } from '../../../scripts/context/AuthContext';
import { getUserById, updateUserPhone } from '../../services/user';
import { createTransporterProfile, fetchTransporterProfile, updateTransporterProfile } from '../../services/trip';

export default function TransporterProfileScreen() {
  const router = useRouter();
  const { userId, role, logout, loading: authLoading } = useAuth();

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', email: '', role: '', bio: '', vehicleType: '', licensePlate: '', imageUrl: '' });
  const [formData, setFormData] = useState({ bio: '', vehicleType: '', licensePlate: '' });
  const [phone, setPhone] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && userId) loadUserInfo();
    }, [authLoading, userId])
  );

  const loadUserInfo = async () => {
    if (!userId) { setLoading(false); return; }
    if (role !== 'TRANSPORTER') { setLoading(false); router.replace('/(sender)/profile' as any); return; }
    try {
      const userData = await getUserById(Number(userId));
      const baseData = {
        firstName: userData.firstName, lastName: userData.lastName, email: userData.email, role,
        bio: '', vehicleType: '', licensePlate: '', imageUrl: userData.imageUrl || '',
      };
      setUserInfo(baseData);
      if (!isUploading) setImage(baseData.imageUrl);
      setFormData({ bio: '', vehicleType: '', licensePlate: '' });
      setPhone(userData.phone || '');
      setLoading(false);

      fetchTransporterProfile(Number(userId))
        .then((transporter) => {
          if (!transporter) return;
          const updated = { ...baseData, bio: transporter.bio || '', vehicleType: transporter.vehicleType || '', licensePlate: transporter.licensePlate || '' };
          setUserInfo(updated);
          setFormData({ bio: updated.bio, vehicleType: updated.vehicleType, licensePlate: updated.licensePlate });
        })
        .catch(() => console.log('Transporter profile not found'));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load profile');
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
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
      formData.append('file', { uri, name: 'profile.jpg', type: 'image/jpeg' } as any);
      const response = await fetch(`http://localhost:8080/users/${userId}/upload-profile-photo`, {
        method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photoUrl = await response.text();
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
    const numericUserId = Number(userId);
    if (!numericUserId) return;
    try {
      await updateUserPhone(numericUserId, { phone });
      try {
        await updateTransporterProfile(numericUserId, formData);
      } catch {
        await createTransporterProfile(numericUserId, {
          displayName: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
          bio: formData.bio, vehicleType: formData.vehicleType, licensePlate: formData.licensePlate, pricingPerKg: 0,
        });
      }
      Alert.alert('Success', 'Profile updated');
      setIsEditing(false);
      loadUserInfo();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update profile');
    }
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
        <Glow color="#EC5B43" size={200} style={{ alignSelf: 'center', top: -20 }} />
        <Pressable onPress={pickImage} disabled={isUploading} style={styles.avatarWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatarImg} />
          ) : (
            <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarGrad}>
              <Feather name="truck" size={36} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.camBadge}>
            {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="camera" size={13} color="#fff" />}
          </View>
        </Pressable>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{userInfo.firstName} {userInfo.lastName}</Text>
          <Feather name="check-circle" size={16} color={M.cool} />
        </View>
        <Text style={styles.role}>Transporteur vérifié</Text>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Card style={{ overflow: 'hidden' }}>
          <Row icon="mail" label="Email" value={userInfo.email} />
          <View style={styles.divider} />
          <EditRow label="Téléphone (WhatsApp)" icon="phone" value={phone} isEditing={isEditing} onChange={setPhone} />
          <View style={styles.divider} />
          <Row icon="briefcase" label="Rôle" value={userInfo.role} />
          <View style={styles.divider} />
          <EditRow label="Bio" icon="file-text" value={formData.bio} isEditing={isEditing} onChange={(t: string) => setFormData({ ...formData, bio: t })} />
          <View style={styles.divider} />
          <EditRow label="Véhicule" icon="truck" value={formData.vehicleType} isEditing={isEditing} onChange={(t: string) => setFormData({ ...formData, vehicleType: t })} />
          <View style={styles.divider} />
          <EditRow label="Plaque" icon="hash" value={formData.licensePlate} isEditing={isEditing} onChange={(t: string) => setFormData({ ...formData, licensePlate: t })} last />
        </Card>

        {!isEditing ? (
          <Pressable style={styles.outlineBtn} onPress={() => setIsEditing(true)}>
            <Feather name="edit-2" size={15} color={M.text} />
            <Text style={styles.outlineTxt}>Modifier le profil</Text>
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

        <Pressable style={styles.logout} onPress={() => { logout(); router.replace('/(auth)/login' as any); }}>
          <Feather name="log-out" size={15} color={M.warm1} />
          <Text style={styles.logoutTxt}>Se déconnecter</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Row({ icon, label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Feather name={icon} size={17} color={M.blue} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );
}

function EditRow({ icon, label, value, isEditing, onChange, last }: any) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.infoIcon}><Feather name={icon} size={17} color={M.blue} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        {isEditing ? (
          <TextInput value={value} onChangeText={onChange} style={styles.input} placeholderTextColor={M.textFaint} />
        ) : (
          <Text style={styles.infoValue}>{value || 'N/A'}</Text>
        )}
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
  camBadge: { position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: M.warm1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: M.ink },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  name: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: '#fff' },
  role: { fontSize: 12, color: M.onInkMut, marginTop: 3, fontFamily: fonts.body },

  body: { paddingHorizontal: 20, marginTop: -20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: M.page, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: M.textFaint, fontFamily: fonts.body },
  infoValue: { fontSize: 15, color: M.text, fontWeight: '500', fontFamily: fonts.body },
  divider: { height: 1, backgroundColor: M.hair, marginHorizontal: 16 },
  input: { borderWidth: 1, borderColor: M.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4, fontSize: 15, color: M.text, fontFamily: fonts.body },

  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: M.line, marginTop: 14 },
  outlineTxt: { fontSize: 15, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16, backgroundColor: '#FBEBE7', marginTop: 12 },
  logoutTxt: { fontSize: 14, fontWeight: '600', color: M.warm1, fontFamily: fonts.body },
});
