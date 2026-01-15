import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ResultsScreen() {
  const router = useRouter();

  const { collectionCity, deliveryCity } = useLocalSearchParams<{
    collectionCity?: string;
    deliveryCity?: string;
    date?: string;
  }>();

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const capitalize = (s?: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);

        const url = `http://localhost:8080/catalog/trips/search?departureCity=${capitalize(
          collectionCity
        )}&arrivalCity=${capitalize(deliveryCity)}`;

        const res = await fetch(url);
        const data = await res.json();

        setTrips(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch trips:', err);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [collectionCity, deliveryCity]);

  const handleTransporterPress = (id: number) => {
    router.push(`/(sender)/transporter-profile?id=${id}` as any);
  };

  const formatDateTime = (value: any) => {
    if (!value) return '—';
    return String(value).replace('T', ' ').slice(0, 16);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Available Transporters</Text>
        </View>
      </View>

      <ScrollView style={styles.main} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Route Info */}
        <View style={styles.routeInfo}>
          <Feather name="map-pin" size={16} color="#6B7280" />
          <Text style={styles.routeText}>
            {collectionCity ?? '...'} → {deliveryCity ?? '...'} • {trips.length} results
          </Text>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centerBox}>
            <Text style={styles.loadingText}>Loading trips...</Text>
          </View>
        )}

        {/* Empty */}
        {!loading && trips.length === 0 && (
          <View style={styles.emptyBox}>
            <Feather name="search" size={44} color="#2563EB" />
            <Text style={styles.emptyTitle}>No trips found</Text>
            <Text style={styles.emptySubtitle}>
              Try changing the route or selecting another date.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(sender)/search' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyButtonText}>Back to Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Trips List */}
        {!loading &&
          trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.card}
              onPress={() => handleTransporterPress(trip.transporterId)}
              activeOpacity={0.75}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  {/* Avatar */}
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {String(trip.departureCity ?? '?').charAt(0)}
                    </Text>
                  </View>

                  {/* Info Section */}
                  <View style={styles.infoSection}>
                    <Text style={styles.name}>
                      {trip.departureCity} → {trip.arrivalCity}
                    </Text>

                    <View style={styles.rowLine}>
                      <Feather name="clock" size={14} color="#6B7280" />
                      <Text style={styles.route}>
                        Departure: {formatDateTime(trip.departureTime)}
                      </Text>
                    </View>

                    <View style={styles.rowLine}>
                      <Feather name="flag" size={14} color="#6B7280" />
                      <Text style={styles.route}>
                        Arrival: {formatDateTime(trip.arrivalTime)}
                      </Text>
                    </View>

                    <View style={styles.rowLine}>
                      <Feather name="package" size={14} color="#6B7280" />
                      <Text style={styles.route}>
                        Available: {trip.availableCapacityKg}kg / {trip.totalCapacityKg}kg
                      </Text>
                    </View>

                    <View style={styles.statusRow}>
                      <Text style={styles.statusBadge}>{trip.status}</Text>
                    </View>
                  </View>

                  {/* Price Section */}
                  <View style={styles.priceSection}>
                    <Text style={styles.price}>
                      {trip.pricePerKg ? `€${trip.pricePerKg}` : '—'}
                    </Text>
                    <Text style={styles.priceUnit}>per kg</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  header: {
    backgroundColor: '#2563EB',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },

  main: {
    flex: 1,
    padding: 16,
  },

  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },

  routeText: {
    fontSize: 14,
    color: '#6B7280',
  },

  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
  },

  emptyButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },

  cardContent: {
    padding: 16,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  infoSection: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  rowLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },

  route: {
    fontSize: 13,
    color: '#6B7280',
  },

  statusRow: {
    marginTop: 8,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    color: '#1E3A8A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },

  priceSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563EB',
  },

  priceUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
});
