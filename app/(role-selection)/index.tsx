import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Glow from '../../components/meridian/Glow';
import GradientButton from '../../components/meridian/GradientButton';
import { fonts, M } from '../../constants/meridian';
import { clearGoogleUser, getGoogleUser } from '../../app/utils/tokenStorage';
import { useAuth } from '../../scripts/context/AuthContext';
import { registerWithGoogle } from '../services/auth';

type Role = 'SENDER' | 'TRANSPORTER';

export default function RoleSelection() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>('SENDER');
  const [busy, setBusy] = useState(false);

  const handleContinue = async () => {
    setBusy(true);
    try {
      const googleUser = await getGoogleUser();

      // Classic flow: go to the matching registration form.
      if (!googleUser) {
        router.replace(role === 'SENDER' ? '/(auth)/register-sender' : '/(auth)/register-transporter');
        return;
      }

      // Google flow: register with the chosen role, then route.
      const data = await registerWithGoogle({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        imageUrl: googleUser.imageUrl,
        role,
      });
      await login(data);

      if (role === 'TRANSPORTER') {
        try {
          const { createTransporterProfile } = require('../services/trip');
          await createTransporterProfile(data.userId, {
            displayName: `${googleUser.firstName ?? ''} ${googleUser.lastName ?? ''}`.trim() || googleUser.email,
            bio: '',
            pricingPerKg: 0,
          });
        } catch (profileError) {
          console.error('⚠️ [ROLE-SELECT] Failed to create transporter profile:', profileError);
        }
      }

      await clearGoogleUser();
      router.replace(role === 'SENDER' ? '/(sender)/search' : '/(transporter)/dashboard');
    } catch (error) {
      console.error('Role selection error:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.head}>
        <Glow color="#EC5B43" size={180} style={{ left: 40, top: -40 }} />
        <Text style={styles.h1}>How will you{'\n'}use Sendlo?</Text>
        <Text style={styles.sub}>Pick a role — switch anytime.</Text>
      </View>

      <View style={styles.cards}>
        <RoleCard
          active={role === 'SENDER'}
          icon="package"
          title="I'm a Sender"
          desc="Find travellers and send parcels across the sea."
          onPress={() => setRole('SENDER')}
        />
        <RoleCard
          active={role === 'TRANSPORTER'}
          icon="truck"
          title="I'm a Transporter"
          desc="Post trips and earn carrying parcels."
          onPress={() => setRole('TRANSPORTER')}
        />
        <GradientButton label="Continue" icon="arrow-right" onPress={handleContinue} loading={busy} style={{ marginTop: 6 }} />
      </View>
    </ScrollView>
  );
}

function RoleCard({
  active,
  icon,
  title,
  desc,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.card, active && styles.cardActive]}>
      <View style={styles.cardTop}>
        {active ? (
          <LinearGradient colors={['#EC5B43', '#F5A623']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardIcon}>
            <Feather name={icon} size={24} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={styles.cardIconMuted}>
            <Feather name={icon} size={24} color={M.onInkMut} />
          </View>
        )}
        <Feather name={active ? 'check-circle' : 'circle'} size={22} color={active ? '#EC5B43' : '#3A465A'} />
      </View>
      <Text style={[styles.cardTitle, !active && { color: '#DDE3EC' }]}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: M.ink, paddingHorizontal: 22, paddingTop: 40, paddingBottom: 34 },
  head: { overflow: 'hidden', marginBottom: 22 },
  h1: { fontFamily: fonts.display, fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 32, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: M.onInkMut, marginTop: 10, fontFamily: fonts.body },
  cards: { gap: 14 },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardActive: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1.5, borderColor: '#EC5B43' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardIconMuted: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  cardTitle: { fontFamily: fonts.display, fontSize: 19, fontWeight: '700', color: '#fff', marginTop: 14 },
  cardDesc: { fontSize: 13, color: M.onInkMut, marginTop: 4, lineHeight: 20, fontFamily: fonts.body },
});
