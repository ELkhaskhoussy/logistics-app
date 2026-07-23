import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts, M } from '../../../constants/meridian';
import type { Booking } from '../../networking/types';
import { getConfirmedBookingsByTrip, updateBookingStatus } from '../../services/booking';

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

const initials = (name?: string) => (name || '—').split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();
const kgOf = (b: Booking) => (b.parcels ?? []).reduce((sum, p) => sum + (p.weightKg ?? 0), 0);

export default function ConfirmedBookingsModal({ visible, onClose, tripId }: Props) {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'DELIVERED' | 'NOT_DELIVERED'>('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible || !tripId) return;
    setLoading(true);
    getConfirmedBookingsByTrip(tripId)
      .then(setBookings)
      .catch((err) => console.warn('Failed to fetch confirmed bookings:', err))
      .finally(() => setLoading(false));
  }, [visible, tripId]);

  const handleToggle = async (booking: Booking) => {
    const next = booking.status === 'DELIVERED' ? 'NOT_DELIVERED' : 'DELIVERED';
    try {
      await updateBookingStatus(booking.id, next);
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: next } : b)));
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const counts = useMemo(() => {
    const delivered = bookings.filter((b) => b.status === 'DELIVERED').length;
    return { all: bookings.length, delivered, notDelivered: bookings.length - delivered };
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => (filter === 'ALL' ? true : filter === 'DELIVERED' ? b.status === 'DELIVERED' : b.status !== 'DELIVERED'))
      .filter((b) => (b.recipient?.fullName ?? '').toLowerCase().includes(query.toLowerCase()));
  }, [bookings, filter, query]);

  const totalKg = useMemo(() => bookings.reduce((s, b) => s + kgOf(b), 0), [bookings]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          {/* Dark header */}
          <View style={s.header}>
            <View style={s.headerTop}>
              <Text style={s.title}>Réservations confirmées</Text>
              <Pressable onPress={onClose}>
                <Feather name="x" size={22} color="#fff" />
              </Pressable>
            </View>
            <Text style={s.sub}>{counts.all} colis · {totalKg} kg</Text>
            <View style={s.tabs}>
              {([['ALL', 'Tous', counts.all], ['DELIVERED', 'Livré', counts.delivered], ['NOT_DELIVERED', 'Non livré', counts.notDelivered]] as const).map(([key, label, n]) => (
                <Pressable key={key} style={[s.tab, filter === key && s.tabActive]} onPress={() => setFilter(key)}>
                  <Text style={[s.tabTxt, filter === key && s.tabTxtActive]}>{label} · {n}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Search */}
          <View style={s.searchWrap}>
            <View style={s.search}>
              <Feather name="search" size={16} color={M.textFaint} />
              <TextInput style={s.searchInput} placeholder="Rechercher un destinataire…" placeholderTextColor={M.textFaint} value={query} onChangeText={setQuery} />
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={s.emptyState}>
                <ActivityIndicator size="large" color={M.warm1} />
                <Text style={s.emptyText}>Chargement…</Text>
              </View>
            ) : filtered.length === 0 ? (
              <View style={s.emptyState}>
                <Feather name="inbox" size={40} color={M.textFaint} />
                <Text style={s.emptyText}>Aucune réservation</Text>
              </View>
            ) : (
              <>
                <View style={s.tableHead}>
                  <Text style={[s.th, { flex: 1 }]}>DESTINATAIRE</Text>
                  <Text style={[s.th, { width: 40, textAlign: 'center' }]}>KG</Text>
                  <Text style={[s.th, { width: 96, textAlign: 'right' }]}>STATUT</Text>
                </View>
                {filtered.map((b) => {
                  const delivered = b.status === 'DELIVERED';
                  return (
                    <View key={b.id} style={s.row}>
                      <Pressable
                        style={s.recipient}
                        onPress={() => { onClose(); router.push({ pathname: '/(transporter)/booking-details', params: { tripId, bookingId: String(b.id) } } as any); }}
                      >
                        <LinearGradient colors={[M.blue, M.cool]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                          <Text style={s.avatarTxt}>{initials(b.recipient?.fullName)}</Text>
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <Text style={s.name} numberOfLines={1}>{b.recipient?.fullName ?? '—'}</Text>
                          <Text style={s.city} numberOfLines={1}>{b.recipient?.tunisiaAddress ?? '—'}</Text>
                        </View>
                      </Pressable>
                      <Text style={s.kg}>{kgOf(b)}</Text>
                      <Pressable style={{ width: 96, alignItems: 'flex-end' }} onPress={() => handleToggle(b)}>
                        <Text style={[s.pill, delivered ? s.pillOk : s.pillNo]}>{delivered ? 'Livré' : 'Non livré'}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,22,38,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: M.surfaceAlt, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '92%', minHeight: '60%', overflow: 'hidden' },

  header: { backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 19, fontWeight: '700', color: '#fff', fontFamily: fonts.display },
  sub: { fontSize: 13, color: M.onInkMut, marginTop: 4, fontFamily: fonts.body },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tab: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)' },
  tabActive: { backgroundColor: '#fff' },
  tabTxt: { fontSize: 12, fontWeight: '600', color: '#B4C0D2', fontFamily: fonts.body },
  tabTxtActive: { color: M.ink },

  searchWrap: { padding: 16, paddingBottom: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: M.line },
  searchInput: { flex: 1, fontSize: 14, color: M.text, fontFamily: fonts.body },

  emptyState: { alignItems: 'center', paddingTop: 50, gap: 12 },
  emptyText: { color: M.textMut, fontSize: 14, fontFamily: fonts.body },

  tableHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  th: { fontSize: 11, fontWeight: '700', color: M.textFaint, fontFamily: fonts.display, letterSpacing: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, borderColor: M.line },
  recipient: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 12, fontFamily: fonts.display },
  name: { fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  city: { fontSize: 11, color: M.textFaint, marginTop: 1, fontFamily: fonts.body },
  kg: { width: 40, textAlign: 'center', fontSize: 14, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  pill: { fontSize: 11, fontWeight: '700', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 9999, overflow: 'hidden', fontFamily: fonts.display },
  pillOk: { color: M.green, backgroundColor: M.greenBg },
  pillNo: { color: '#DC2626', backgroundColor: '#FEE2E2' },
});
