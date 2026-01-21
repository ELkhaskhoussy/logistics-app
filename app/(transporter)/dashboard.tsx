import { Feather } from '@expo/vector-icons';
import { useRouter,useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback} from 'react';
import { apiClient } from '../services/backService';

import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getToken, getUserId } from '../utils/tokenStorage';

export default function DashboardScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'trips' | 'profile'>('trips');

  // ✅ Profile state
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // ✅ Trips state
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [pastTrips, setPastTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  // ✅ Load profile
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

      // ✅ Load trips function 
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

          const upcoming = trips.filter((t: any) => new Date(t.departureTime) >= now);
          const past = trips.filter((t: any) => new Date(t.departureTime) < now);

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

      // ✅ reload trips every time dashboard is focused
      useFocusEffect(
        useCallback(() => {
          loadTrips();
        }, [loadTrips])
      );

   

  const formatDate = (value: any) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transporter Dashboard</Text>
      </View>

      {/* Tabs */}
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
        {/* ==================== TRIPS TAB ==================== */}
        {activeTab === 'trips' ? (
          <View style={styles.tabContent}>
            {/* Upcoming Trips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Trips</Text>

              {loadingTrips ? (
                <ActivityIndicator />
              ) : upcomingTrips.length === 0 ? (
                <Text style={styles.emptyText}>No upcoming trips</Text>
              ) : (
                <View style={styles.tripsList}>
                {[...upcomingTrips]
                       .sort(
                           (a, b) =>
                               new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
                              )
                        .map((trip) => (
                    <View key={trip.id} style={styles.tripCard}>
                      <View style={styles.tripCardContent}>
                        <View style={styles.tripHeader}>
                          <View style={styles.tripInfo}>
                            <View style={styles.routeRow}>
                              <Feather name="map-pin" size={16} color="#6B7280" />
                              <Text style={styles.routeText}>
                                {trip.departureCity} → {trip.arrivalCity}
                              </Text>
                            </View>

                            <View style={styles.dateRow}>
                              <Feather name="calendar" size={16} color="#6B7280" />
                              <Text style={styles.dateText}>{formatDate(trip.departureTime)}</Text>
                            </View>
                          </View>

                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>Active</Text>
                          </View>
                        </View>

                        <View style={styles.tripFooter}>
                          <View style={styles.capacityRow}>
                            <Feather name="package" size={16} color="#6B7280" />
                            <Text style={styles.capacityText}>{trip.availableCapacityKg} kg</Text>
                          </View>

                          <Text style={styles.priceText}>
                            {trip.pricePerKg ? `€${trip.pricePerKg}/kg` : '—'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Past Trips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Trips</Text>

              {loadingTrips ? (
                <ActivityIndicator />
              ) : pastTrips.length === 0 ? (
                <Text style={styles.emptyText}>No past trips</Text>
              ) : (
                <View style={styles.tripsList}>
                  {pastTrips.map((trip) => (
                    <View key={trip.id} style={[styles.tripCard, styles.pastTripCard]}>
                      <View style={styles.tripCardContent}>
                        <View style={styles.tripHeader}>
                          <View style={styles.tripInfo}>
                            <View style={styles.routeRow}>
                              <Feather name="map-pin" size={16} color="#6B7280" />
                              <Text style={styles.routeText}>
                                {trip.departureCity} → {trip.arrivalCity}
                              </Text>
                            </View>

                            <View style={styles.dateRow}>
                              <Feather name="calendar" size={16} color="#6B7280" />
                              <Text style={styles.dateText}>{formatDate(trip.departureTime)}</Text>
                            </View>
                          </View>

                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>Completed</Text>
                          </View>
                        </View>

                        <View style={styles.tripFooter}>
                          <View style={styles.capacityRow}>
                            <Feather name="package" size={16} color="#6B7280" />
                            <Text style={styles.capacityText}>{trip.availableCapacityKg} kg</Text>
                          </View>

                          <Text style={styles.priceTextGray}>
                            {trip.pricePerKg ? `€${trip.pricePerKg}/kg` : '—'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          /* ==================== PROFILE TAB ==================== */
          <View style={styles.tabContent}>
            <View style={styles.profileCard}>
              {loadingProfile ? (
                <View style={{ padding: 24 }}>
                  <ActivityIndicator />
                  <Text style={{ textAlign: 'center', marginTop: 10, color: '#6B7280' }}>
                    Loading profile...
                  </Text>
                </View>
              ) : (
                <View style={styles.profileContent}>
                  {/* HEADER */}
                  <View style={styles.profileHeader}>
                    <View style={styles.profileAvatar}>
                      <Feather name="user" size={32} color="#FFFFFF" />
                    </View>

                    <View style={styles.profileText}>
                      <Text style={styles.profileName}>
                        {profile ? `${profile.firstName} ${profile.lastName}` : '—'}
                      </Text>
                      <Text style={styles.profileEmail}>{profile?.email ?? ''}</Text>
                    </View>
                  </View>

                  {/* DETAILS */}
                  <View style={styles.profileDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={styles.detailValue}>{profile?.phone ?? '—'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Vehicle Type</Text>
                      <Text style={styles.detailValue}>{profile?.vehicleType ?? 'Van'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>License Plate</Text>
                      <Text style={styles.detailValue}>{profile?.licensePlate ?? '123 TUN 4567'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Member Since</Text>
                      <Text style={styles.detailValue}>{profile?.memberSince ?? 'Jan 2020'}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(transporter)/add-trip' as any)}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
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
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#2563EB' },

  main: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  tabContent: { gap: 24 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },

  emptyText: { color: '#6B7280', fontSize: 14 },

  tripsList: { gap: 12 },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  pastTripCard: { opacity: 0.65 },
  tripCardContent: { padding: 16 },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripInfo: { flex: 1, gap: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 14, color: '#6B7280' },

  activeBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activeBadgeText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },

  completedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  completedBadgeText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },

  tripFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  capacityText: { fontSize: 14, color: '#111827', fontWeight: '600' },
  priceText: { fontSize: 14, fontWeight: '800', color: '#2563EB' },
  priceTextGray: { fontSize: 14, fontWeight: '800', color: '#111827' },

  // ✅ Profile
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  profileContent: { padding: 22 },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },

  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileText: { flex: 1 },

  profileName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  profileEmail: { marginTop: 2, fontSize: 14, color: '#6B7280' },

  profileDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  detailValue: { fontSize: 14, fontWeight: '800', color: '#111827' },

  bottomPadding: { height: 80 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
