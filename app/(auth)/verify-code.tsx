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

export default function VerifyCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = typeof params.email === 'string' ? params.email : '';

  const [code, setCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cooldown, setCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiry, setExpiry] = useState(240);

  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (cooldown === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (expiry === 0) return;
    const timer = setTimeout(() => setExpiry(expiry - 1), 1000);
    return () => clearTimeout(timer);
  }, [expiry]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleChange = (text: string, index: number) => {
    if (!/^\d?$/.test(text)) return;
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 4) inputs.current[index + 1]?.focus();
    if (!text && index > 0) inputs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    setError(null);
    const fullCode = code.join('');
    if (fullCode.length !== 5) {
      setError('Saisissez le code complet.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/users/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });
      if (!response.ok) throw new Error('Code invalide.');
      router.push({ pathname: '/(auth)/reset-password', params: { email } });
    } catch (e: any) {
      setError(e?.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    try {
      setResending(true);
      const res = await fetch('http://localhost:8080/users/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setCooldown(30);
      setCanResend(false);
      setExpiry(240);
    } catch {
      setError("Échec du renvoi du code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: 8 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>

        <View style={styles.hero}>
          <Glow color="#EC5B43" size={170} style={{ alignSelf: 'center', top: -30 }} />
          <LinearGradient colors={['#EC5B43', '#F5A623']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
            <Feather name="mail" size={26} color="#fff" />
          </LinearGradient>
          <Text style={styles.h1}>Check your email</Text>
          <Text style={styles.sub}>
            Code sent to <Text style={{ color: '#fff', fontWeight: '600' }}>{email || 'your email'}</Text>
          </Text>
          <Text style={styles.expiry}>Expires in {formatTime(expiry)}</Text>
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
              onChangeText={(text) => handleChange(text, index)}
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

        <GradientButton label="Verify" onPress={handleVerify} loading={loading} style={{ marginTop: 20 }} />

        <View style={styles.resend}>
          <Text style={styles.resendTxt}>Didn't receive the code? </Text>
          <Pressable onPress={handleResend} disabled={!canResend || resending} hitSlop={6}>
            {resending ? (
              <ActivityIndicator color={M.cool} />
            ) : (
              <Text style={[styles.resendLink, { color: canResend ? M.cool : M.onInkFaint }]}>
                {canResend ? 'Resend code' : `Resend in ${cooldown}s`}
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
  scroll: { flexGrow: 1, backgroundColor: M.ink, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 34 },
  hero: { overflow: 'hidden', alignItems: 'center', marginTop: 6, marginBottom: 22 },
  iconBox: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 16, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: M.onInkMut, marginTop: 6, textAlign: 'center', fontFamily: fonts.body },
  expiry: { fontSize: 12, color: M.cool, marginTop: 8, fontFamily: fonts.display },
  codeRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  box: {
    width: 56, height: 68, borderRadius: 16, textAlign: 'center', fontSize: 26, fontWeight: '700', color: '#fff',
    fontFamily: fonts.display, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  boxFilled: { borderWidth: 1.5, borderColor: '#EC5B43' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16,
    backgroundColor: 'rgba(236,91,67,0.15)', borderWidth: 1, borderColor: 'rgba(236,91,67,0.5)', borderRadius: 12, padding: 12,
  },
  errorTxt: { color: '#fff', fontSize: 13, flex: 1, fontFamily: fonts.body },
  resend: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  resendTxt: { color: M.onInkMut, fontSize: 13, fontFamily: fonts.body },
  resendLink: { fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
});
