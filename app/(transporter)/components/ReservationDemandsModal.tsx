import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, M } from '../../../constants/meridian';
import { getApiBaseUrl } from '../../networking/config';
import type { Booking, ParcelResponse } from '../../networking/types';
import { confirmBooking, getPendingDemandsByTrip, updateBookingStatus } from '../../services/booking';
import AcceptBookingModal from './AcceptBookingModal';

function initials(name?: string, id?: any) {
  const src = name || `S${id ?? ''}`;
  return src.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();
}

function DemandCard({
  booking,
  onAccept,
  onDecline,
  actionLoading,
}: {
  booking: Booking;
  onAccept: (booking: Booking) => void;
  onDecline: (id: string) => void;
  actionLoading: string | null;
}) {
  const parcels = booking.parcels ?? [];
  const totalWeight = parcels.reduce((sum, p) => sum + (p.weightKg ?? 0), 0);
  const categories = [...new Set(parcels.map((p) => p.type).filter(Boolean))].join(', ');
  const firstParcel: ParcelResponse | undefined = parcels[0];
  const description = firstParcel?.description ?? '';
  const destination = booking.recipient?.tunisiaAddress ?? '—';
  const photoUrls = parcels.flatMap((p) => p.images ?? []).map((img) => `${getApiBaseUrl()}/parcel-uploads/files/${img.imageUrl}`);
  const isActioning = actionLoading === booking.id;

  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <LinearGradient colors={[M.blue, M.cool]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
          <Text style={s.avatarText}>{initials(booking.senderName, booking.senderId)}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={s.senderName}>{booking.senderName || `Expéditeur #${booking.senderId}`}</Text>
          <Text style={s.subLine}>
            {categories || 'Colis'} · {totalWeight} kg → {destination}
          </Text>
        </View>
        <Text style={s.dateText}>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('fr-FR') : ''}</Text>
      </View>

      {description ? <Text style={s.desc}>{description}</Text> : null}

      {photoUrls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {photoUrls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={s.thumb} resizeMode="cover" />
          ))}
        </ScrollView>
      )}

      <View style={s.actionRow}>
        <Pressable style={[s.declineBtn, isActioning && { opacity: 0.6 }]} disabled={isActioning} onPress={() => onDecline(booking.id)}>
          <Text style={s.declineText}>Refuser</Text>
        </Pressable>
        <Pressable style={{ flex: 1 }} disabled={isActioning} onPress={() => onAccept(booking)}>
          <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.acceptBtn}>
            {isActioning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.acceptText}>Accepter</Text>}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

interface Props {
  visible: boolean;
  tripId: string;
  totalDemands: number;
  onClose: () => void;
  onBookingConfirmed: () => void;
}

export default function ReservationDemandsModal({ visible, tripId, totalDemands, onBookingConfirmed, onClose }: Props) {
  const [demands, setDemands] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);

  const fetchDemands = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getPendingDemandsByTrip(tripId);
      setDemands(data);
    } catch (e: any) {
      console.warn('[ReservationDemandsModal] Failed to fetch demands:', e?.message);
      setFetchError('Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (visible) fetchDemands();
  }, [visible, fetchDemands]);

  const handleDecline = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, 'CANCELLED');
      setDemands((prev) => prev.filter((d) => d.id !== bookingId));
    } catch (e: any) {
      console.error('[ReservationDemandsModal] Decline failed:', e?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const count = demands.length > 0 ? demands.length : totalDemands;

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <View style={s.grabber} />
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>Demandes de réservation</Text>
                <Text style={s.sheetSub}>{count} en attente</Text>
              </View>
              <Pressable onPress={onClose} style={s.closeBtn}>
                <Feather name="x" size={22} color={M.textFaint} />
              </Pressable>
            </View>

            {loading ? (
              <View style={s.centerState}>
                <ActivityIndicator size="large" color={M.warm1} />
                <Text style={s.centerText}>Chargement…</Text>
              </View>
            ) : fetchError ? (
              <View style={s.centerState}>
                <Feather name="alert-circle" size={36} color={M.warm1} />
                <Text style={s.centerText}>{fetchError}</Text>
                <Pressable style={s.retryBtn} onPress={fetchDemands}>
                  <Text style={s.retryText}>Réessayer</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
                {demands.length === 0 ? (
                  <View style={s.emptyState}>
                    <Feather name="inbox" size={40} color={M.textFaint} />
                    <Text style={s.centerText}>Aucune demande en attente</Text>
                  </View>
                ) : (
                  demands.map((d) => (
                    <DemandCard
                      key={d.id}
                      booking={d}
                      onAccept={(booking) => { setSelectedBooking(booking); setAcceptModalVisible(true); }}
                      onDecline={handleDecline}
                      actionLoading={actionLoading}
                    />
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <AcceptBookingModal
        visible={acceptModalVisible}
        booking={selectedBooking}
        onClose={() => { setAcceptModalVisible(false); setSelectedBooking(null); }}
        onConfirm={async (data) => {
          if (!selectedBooking) return;
          await confirmBooking(selectedBooking.id, data);
          await onBookingConfirmed();
          await fetchDemands();
          setAcceptModalVisible(false);
          setSelectedBooking(null);
        }}
      />
    </>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,22,38,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: M.surfaceAlt, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '90%', minHeight: '55%', paddingBottom: 20 },
  grabber: { width: 44, height: 4, borderRadius: 9999, backgroundColor: '#D6DBE3', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  sheetSub: { fontSize: 13, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },
  closeBtn: { padding: 4 },

  centerState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  centerText: { color: M.textMut, fontSize: 14, fontFamily: fonts.body },
  retryBtn: { backgroundColor: M.warm1, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '600', fontFamily: fonts.body },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: M.line },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontFamily: fonts.display, fontSize: 14 },
  senderName: { fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  subLine: { fontSize: 12, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },
  dateText: { fontSize: 11, color: M.textFaint, fontFamily: fonts.body },
  desc: { fontSize: 13, color: M.textMut, marginTop: 10, fontFamily: fonts.body },
  thumb: { width: 64, height: 64, borderRadius: 10, marginRight: 8, backgroundColor: M.page },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  declineBtn: { flex: 1, height: 42, borderRadius: 12, backgroundColor: M.surfaceAlt, borderWidth: 1, borderColor: '#E2E6EC', alignItems: 'center', justifyContent: 'center' },
  declineText: { color: M.textMut, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
  acceptBtn: { height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: '#fff', fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
});
