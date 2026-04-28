import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../networking/client';

import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getToken, getUserId } from '../../utils/tokenStorage';

export default function DashboardScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'trips' | 'profile'>('trips');

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [pastTrips, setPastTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const userId = await getUserId();
        if (!userId) return;

        const res = await apiClient.get(`/users/${userId}`);
        setProfile(res.data);
      } catch (err) {
        console.log('Failed to load profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const loadTrips = useCallback(async () => {
    try {
      setLoadingTrips(true);

      const userId = await getUserId();
      const token = await getToken();

      if (!userId || !token) return;

      const res = await apiClient.get(`/catalog/trips/transporter/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const trips = Array.isArray(res.data) ? res.data : [];
      const now = new Date();

      const upcoming = trips.filter((t) => new Date(t.departureTime) >= now);
      const past = trips.filter((t) => new Date(t.departureTime) < now);

      setUpcomingTrips(upcoming);
      setPastTrips(past);
    } catch (err) {
      console.log('Failed to load trips:', err);
      setUpcomingTrips([]);
      setPastTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const formatDate = (value: any) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
  };

  const renderTrip = (trip: any) => (
    <TouchableOpacity
      key={trip.id}
      style={styles.tripCard}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(transporter)/trip-details', params: { tripId: trip.id } } as any)}
    >
      <View style={styles.tripCardContent}>
        
        {/* ROUTE */}
        <View style={styles.routeRow}>
          <Feather name="map-pin" size={16} color="#6B7280" />
          <Text style={styles.routeText}>
            {trip.departureCity} → {trip.arrivalCity}
          </Text>
        </View>

        {/* DATE */}
        <View style={styles.dateRow}>
          <Feather name="calendar" size={16} color="#6B7280" />
          <Text style={styles.dateText}>
            {formatDate(trip.departureTime)}
          </Text>
        </View>

        {/* STOPS */}
        {trip.collectionStops?.length > 0 && (
          <View style={styles.stopsContainer}>
            {trip.collectionStops.map((stop: any, index: number) => (
              <View key={index} style={styles.stopRow}>
                <Feather name="map-pin" size={14} color="#9CA3AF" />
                <Text style={styles.stopText}>
                  {stop.city} • {formatDate(stop.stopTime)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.tripFooter}>
          <View style={styles.tripFooterRow}>
            <Text style={styles.metaText}>
              {trip.availableCapacityKg} kg • €{trip.pricePerKg}/kg
            </Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transporter Dashboard</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trips' && styles.activeTab]}
          onPress={() => setActiveTab('trips')}
        >
          <Text style={[styles.tabText, activeTab === 'trips' && styles.activeTabText]}>
            My Trips
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'trips' ? (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Trips</Text>

              {loadingTrips ? (
                <ActivityIndicator />
              ) : upcomingTrips.length === 0 ? (
                <Text style={styles.emptyText}>No upcoming trips</Text>
              ) : (
                upcomingTrips
                  .sort(
                    (a, b) =>
                      new Date(a.departureTime).getTime() -
                      new Date(b.departureTime).getTime()
                  )
                  .map(renderTrip)
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Trips</Text>

              {loadingTrips ? (
                <ActivityIndicator />
              ) : pastTrips.length === 0 ? (
                <Text style={styles.emptyText}>No past trips</Text>
              ) : (
                pastTrips.map(renderTrip)
              )}
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            <Text>Profile coming soon</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(transporter)/(tabs)/add-trip' as any)}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    backgroundColor: '#2563EB',
    padding: 18,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },

  tab: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },

  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },

  tabText: { color: '#6B7280' },
  activeTabText: { color: '#2563EB' },

  main: { flex: 1 },
  scrollContent: { padding: 16 },

  tabContent: { gap: 20 },

  section: {
  marginBottom: 24,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
  paddingBottom: 12,
},

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },

  emptyText: { color: '#6B7280' },

  tripCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  padding: 16,
  marginBottom: 14,

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
},

  tripCardContent: {
    gap: 8,
  },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  routeText: {
  fontSize: 17,
  fontWeight: '700',
  color: '#111827',
},

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  dateText: {
    fontSize: 13,
    color: '#6B7280',
  },

  stopsContainer: {
    marginTop: 4,
    gap: 4,
  },

  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  stopText: {
    fontSize: 12,
    color: '#6B7280',
  },

  tripFooter: {
    marginTop: 6,
  },

  tripFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  metaText: {
    fontSize: 13,
    color: '#374151',
  },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 50,
  },

  bottomPadding: { height: 80 },
});