import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Glow from '../../components/meridian/Glow';
import RouteDots from '../../components/meridian/RouteDots';
import { fonts, M } from '../../constants/meridian';
import { getApiBaseUrl } from '../networking/config';
import type { Booking } from '../networking/types';
import { getMyBookings } from '../services/booking';
import { useAuth } from '../../scripts/context/AuthContext';
import { apiClient } from '../services/backService';

const STATUS = {
  PENDING: { label: 'EN ATTENTE', color: M.amber, bg: 'rgba(245,166,35,0.16)' },
  PRE_ACCEPTED: { label: 'PRÉ-ACCEPTÉE', color: M.warm2, bg: 'rgba(245,166,35,0.16)' },
  CONFIRMED: { label: 'EN TRANSIT', color: M.cool, bg: 'rgba(56,189,248,0.18)' },
  DELIVERED: { label: 'LIVRÉE', color: '#4ADE80', bg: 'rgba(22,163,74,0.18)' },
  NOT_DELIVERED: { label: 'NON LIVRÉE', color: '#F87171', bg: 'rgba(220,38,38,0.18)' },
  CANCELLED: { label: 'ANNULÉE', color: '#B4C0D2', bg: 'rgba(255,255,255,0.1)' },
} as const;

/** Sender-facing tracking: where the parcel is along the route. */
export default function ShipmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [transporterPhone, setTransporterPhone] = useState('');
  const [transporterName, setTransporterName] = useState('le transporteur');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userId || !id) return;
      try {
        const all = await getMyBookings(userId);
        const found = all.find((b) => String(b.id) === String(id)) ?? null;
        setBooking(found);

        const transporterId = (found as any)?.trip?.transporterId;
        if (transporterId) {
          try {
            const u = await apiClient.get(`/users/${transporterId}`);
            setTransporterPhone(u.data?.phone ?? '');
            const full = `${u.data?.firstName ?? ''} ${u.data?.lastName ?? ''}`.trim();
            if (full) setTransporterName(full);
          } catch {
            // contact stays unavailable
          }
        }
      } catch (e) {
        console.warn('Failed to load shipment', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, userId]);

  const trip: any = (booking as any)?.trip;
  const st = STATUS[(booking?.status as keyof typeof STATUS)] ?? STATUS.PENDING;
  const parcels = booking?.parcels ?? [];
  const weight = parcels.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  const price = trip?.pricePerKg ? weight * Number(trip.pricePerKg) : null;
  const isPre = booking?.status === 'PRE_ACCEPTED';
  const weighed = booking?.status === 'CONFIRMED' || booking?.status === 'DELIVERED';

  const photos = parcels.flatMap((p) => p.images ?? []).map((i) => `${getApiBaseUrl()}/parcel-uploads/files/${i.imageUrl}`);

  const fmt = (v: any) => {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  /** Stops with completed / current / upcoming state, driven by trip.currentStopIndex. */
  const stops = useMemo(() => {
    if (!trip) return [];
    const list = Array.isArray(trip.collectionStops) && trip.collectionStops.length
      ? [...trip.collectionStops].sort((a: any, b: any) => (a.ordre ?? 0) - (b.ordre ?? 0))
      : [{ city: trip.departureCity, stopTime: trip.departureTime }, { city: trip.arrivalCity, stopTime: trip.arrivalTime }];
    const current = Number(trip.currentStopIndex ?? 0);
    return list.map((s: any, i: number) => ({
      city: s.city,
      date: fmt(s.stopTime),
      state: i < current ? 'done' : i === current ? 'current' : 'upcoming',
      isLast: i === list.length - 1,
      isFirst: i === 0,
    }));
  }, [trip]);

  const openWhatsApp = () => {
    const digits = (transporterPhone || '').replace(/[^0-9]/g, '');
    if (!digits) return;
    const text = encodeURIComponent(`Bonjour, je vous contacte via Sendlo au sujet de mon colis.`);
    Linking.openURL(`https://wa.me/${digits}?text=${text}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={M.warm1} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 12 }]}>
        <Feather name="alert-circle" size={38} color={M.textFaint} />
        <Text style={styles.empty}>Envoi introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <Glow color="#EC5B43" size={160} style={{ left: -30, bottom: -10 }} />
          <Glow color="#38BDF8" size={140} style={{ right: -30, top: -20 }} />
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={styles.heroRoute}>
            <Text style={styles.heroCity}>{trip?.departureCity ?? '—'}</Text>
            <RouteDots style={{ flex: 1, marginHorizontal: 12 }} />
            <Text style={styles.heroCity}>{trip?.arrivalCity ?? '—'}</Text>
          </View>
          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMeta}>Départ {fmt(trip?.departureTime)}</Text>
            <Text style={[styles.heroBadge, { color: st.color, backgroundColor: st.bg }]}>{st.label}</Text>
          </View>
        </View>

        {/* ACTION BANNER — pre-accepted */}
        {isPre ? (
          <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBanner}>
            <View style={styles.bannerTop}>
              <View style={styles.bannerIcon}>
                <Feather name="map-pin" size={21} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Présentez-vous au point de collecte</Text>
                <Text style={styles.bannerSub}>Le transporteur a accepté votre demande.</Text>
              </View>
            </View>
            <View style={styles.bannerInfo}>
              <View style={styles.bannerRow}>
                <Feather name="home" size={14} color="#fff" />
                <Text style={styles.bannerRowTxt}>{trip?.departureCity ?? '—'}</Text>
              </View>
              <View style={styles.bannerRow}>
                <Feather name="clock" size={14} color="#fff" />
                <Text style={styles.bannerRowTxt}>Avant le {fmt(trip?.departureTime)}</Text>
              </View>
            </View>
          </LinearGradient>
        ) : null}

        {/* LIVE STRIP — in transit */}
        {booking.status === 'CONFIRMED' ? (
          <View style={styles.liveStrip}>
            <View style={styles.liveDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.liveTitle}>
                Colis en route{stops[Number(trip?.currentStopIndex ?? 0)]?.city ? ` · ${stops[Number(trip?.currentStopIndex ?? 0)].city}` : ''}
              </Text>
              <Text style={styles.liveSub}>Position mise à jour par le transporteur</Text>
            </View>
          </View>
        ) : null}

        {/* TIMELINE */}
        <View style={styles.section}>
          <Text style={styles.lbl}>Suivi du trajet</Text>
          <View style={styles.card}>
            {stops.map((s: any, i: number) => (
              <View key={i} style={styles.tlRow}>
                <View style={styles.tlCol}>
                  {s.state === 'done' ? (
                    <View style={styles.dotDone}>
                      <Feather name="check" size={10} color="#fff" />
                    </View>
                  ) : s.state === 'current' ? (
                    <View style={styles.dotCurrent} />
                  ) : (
                    <View style={styles.dotUpcoming} />
                  )}
                  {!s.isLast && <View style={styles.tlLine} />}
                </View>
                <View style={{ flex: 1, paddingBottom: s.isLast ? 4 : 20 }}>
                  <View style={styles.tlHead}>
                    <Text style={styles.tlCity}>
                      {s.city}
                      {s.isFirst ? ' · collecte' : s.isLast ? ' · livraison' : ''}
                    </Text>
                    {s.state === 'done' ? (
                      <Text style={[styles.tlBadge, { color: M.green, backgroundColor: M.greenBg }]}>TERMINÉ</Text>
                    ) : s.state === 'current' ? (
                      <Text style={[styles.tlBadge, { color: '#0C7FB5', backgroundColor: '#E4F5FE' }]}>EN COURS</Text>
                    ) : null}
                  </View>
                  <Text style={styles.tlDate}>{s.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* PARCEL */}
        <View style={styles.section}>
          <Text style={styles.lbl}>Votre colis</Text>
          <View style={styles.card}>
            <View style={[styles.weightBox, weighed ? styles.weightBoxBlue : styles.weightBoxWarm]}>
              <Text style={[styles.weightLabel, { color: weighed ? M.blue : '#B33F2A' }]}>
                {weighed ? 'Poids pesé au départ' : 'Poids déclaré'}
              </Text>
              <Text style={[styles.weightValue, { color: weighed ? M.blue : '#B33F2A' }]}>{weight} kg</Text>
            </View>

            {parcels.map((p, i) => (
              <View key={p.id ?? i} style={styles.pRow}>
                <Text style={styles.pLabel}>Catégorie</Text>
                {p.type ? <Text style={styles.pType}>{p.type}</Text> : <Text style={styles.pValue}>—</Text>}
              </View>
            ))}
            {trip?.pricePerKg ? (
              <View style={[styles.pRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.pLabel}>Prix au kg</Text>
                <Text style={styles.pValue}>€{trip.pricePerKg} / kg</Text>
              </View>
            ) : null}

            {photos.length > 0 && (
              <>
                <Text style={styles.photoLbl}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {photos.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.thumb} resizeMode="cover" />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>

        {/* RECIPIENT */}
        <View style={styles.section}>
          <Text style={styles.lbl}>Destinataire</Text>
          <View style={styles.card}>
            <View style={styles.pRow}>
              <Text style={styles.pLabel}>Nom</Text>
              <Text style={styles.pValue}>{booking.recipient?.fullName ?? '—'}</Text>
            </View>
            <View style={styles.pRow}>
              <Text style={styles.pLabel}>Téléphone</Text>
              <Text style={styles.pValue}>{booking.recipient?.phoneNumber ?? '—'}</Text>
            </View>
            <View style={[styles.pRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.pLabel}>Adresse</Text>
              <Text style={styles.pValue}>{booking.recipient?.tunisiaAddress ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* TOTAL + CONTACT */}
        <View style={styles.section}>
          <View style={styles.totalCard}>
            <Glow color="#38BDF8" size={120} style={{ right: -30, top: -30 }} />
            <View>
              <Text style={styles.totalLabel}>{weighed ? 'Total réglé' : 'Total estimé'}</Text>
              {trip?.pricePerKg ? (
                <Text style={styles.totalHint}>{weight} kg × €{trip.pricePerKg}</Text>
              ) : null}
            </View>
            <Text style={styles.totalValue}>{price !== null ? `€${price.toFixed(2)}` : '—'}</Text>
          </View>

          {transporterPhone ? (
            <Pressable style={styles.whatsapp} onPress={openWhatsApp}>
              <Feather name="message-circle" size={17} color="#fff" />
              <Text style={styles.whatsappTxt}>Contacter {transporterName.split(' ')[0]} sur WhatsApp</Text>
            </Pressable>
          ) : null}

          {trip?.transporterId ? (
            <Pressable
              style={styles.outlineBtn}
              onPress={() =>
                router.push({
                  pathname: '/transporter-details/[id]',
                  params: { id: String(trip.transporterId), tripId: String(booking.tripId) },
                } as any)
              }
            >
              <Feather name="user" size={16} color={M.text} />
              <Text style={styles.outlineTxt}>Voir le profil du transporteur</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },
  empty: { color: M.textMut, fontSize: 15, fontFamily: fonts.body },

  hero: { overflow: 'hidden', paddingHorizontal: 24, paddingTop: 14, paddingBottom: 26, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroRoute: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  heroCity: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: '#fff' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  heroMeta: { fontSize: 13, color: M.onInkMut, fontFamily: fonts.body },
  heroBadge: { fontSize: 10, fontWeight: '700', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, overflow: 'hidden', letterSpacing: 0.4, fontFamily: fonts.display },

  actionBanner: { marginHorizontal: 18, marginTop: -14, borderRadius: 20, padding: 18, shadowColor: '#EC5B43', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 6 },
  bannerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 19 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 3, fontFamily: fonts.body },
  bannerInfo: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14, padding: 13, gap: 7 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerRowTxt: { fontSize: 13, fontWeight: '600', color: '#fff', fontFamily: fonts.body },

  liveStrip: { flexDirection: 'row', alignItems: 'center', gap: 13, marginHorizontal: 20, marginTop: 18, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: M.line, padding: 16 },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: M.cool },
  liveTitle: { fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  liveSub: { fontSize: 12, color: M.textFaint, marginTop: 1, fontFamily: fonts.body },

  section: { paddingHorizontal: 20, marginTop: 22 },
  lbl: { fontFamily: fonts.display, fontSize: 12, fontWeight: '600', color: M.textFaint, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: M.line, padding: 18 },

  tlRow: { flexDirection: 'row', gap: 14 },
  tlCol: { width: 20, alignItems: 'center' },
  dotDone: { width: 16, height: 16, borderRadius: 8, backgroundColor: M.green, alignItems: 'center', justifyContent: 'center' },
  dotCurrent: { width: 16, height: 16, borderRadius: 8, backgroundColor: M.cool, borderWidth: 3, borderColor: '#fff' },
  dotUpcoming: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff', borderWidth: 2, borderColor: '#C4CBD6', marginTop: 1 },
  tlLine: { width: 2, flex: 1, backgroundColor: '#E2E6EC', marginTop: 3, minHeight: 18 },
  tlHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tlCity: { fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body, flex: 1 },
  tlBadge: { fontSize: 10, fontWeight: '700', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden', fontFamily: fonts.display },
  tlDate: { fontSize: 12, color: M.textFaint, marginTop: 2, fontFamily: fonts.display },

  weightBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 14, borderWidth: 1 },
  weightBoxWarm: { backgroundColor: '#FDF0EC', borderColor: '#F6D9CE' },
  weightBoxBlue: { backgroundColor: '#F0F5FF', borderColor: '#DCE6FB' },
  weightLabel: { fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
  weightValue: { fontSize: 17, fontWeight: '700', fontFamily: fonts.display },

  pRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: M.hair },
  pLabel: { fontSize: 13, color: M.textFaint, fontFamily: fonts.body },
  pValue: { fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  pType: { fontSize: 12, fontWeight: '700', color: M.text, backgroundColor: '#EEF1F5', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, overflow: 'hidden', fontFamily: fonts.display },
  photoLbl: { fontSize: 13, color: M.textFaint, marginTop: 14, marginBottom: 10, fontFamily: fonts.body },
  thumb: { width: 74, height: 74, borderRadius: 12, marginRight: 10, backgroundColor: M.page },

  totalCard: { backgroundColor: M.ink, borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  totalLabel: { fontSize: 13, color: M.onInkMut, fontFamily: fonts.body },
  totalHint: { fontSize: 11, color: M.onInkFaint, marginTop: 2, fontFamily: fonts.body },
  totalValue: { fontSize: 26, fontWeight: '700', color: '#fff', fontFamily: fonts.display, letterSpacing: -0.5 },

  whatsapp: { height: 52, borderRadius: 16, backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 14 },
  whatsappTxt: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: fonts.body },
  outlineBtn: { height: 52, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E6EC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  outlineTxt: { fontSize: 15, fontWeight: '600', color: M.text, fontFamily: fonts.body },
});
