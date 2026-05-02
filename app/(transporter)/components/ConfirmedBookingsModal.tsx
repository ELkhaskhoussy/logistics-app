import { useEffect, useState } from 'react';
import { getConfirmedBookingsByTrip, updateBookingStatus} from '../../services/booking';
import type { Booking } from '../../networking/types';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    ActivityIndicator,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

export default function ConfirmedBookingsModal({
  visible,
  onClose,
  tripId
}: Props) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
  if (!visible || !tripId) return;

  setLoading(true);

  getConfirmedBookingsByTrip(tripId)
    .then((data) => {
      setBookings(data);
    })
    .catch((err) => {
      console.warn('Failed to fetch confirmed bookings:', err);
    })
    .finally(() => {
      setLoading(false);
    });
}, [visible, tripId]);
const handleStatusChange = async (
  booking: Booking,
  newStatus: 'DELIVERED' | 'NOT_DELIVERED'
) => {
  try {
    await updateBookingStatus(booking.id, newStatus);

    setBookings(prev =>
      prev.map(b =>
        b.id === booking.id ? { ...b, status: newStatus } : b
      )
    );
  } catch (e) {
    console.error('Failed to update status', e);
  }
};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View style={s.backdrop}>
        {/* Sheet */}
        <View style={s.sheet}>
          
          {/* Header */}
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Confirmed Bookings</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.closeBtn}>
              <Feather name="x" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={s.list}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
                <View style={s.emptyState}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={s.emptyText}>Loading...</Text>
                </View>
                ) : bookings.length === 0 ? (
                <View style={s.emptyState}>
                    <Feather name="inbox" size={40} color="#9CA3AF" />
                    <Text style={s.emptyText}>No confirmed bookings</Text>
                </View>
                ) : (
  <View>
    
    {/* Table Header */}
    <View style={s.headerRow}>
     <Text style={s.headerCellName}>Destinataire</Text>
    <Text style={s.headerCell}>Téléphone</Text>
    <Text style={s.headerCell}>Colis</Text>
    <Text style={s.headerCell}>Poids</Text>
    <Text style={s.headerStatus}>Statut</Text>
    </View>

    {/* Rows */}
    {bookings.map((booking) => {
      const parcels = booking.parcels ?? [];

      const totalWeight = parcels.reduce(
        (sum, p) => sum + (p.weightKg ?? 0),
        0
      );

      return (
        <View key={booking.id} style={s.row}>
          <Text style={s.cellName}>
            {booking.recipient?.fullName ?? '—'}
          </Text>

          <Text style={s.cell}>
            {booking.recipient?.phoneNumber ?? '—'}
          </Text>

          <Text style={s.cell}>
            {parcels.length}
          </Text>

          <Text style={s.cell}>
            {totalWeight} kg
          </Text>

         <View style={s.statusContainer}>
  <TouchableOpacity
    style={[
      s.segment,
      booking.status === 'DELIVERED' && s.segmentActive
    ]}
    onPress={() => handleStatusChange(booking, 'DELIVERED')}
  >
    <Text
      style={[
        s.segmentText,
        booking.status === 'DELIVERED' && s.segmentTextActive
      ]}
    >
      Livré
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      s.segment,
      booking.status === 'NOT_DELIVERED' && s.segmentActive
    ]}
    onPress={() => handleStatusChange(booking, 'NOT_DELIVERED')}
  >
    <Text
      style={[
        s.segmentText,
        booking.status === 'NOT_DELIVERED' && s.segmentTextActive
      ]}
    >
      Non livré
    </Text>
  </TouchableOpacity>
</View>
              
            </View>
           
                    );
                    })}
                </View>
                )
                }

                <View style={{ height: 32 }} />
            </ScrollView>
            </View>
        </View>
        </Modal>
    );
    }

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
    minHeight: '60%',
    ...Platform.select({
      ios: { paddingBottom: 34 },
      android: { paddingBottom: 16 },
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
   
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 20,
     paddingBottom: 10,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  card: {
  backgroundColor: '#FFF',
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
},

name: {
  fontSize: 15,
  fontWeight: '700',
  color: '#111827',
},

phone: {
  fontSize: 13,
  color: '#6B7280',
  marginTop: 4,
},

info: {
  fontSize: 13,
  color: '#374151',
  marginTop: 6,
},
headerRow: {
  flexDirection: 'row',
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
 backgroundColor: '#F9FAFB',
  borderRadius: 10,
  paddingHorizontal: 8,
},

headerCellName: {
  flex: 1.5,
  fontSize: 12,
  fontWeight: '700',
  color: '#374151',
},

headerCell: {
  flex: 1,
  fontSize: 12,
  fontWeight: '700',
  color: '#374151',
},

headerStatus: {
  flex: 1.2,
  fontSize: 12,
  fontWeight: '700',
  color: '#374151',
  textAlign: 'right',
},

row: {
  flexDirection: 'row',
   alignItems: 'center',
 
  paddingVertical: 12,
  paddingHorizontal: 8,

  marginBottom: 8, 

  backgroundColor: '#FFFFFF', 

  borderRadius: 10, 

  // iOS shadow
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 4,

// Android shadow
elevation: 2,
},

cell: {
  flex: 1,
  fontSize: 12,
  color: '#111827',
},

cellName: {
  flex: 1.5,
  fontSize: 12,
  fontWeight: '600',
  color: '#111827',
   maxWidth: 100,
},

statusContainer: {
  flexDirection: 'row',
  backgroundColor: '#E5E7EB',
  borderRadius: 20,
  padding: 3,
},

segment: {
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 16,
},

segmentActive: {
  backgroundColor: '#2563EB',
},

segmentText: {
  fontSize: 11,
  color: '#374151',
},

segmentTextActive: {
  color: '#FFFFFF',
  fontWeight: '600',
},
});