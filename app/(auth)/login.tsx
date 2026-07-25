import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Glow from '../../components/meridian/Glow';
import GradientButton from '../../components/meridian/GradientButton';
import InkField from '../../components/meridian/InkField';
import RouteArc from '../../components/meridian/RouteArc';
import { fonts, M } from '../../constants/meridian';
import { saveGoogleUser } from '../../app/utils/tokenStorage';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAuth } from '../../scripts/context/AuthContext';
import { authenticateWithGoogle, loginUser, registerWithGoogle } from '../services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { promptAsync, response } = useGoogleAuth();
  const { login } = useAuth();
  const processedToken = useRef<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Veuillez saisir votre email et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      login(res);
      if (res.userRole === 'SENDER') router.replace('/search');
      if (res.userRole === 'TRANSPORTER') router.replace('/dashboard');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setError('Email ou mot de passe incorrect.');
      } else if (!status || e?.code === 'ERR_NETWORK') {
        setError('Connexion impossible. Vérifiez votre connexion et réessayez.');
      } else if (status >= 500) {
        setError('Service momentanément indisponible. Réessayez.');
      } else {
        setError('Email ou mot de passe incorrect.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Exchanges the Google id_token with our backend, then routes the user.
  const handleGoogleToken = async (idToken: string) => {
    if (processedToken.current === idToken) return;
    processedToken.current = idToken;
    try {
      const data = await authenticateWithGoogle(idToken);
      if (data.needsRoleSelection) {
        // Public signup is Sender-only — register the Google user as SENDER directly.
        const senderData = await registerWithGoogle({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          imageUrl: data.imageUrl,
          role: 'SENDER',
        });
        await login(senderData);
        router.replace('/search');
        return;
      }
      if (data.token) {
        login(data);
        if (data.userRole === 'SENDER') router.replace('/search');
        if (data.userRole === 'TRANSPORTER') router.replace('/dashboard');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('La connexion Google a échoué. Réessayez.');
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) handleGoogleToken(idToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const idToken = result.params?.id_token;
        if (idToken) handleGoogleToken(idToken);
      }
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[M.inkHi, M.ink]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Glow color="#EC5B43" size={160} style={{ left: -30, bottom: 0 }} />
          <Glow color="#38BDF8" size={150} style={{ right: -30, top: 10 }} />
          <RouteArc w={392} h={232} d="M50 175 Q 196 50 342 100" />
          <View style={styles.heroInner}>
            <LinearGradient
              colors={['#EC5B43', '#F5A623']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <Feather name="package" size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.h1}>Welcome back</Text>
            <Text style={styles.h2}>Sign in to Sendlo</Text>
          </View>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          <InkField
            icon="mail"
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <InkField
            icon="lock"
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secure
          />

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#fff" />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <Pressable onPress={() => router.push('/forgot-password')} hitSlop={6}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>

          <GradientButton label="Sign in" icon="arrow-right" onPress={handleLogin} loading={loading} />
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.or}>or</Text>
            <View style={styles.line} />
          </View>
          <Pressable style={styles.google} onPress={handleGoogleLogin}>
            <Feather name="chrome" size={16} color="#fff" />
            <Text style={styles.googleTxt}>Continue with Google</Text>
          </Pressable>
          <View style={styles.signup}>
            <Text style={styles.signupTxt}>New here? </Text>
            <Link href="/(auth)/register-sender" asChild>
              <Pressable hitSlop={6}>
                <Text style={styles.signupLink}>Create account</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: M.ink },
  scroll: { flexGrow: 1, backgroundColor: M.ink },

  hero: { height: 232, overflow: 'hidden' },
  heroInner: { position: 'absolute', top: 42, left: 24, right: 24 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EC5B43',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  h1: { fontFamily: fonts.display, fontSize: 26, fontWeight: '700', color: '#fff', marginTop: 18, letterSpacing: -0.5 },
  h2: { fontSize: 14, color: M.onInkMut, marginTop: 4, fontFamily: fonts.body },

  form: { paddingHorizontal: 22, paddingTop: 22, gap: 14 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(236,91,67,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(236,91,67,0.5)',
    borderRadius: 12,
    padding: 12,
  },
  errorTxt: { color: '#fff', fontSize: 13, flex: 1, fontFamily: fonts.body },
  forgot: { textAlign: 'right', color: M.cool, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },

  footer: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 34 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  or: { color: M.onInkFaint, fontSize: 12, fontFamily: fonts.body },
  google: {
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleTxt: { color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: fonts.body },
  signup: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  signupTxt: { color: M.onInkMut, fontSize: 13, fontFamily: fonts.body },
  signupLink: { color: M.warm2, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
});
