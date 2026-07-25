import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, M } from '../../../constants/meridian';
import { getApiBaseUrl } from '../../networking/config';
import type { Booking } from '../../networking/types';

interface Props {
  visible: boolean;
  booking: Booking | null;
  pricePerKg?: number;
  onClose: () => void;
  onPreAccept: (booking: Booking) => Promise<void> | void;
  onDecline: (bookingId: string) => Promise<void> | void;
}

const initials = (name?: string, id?: any) =>
  (name || `S${id ?? ''}`).split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();

/**
 * Full review of a sender's pre-reservation request before the transporter
 * decides. Shows who is sending, who receives, and every declared parcel
 * (with photos) so the decision isn't made blind from a summary row.
 */
export default function DemandDetailModal({
  visible,
  booking,
  pricePerKg,
  onClose,
  onPreAccept,
  onDecline,
}: Props) {
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  if (!booking) return null;

  const parcels = booking.parcels ?? [];
  const totalWeight = parcels.reduce((sum, p) => sum + (p.weightKg ?? 0), 0);
  const estimated = pricePerKg ? totalWeight * pricePerKg : null;
  const photos = parcels.flatMap((p) => p.images ?? []).map((i) => `${getApiBaseUrl()}/parcel-uploads/files/${i.imageUrl}`);

  const run = async (kind: 'accept' | 'decline') => {
    setBusy(kind);
    try {
      if (kind === 'accept') await onPreAccept(booking);
      else await onDecline(booking.id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.grabber} />
          <View style={s.header}>
            <View>
              <Text style={s.title}>Demande de pré-réservation</Text>
              <Text style={s.sub}>
                {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('fr-FR') : ''} · à examiner
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={M.textFaint} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }} showsVerticalScrollIndicator={false}>
            {/* SENDER */}
            <View style={s.card}>
              <View style={s.cardHead}>
                <Feather name="user" size={16} color={M.blue} />
                <Text style={s.cardTitle}>Expéditeur</Text>
              </View>
              <View style={s.senderRow}>
                <LinearGradient colors={[M.blue, M.cool]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                  <Text style={s.avatarTxt}>{initials(booking.senderName, booking.senderId)}</Text>
                </LinearGradient>
                <Text style={s.senderName}>{booking.senderName || `Expéditeur #${booking.senderId}`}</Text>
              </View>
            </View>

            {/* RECIPIENT */}
            <View style={s.card}>
              <View style={s.cardHead}>
                <Feather name="user-check" size={16} color={M.warm1} />
                <Text style={s.cardTitle}>Destinataire</Text>
              </View>
              <Row label="Nom" value={booking.recipient?.fullName} />
              <Row label="Téléphone" value={booking.recipient?.phoneNumber} />
              <Row label="Adresse" value={booking.recipient?.tunisiaAddress} last />
            </View>

            {/* PARCELS */}
            <View style={s.card}>
              <View style={s.cardHead}>
                <Feather name="box" size={16} color={M.warm2} />
                <Text style={s.cardTitle}>Colis déclarés</Text>
              </View>

              {parcels.length === 0 ? (
                <Text style={s.empty}>Aucun colis déclaré</Text>
              ) : (
                parcels.map((p, i) => (
                  <View key={p.id ?? i} style={[s.parcel, i === parcels.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={s.parcelHead}>
                      <Text style={s.parcelTitle}>Colis {i + 1}</Text>
                      {p.type ? <Text style={s.typeBadge}>{p.type}</Text> : null}
                    </View>
                    {p.description ? <Text style={s.desc}>{p.description}</Text> : null}
                    <View style={s.parcelMeta}>
                      <View style={s.metaItem}>
                        <Feather name="box" size={13} color={M.textMut} />
                        <Text style={s.metaTxt}>{p.weightKg ?? '—'} kg</Text>
                      </View>
                      <View style={s.metaItem}>
                        <Feather name="hash" size={13} color={M.textMut} />
                        <Text style={s.metaTxt}>x{p.quantity ?? 1}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}

              {photos.length > 0 && (
                <>
                  <Text style={s.photoLabel}>Photos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {photos.map((url, i) => (
                      <Image key={i} source={{ uri: url }} style={s.thumb} resizeMode="cover" />
                    ))}
                  </ScrollView>
                </>
              )}
            </View>

            {/* TOTAL */}
            <View style={s.totalCard}>
              <View>
                <Text style={s.totalLabel}>Poids total déclaré</Text>
                {estimated !== null ? (
                  <Text style={s.totalHint}>Estimation : {estimated.toFixed(2)} €</Text>
                ) : null}
              </View>
              <Text style={s.totalValue}>{totalWeight} kg</Text>
            </View>

            <View style={s.note}>
              <Feather name="info" size={15} color={M.amber} />
              <Text style={s.noteTxt}>
                Poids déclaré par l'expéditeur. Vous pèserez le colis au point de collecte avant la confirmation
                définitive.
              </Text>
            </View>
          </ScrollView>

          {/* ACTIONS */}
          <View style={s.actions}>
            <Pressable style={[s.declineBtn, busy && { opacity: 0.6 }]} disabled={!!busy} onPress={() => run('decline')}>
              {busy === 'decline' ? (
                <ActivityIndicator size="small" color={M.textMut} />
              ) : (
                <Text style={s.declineTxt}>Refuser</Text>
              )}
            </Pressable>
            <Pressable style={{ flex: 1.5 }} disabled={!!busy} onPress={() => run('accept')}>
              <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.acceptBtn}>
                {busy === 'accept' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={s.acceptTxt}>Pré-accepter</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value || '—'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,22,38,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: M.surfaceAlt, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '92%', paddingBottom: 16 },
  grabber: { width: 44, height: 4, borderRadius: 9999, backgroundColor: '#D6DBE3', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 19, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  sub: { fontSize: 12, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: M.line },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: M.text, fontFamily: fonts.display },

  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '700', fontFamily: fonts.display, fontSize: 14 },
  senderName: { fontSize: 15, fontWeight: '600', color: M.text, fontFamily: fonts.body },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: M.hair },
  rowLabel: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },
  rowValue: { fontSize: 13, fontWeight: '600', color: M.text, fontFamily: fonts.body, flexShrink: 1, textAlign: 'right', marginLeft: 12 },

  parcel: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: M.hair },
  parcelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  parcelTitle: { fontSize: 14, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  typeBadge: { fontSize: 10, fontWeight: '700', color: M.blue, backgroundColor: '#EFF6FF', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8, overflow: 'hidden', fontFamily: fonts.display },
  desc: { fontSize: 13, color: M.textMut, marginTop: 6, fontFamily: fonts.body },
  parcelMeta: { flexDirection: 'row', gap: 18, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaTxt: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },
  empty: { fontSize: 13, color: M.textFaint, fontFamily: fonts.body },

  photoLabel: { fontSize: 12, color: M.textMut, marginTop: 12, marginBottom: 8, fontFamily: fonts.body },
  thumb: { width: 72, height: 72, borderRadius: 10, marginRight: 8, backgroundColor: M.page },

  totalCard: { backgroundColor: M.ink, borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: M.onInkMut, fontFamily: fonts.body },
  totalHint: { fontSize: 12, color: M.warm2, marginTop: 3, fontFamily: fonts.body },
  totalValue: { fontSize: 24, fontWeight: '700', color: '#fff', fontFamily: fonts.display },

  note: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FBF7ED', borderWidth: 1, borderColor: '#F3E7C9', borderRadius: 14, padding: 12 },
  noteTxt: { flex: 1, fontSize: 12, color: '#8A7A4E', lineHeight: 17, fontFamily: fonts.body },

  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: M.line },
  declineBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: M.line, alignItems: 'center', justifyContent: 'center' },
  declineTxt: { color: M.textMut, fontSize: 14, fontWeight: '600', fontFamily: fonts.body },
  acceptBtn: { height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  acceptTxt: { color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: fonts.body },
});
