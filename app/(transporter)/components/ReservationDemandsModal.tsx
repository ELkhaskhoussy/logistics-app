import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getPendingDemandsByTrip, updateBookingStatus } from '../../services/booking';
import type { Booking, ParcelResponse } from '../../networking/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

function FilterDropdown({ label }: { label: string }) {
  return (
    <View style={s.filterDropdown}>
      <Text style={s.filterDropdownLabel}>{label}</Text>
      <Feather name="chevron-down" size={14} color="#374151" />
    </View>
  );
}

// ─── Demand Card ───────────────────────────────────────────────────────────

function DemandCard({
  booking,
  onAccept,
  onDecline,
  actionLoading,
}: {
  booking: Booking;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  actionLoading: string | null;
}) {
  // Aggregate parcel data
  const parcels = booking.parcels ?? [];
  const totalWeight = parcels.reduce((sum, p) => sum + (p.weightKg ?? 0), 0);
  const categories = [...new Set(parcels.map((p) => p.type).filter(Boolean))].join(', ');
  const firstParcel: ParcelResponse | undefined = parcels[0];
  const description = firstParcel?.description ?? '—';
  const quantityLabel = firstParcel?.quantityLabel ?? (firstParcel?.quantity ? String(firstParcel.quantity) : '—');
  const destination = booking.recipient?.tunisiaAddress ?? '—';

  const isActioning = actionLoading === booking.id;

  return (
    <View style={s.card}>
      {/* ── Header */}
      <View style={s.cardHeader}>
        <View style={s.senderRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{String(booking.senderId).charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={s.senderName}>Sender #{booking.senderId}</Text>
          </View>
        </View>
        <Text style={s.dateText}>
          {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('fr-FR') : '—'}
        </Text>
      </View>

      {/* ── Weight / destination / category / price */}
      <View style={s.metaRow}>
        <Text style={s.weightText}>{totalWeight} kg</Text>
        <View style={s.destPill}>
          <Feather name="map-pin" size={12} color="#2563EB" />
          <Text style={s.destText}>{destination}</Text>
        </View>
      </View>
      <View style={s.metaRow2}>
        <Text style={s.categoryText}>{categories || '—'}</Text>
      </View>

      {/* ── Package details box */}
      <View style={s.packageBox}>
        <Text style={s.packageBoxTitle}>Package Details:</Text>
        <View style={s.packageRow}>
          <Text style={s.packageLabel}>Detailed Description: </Text>
          <Text style={s.packageValue}>{description}</Text>
        </View>
        <View style={s.packageRow}>
          <Text style={s.packageLabel}>Label: Quantity: </Text>
          <Text style={s.packageValue}>{quantityLabel}</Text>
        </View>
      </View>

      {/* ── Action buttons */}
      <View style={s.actionRow}>
        <TouchableOpacity
          style={[s.acceptButton, isActioning && s.buttonDisabled]}
          activeOpacity={0.8}
          disabled={isActioning}
          onPress={() => onAccept(booking.id)}
        >
          {isActioning ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Feather name="check" size={15} color="#FFF" />
              <Text style={s.acceptText}>Accept Demand</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.declineButton, isActioning && s.buttonDisabled]}
          activeOpacity={0.8}
          disabled={isActioning}
          onPress={() => onDecline(booking.id)}
        >
          {isActioning ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Feather name="x" size={15} color="#FFF" />
              <Text style={s.declineText}>Decline</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  tripId: string;
  totalDemands: number;
  onClose: () => void;
}

export default function ReservationDemandsModal({
  visible,
  tripId,
  totalDemands,
  onClose,
}: Props) {
  const [demands, setDemands] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch demands when modal opens ────────────────────────────────
  const fetchDemands = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getPendingDemandsByTrip(tripId);
      setDemands(data);
    } catch (e: any) {
      console.warn('[ReservationDemandsModal] Failed to fetch demands:', e?.message);
      setFetchError('Could not load demands. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (visible) {
      fetchDemands();
    }
  }, [visible, fetchDemands]);

  // ── Accept ────────────────────────────────────────────────────────
  const handleAccept = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, 'CONFIRMED');
      setDemands((prev) => prev.filter((d) => d.id !== bookingId));
    } catch (e: any) {
      console.error('[ReservationDemandsModal] Accept failed:', e?.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Decline ───────────────────────────────────────────────────────
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dimmed backdrop */}
      <View style={s.backdrop}>
        {/* Modal sheet */}
        <View style={s.sheet}>
          {/* ── Modal header */}
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Reservation Demands ({count})</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.closeBtn}>
              <Feather name="x" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* ── Filter row */}
          <View style={s.filterRow}>
            <Text style={s.filterByLabel}>Filter By:</Text>
            <FilterDropdown label="Weight" />
            <FilterDropdown label="Price" />
            <FilterDropdown label="Destination" />
          </View>

          {/* ── Content */}
          {loading ? (
            <View style={s.centerState}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={s.centerText}>Loading demands...</Text>
            </View>
          ) : fetchError ? (
            <View style={s.centerState}>
              <Feather name="alert-circle" size={36} color="#EF4444" />
              <Text style={s.errorText}>{fetchError}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={fetchDemands}>
                <Text style={s.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={s.list}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
            >
              {demands.length === 0 ? (
                <View style={s.emptyState}>
                  <Feather name="inbox" size={40} color="#9CA3AF" />
                  <Text style={s.emptyText}>No pending demands</Text>
                </View>
              ) : (
                demands.map((d) => (
                  <DemandCard
                    key={d.id}
                    booking={d}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    actionLoading={actionLoading}
                  />
                ))
              )}
              <View style={{ height: 32 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    minHeight: '70%',
    ...Platform.select({
      ios: { paddingBottom: 34 },
      android: { paddingBottom: 16 },
      default: { paddingBottom: 16 },
    }),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterByLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginRight: 4 },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#F9FAFB',
  },
  filterDropdownLabel: { fontSize: 13, color: '#374151' },

  // Center states
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  centerText: { color: '#6B7280', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#FFF', fontWeight: '600' },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingTop: 14, gap: 14 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#1D4ED8' },
  senderName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  dateText: { fontSize: 12, color: '#9CA3AF' },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  weightText: { fontSize: 20, fontWeight: '800', color: '#111827' },
  destPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  destText: { fontSize: 13, color: '#1D4ED8', fontWeight: '600' },
  categoryText: { fontSize: 13, color: '#6B7280' },

  packageBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 6,
  },
  packageBoxTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  packageRow: { flexDirection: 'row', flexWrap: 'wrap' },
  packageLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  packageValue: { fontSize: 13, color: '#4B5563', flexShrink: 1 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: 10,
    minHeight: 44,
  },
  acceptText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 11,
    borderRadius: 10,
    minHeight: 44,
  },
  declineText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});
