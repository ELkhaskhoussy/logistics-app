import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Card from '../../components/meridian/Card';
import GradientButton from '../../components/meridian/GradientButton';
import { fonts, M } from '../../constants/meridian';
import { useAuth } from '../../scripts/context/AuthContext';
import { getTripById } from '../services/trip';
import { getTransporterProfile } from '../services/transporter';
import type { Trip } from '../networking/types';

/**
 * Public trip page — the landing target for "new trip" alert emails and for
 * anything shared outside the app (WhatsApp, SMS).
 *
 * Deliberately readable while logged out: someone arriving from an email has
 * no session, and asking them to sign in before they can see whether the trip
 * is even relevant is how you lose them. Sign-up is asked for only at the point
 * of booking, where it is actually required.
 */
export default function PublicTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, role } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [transporterName, setTransporterName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Kept separate from "no trip" so a network failure never renders as
  // "this trip does not exist".
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTripById(id);
      setTrip(data);

      // Name is a nice-to-have: a failure here must not blank the page.
      try {
        const profile = await getTransporterProfile(data.transporterId);
        setTransporterName(profile?.displayName ?? null);
      } catch {
        setTransporterName(null);
      }
    } catch (e: any) {
      setError(
        e?.response?.status === 404
          ? "Ce trajet n'existe plus."
          : 'Impossible de charger ce trajet. Vérifiez votre connexion.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const route: string[] = (trip?.collectionStops ?? [])
    .slice()
    .sort((a: any, b: any) => (a?.ordre ?? 0) - (b?.ordre ?? 0))
    .map((s: any) => s?.city)
    .filter((c: any) => !!c);

  const displayRoute = route.length
    ? route
    : [trip?.departureCity, trip?.arrivalCity].filter(Boolean) as string[];

  const onBook = () => {
    if (!trip) return;
    if (!token) {
      // Public sign-up is Sender-only, so send guests straight there.
      router.push('/(auth)/register-sender' as any);
      return;
    }
    if (role === 'TRANSPORTER') return;
    router.push({
      pathname: '/transporter-details/[id]',
      params: { id: String(trip.transporterId), tripId: String(trip.id) },
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={M.warm1} />
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={30} color={M.textMut} />
        <Text style={styles.errorTxt}>{error ?? "Ce trajet est introuvable."}</Text>
        <Pressable onPress={() => router.replace('/' as any)}>
          <Text style={styles.link}>Voir les trajets disponibles</Text>
        </Pressable>
      </View>
    );
  }

  const free = trip.availableCapacityKg ?? 0;
  const total = trip.totalCapacityKg ?? 0;
  const pct = total > 0 ? Math.round(((total - free) / total) * 100) : 0;
  const full = free <= 0;

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[M.ink, M.inkHi]} style={styles.hero}>
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.replace('/' as any)} style={styles.brandRow}>
              <View style={styles.logoDot}>
                <Feather name="send" size={13} color="#fff" />
              </View>
              <Text style={styles.brand}>Sendlo</Text>
            </Pressable>
            {!token ? (
              <Pressable onPress={() => router.push('/(auth)/login' as any)}>
                <Text style={styles.heroLink}>Se connecter</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.heroLabel}>TRAJET</Text>
          <Text style={styles.heroRoute}>
            {displayRoute[0]}
            <Text style={styles.heroArrow}>  →  </Text>
            {displayRoute[displayRoute.length - 1]}
          </Text>
          {transporterName ? (
            <Text style={styles.heroBy}>Proposé par {transporterName}</Text>
          ) : null}
        </LinearGradient>

        <View style={styles.body}>
          {displayRoute.length > 2 ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Itinéraire</Text>
              {displayRoute.map((city, i) => {
                const last = i === displayRoute.length - 1;
                const endpoint = i === 0 || last;
                return (
                  <View key={`${city}-${i}`} style={styles.stopRow}>
                    <View style={styles.stopRail}>
                      <View
                        style={[
                          styles.stopDot,
                          endpoint ? styles.stopDotMain : styles.stopDotMid,
                        ]}
                      />
                      {!last ? <View style={styles.stopLine} /> : null}
                    </View>
                    <Text style={[styles.stopCity, endpoint && styles.stopCityMain]}>
                      {city}
                    </Text>
                  </View>
                );
              })}
            </Card>
          ) : null}

          <Card style={styles.card}>
            <Row label="Départ" value={formatDate(trip.departureTime)} />
            <Row label="Arrivée" value={formatDate(trip.arrivalTime)} />
            <Row label="Prix" value={`${trim(trip.pricePerKg)} € / kg`} />
            <Row
              label="Capacité libre"
              value={`${trim(free)} kg${total ? ` sur ${trim(total)} kg` : ''}`}
              last
            />
            {total > 0 ? (
              <View style={styles.barWrap}>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={[M.warm1, M.warm2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.barFill, { width: `${Math.min(pct, 100)}%` }]}
                  />
                </View>
                <Text style={styles.barTxt}>{pct}% réservé</Text>
              </View>
            ) : null}
          </Card>

          {full ? (
            <View style={styles.fullBox}>
              <Feather name="alert-circle" size={15} color={M.amber} />
              <Text style={styles.fullTxt}>
                Ce trajet est complet. Consultez les autres trajets disponibles.
              </Text>
            </View>
          ) : role === 'TRANSPORTER' ? (
            <View style={styles.fullBox}>
              <Feather name="info" size={15} color={M.amber} />
              <Text style={styles.fullTxt}>
                Seuls les expéditeurs peuvent réserver un trajet.
              </Text>
            </View>
          ) : (
            <GradientButton
              label={token ? 'Réserver ce trajet' : 'Créer un compte pour réserver'}
              onPress={onBook}
              style={styles.cta}
            />
          )}

          <Pressable onPress={() => router.replace('/' as any)} style={styles.browse}>
            <Text style={styles.browseTxt}>Voir tous les trajets</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/** 5 → "5", 5.5 → "5.5". Whole numbers read better without a trailing .0 */
function trim(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  return Number.isInteger(n) ? String(n) : String(n);
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: M.page },
  scroll: { paddingBottom: 40 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: M.page, padding: 32, gap: 12,
  },
  errorTxt: {
    fontSize: 14, color: M.textMut, textAlign: 'center',
    fontFamily: fonts.body, lineHeight: 20,
  },
  link: { fontSize: 14, color: M.warm1, fontFamily: fonts.body },

  hero: { paddingTop: Platform.OS === 'web' ? 20 : 48, paddingHorizontal: 20, paddingBottom: 26 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDot: {
    width: 24, height: 24, borderRadius: 8, backgroundColor: M.warm1,
    alignItems: 'center', justifyContent: 'center',
  },
  brand: { fontSize: 15, color: '#fff', fontFamily: fonts.display, fontWeight: '700' },
  heroLink: { fontSize: 13, color: M.onInkMut, fontFamily: fonts.body },
  heroLabel: {
    fontSize: 10, letterSpacing: 1.4, color: M.onInkFaint,
    fontFamily: fonts.body, marginBottom: 6,
  },
  heroRoute: { fontSize: 24, color: '#fff', fontFamily: fonts.display, fontWeight: '700', lineHeight: 32 },
  heroArrow: { color: M.warm2 },
  heroBy: { fontSize: 13, color: M.onInkMut, fontFamily: fonts.body, marginTop: 8 },

  body: { padding: 16, gap: 14 },
  card: { padding: 16 },
  cardTitle: {
    fontSize: 12, letterSpacing: 0.6, color: M.textFaint,
    fontFamily: fonts.body, marginBottom: 12, textTransform: 'uppercase',
  },

  stopRow: { flexDirection: 'row', gap: 12 },
  stopRail: { width: 12, alignItems: 'center' },
  stopDot: { width: 9, height: 9, borderRadius: 5, marginTop: 4 },
  stopDotMain: { backgroundColor: M.warm1 },
  stopDotMid: { backgroundColor: M.line, borderWidth: 1.5, borderColor: M.textFaint },
  stopLine: { flex: 1, width: 1.5, backgroundColor: M.line, marginVertical: 2 },
  stopCity: { fontSize: 14, color: M.textMut, fontFamily: fonts.body, paddingBottom: 14 },
  stopCityMain: { color: M.text, fontWeight: '600' },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: M.hair,
  },
  rowLabel: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },
  rowValue: { fontSize: 14, color: M.text, fontFamily: fonts.body, fontWeight: '600' },

  barWrap: { marginTop: 14 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: M.surfaceAlt, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  barTxt: { fontSize: 11, color: M.textFaint, fontFamily: fonts.body, marginTop: 6 },

  fullBox: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: M.amberBg, borderRadius: 12, padding: 13,
  },
  fullTxt: { flex: 1, fontSize: 13, color: M.amber, fontFamily: fonts.body, lineHeight: 18 },

  cta: { marginTop: 2 },
  browse: { alignItems: 'center', paddingVertical: 12 },
  browseTxt: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },
});
