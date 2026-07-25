import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, M } from '../../../constants/meridian';
import { getApiBaseUrl } from '../../networking/config';
import type { Booking } from '../../networking/types';
import { confirmBooking, getPreAcceptedBookingsByTrip, updateBookingStatus } from '../../services/booking';
import AcceptBookingModal from './AcceptBookingModal';

const initials = (name?: string, id?: any) =>
  (name || `S${id ?? ''}`).split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();

interface Props {
  visible: boolean;
  tripId: string;
  totalDemands: number;
  onClose: () => void;
  onBookingConfirmed: () => void;
}

/**
 * STEP 2 — "Demandes de réservation".
 * Bookings the transporter already agreed to collect. Here he checks the parcel,
 * adjusts the real weight, adds his notes, and confirms — which makes the
 * reservation official and moves it to "Réservations confirmées".
 */
export default function ReservationDemandsModal({ visible, tripId, onBookingConfirmed, onClose }: Props) {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [editVisible, setEditVisible] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await getPreAcceptedBookingsByTrip(tripId));
    } catch {
      setError('Impossible de charger les réservations.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (visible) fetchItems();
  }, [visible, fetchItems]);

  const handleCancel = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, 'CANCELLED');
      setItems((prev) => prev.filter((b) => b.id !== bookingId));
      onBookingConfirmed();
    } catch {
      setError('Annulation impossible. Réessayez.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <View style={s.grabber} />
            <View style={s.header}>
              <View>
                <Text style={s.title}>Demandes de réservation</Text>
                <Text style={s.sub}>{items.length} colis à vérifier</Text>
              </View>
              <Pressable onPress={onClose}>
                <Feather name="x" size={22} color={M.textFaint} />
              </Pressable>
            </View>

            <View style={s.hint}>
              <Feather name="info" size={15} color={M.amber} />
              <Text style={s.hintTxt}>Vérifiez le colis, ajustez le poids réel et vos remarques, puis confirmez.</Text>
            </View>

            {loading ? (
              <View style={s.center}><ActivityIndicator size="large" color={M.warm1} /></View>
            ) : error ? (
              <View style={s.center}>
                <Feather name="alert-circle" size={34} color={M.warm1} />
                <Text style={s.centerTxt}>{error}</Text>
                <Pressable style={s.retry} onPress={fetchItems}><Text style={s.retryTxt}>Réessayer</Text></Pressable>
              </View>
            ) : items.length === 0 ? (
              <View style={s.center}>
                <Feather name="package" size={38} color={M.textFaint} />
                <Text style={s.centerTxt}>Aucune réservation à vérifier</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
                {items.map((b) => {
                  const parcels = b.parcels ?? [];
                  const declared = parcels.reduce((sum, p) => sum + (p.weightKg ?? 0), 0);
                  const categories = [...new Set(parcels.map((p) => p.type).filter(Boolean))].join(', ');
                  const photos = parcels.flatMap((p) => p.images ?? []).map((i) => `${getApiBaseUrl()}/parcel-uploads/files/${i.imageUrl}`);
                  const busy = actionLoading === b.id;

                  return (
                    <View key={b.id} style={s.card}>
                      <View style={s.cardHead}>
                        <LinearGradient colors={[M.blue, M.cool]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                          <Text style={s.avatarTxt}>{initials(b.senderName, b.senderId)}</Text>
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <Text style={s.name}>{b.senderName || `Expéditeur #${b.senderId}`}</Text>
                          <Text style={s.meta}>
                            {categories || 'Colis'} → {b.recipient?.tunisiaAddress ?? '—'}
                          </Text>
                        </View>
                      </View>

                      <View style={s.weightBox}>
                        <Text style={s.weightLabel}>Poids déclaré</Text>
                        <Text style={s.weightValue}>{declared} kg</Text>
                      </View>

                      {photos.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                          {photos.map((url, i) => (
                            <Image key={i} source={{ uri: url }} style={s.thumb} resizeMode="cover" />
                          ))}
                        </ScrollView>
                      )}

                      <View style={s.actions}>
                        <Pressable style={[s.cancelBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => handleCancel(b.id)}>
                          <Text style={s.cancelTxt}>Annuler</Text>
                        </Pressable>
                        <Pressable style={{ flex: 1.5 }} disabled={busy} onPress={() => { setSelected(b); setEditVisible(true); }}>
                          <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.confirmBtn}>
                            {busy ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Feather name="edit-2" size={15} color="#fff" />
                                <Text style={s.confirmTxt}>Vérifier & confirmer</Text>
                              </>
                            )}
                          </LinearGradient>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Adjust real weight + notes, then confirm → CONFIRMED */}
      <AcceptBookingModal
        visible={editVisible}
        booking={selected}
        onClose={() => { setEditVisible(false); setSelected(null); }}
        onConfirm={async (data) => {
          if (!selected) return;
          try {
            await confirmBooking(selected.id, data);
            setEditVisible(false);
            setSelected(null);
            await fetchItems();
            onBookingConfirmed();
          } catch (e: any) {
            setEditVisible(false);
            setError(
              e?.response?.data?.message ||
                'Confirmation impossible — vérifiez que le poids tient dans la capacité restante.'
            );
          }
        }}
      />
    </>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,22,38,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: M.surfaceAlt, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '90%', minHeight: '55%', paddingBottom: 20 },
  grabber: { width: 44, height: 4, borderRadius: 9999, backgroundColor: '#D6DBE3', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 20, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  sub: { fontSize: 13, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },

  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: '#FBF7ED', borderWidth: 1, borderColor: '#F3E7C9', borderRadius: 14, padding: 12 },
  hintTxt: { flex: 1, fontSize: 12, color: '#8A7A4E', lineHeight: 17, fontFamily: fonts.body },

  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 50, gap: 12 },
  centerTxt: { color: M.textMut, fontSize: 14, fontFamily: fonts.body, textAlign: 'center', paddingHorizontal: 24 },
  retry: { backgroundColor: M.warm1, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12 },
  retryTxt: { color: '#fff', fontWeight: '600', fontFamily: fonts.body },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: M.line },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '700', fontFamily: fonts.display, fontSize: 14 },
  name: { fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  meta: { fontSize: 12, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },

  weightBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDF0EC', borderWidth: 1, borderColor: '#F6D9CE', borderRadius: 14, padding: 13, marginTop: 12 },
  weightLabel: { fontSize: 13, fontWeight: '600', color: '#B33F2A', fontFamily: fonts.body },
  weightValue: { fontSize: 17, fontWeight: '700', color: '#B33F2A', fontFamily: fonts.display },
  thumb: { width: 64, height: 64, borderRadius: 10, marginRight: 8, backgroundColor: M.page },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, height: 42, borderRadius: 12, backgroundColor: M.surfaceAlt, borderWidth: 1, borderColor: '#E2E6EC', alignItems: 'center', justifyContent: 'center' },
  cancelTxt: { color: M.textMut, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
  confirmBtn: { height: 42, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  confirmTxt: { color: '#fff', fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
});
