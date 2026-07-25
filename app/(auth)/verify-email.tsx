import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Glow from '../../components/meridian/Glow';
import GradientButton from '../../components/meridian/GradientButton';
import { fonts, M } from '../../constants/meridian';
import { resendVerificationCode, verifyEmail } from '../services/auth';

/**
 * Post-registration email confirmation.
 * The account exists but stays unverified until the emailed code is entered.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = typeof params.email === 'string' ? params.email : '';

  const [code, setCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(30);

  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (cooldown === 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d?$/.test(text)) return;
    const next = [...code];
    next[index] = text;
    setCode(next);
    if (text && index < 4) inputs.current[index + 1]?.focus();
    if (!text && index > 0) inputs.current[index - 1]?.focus();
  };

  const friendly = (e: any) => {
    const msg = String(e?.response?.data?.message || '').toLowerCase();
    if (msg.includes('expired')) return 'Ce code a expiré. Demandez-en un nouveau.';
    if (msg.includes('invalid')) return 'Code invalide. Vérifiez les chiffres saisis.';
    if (msg.includes('already verified')) return 'Cette adresse est déjà vérifiée.';
    if (!e?.response) return 'Connexion impossible. Réessayez.';
    return 'Vérification impossible. Réessayez.';
  };

  const handleVerify = async () => {
    setError(null);
    setNotice(null);
    const full = code.join('');
    if (full.length !== 5) {
      setError('Saisissez les 5 chiffres du code.');
      return;
    }
    try {
      setLoading(true);
      await verifyEmail(email, full);
      // Account is active — the user was already signed in at registration.
      router.replace('/(sender)/search');
    } catch (e: any) {
      setError(friendly(e));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError(null);
    setNotice(null);
    try {
      setResending(true);
      await resendVerificationCode(email);
      setNotice('Un nouveau code vous a été envoyé.');
      setCooldown(30);
      setCode(['', '', '', '', '']);
    } catch (e: any) {
      setError(friendly(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Glow color="#EC5B43" size={170} style={{ alignSelf: 'center', top: -30 }} />
          <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
            <Feather name="mail" size={26} color="#fff" />
          </LinearGradient>
          <Text style={styles.h1}>Confirmez votre e-mail</Text>
          <Text style={styles.sub}>
            Nous avons envoyé un code à{'\n'}
            <Text style={{ color: '#fff', fontWeight: '600' }}>{email || 'votre adresse'}</Text>
          </Text>
        </View>

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              style={[styles.box, digit ? styles.boxFilled : null]}
              value={digit}
              onChangeText={(t) => handleChange(t, index)}
              keyboardType="numeric"
              maxLength={1}
            />
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color="#fff" />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}
        {notice ? (
          <View style={styles.noticeBox}>
            <Feather name="check-circle" size={14} color={M.green} />
            <Text style={styles.noticeTxt}>{notice}</Text>
          </View>
        ) : null}

        <GradientButton label="Vérifier" onPress={handleVerify} loading={loading} style={{ marginTop: 20 }} />

        <View style={styles.resend}>
          <Text style={styles.resendTxt}>Vous n'avez rien reçu ? </Text>
          <Pressable onPress={handleResend} disabled={cooldown > 0 || resending} hitSlop={6}>
            {resending ? (
              <ActivityIndicator color={M.cool} />
            ) : (
              <Text style={[styles.resendLink, { color: cooldown > 0 ? M.onInkFaint : M.cool }]}>
                {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: M.ink },
  scroll: { flexGrow: 1, backgroundColor: M.ink, paddingHorizontal: 22, paddingTop: 40, paddingBottom: 34 },
  hero: { overflow: 'hidden', alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 16, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: M.onInkMut, marginTop: 8, textAlign: 'center', lineHeight: 21, fontFamily: fonts.body },
  codeRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  box: {
    width: 56, height: 68, borderRadius: 16, textAlign: 'center', fontSize: 26, fontWeight: '700', color: '#fff',
    fontFamily: fonts.display, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  boxFilled: { borderWidth: 1.5, borderColor: M.warm1 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16,
    backgroundColor: 'rgba(236,91,67,0.15)', borderWidth: 1, borderColor: 'rgba(236,91,67,0.5)', borderRadius: 12, padding: 12,
  },
  errorTxt: { color: '#fff', fontSize: 13, flex: 1, fontFamily: fonts.body },
  noticeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16,
    backgroundColor: 'rgba(22,163,74,0.15)', borderWidth: 1, borderColor: 'rgba(22,163,74,0.45)', borderRadius: 12, padding: 12,
  },
  noticeTxt: { color: '#fff', fontSize: 13, flex: 1, fontFamily: fonts.body },
  resend: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  resendTxt: { color: M.onInkMut, fontSize: 13, fontFamily: fonts.body },
  resendLink: { fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
});
