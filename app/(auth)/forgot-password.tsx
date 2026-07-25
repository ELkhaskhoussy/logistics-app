import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Glow from '../../components/meridian/Glow';
import GradientButton from '../../components/meridian/GradientButton';
import InkField from '../../components/meridian/InkField';
import { fonts, M } from '../../constants/meridian';
import { cleanEmail, isValidEmail } from '../utils/inputFilters';
import { apiClient } from '../services/backService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    setError(null);
    if (!email) {
      setError('Veuillez saisir votre email.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Adresse e-mail invalide.');
      return;
    }
    try {
      setLoading(true);
      await apiClient.post('/users/auth/forgot-password', { email });
      router.push({ pathname: '/verify-code', params: { email } });
    } catch (e: any) {
      setError(
        e?.response?.status === 404
          ? 'Aucun compte ne correspond à cette adresse.'
          : "Impossible d'envoyer le code. Réessayez."
      );
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
          <Glow color="#38BDF8" size={150} style={{ right: -20, top: -30 }} />
          <View style={styles.iconBox}>
            <Feather name="key" size={26} color={M.cool} />
          </View>
          <Text style={styles.h1}>Reset password</Text>
          <Text style={styles.sub}>Enter your email and we'll send a recovery code.</Text>
        </View>

        <View style={styles.form}>
          <InkField icon="mail" label="EMAIL" value={email} onChangeText={(t) => setEmail(cleanEmail(t))} placeholder="you@example.com" keyboardType="email-address" />
          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#fff" />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}
          <GradientButton label="Send recovery code" onPress={handleSendCode} loading={loading} style={{ marginTop: 4 }} />
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
  sub: { fontSize: 14, color: M.onInkMut, marginTop: 6, lineHeight: 20, fontFamily: fonts.body },
  form: { gap: 14 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(236,91,67,0.15)', borderWidth: 1, borderColor: 'rgba(236,91,67,0.5)', borderRadius: 12, padding: 12,
  },
  errorTxt: { color: '#fff', fontSize: 13, flex: 1, fontFamily: fonts.body },
});
