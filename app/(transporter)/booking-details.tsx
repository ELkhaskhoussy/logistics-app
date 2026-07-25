import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/meridian/Badge';
import { fonts, M } from '../../constants/meridian';
import { getApiBaseUrl } from '../networking/config';
import type { Booking, User } from '../networking/types';
import { getConfirmedBookingsByTrip } from '../services/booking';
import { getUserById } from '../services/user';

const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value !== undefined && value !== null && value !== '' ? value : '—'}</Text>
  </View>
);

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { tripId, bookingId } = useLocalSearchParams<{ tripId: string; bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [sender, setSender] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!tripId || !bookingId) return;
      setLoading(true);
      try {
        const list = await getConfirmedBookingsByTrip(tripId);
        const found = list.find((b) => String(b.id) === String(bookingId)) ?? null;
        setBooking(found);
        if (found?.senderId) {
          try {
            const s = await getUserById(found.senderId);
            setSender(s as User);
          } catch (e) {
            console.warn('Failed to fetch sender:', e);
          }
        }
      } catch (e) {
        console.warn('Failed to load booking details:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, bookingId]);

  const parcels = booking?.parcels ?? [];
  const totalWeight = useMemo(() => parcels.reduce((sum, p) => sum + (p.weightKg ?? 0), 0), [parcels]);
  const delivered = booking?.status === 'DELIVERED';

  return (
    <View style={styles.container}>
      {/* HERO */}
      <View style={styles.hero}>
        <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.heroTitle}>Détails de la réservation</Text>
        </View>
        {booking ? (
          <View style={styles.heroBadge}>
            <Badge label={delivered ? 'LIVRÉ' : (booking.status || 'CONFIRMÉ')} tone={delivered ? 'green' : 'green'} />
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={M.warm1} />
        </View>
      ) : !booking ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color={M.textFaint} />
          <Text style={styles.empty}>Réservation introuvable</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* SENDER */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Feather name="user" size={17} color={M.blue} />
              <Text style={styles.cardTitle}>Expéditeur</Text>
            </View>
            <InfoRow label="Prénom" value={sender?.firstName} />
            <InfoRow label="Nom" value={sender?.lastName} />
            <InfoRow label="Téléphone" value={sender?.phone} />
          </View>

          {/* RECIPIENT */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Feather name="user-check" size={17} color={M.warm1} />
              <Text style={styles.cardTitle}>Destinataire</Text>
            </View>
            <InfoRow label="Nom complet" value={booking.recipient?.fullName} />
            <InfoRow label="Téléphone" value={booking.recipient?.phoneNumber} />
            <InfoRow label="Adresse" value={booking.recipient?.tunisiaAddress} />
          </View>

          {/* TRANSPORTER NOTES — captured at hand-over */}
          {booking.notes ? (
            <View style={styles.notesCard}>
              <View style={styles.cardHead}>
                <Feather name="edit-3" size={17} color={M.amber} />
                <Text style={styles.cardTitle}>Vos remarques</Text>
              </View>
              <Text style={styles.notesTxt}>{booking.notes}</Text>
            </View>
          ) : null}

          {/* PARCEL */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Feather name="box" size={17} color={M.warm2} />
              <Text style={styles.cardTitle}>Colis</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Poids total</Text>
              <Text style={styles.totalValue}>{totalWeight} kg</Text>
            </View>

            {parcels.length === 0 ? (
              <Text style={styles.empty}>Aucun colis</Text>
            ) : (
              parcels.map((parcel, index) => (
                <View key={parcel.id ?? index} style={styles.parcelBlock}>
                  <Text style={styles.parcelTitle}>Colis {index + 1}</Text>
                  <View style={styles.row}>
                    <Text style={styles.label}>Catégorie</Text>
                    {parcel.type ? <Badge label={parcel.type} tone="blue" /> : <Text style={styles.value}>—</Text>}
                  </View>
                  <InfoRow label="Poids" value={`${parcel.weightKg ?? '—'} kg`} />
                  {(parcel.images?.length ?? 0) > 0 && (
                    <View style={styles.photoSection}>
                      <Text style={styles.photoLabel}>Photos</Text>
                      <View style={styles.photoRow}>
                        {parcel.images!.map((img, i) => {
                          const url = `${getApiBaseUrl()}/parcel-uploads/files/${img.imageUrl}`;
                          return (
                            <Pressable key={i} onPress={() => setSelectedPhoto(url)}>
                              <Image source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Full-size photo */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
        <Pressable style={styles.photoOverlay} onPress={() => setSelectedPhoto(null)}>
          {selectedPhoto && <Image source={{ uri: selectedPhoto }} style={styles.photoFull} resizeMode="contain" />}
          <Pressable style={styles.photoClose} onPress={() => setSelectedPhoto(null)}>
            <Feather name="x" size={26} color="#fff" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },

  hero: { overflow: 'hidden', paddingTop: 14, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: fonts.display, fontSize: 19, fontWeight: '700', color: '#fff' },
  heroBadge: { marginTop: 12, alignSelf: 'flex-start', marginLeft: 54 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  empty: { color: M.textMut, fontSize: 15, fontFamily: fonts.body },

  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: M.line, padding: 18, marginBottom: 16 },
  notesCard: { backgroundColor: '#FBF7ED', borderRadius: 20, borderWidth: 1, borderColor: '#F3E7C9', padding: 18, marginBottom: 16 },
  notesTxt: { fontSize: 14, color: '#8A7A4E', lineHeight: 21, fontFamily: fonts.body },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: M.text, fontFamily: fonts.display },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: M.hair },
  label: { fontSize: 14, color: M.textMut, fontFamily: fonts.body },
  value: { fontSize: 14, fontWeight: '600', color: M.text, flexShrink: 1, textAlign: 'right', marginLeft: 12, fontFamily: fonts.body },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: M.blue, fontFamily: fonts.body },
  totalValue: { fontSize: 16, fontWeight: '700', color: M.blue, fontFamily: fonts.display },
  parcelBlock: { borderTopWidth: 1, borderTopColor: M.hair, paddingTop: 12, marginTop: 6 },
  parcelTitle: { fontSize: 14, fontWeight: '700', color: M.text, marginBottom: 4, fontFamily: fonts.display },

  photoSection: { marginTop: 10 },
  photoLabel: { fontSize: 13, color: M.textMut, marginBottom: 8, fontFamily: fonts.body },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: M.page, borderWidth: 1, borderColor: M.line },
  photoOverlay: { flex: 1, backgroundColor: 'rgba(10,22,38,0.92)', justifyContent: 'center', alignItems: 'center' },
  photoFull: { width: '90%', height: '80%' },
  photoClose: { position: 'absolute', top: 40, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
});
