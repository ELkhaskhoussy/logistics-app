import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Glow from '../../components/meridian/Glow';
import GradientButton from '../../components/meridian/GradientButton';
import InkField from '../../components/meridian/InkField';
import { fonts, M } from '../../constants/meridian';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score =
    (password.length >= 6 ? 1 : 0) +
    (password.length >= 10 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0);

  const handleResetPassword = async () => {
    setError(null);
    if (!password || !confirm) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/users/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Réinitialisation échouée.');
      }
      router.replace('/(auth)/login');
    } catch (e: any) {
      setError(e?.message || "Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: 8 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>

        <View style={styles.hero}>
          <Glow color="#38BDF8" size={150} style={{ left: -20, top: -20 }} />
          <View style={styles.iconBox}>
            <Feather name="lock" size={26} color={M.cool} />
          </View>
          <Text style={styles.h1}>New password</Text>
          <Text style={styles.sub}>Make it strong — at least 8 characters.</Text>
        </View>

        <View style={styles.form}>
          <InkField icon="lock" label="NEW PASSWORD" value={password} onChangeText={setPassword} placeholder="••••••••" secure />
          <InkField icon="check" label="CONFIRM PASSWORD" value={confirm} onChangeText={setConfirm} placeholder="••••••••" secure />

          <View style={styles.strength}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.seg, i < score ? styles.segOn : null]} />
            ))}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#fff" />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <GradientButton label="Update password" onPress={handleResetPassword} loading={loading} style={{ marginTop: 4 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: M.ink },
  scroll: { flexGrow: 1, backgroundColor: M.ink, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 34 },
  hero: { overflow: 'hidden', marginTop: 6, marginBottom: 22 },
  iconBox: {
    width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  h1: { fontFamily: fonts.display, fontSize: 25, fontWeight: '700', color: '#fff', marginTop: 18, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: M.onInkMut, marginTop: 6, fontFamily: fonts.body },
  form: { gap: 13 },
  strength: { flexDirection: 'row', gap: 6, marginTop: 2 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  segOn: { backgroundColor: M.green },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(236,91,67,0.15)', borderWidth: 1, borderColor: 'rgba(236,91,67,0.5)', borderRadius: 12, padding: 12,
  },
  errorTxt: { color: '#fff', fontSize: 13, flex: 1, fontFamily: fonts.body },
});
