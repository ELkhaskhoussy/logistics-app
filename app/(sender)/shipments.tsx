import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/meridian/Card';
import Glow from '../../components/meridian/Glow';
import GradientButton from '../../components/meridian/GradientButton';
import RouteDots from '../../components/meridian/RouteDots';
import { fonts, M } from '../../constants/meridian';
import { useAuth } from '../../scripts/context/AuthContext';
import type { Booking } from '../networking/types';
import { getMyBookings } from '../services/booking';

/** Visual treatment per booking status, mirroring the Meridian design. */
const STATUS = {
  PENDING: { label: 'EN ATTENTE', color: M.amber, bg: '#FBF3E1' },
  PRE_ACCEPTED: { label: 'PRÉ-ACCEPTÉE', color: M.warm1, bg: '#FBEBE7' },
  CONFIRMED: { label: 'CONFIRMÉE', color: M.blue, bg: '#EEF6FF' },
  DELIVERED: { label: 'LIVRÉE', color: M.green, bg: M.greenBg },
  NOT_DELIVERED: { label: 'NON LIVRÉE', color: '#DC2626', bg: '#FEE2E2' },
  CANCELLED: { label: 'ANNULÉE', color: M.textFaint, bg: '#EEF1F5' },
} as const;

type FilterKey = 'ALL' | 'ACTIVE' | 'DONE';

export default function ShipmentsScreen() {
  const router = useRouter();
  const { userId, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError(false);
      setBookings(await getMyBookings(userId));
    } catch (e) {
      console.warn('Failed to load shipments', e);
      setLoadError(true);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading) load();
    }, [authLoading, load])
  );

  const activeCount = useMemo(
    () => bookings.filter((b) => ['PENDING', 'PRE_ACCEPTED', 'CONFIRMED'].includes(b.status)).length,
    [bookings]
  );

  const shown = useMemo(() => {
    if (filter === 'ACTIVE') return bookings.filter((b) => ['PENDING', 'PRE_ACCEPTED', 'CONFIRMED'].includes(b.status));
    if (filter === 'DONE') return bookings.filter((b) => ['DELIVERED', 'NOT_DELIVERED', 'CANCELLED'].includes(b.status));
    return bookings;
  }, [bookings, filter]);

  const fmtDate = (v: any) => {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <Glow color="#EC5B43" size={170} style={{ left: -40, bottom: -30 }} />
          <Text style={styles.heroTitle}>Mes envois</Text>
          <Text style={styles.heroSub}>
            {loading ? 'Chargement…' : `${bookings.length} envoi${bookings.length > 1 ? 's' : ''} · ${activeCount} en cours`}
          </Text>
          <View style={styles.pills}>
            {([['ALL', 'Tous'], ['ACTIVE', 'En cours'], ['DONE', 'Terminés']] as const).map(([key, label]) => (
              <Pressable key={key} style={[styles.pill, filter === key && styles.pillActive]} onPress={() => setFilter(key)}>
                <Text style={[styles.pillTxt, filter === key && styles.pillTxtActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={M.warm1} />
          </View>
        ) : loadError ? (
          <View style={styles.errorBanner}>
            <Feather name="wifi-off" size={18} color={M.warm1} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Impossible de charger vos envois</Text>
              <Text style={styles.errorSub}>Vérifiez votre connexion.</Text>
            </View>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryTxt}>Réessayer</Text>
            </Pressable>
          </View>
        ) : shown.length === 0 ? (
          <EmptyState onSearch={() => router.push('/(sender)/search' as any)} filtered={filter !== 'ALL'} />
        ) : (
          <View style={styles.list}>
            {shown.map((b) => {
              const trip: any = (b as any).trip;
              const st = STATUS[(b.status as keyof typeof STATUS)] ?? STATUS.PENDING;
              const weight = (b.parcels ?? []).reduce((s, p) => s + (p.weightKg ?? 0), 0);
              const price = trip?.pricePerKg ? weight * Number(trip.pricePerKg) : null;
              const isPre = b.status === 'PRE_ACCEPTED';
              const isDone = ['DELIVERED', 'NOT_DELIVERED', 'CANCELLED'].includes(b.status);

              return (
                <Card
                  key={b.id}
                  style={[
                    styles.card,
                    isPre && styles.cardHighlight,
                    isDone && { opacity: 0.86 },
                  ] as any}
                  onPress={() => router.push({ pathname: '/shipment/[id]', params: { id: b.id } } as any)}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.route} numberOfLines={1}>
                      {trip?.departureCity ?? '—'} → {trip?.arrivalCity ?? '—'}
                    </Text>
                    <Text style={[styles.badge, { color: st.color, backgroundColor: st.bg }]}>{st.label}</Text>
                  </View>

                  <RouteDots style={{ marginTop: 14 }} />
                  <View style={styles.cityRow}>
                    <Text style={styles.city}>{trip?.departureCity ?? '—'}</Text>
                    <Text style={styles.mono}>{fmtDate(trip?.departureTime)}</Text>
                    <Text style={styles.city}>{trip?.arrivalCity ?? '—'}</Text>
                  </View>

                  <View style={styles.divider} />
                  <View style={styles.footRow}>
                    <View style={styles.kgRow}>
                      <Feather name="box" size={15} color={M.textMut} />
                      <Text style={styles.kg}>
                        {weight} kg{b.status === 'CONFIRMED' ? ' · pesé' : ''}
                      </Text>
                    </View>
                    {price !== null ? <Text style={styles.price}>€{price.toFixed(2)}</Text> : null}
                  </View>

                  {/* Status-specific footer */}
                  {isPre ? (
                    <View style={styles.collectBanner}>
                      <Feather name="map-pin" size={17} color={M.warm1} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.collectTitle}>Présentez-vous au point de collecte</Text>
                        <Text style={styles.collectSub}>{trip?.departureCity ?? ''} · avant le départ</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={M.warm1} />
                    </View>
                  ) : b.status === 'PENDING' ? (
                    <View style={styles.hintRow}>
                      <Feather name="clock" size={14} color={M.amber} />
                      <Text style={styles.hintTxt}>En attente de réponse du transporteur</Text>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ onSearch, filtered }: { onSearch: () => void; filtered: boolean }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Feather name="package" size={26} color={M.textFaint} />
      </View>
      <Text style={styles.emptyTitle}>{filtered ? 'Aucun envoi ici' : 'Aucun envoi en cours'}</Text>
      <Text style={styles.emptySub}>
        Trouvez un voyageur sur votre trajet et envoyez votre premier colis en quelques minutes.
      </Text>
      <View style={{ width: '100%', marginTop: 24 }}>
        <GradientButton label="Chercher un trajet" icon="arrow-right" onPress={onSearch} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },

  hero: { overflow: 'hidden', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroTitle: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: M.onInkMut, marginTop: 5, fontFamily: fonts.body },
  pills: { flexDirection: 'row', gap: 8, marginTop: 16 },
  pill: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)' },
  pillActive: { backgroundColor: '#fff' },
  pillTxt: { fontSize: 12, fontWeight: '600', color: '#B4C0D2', fontFamily: fonts.body },
  pillTxtActive: { color: M.ink },

  center: { paddingTop: 60, alignItems: 'center' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, margin: 20,
    backgroundColor: '#FEF0EC', borderWidth: 1, borderColor: '#F6D9CE', borderRadius: 16, padding: 14,
  },
  errorTitle: { fontSize: 14, fontWeight: '600', color: '#B33F2A', fontFamily: fonts.body },
  errorSub: { fontSize: 12, color: '#A8705B', marginTop: 2, fontFamily: fonts.body },
  retryBtn: { backgroundColor: M.warm1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  retryTxt: { color: '#fff', fontSize: 12, fontWeight: '600', fontFamily: fonts.body },
  list: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },

  card: { padding: 18 },
  cardHighlight: { borderWidth: 1.5, borderColor: M.warm1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  route: { flex: 1, fontSize: 15, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  badge: { fontSize: 10, fontWeight: '700', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, overflow: 'hidden', letterSpacing: 0.4, fontFamily: fonts.display },

  cityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 },
  city: { fontSize: 13, fontWeight: '600', color: M.text, fontFamily: fonts.display },
  mono: { fontSize: 11, color: M.textFaint, fontFamily: fonts.display },
  divider: { height: 1, backgroundColor: M.hair, marginTop: 16, marginBottom: 14 },
  footRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kgRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kg: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },
  price: { fontSize: 20, fontWeight: '700', color: M.text, fontFamily: fonts.display, letterSpacing: -0.4 },

  collectBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: '#FDF0EC', borderWidth: 1, borderColor: '#F6D9CE', borderRadius: 14, padding: 13 },
  collectTitle: { fontSize: 12, fontWeight: '600', color: '#B33F2A', lineHeight: 17, fontFamily: fonts.body },
  collectSub: { fontSize: 11, color: '#A8705B', marginTop: 1, fontFamily: fonts.body },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  hintTxt: { fontSize: 12, color: '#8A7A4E', fontFamily: fonts.body },

  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 70 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: M.line, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: '700', color: M.text, marginTop: 24, letterSpacing: -0.3 },
  emptySub: { fontSize: 14, color: M.textMut, lineHeight: 21, marginTop: 8, textAlign: 'center', fontFamily: fonts.body },
});
