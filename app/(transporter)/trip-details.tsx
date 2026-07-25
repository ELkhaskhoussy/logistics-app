import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/meridian/Badge';
import Donut from '../../components/meridian/Donut';
import GradientButton from '../../components/meridian/GradientButton';
import RouteDots from '../../components/meridian/RouteDots';
import { fonts, M } from '../../constants/meridian';
import { getConfirmedBookingsByTrip, getPendingBookingsByTrip, getPreAcceptedBookingsByTrip } from '../services/booking';
import { getTripById, updateTripCurrentStop } from '../services/trip';
import ConfirmedBookingsModal from './components/ConfirmedBookingsModal';
import ReservationDemandsModal from './components/ReservationDemandsModal';
import StopSelectorModal from './components/StopSelectorModal';
import ToCollectModal from './components/ToCollectModal';

const formatDate = (value: string | undefined) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function TripDetailsScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const [confirmedBookingsCount, setConfirmedBookingsCount] = useState(0);
  const [reservationDemandsCount, setReservationDemandsCount] = useState(0);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isStopModalVisible, setIsStopModalVisible] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  const [liveCapacity, setLiveCapacity] = useState<{ totalCapacityKg: number; availableCapacityKg: number } | null>(null);
  const [showConfirmedModal, setShowConfirmedModal] = useState(false);
  const [showDemandsModal, setShowDemandsModal] = useState(false);
  const [showToCollectModal, setShowToCollectModal] = useState(false);
  const [toCollectCount, setToCollectCount] = useState(0);

  const fetchBookingCounts = async () => {
    if (!tripId) return;
    try {
      const confirmed = await getConfirmedBookingsByTrip(tripId);
      setConfirmedBookingsCount(confirmed.length);
      const pending = await getPendingBookingsByTrip(tripId);
      setReservationDemandsCount(pending.length);
      const preAccepted = await getPreAcceptedBookingsByTrip(tripId);
      setToCollectCount(preAccepted.length);
    } catch (err) {
      console.warn('Failed to fetch booking counts:', err);
    }
  };

  const fetchTripDetails = async () => {
    if (!tripId) return;
    try {
      const data = await getTripById(tripId);
      setTrip(data);
      if (data.totalCapacityKg !== undefined && data.availableCapacityKg !== undefined) {
        setLiveCapacity({ totalCapacityKg: data.totalCapacityKg, availableCapacityKg: data.availableCapacityKg });
      }
    } catch (e) {
      console.warn('[TripDetails] Could not fetch live capacity', e);
    }
  };

  useEffect(() => { fetchTripDetails(); }, [tripId]);
  useEffect(() => { fetchBookingCounts(); }, [tripId]);
  useEffect(() => { if (trip?.currentStopIndex !== undefined) setCurrentStopIndex(trip.currentStopIndex); }, [trip]);

  const capacityInfo = useMemo(() => {
    const totalKg = liveCapacity?.totalCapacityKg ?? trip?.totalCapacityKg ?? 0;
    const availableKg = liveCapacity?.availableCapacityKg ?? trip?.availableCapacityKg ?? 0;
    const usedKg = totalKg - availableKg;
    const percentage = totalKg > 0 ? Math.round((usedKg / totalKg) * 100) : 0;
    return { usedKg, totalKg, availableKg, percentage };
  }, [liveCapacity, trip]);

  const timelineStops = useMemo(() => {
    if (!trip) return [];
    const stops: { city: string; date: string; isCurrent: boolean }[] = [];
    stops.push({ city: trip.departureCity, date: formatDate(trip.departureTime), isCurrent: false });
    if (trip.collectionStops?.length) {
      trip.collectionStops.forEach((s: any) => {
        if (s.city !== trip.departureCity && s.city !== trip.arrivalCity) {
          stops.push({ city: s.city, date: formatDate(s.stopTime), isCurrent: false });
        }
      });
    }
    stops.push({ city: trip.arrivalCity, date: formatDate(trip.arrivalTime), isCurrent: false });
    if (stops[currentStopIndex]) stops[currentStopIndex].isCurrent = true;
    return stops;
  }, [trip, currentStopIndex]);

  const currentStopName = timelineStops.find((s) => s.isCurrent)?.city || trip?.departureCity || '—';

  if (!trip) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={M.warm1} />
      </View>
    );
  }

  const modalStops = timelineStops.map((stop, index) => ({ id: index.toString(), city: stop.city }));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.heroRoute}>
            <Text style={styles.heroCity}>{trip.departureCity}</Text>
            <RouteDots style={{ flex: 1, marginHorizontal: 12 }} />
            <Text style={styles.heroCity}>{trip.arrivalCity}</Text>
          </View>
          <Text style={styles.heroMeta}>
            Départ {formatDate(trip.departureTime)} · €{trip.pricePerKg}/kg ·{' '}
            <Text style={{ color: M.warm2 }}>{trip.status || 'Scheduled'}</Text>
          </Text>
        </View>

        <View style={styles.padded}>
          {/* CAPACITY */}
          <View style={styles.card}>
            <View style={styles.capRow}>
              <Donut pct={capacityInfo.percentage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.capLabel}>CAPACITÉ DU TRAJET</Text>
                <Text style={styles.capUsed}>
                  {capacityInfo.usedKg} <Text style={styles.capTotal}>/ {capacityInfo.totalKg} kg utilisés</Text>
                </Text>
                <View style={styles.capAvailRow}>
                  <View style={styles.dotGreen} />
                  <Text style={styles.capAvail}>{capacityInfo.availableKg} kg encore disponibles</Text>
                </View>
              </View>
            </View>
          </View>

          {/* TIMELINE */}
          <Text style={styles.sectionLabel}>ITINÉRAIRE</Text>
          <View style={styles.card}>
            {timelineStops.map((stop, i) => {
              const isLast = i === timelineStops.length - 1;
              const label = i === 0 ? 'Départ' : isLast ? 'Arrivée' : 'Étape';
              return (
                <View key={i} style={styles.tlRow}>
                  <View style={styles.tlDotCol}>
                    {stop.isCurrent ? (
                      <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tlDotCurrent}>
                        <Feather name="navigation" size={10} color="#fff" />
                      </LinearGradient>
                    ) : (
                      <View style={[styles.tlDot, isLast && { borderColor: M.cool }]} />
                    )}
                    {!isLast && <View style={styles.tlLine} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
                    <View style={styles.tlHead}>
                      <Text style={styles.tlCity}>{stop.city}</Text>
                      {stop.isCurrent ? <Badge label="ACTUEL" tone="amber" /> : null}
                    </View>
                    <Text style={styles.tlSub}>{label} · {stop.date}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* BOOKINGS & STATUS */}
          <Text style={styles.sectionLabel}>RÉSERVATIONS & STATUT</Text>
          <Pressable style={styles.bookCard} onPress={() => setShowConfirmedModal(true)}>
            <View style={styles.bookIconBlue}>
              <Feather name="clipboard" size={20} color={M.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>Gérer {confirmedBookingsCount} réservation{confirmedBookingsCount > 1 ? 's' : ''} confirmée{confirmedBookingsCount > 1 ? 's' : ''}</Text>
              <Text style={styles.bookSub}>Voir les colis confirmés</Text>
            </View>
            <Feather name="chevron-right" size={20} color={M.textFaint} />
          </Pressable>

          {/* STEP 1 — incoming requests: accept to collect (read-only recap) */}
          <Pressable style={[styles.bookCard, { marginTop: 12 }]} onPress={() => setShowToCollectModal(true)}>
            <View style={styles.bookIconAmber}>
              <Feather name="package" size={20} color={M.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>À collecter</Text>
              <Text style={styles.bookSub}>Demandes des expéditeurs · à accepter</Text>
            </View>
            {reservationDemandsCount > 0 ? (
              <View style={[styles.countBadge, { backgroundColor: M.amber }]}>
                <Text style={styles.countBadgeTxt}>{reservationDemandsCount}</Text>
              </View>
            ) : (
              <Feather name="chevron-right" size={20} color={M.textFaint} />
            )}
          </Pressable>

          {/* STEP 2 — accepted parcels: check, adjust weight/notes, confirm */}
          <Pressable style={[styles.bookCard, { marginTop: 12 }]} onPress={() => setShowDemandsModal(true)}>
            <View style={styles.bookIconWarm}>
              <Feather name="edit-2" size={20} color={M.warm1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>Demandes de réservation</Text>
              <Text style={styles.bookSub}>À vérifier et confirmer</Text>
            </View>
            {toCollectCount > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeTxt}>{toCollectCount}</Text>
              </View>
            ) : (
              <Feather name="chevron-right" size={20} color={M.textFaint} />
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelTxt}>Retour</Text>
        </Pressable>
        <View style={{ flex: 1.6 }}>
          <GradientButton label={`À ${currentStopName} · Statut`} icon="navigation" onPress={() => setIsStopModalVisible(true)} />
        </View>
      </View>

      {/* MODALS */}
      <ReservationDemandsModal
        visible={showDemandsModal}
        tripId={tripId ?? ''}
        totalDemands={reservationDemandsCount}
        onBookingConfirmed={fetchTripDetails}
        onClose={() => { setShowDemandsModal(false); fetchBookingCounts(); }}
      />
      <ToCollectModal
        visible={showToCollectModal}
        tripId={tripId ?? ''}
        onClose={() => { setShowToCollectModal(false); fetchBookingCounts(); }}
        onChanged={() => { fetchTripDetails(); fetchBookingCounts(); }}
      />
      <ConfirmedBookingsModal
        visible={showConfirmedModal}
        onClose={() => { setShowConfirmedModal(false); fetchBookingCounts(); }}
        tripId={tripId ?? ''}
      />
      <StopSelectorModal
        visible={isStopModalVisible}
        onClose={() => setIsStopModalVisible(false)}
        stops={modalStops}
        selectedIndex={currentStopIndex}
        onSelect={async (index) => {
          setCurrentStopIndex(index);
          setIsStopModalVisible(false);
          try {
            // Persist so the sender can follow the parcel along the route.
            await updateTripCurrentStop(tripId ?? '', index);
            fetchTripDetails();
          } catch (e) {
            console.warn('Failed to save current stop', e);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },
  padded: { paddingHorizontal: 20 },

  hero: { overflow: 'hidden', paddingTop: 14, paddingBottom: 22, paddingHorizontal: 20, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroTop: { flexDirection: 'row' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroRoute: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  heroCity: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: '#fff' },
  heroMeta: { fontSize: 13, color: M.onInkMut, marginTop: 12, fontFamily: fonts.body },

  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: M.line, padding: 18, marginBottom: 16, shadowColor: '#0A1626', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 2 },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  capLabel: { fontSize: 11, fontWeight: '700', color: M.textFaint, fontFamily: fonts.display, letterSpacing: 0.5 },
  capUsed: { fontSize: 22, fontWeight: '700', color: M.text, fontFamily: fonts.display, marginTop: 4 },
  capTotal: { fontSize: 13, fontWeight: '500', color: M.textMut, fontFamily: fonts.body },
  capAvailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  dotGreen: { width: 7, height: 7, borderRadius: 4, backgroundColor: M.green },
  capAvail: { fontSize: 12, color: M.green, fontFamily: fonts.body },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: M.textFaint, fontFamily: fonts.display, letterSpacing: 0.6, marginBottom: 10, marginTop: 4 },

  tlRow: { flexDirection: 'row', gap: 14 },
  tlDotCol: { width: 22, alignItems: 'center' },
  tlDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#C4CBD6', backgroundColor: '#fff' },
  tlDotCurrent: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tlLine: { width: 2, flex: 1, backgroundColor: M.hair, marginTop: 3, minHeight: 20 },
  tlHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tlCity: { fontSize: 15, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  tlSub: { fontSize: 12, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },

  bookCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: M.line, padding: 16 },
  bookIconBlue: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  bookIconWarm: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FEF0EC', alignItems: 'center', justifyContent: 'center' },
  bookIconAmber: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FBF3E1', alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontSize: 15, fontWeight: '700', color: M.text, fontFamily: fonts.body },
  bookSub: { fontSize: 12, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },
  countBadge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: M.warm1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: fonts.display },

  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: M.page },
  cancelBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#FEF0EC', alignItems: 'center', justifyContent: 'center' },
  cancelTxt: { color: M.warm1, fontWeight: '600', fontFamily: fonts.body },
});
