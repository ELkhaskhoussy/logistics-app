import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, M } from '../../../constants/meridian';
import type { Booking } from '../../networking/types';
import { getPendingDemandsByTrip, updateBookingStatus } from '../../services/booking';
import DemandDetailModal from './DemandDetailModal';

interface Props {
  visible: boolean;
  tripId: string;
  onClose: () => void;
  onChanged: () => void;
}

const initials = (name?: string, id?: any) =>
  (name || `S${id ?? ''}`).split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();

/**
 * STEP 1 — "À collecter".
 * Incoming requests from senders. The transporter reviews a read-only recap and
 * decides whether he agrees to collect the parcel. No editing at this stage:
 * he hasn't seen the parcel yet.
 */
export default function ToCollectModal({ visible, tripId, onClose, onChanged }: Props) {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await getPendingDemandsByTrip(tripId));
    } catch {
      setError('Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (visible) fetchItems();
  }, [visible, fetchItems]);

  /** Agreement in principle — moves the booking to "Demandes de réservation". */
  const handleAccept = async (booking: Booking) => {
    setActionLoading(booking.id);
    try {
      await updateBookingStatus(booking.id, 'PRE_ACCEPTED');
      setItems((prev) => prev.filter((b) => b.id !== booking.id));
      setDetail(null);
      onChanged();
    } catch {
      setError('Action impossible. Réessayez.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, 'CANCELLED');
      setItems((prev) => prev.filter((b) => b.id !== bookingId));
      setDetail(null);
      onChanged();
    } catch {
      setError('Action impossible. Réessayez.');
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
                <Text style={s.title}>À collecter</Text>
                <Text style={s.sub}>{items.length} demande{items.length > 1 ? 's' : ''} d'expéditeurs</Text>
              </View>
              <Pressable onPress={onClose}>
                <Feather name="x" size={22} color={M.textFaint} />
              </Pressable>
            </View>

            <View style={s.hint}>
              <Feather name="info" size={15} color={M.blue} />
              <Text style={s.hintTxt}>Consultez le détail, puis acceptez de collecter le colis.</Text>
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
                <Feather name="inbox" size={38} color={M.textFaint} />
                <Text style={s.centerTxt}>Aucune demande en attente</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
                {items.map((b) => {
                  const declared = (b.parcels ?? []).reduce((sum, p) => sum + (p.weightKg ?? 0), 0);
                  const busy = actionLoading === b.id;
                  const categories = [...new Set((b.parcels ?? []).map((p) => p.type).filter(Boolean))].join(', ');
                  return (
                    <Pressable key={b.id} style={s.card} onPress={() => setDetail(b)}>
                      <View style={s.cardHead}>
                        <LinearGradient colors={[M.blue, M.cool]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                          <Text style={s.avatarTxt}>{initials(b.senderName, b.senderId)}</Text>
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <Text style={s.name}>{b.senderName || `Expéditeur #${b.senderId}`}</Text>
                          <Text style={s.meta}>
                            {categories || 'Colis'} · {declared} kg → {b.recipient?.tunisiaAddress ?? '—'}
                          </Text>
                        </View>
                      </View>

                      <View style={s.reviewHint}>
                        <Feather name="eye" size={13} color={M.blue} />
                        <Text style={s.reviewTxt}>Voir le détail</Text>
                      </View>

                      <View style={s.actions}>
                        <Pressable style={[s.declineBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => handleDecline(b.id)}>
                          <Text style={s.declineTxt}>Refuser</Text>
                        </Pressable>
                        <Pressable style={{ flex: 1.4 }} disabled={busy} onPress={() => handleAccept(b)}>
                          <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.acceptBtn}>
                            {busy ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Feather name="check" size={15} color="#fff" />
                                <Text style={s.acceptTxt}>Accepter de collecter</Text>
                              </>
                            )}
                          </LinearGradient>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Read-only recap — decision is made from here or from the card */}
      <DemandDetailModal
        visible={!!detail}
        booking={detail}
        onClose={() => setDetail(null)}
        onPreAccept={handleAccept}
        onDecline={handleDecline}
      />
    </>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,22,38,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: M.surfaceAlt, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '90%', minHeight: '50%', paddingBottom: 20 },
  grabber: { width: 44, height: 4, borderRadius: 9999, backgroundColor: '#D6DBE3', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 20, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  sub: { fontSize: 13, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },

  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DCE6FB', borderRadius: 14, padding: 12 },
  hintTxt: { flex: 1, fontSize: 12, color: '#3A5A8A', lineHeight: 17, fontFamily: fonts.body },

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
  reviewHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  reviewTxt: { fontSize: 12, color: M.blue, fontWeight: '600', fontFamily: fonts.body },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  declineBtn: { flex: 1, height: 42, borderRadius: 12, backgroundColor: M.surfaceAlt, borderWidth: 1, borderColor: '#E2E6EC', alignItems: 'center', justifyContent: 'center' },
  declineTxt: { color: M.textMut, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
  acceptBtn: { height: 42, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  acceptTxt: { color: '#fff', fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
});
