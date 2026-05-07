import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import { getTripById } from '../services/trip';
import ReservationDemandsModal from './components/ReservationDemandsModal';
import {
  getConfirmedBookingsByTrip,
  getPendingBookingsByTrip,
} from '../services/booking';
import ConfirmedBookingsModal from './components/ConfirmedBookingsModal';
import StopSelectorModal from "./components/StopSelectorModal";

import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Truck illustration ──────────────────────────────────────────────
const truckImage = require('../../assets/images/truck-illustration.png');

// ─── Local stop type (used for timeline rendering) ──────────────────
interface CollectionStop {
  city: string;
  fullAddress?: string;
  stopTime?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────
const formatDate = (value: string | undefined) => {
  if (!value) return '—';
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');




// ═════════════════════════════════════════════════════════════════════
//   TripDetailsScreen
// ═════════════════════════════════════════════════════════════════════
export default function TripDetailsScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

const [confirmedBookingsCount, setConfirmedBookingsCount] = useState(0);

const [reservationDemandsCount, setReservationDemandsCount] = useState(0);

const [currentStopIndex, setCurrentStopIndex] = useState(0);

const [isStopModalVisible, setIsStopModalVisible] = useState(false);

  const [trip, setTrip] = useState<any>(null);

  // ─── Only capacity fields are live from the backend ──────────────
  const [liveCapacity, setLiveCapacity] = useState<{
    totalCapacityKg: number;
    availableCapacityKg: number;
  } | null>(null);

  // ─── Modal state ─────────────────────────────────────────────────
  const [showConfirmedModal, setShowConfirmedModal] = useState(false);
  
  const [showDemandsModal, setShowDemandsModal] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    getTripById(tripId)
      .then((data) => {
         setTrip(data); 
        if (data.totalCapacityKg !== undefined && data.availableCapacityKg !== undefined) {
          setLiveCapacity({
            totalCapacityKg: data.totalCapacityKg,
            availableCapacityKg: data.availableCapacityKg,
          });
        }
      })
      .catch((e) => {
        console.warn('[TripDetails] Could not fetch live capacity, using mock values:', e?.message);
      });
  }, [tripId]);

useEffect(() => {
  if (!tripId) return;

  getConfirmedBookingsByTrip(tripId)
    .then((data) => {
      setConfirmedBookingsCount(data.length);
    })
    .catch((err) => {
      console.warn('Failed to fetch confirmed bookings:', err);
    });
}, [tripId]);

useEffect(() => {
  if (trip?.currentStopIndex !== undefined) {
    setCurrentStopIndex(trip.currentStopIndex);
  }
}, [trip]);
useEffect(() => {
  if (!tripId) return;

  getPendingBookingsByTrip(tripId)
    .then((data) => {
      setReservationDemandsCount(data.length);
    })
    .catch((err) => {
      console.warn('Failed to fetch reservation demands:', err);
    });
}, [tripId]);

  // ─── Derived capacity — live if available, mock otherwise ─────────
  const capacityInfo = useMemo(() => {
   const totalKg = liveCapacity?.totalCapacityKg ?? trip?.totalCapacityKg ?? 0;
  const availableKg = liveCapacity?.availableCapacityKg ?? trip?.availableCapacityKg ?? 0;
    // TODO: Replace usedKg with sum of parcel weights from booking-service when available
    const usedKg = totalKg - availableKg;
    const percentage = totalKg > 0 ? Math.round((usedKg / totalKg) * 100) : 0;
    
    return { usedKg, totalKg, percentage };
  }, [liveCapacity, trip]);


  // Build timeline from departure → stops → arrival
  const timelineStops = useMemo(() => {
    if (!trip) return [];
    const stops: { city: string; date: string; isCurrent: boolean }[] = [];

    // Departure
    stops.push({
      city: trip.departureCity,
      date: formatDate(trip.departureTime),
      isCurrent: false,
    });

    // Collection stops
      if (trip.collectionStops?.length) {
    trip.collectionStops.forEach((s:any) => {
      // skip duplicates (departure / arrival)
      if (
        s.city !== trip.departureCity &&
        s.city !== trip.arrivalCity
      ) {
        stops.push({
          city: s.city,
          date: formatDate(s.stopTime),
          isCurrent: false,
        });
      }
    });
  }

    // Arrival
    stops.push({
      city: trip.arrivalCity,
      date: formatDate(trip.arrivalTime),
      isCurrent: false,
    });

    // Determine current stop based on dates
    let currentIdx = currentStopIndex;

    if (stops[currentIdx]) stops[currentIdx].isCurrent = true;

    return stops;
 }, [trip, currentStopIndex]);

  const confirmedBookings = confirmedBookingsCount;
  const reservationDemands = reservationDemandsCount;
  const currentStopName = timelineStops.find((s) => s.isCurrent)?.city || trip?.departureCity || '—';

  if (!trip) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
    const modalStops = timelineStops.map((stop, index) => ({
      id: index.toString(),
      city: stop.city,
    }));
    
  // ═══════════════════════════════════════════════════════════════════
  //   RENDER
  // ═══════════════════════════════════════════════════════════════════
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
            Trip Details: {trip.departureCity} to {trip.arrivalCity}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Capacity Card ────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Capacity Details</Text>

          <View style={styles.truckWrapper}>
            {/* Truck image fills the entire area */}
            <Image
              source={truckImage}
              style={styles.truckImage}
              resizeMode="cover"
            />

            {/* Capacity info positioned on the cargo box */}
            <View style={styles.cargoOverlay}>
              {/* Green fill covers the entire wagon area */}
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={['#22C55E', '#16A34A', '#15803D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(capacityInfo.percentage, 100)}%` as any },
                  ]}
                />
              </View>

              {/* Text overlaid inside the rectangle */}
              <View style={styles.cargoTextOverlay}>
                <View style={styles.capacityDetailRow}>
                  <Feather name="package" size={14} color="#FFF" />
                  <Text style={styles.capacityDetailText}>
                    Used: {capacityInfo.usedKg} kg / {capacityInfo.totalKg} kg Total
                  </Text>
                </View>
                <Text style={styles.capacityPercentage}>
                  {capacityInfo.percentage}%{' '}
                  <Text style={styles.capacityLabel}>Capacity Filled</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Timeline Card ────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Stop Timeline</Text>

          <View style={styles.timelineContainer}>
            {timelineStops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === timelineStops.length - 1;
              const isPast = !stop.isCurrent && index < (timelineStops.findIndex((s) => s.isCurrent) ?? 0);

              return (
                <View key={index} style={styles.timelineStopWrapper}>
                  {/* Dot + Line */}
                  <View style={styles.timelineDotLineRow}>
                    {/* Left line */}
                    {!isFirst && (
                      <View
                        style={[
                          styles.timelineLine,
                          (isPast || stop.isCurrent) && styles.timelineLineActive,
                        ]}
                      />
                    )}

                    {/* Dot */}
                    <View
                      style={[
                        styles.timelineDot,
                        stop.isCurrent && styles.timelineDotCurrent,
                        isPast && styles.timelineDotPast,
                      ]}
                    >
                      {stop.isCurrent && (
                        <Feather name="navigation" size={10} color="#FFFFFF" />
                      )}
                    </View>

                    {/* Right line */}
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          isPast && styles.timelineLineActive,
                        ]}
                      />
                    )}
                  </View>

                  {/* City + Date */}
                  <Text
                    style={[
                      styles.timelineCityName,
                      stop.isCurrent && styles.timelineCityNameCurrent,
                    ]}
                    numberOfLines={1}
                  >
                    {stop.city}
                  </Text>
                  <Text style={styles.timelineDate}>{stop.date}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── Bottom Cards Row ─────────────────────────────────── */}
        <View style={styles.bottomCardsRow}>
          {/* Booking Summary */}
          <View style={[styles.card, styles.bottomCardHalf]}>
            <Text style={styles.cardTitle}>Booking Summary</Text>

            <TouchableOpacity
              style={styles.manageBookingsButton}
              activeOpacity={0.8}
              onPress={() => setShowConfirmedModal(true)}
            >
              <View style={styles.manageBookingsContent}>
                <View style={styles.manageBookingsIconWrap}>
                  <Feather name="clipboard" size={22} color="#2563EB" />
                </View>
                <Text style={styles.manageBookingsText}>
                  Manage {confirmedBookings} Confirmed Bookings
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Trip Actions */}
          <View style={[styles.card, styles.bottomCardHalf]}>
            <Text style={styles.cardTitle}>Trip Actions</Text>

             <TouchableOpacity
                  style={styles.updateStatusButton}
                 onPress={() => setIsStopModalVisible(true)}
                >
              <Feather name="navigation" size={16} color="#FFFFFF" />
              <Text style={styles.updateStatusText} numberOfLines={2}>
                At {currentStopName} - Update Trip Status
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reservationButton}
              activeOpacity={0.8}
              onPress={() => setShowDemandsModal(true)}
            >
              <View style={styles.reservationButtonContent}>
                <Feather name="users" size={16} color="#2563EB" />
                <Text style={styles.reservationText}>Reservation Demands</Text>
              </View>
              {/* Badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{reservationDemands}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Reservation Demands Modal ──────────────────────────── */}
      <ReservationDemandsModal
        visible={showDemandsModal}
        tripId={tripId ?? ''}
        totalDemands={reservationDemands}
        onClose={() => setShowDemandsModal(false)}
      />


      <ConfirmedBookingsModal
      visible={showConfirmedModal}
      onClose={() => setShowConfirmedModal(false)}
      tripId={tripId ?? ''}
    />

<StopSelectorModal
  visible={isStopModalVisible}
  onClose={() => setIsStopModalVisible(false)}
  stops={modalStops}
  selectedIndex={currentStopIndex}
  onSelect={(index) => {
    setCurrentStopIndex(index);
    setIsStopModalVisible(false);
  }}
/>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
//   STYLES
// ═════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // ─── Container ─────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },

  // ─── Truck / Capacity ──────────────────────────────────────────
  truckWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 2.2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  truckImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  cargoOverlay: {
    position: 'absolute',
    top: '2%',
    right: '8%',
    bottom: '27%',
    left: '35%',
    overflow: 'hidden',
  },
  progressBarTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 210, 220, 0.25)',
  },
  progressBarFill: {
    height: '100%',
  },
  cargoTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  capacityPercentage: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  capacityLabel: {
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#FFFFFF',
  },
  capacityDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  capacityDetailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ─── Timeline ──────────────────────────────────────────────────
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 8,
  },
  timelineStopWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  timelineDotLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    width: '100%',
    justifyContent: 'center',
  },
  timelineLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  timelineLineActive: {
    backgroundColor: '#2563EB',
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timelineDotCurrent: {
    backgroundColor: '#2563EB',
    borderColor: '#BFDBFE',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
  },
  timelineDotPast: {
    backgroundColor: '#93C5FD',
  },
  timelineCityName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
  },
  timelineCityNameCurrent: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  timelineDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },

  // ─── Bottom Cards Row ──────────────────────────────────────────
  bottomCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomCardHalf: {
    flex: 1,
  },

  // ─── Manage Bookings Button ────────────────────────────────────
  manageBookingsButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  manageBookingsContent: {
    alignItems: 'center',
    gap: 10,
  },
  manageBookingsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageBookingsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ─── Update Status Button ─────────────────────────────────────
  updateStatusButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  updateStatusText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },

  // ─── Reservation Button ────────────────────────────────────────
  reservationButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reservationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reservationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  badge: {
    backgroundColor: '#2563EB',
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
