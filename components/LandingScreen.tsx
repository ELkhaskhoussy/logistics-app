import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from './meridian/Card';
import Glow from './meridian/Glow';
import GradientButton from './meridian/GradientButton';
import RouteArc from './meridian/RouteArc';
import RouteDots from './meridian/RouteDots';
import { fonts, M } from '../constants/meridian';
import { apiClient } from '../app/services/backService';

const STEPS = [
  { n: '01', icon: 'search', tint: '#FEF4E5', color: '#EC5B43', title: 'Cherchez un trajet', sub: 'Filtrez par ville et par date.' },
  { n: '02', icon: 'package', tint: '#EEF6FF', color: '#2563EB', title: 'Réservez votre colis', sub: 'Envoyez une demande au voyageur.' },
  { n: '03', icon: 'map-pin', tint: '#E7F7EE', color: '#16A34A', title: 'Suivez la livraison', sub: "Du départ jusqu'à la remise." },
] as const;

const TRUST = [
  { icon: 'shield', color: '#38BDF8', bg: 'rgba(56,189,248,0.16)', title: 'Voyageurs vérifiés', sub: 'Identité contrôlée avant publication.' },
  { icon: 'camera', color: '#F5A623', bg: 'rgba(245,166,35,0.16)', title: 'Photos du colis', sub: 'Preuve visuelle à chaque étape.' },
  { icon: 'message-circle', color: '#4ADE80', bg: 'rgba(22,163,74,0.16)', title: 'Contact WhatsApp direct', sub: 'Parlez au voyageur en un tap.' },
] as const;

export default function LandingScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    apiClient
      .get('/catalog/trips/available')
      .then((r) => setTrips(Array.isArray(r.data) ? r.data.slice(0, 4) : []))
      .catch(() => setTrips([]));
  }, []);

  const toLogin = () => router.push('/(auth)/login');
  const toSignup = () => router.push('/(role-selection)');

  const fmtMonth = (v: any) => {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    const s = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: M.page }} contentContainerStyle={{ paddingBottom: 0 }} showsVerticalScrollIndicator={false}>
      {/* HERO */}
      <View style={styles.hero}>
        <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
        <Glow color="#EC5B43" size={200} style={{ left: -40, bottom: 150 }} />
        <Glow color="#38BDF8" size={190} style={{ right: -30, top: 70 }} />
        <RouteArc w={392} h={520} d="M64 170 Q 200 76 330 120" />

        {/* city markers */}
        <View style={[styles.cityDot, { left: 58, top: 176, backgroundColor: M.warm2 }]} />
        <Text style={[styles.cityLabel, { left: 48, top: 196, color: '#F7C58A' }]}>TUNIS</Text>
        <View style={[styles.cityDot, { right: 52, top: 120, backgroundColor: M.cool }]} />
        <Text style={[styles.cityLabel, { right: 44, top: 100, color: '#A9DEFB' }]}>PARIS</Text>

        {/* top bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.brandLogo}>
              <Feather name="send" size={15} color="#fff" />
            </LinearGradient>
            <Text style={styles.brand}>Sendlo</Text>
          </View>
          <Pressable onPress={toLogin}><Text style={styles.topLogin}>Se connecter</Text></Pressable>
        </View>

        {/* hero copy */}
        <View style={styles.heroCopy}>
          <View style={styles.pill}>
            <View style={styles.pillDot} />
            <Text style={styles.pillTxt}>France ⇄ Tunisie</Text>
          </View>
          <Text style={styles.h1}>Envoyez vos colis entre la France et la Tunisie</Text>
          <Text style={styles.sub}>Des voyageurs de confiance transportent vos colis sur la route que vous connaissez déjà.</Text>
          <View style={{ gap: 10, marginTop: 20 }}>
            <GradientButton label="Créer un compte" icon="arrow-right" onPress={toSignup} />
            <Pressable style={styles.outlineBtn} onPress={toLogin}>
              <Text style={styles.outlineTxt}>Se connecter</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* COMMENT ÇA MARCHE */}
      <View style={styles.section}>
        <Text style={styles.lbl}>Comment ça marche</Text>
        <View style={{ gap: 12, marginTop: 14 }}>
          {STEPS.map((s) => (
            <Card key={s.n} style={styles.stepCard}>
              <View style={[styles.stepIcon, { backgroundColor: s.tint }]}>
                <Feather name={s.icon as any} size={20} color={s.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepNum, { color: s.color }]}>{s.n}</Text>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                </View>
                <Text style={styles.stepSub}>{s.sub}</Text>
              </View>
            </Card>
          ))}
        </View>
      </View>

      {/* TRAJETS DISPONIBLES */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.lbl}>Trajets disponibles</Text>
          <Pressable onPress={toLogin}><Text style={styles.seeAll}>Voir tout</Text></Pressable>
        </View>
        <View style={{ gap: 14, marginTop: 14 }}>
          {trips.length === 0 ? (
            <Card style={{ padding: 18 }}>
              <Text style={styles.emptyTxt}>Chargement des trajets disponibles…</Text>
            </Card>
          ) : (
            trips.map((t) => (
              <Card key={t.id} style={styles.tripCard} onPress={toLogin}>
                <RouteDots />
                <View style={styles.cityRow}>
                  <Text style={styles.city}>{t.departureCity}</Text>
                  <Text style={styles.mono}>{fmtMonth(t.departureTime)}</Text>
                  <Text style={styles.city}>{t.arrivalCity}</Text>
                </View>
                <View style={styles.tripDivider} />
                <View style={styles.tripFoot}>
                  <View style={styles.kgRow}>
                    <Feather name="box" size={15} color={M.textMut} />
                    <Text style={styles.kg}>{t.availableCapacityKg} kg dispo</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>€{t.pricePerKg}</Text>
                    <Text style={styles.priceUnit}>/kg</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
        <View style={styles.gateNote}>
          <Feather name="lock" size={16} color={M.amber} />
          <Text style={styles.gateTxt}>Créez un compte pour réserver et contacter le voyageur.</Text>
        </View>
      </View>

      {/* CONFIANCE */}
      <View style={{ paddingHorizontal: 22, marginTop: 4 }}>
        <View style={styles.trustCard}>
          <Glow color="#38BDF8" size={120} style={{ right: -30, top: -20 }} />
          <View style={{ gap: 14 }}>
            {TRUST.map((t) => (
              <View key={t.title} style={styles.trustRow}>
                <View style={[styles.trustIcon, { backgroundColor: t.bg }]}>
                  <Feather name={t.icon as any} size={18} color={t.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trustTitle}>{t.title}</Text>
                  <Text style={styles.trustSub}>{t.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.brandRow}>
          <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.footLogo}>
            <Feather name="send" size={13} color="#fff" />
          </LinearGradient>
          <Text style={styles.footBrand}>Sendlo</Text>
        </View>
        <View style={styles.footLinks}>
          <Text style={styles.footLink}>Conditions & Termes</Text>
          <Text style={styles.footLink}>Mentions légales</Text>
          <Text style={styles.footLink}>Contact</Text>
        </View>
        <Text style={styles.copy}>Sendlo · France ⇄ Tunisie · © 2026</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 512, overflow: 'hidden' },
  cityDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: M.ink },
  cityLabel: { position: 'absolute', fontFamily: fonts.display, fontSize: 12, fontWeight: '600' },
  topBar: { position: 'absolute', top: 16, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: fonts.display, fontSize: 16, fontWeight: '700', color: '#fff' },
  topLogin: { fontSize: 13, color: M.onInkMut, fontWeight: '500', fontFamily: fonts.body },

  heroCopy: { position: 'absolute', left: 24, right: 24, bottom: 26 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 9999, paddingVertical: 6, paddingHorizontal: 12 },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: M.cool },
  pillTxt: { fontSize: 11, color: '#A9DEFB', fontFamily: fonts.display, letterSpacing: 0.3 },
  h1: { fontFamily: fonts.display, fontSize: 29, fontWeight: '700', color: '#fff', lineHeight: 33, letterSpacing: -0.5, marginTop: 16 },
  sub: { fontSize: 14, color: M.onInkMut, lineHeight: 21, marginTop: 12, fontFamily: fonts.body },
  outlineBtn: { height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  outlineTxt: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: fonts.body },

  section: { paddingHorizontal: 22, marginTop: 26 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lbl: { fontFamily: fonts.display, fontSize: 12, fontWeight: '600', color: M.textFaint, letterSpacing: 0.6, textTransform: 'uppercase' },
  seeAll: { fontSize: 12, color: M.warm1, fontWeight: '600', fontFamily: fonts.body },

  stepCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepNum: { fontFamily: fonts.display, fontSize: 12, fontWeight: '700' },
  stepTitle: { fontSize: 15, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  stepSub: { fontSize: 13, color: M.textMut, marginTop: 2, fontFamily: fonts.body },

  tripCard: { padding: 18 },
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 },
  city: { fontSize: 13, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  mono: { fontSize: 11, color: M.textFaint, fontFamily: fonts.display },
  tripDivider: { height: 1, backgroundColor: M.hair, marginTop: 16, marginBottom: 14 },
  tripFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kgRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kg: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  price: { fontSize: 22, fontWeight: '700', color: M.text, fontFamily: fonts.display, letterSpacing: -0.5 },
  priceUnit: { fontSize: 12, color: M.textFaint, fontFamily: fonts.body },
  emptyTxt: { color: M.textMut, fontFamily: fonts.body, textAlign: 'center' },

  gateNote: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FBF7ED', borderWidth: 1, borderColor: '#F3E7C9', borderRadius: 14, padding: 14 },
  gateTxt: { flex: 1, fontSize: 12, color: '#8A7A4E', lineHeight: 18, fontFamily: fonts.body },

  trustCard: { backgroundColor: M.ink, borderRadius: 20, padding: 20, overflow: 'hidden', marginTop: 24 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  trustTitle: { fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: fonts.body },
  trustSub: { fontSize: 12, color: M.onInkMut, fontFamily: fonts.body },

  footer: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 34 },
  footLogo: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  footBrand: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', color: M.text },
  footLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  footLink: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },
  copy: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E6EC', fontSize: 12, color: M.textFaint, fontFamily: fonts.body },
});
