import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Badge from '../../../components/meridian/Badge';
import Card from '../../../components/meridian/Card';
import Glow from '../../../components/meridian/Glow';
import { fonts, M } from '../../../constants/meridian';
import { apiClient } from '../../networking/client';
import { getToken, getUserId } from '../../utils/tokenStorage';

export default function DashboardScreen() {
  const router = useRouter();
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [pastTrips, setPastTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const loadTrips = useCallback(async () => {
    try {
      setLoadingTrips(true);
      const userId = await getUserId();
      const token = await getToken();
      if (!userId || !token) return;
      const res = await apiClient.get(`/catalog/trips/transporter/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const trips = Array.isArray(res.data) ? res.data : [];
      const now = new Date();
      setUpcomingTrips(trips.filter((t) => new Date(t.departureTime) >= now));
      setPastTrips(trips.filter((t) => new Date(t.departureTime) < now));
    } catch (err) {
      console.log('Failed to load trips:', err);
      setUpcomingTrips([]);
      setPastTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTrips(); }, [loadTrips]));

  const fmtDate = (value: any) => (!value ? '—' : new Date(value).toLocaleDateString('fr-FR'));

  const renderTrip = (trip: any) => {
    const total = Number(trip.totalCapacityKg) || 0;
    const avail = Number(trip.availableCapacityKg) || 0;
    const booked = Math.max(0, total - avail);
    const pct = total > 0 ? Math.round((booked / total) * 100) : 0;
    const open = avail > 0;
    return (
      <Card
        key={trip.id}
        style={styles.tripCard}
        onPress={() => router.push({ pathname: '/(transporter)/trip-details', params: { tripId: trip.id } } as any)}
      >
        <View style={styles.tripTop}>
          <View style={styles.routeRow}>
            <Text style={styles.city}>{trip.departureCity}</Text>
            <Feather name="arrow-right" size={14} color={M.warm1} />
            <Text style={styles.city}>{trip.arrivalCity}</Text>
          </View>
          <Badge label={open ? 'OPEN' : 'FULL'} tone={open ? 'green' : 'amber'} />
        </View>

        {total > 0 ? (
          <View style={{ marginTop: 14 }}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressTxt}>{booked} / {total} kg réservés</Text>
              <Text style={styles.progressPct}>{pct}%</Text>
            </View>
            <View style={styles.track}>
              <LinearGradient colors={[M.warm1, M.cool]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${pct}%` }]} />
            </View>
          </View>
        ) : null}

        <View style={styles.tripFooter}>
          <Text style={styles.metaDate}>{fmtDate(trip.departureTime)}</Text>
          <Text style={styles.metaPrice}>€{trip.pricePerKg}/kg</Text>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.85, y: 0 }} end={{ x: 0.2, y: 1 }} style={StyleSheet.absoluteFill} />
          <Glow color="#EC5B43" size={160} style={{ right: -30, top: -20 }} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.hello}>Bon retour,</Text>
              <Text style={styles.heroTitle}>Tableau de bord</Text>
            </View>
            <View style={styles.bell}>
              <Feather name="bell" size={18} color="#fff" />
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{upcomingTrips.length}</Text>
              <Text style={styles.statLbl}>À venir</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: M.warm2 }]}>{pastTrips.length}</Text>
              <Text style={styles.statLbl}>Passés</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{upcomingTrips.length + pastTrips.length}</Text>
              <Text style={styles.statLbl}>Total</Text>
            </View>
          </View>
        </View>

        {/* UPCOMING */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trajets à venir</Text>
          {loadingTrips ? (
            <ActivityIndicator color={M.warm1} style={{ marginTop: 10 }} />
          ) : upcomingTrips.length === 0 ? (
            <Text style={styles.empty}>Aucun trajet à venir</Text>
          ) : (
            upcomingTrips
              .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
              .map(renderTrip)
          )}
        </View>

        {/* PAST */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trajets passés</Text>
          {loadingTrips ? null : pastTrips.length === 0 ? (
            <Text style={styles.empty}>Aucun trajet passé</Text>
          ) : (
            pastTrips.map(renderTrip)
          )}
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/(transporter)/(tabs)/add-trip' as any)}>
        <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
          <Feather name="plus" size={26} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },

  hero: { overflow: 'hidden', paddingHorizontal: 22, paddingTop: 16, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hello: { fontSize: 13, color: M.onInkMut, fontFamily: fonts.body },
  heroTitle: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  statsCard: { marginTop: 18, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: fonts.display, fontSize: 20, fontWeight: '700', color: '#fff' },
  statLbl: { fontSize: 11, color: M.onInkMut, marginTop: 2, fontFamily: fonts.body },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  section: { paddingHorizontal: 20, paddingTop: 22 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 16, fontWeight: '700', color: M.text, marginBottom: 12 },
  empty: { color: M.textMut, fontFamily: fonts.body },

  tripCard: { padding: 16, marginBottom: 14 },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  city: { fontFamily: fonts.display, fontSize: 16, fontWeight: '700', color: M.text },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressTxt: { fontSize: 11, color: M.textFaint, fontFamily: fonts.body },
  progressPct: { fontSize: 11, fontWeight: '600', color: M.blue, fontFamily: fonts.display },
  track: { height: 7, borderRadius: 9999, backgroundColor: M.page, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9999 },
  tripFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  metaDate: { fontSize: 12, color: M.textFaint, fontFamily: fonts.body },
  metaPrice: { fontSize: 13, fontWeight: '600', color: M.text, fontFamily: fonts.display },

  fab: { position: 'absolute', right: 22, bottom: 84 },
  fabInner: {
    width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EC5B43', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
  },
});
