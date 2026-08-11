import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GradientButton from '../../components/meridian/GradientButton';
import InkField from '../../components/meridian/InkField';
import PhoneField from '../../components/meridian/PhoneField';
import { fonts, M } from '../../constants/meridian';
import { useAuth } from '../../scripts/context/AuthContext';
import { registerUser } from '../services/auth';
import { countryByCode, isValidNational, toE164 } from '../utils/phone';
import { cleanEmail, isValidEmail, onlyName } from '../utils/inputFilters';

export default function RegisterSenderScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Country is explicit so the stored number is unambiguous (see utils/phone).
  const [country, setCountry] = useState(countryByCode('FR'));
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    if (!name || !email || !phone || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Adresse e-mail invalide.');
      return;
    }
    if (!isValidNational(country, phone)) {
      setError(`Numéro invalide pour ${country.label}. Exemple : ${country.example}`);
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
    setLoading(true);
    try {
      const parts = name.trim().split(' ').filter(Boolean);
      const firstName = parts[0] || 'User';
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : firstName;
      const response = await registerUser({ firstName, lastName, email, password, role: 'SENDER', phone: toE164(country, phone) });
      await login(response);
      // Account created but not yet verified — confirm the email address next.
      router.replace({ pathname: '/(auth)/verify-email', params: { email } } as any);
    } catch (e: any) {
      setError(e?.message || "Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.kicker}>SENDER SIGN-UP</Text>
        </View>

        <Text style={styles.title}>Create your{'\n'}account</Text>

        <View style={styles.form}>
          <InkField icon="user" label="NOM COMPLET" value={name} onChangeText={(t) => setName(onlyName(t))} placeholder="Sami Aouni" autoCapitalize="words" />
          <InkField icon="mail" label="E-MAIL" value={email} onChangeText={(t) => setEmail(cleanEmail(t))} placeholder="you@example.com" keyboardType="email-address" />
          <PhoneField label="TÉLÉPHONE" country={country} onCountryChange={setCountry} national={phone} onNationalChange={setPhone} />
          <InkField icon="lock" label="MOT DE PASSE" value={password} onChangeText={setPassword} placeholder="••••••••" secure />
          <InkField icon="lock" label="CONFIRMER LE MOT DE PASSE" value={confirm} onChangeText={setConfirm} placeholder="••••••••" secure />

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#fff" />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <GradientButton label="Create account" onPress={handleSignUp} loading={loading} style={{ marginTop: 4 }} />
        </View>

        <View style={styles.signin}>
          <Text style={styles.signinTxt}>Already registered? </Text>
          <Link href="/login" asChild>
            <Pressable hitSlop={6}>
              <Text style={styles.signinLink}>Se connecter</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: M.ink },
  scroll: { flexGrow: 1, backgroundColor: M.ink, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 34 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  kicker: { fontFamily: fonts.display, fontSize: 13, fontWeight: '600', color: M.warm2, letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, fontSize: 26, fontWeight: '700', color: '#fff', lineHeight: 30, letterSpacing: -0.5, marginTop: 10, marginBottom: 22 },
  form: { gap: 13 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(236,91,67,0.15)', borderWidth: 1, borderColor: 'rgba(236,91,67,0.5)', borderRadius: 12, padding: 12,
  },
  errorTxt: { color: '#fff', fontSize: 13, flex: 1, fontFamily: fonts.body },
  signin: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  signinTxt: { color: M.onInkMut, fontSize: 13, fontFamily: fonts.body },
  signinLink: { color: M.warm2, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
});
