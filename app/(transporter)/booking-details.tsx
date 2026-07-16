import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getConfirmedBookingsByTrip } from '../services/booking';
import { getUserById } from '../services/user';
import { getApiBaseUrl } from '../networking/config';
import type { Booking, User } from '../networking/types';

// ─── Row helper (label à gauche, valeur à droite) ────────────────────
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

  const totalWeight = useMemo(
    () => parcels.reduce((sum, p) => sum + (p.weightKg ?? 0), 0),
    [parcels]
  );

  return (
    <View style={styles.container}>
      {/* ─── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Détails de la réservation
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : !booking ? (
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={40} color="#9CA3AF" />
          <Text style={styles.emptyText}>Réservation introuvable</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Détails Expéditeur ──────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="user" size={18} color="#6B7280" />
              <Text style={styles.cardTitle}>Détails expéditeur</Text>
            </View>

            <InfoRow label="Prénom" value={sender?.firstName} />
            <InfoRow label="Nom" value={sender?.lastName} />
            <InfoRow label="Téléphone" value={sender?.phone} />
          </View>

          {/* ─── Détails Destinataire ────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="user-check" size={18} color="#6B7280" />
              <Text style={styles.cardTitle}>Détails destinataire</Text>
            </View>

            <InfoRow label="Nom complet" value={booking.recipient?.fullName} />
            <InfoRow label="Téléphone" value={booking.recipient?.phoneNumber} />
            <InfoRow label="Adresse" value={booking.recipient?.tunisiaAddress} />
          </View>

          {/* ─── Détails Colis ───────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="package" size={18} color="#6B7280" />
              <Text style={styles.cardTitle}>Détails colis</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Poids total</Text>
              <Text style={styles.totalValue}>{totalWeight} kg</Text>
            </View>

            {parcels.length === 0 ? (
              <Text style={styles.emptyText}>Aucun colis</Text>
            ) : (
              parcels.map((parcel, index) => (
                <View key={parcel.id ?? index} style={styles.parcelBlock}>
                  <Text style={styles.parcelTitle}>Colis {index + 1}</Text>

                  <InfoRow label="Catégorie" value={parcel.type} />
                  <InfoRow label="Poids" value={`${parcel.weightKg ?? '—'} kg`} />

                  {(parcel.images?.length ?? 0) > 0 && (
                    <View style={styles.photoSection}>
                      <Text style={styles.photoLabel}>Photos</Text>
                      <View style={styles.photoRow}>
                        {parcel.images!.map((img, i) => {
                          const url = `${getApiBaseUrl()}/parcel-uploads/files/${img.imageUrl}`;
                          return (
                            <TouchableOpacity
                              key={i}
                              activeOpacity={0.85}
                              onPress={() => setSelectedPhoto(url)}
                            >
                              <Image source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ─── Full-size photo overlay ─────────────────────────────── */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <TouchableOpacity
          style={styles.photoOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPhoto(null)}
        >
          {selectedPhoto && (
            <Image source={{ uri: selectedPhoto }} style={styles.photoFull} resizeMode="contain" />
          )}
          <TouchableOpacity
            style={styles.photoCloseBtn}
            onPress={() => setSelectedPhoto(null)}
            activeOpacity={0.7}
          >
            <Feather name="x" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
//   STYLES  (aligné sur le design global — cf. trip-details.tsx)
// ═════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // ─── Header ────────────────────────────────────────────────────
  header: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── States ────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
  },

  // ─── ScrollView ────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // ─── Card ──────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  // ─── Rows ──────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },

  // ─── Colis ─────────────────────────────────────────────────────
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  parcelBlock: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 4,
  },
  parcelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  // ─── Photos ────────────────────────────────────────────────────
  photoSection: {
    marginTop: 10,
  },
  photoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoFull: {
    width: '90%',
    height: '80%',
  },
  photoCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 24,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
