import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { apiClient } from "../services/backService";

/**
 * Format date yyyy-MM-dd
 */
const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeCity = (s?: string) => {
  const value = (s ?? "").trim();
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const addMonths = (yyyyMMdd: string, monthsToAdd: number) => {
  const [y, m, d] = yyyyMMdd.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  date.setMonth(date.getMonth() + monthsToAdd);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function SearchScreen() {
  const router = useRouter();

  const [searchData, setSearchData] = useState({
    collectionCity: "",
    deliveryCity: "",
    date: "",
  });

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [collectionError, setCollectionError] = useState(false);
  const [deliveryError, setDeliveryError] = useState(false);
  const [dateError, setDateError] = useState(false);

  const todayExample = formatLocalDate(new Date());

  const handleSearch = async () => {
    setCollectionError(false);
    setDeliveryError(false);
    setDateError(false);

    if (!searchData.collectionCity.trim()) {
      setCollectionError(true);
      Toast.show({ type: "error", text1: "Collection city required" });
      return;
    }

    if (!searchData.deliveryCity.trim()) {
      setDeliveryError(true);
      Toast.show({ type: "error", text1: "Delivery city required" });
      return;
    }

    if (!searchData.date.trim()) {
      setDateError(true);
      Toast.show({ type: "error", text1: "Date required" });
      return;
    }

    try {
      setLoading(true);

      const departureCity = normalizeCity(searchData.collectionCity);
      const arrivalCity = normalizeCity(searchData.deliveryCity);
      const selectedDate = searchData.date;

      const params = new URLSearchParams();

      if (departureCity) params.append("departureCity", departureCity);
      if (arrivalCity) params.append("arrivalCity", arrivalCity);
      if (selectedDate) {
        params.append("dateFrom", selectedDate);
        params.append("dateTo", addMonths(selectedDate, 3));
      }

      const url = `/catalog/trips/search?${params.toString()}`;
      console.log("Final URL =", url);

      const response = await apiClient.get(url);
      const data = response.data;

      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (value: any) => {
    if (!value) return "—";
    return String(value).replace("T", " ").slice(0, 10);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Feather name="package" size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Tunisia-France Link</Text>
        </View>
      </View>

      <ScrollView style={styles.main}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Find Your Transporter</Text>
          <Text style={styles.subtitle}>
            Search for available transporters on your route
          </Text>
        </View>

        {/* Search Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Search Transporters</Text>
          </View>

          <View style={styles.cardContent}>
            {/* Collection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Collection City</Text>
              <View style={styles.inputWrapper}>
                <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Tunis"
                  placeholderTextColor="#9CA3AF"
                  value={searchData.collectionCity}
                  onChangeText={(text) =>
                    setSearchData({ ...searchData, collectionCity: text })
                  }
                />
              </View>
            </View>

            {/* Delivery */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Delivery City</Text>
              <View style={styles.inputWrapper}>
                <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Paris"
                  placeholderTextColor="#9CA3AF"
                  value={searchData.deliveryCity}
                  onChangeText={(text) =>
                    setSearchData({ ...searchData, deliveryCity: text })
                  }
                />
              </View>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preferred Date</Text>

              {Platform.OS === "web" ? (
                <View style={styles.webDateWrapper}>
                  <Feather name="calendar" size={16} color="#6B7280" style={styles.webCalendarIcon} />

                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => {
                      if (!date) return;

                      setSelectedDate(date);
                      setSearchData({
                        ...searchData,
                        date: formatLocalDate(date),
                      });
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText={`e.g. ${todayExample}`}
                    customInput={
                      <input
                        style={{
                          width: "100%",
                          height: 48,
                          paddingLeft: 36,
                          borderRadius: 8,
                          border: "1px solid #D1D5DB",
                        }}
                      />
                    }
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setShowCalendar(true)}
                >
                  <Feather name="calendar" size={16} color="#6B7280" style={styles.inputIcon} />
                  <Text style={styles.dateText}>
                    {searchData.date || `e.g. ${todayExample}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Find Transporters</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {loading && (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            Loading trips...
          </Text>
        )}

        {!loading && trips.length === 0 && (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No trips found
          </Text>
        )}

        {!loading &&
  trips.map((trip) => {
    const searchArrival = searchData.deliveryCity.toLowerCase();

    const filteredStops = (trip.collectionStops || []).filter(
      (s: any) => s.city.toLowerCase() === searchArrival
    );

    return (
      <TouchableOpacity
        key={trip.id}
        style={styles.resultCard}
        onPress={() => {
          if (!trip.transporterId) return;

         router.push({
          pathname: "/transporter-details/[id]",
          params: {
            id: String(trip.transporterId),
            tripId: String(trip.id),
          },
        });
        }}
      >
        {/* ROUTE */}
        <View style={styles.routeRow}>
          <Feather name="map-pin" size={16} color="#6B7280" />
          <Text style={styles.routeText}>
            {trip.departureCity} → {trip.arrivalCity}
          </Text>
        </View>

        {/* DATE */}
        <View style={styles.row}>
          <Feather name="calendar" size={14} color="#9CA3AF" />
          <Text style={styles.date}>
            {formatDateTime(trip.departureTime)}
          </Text>
        </View>

        {/* FILTERED STOPS (ONLY MATCHED) */}
        {filteredStops.map((s: any, i: number) => (
          <View key={i} style={styles.row}>
            <Feather name="map-pin" size={14} color="#9CA3AF" />
            <Text style={styles.stopText}>
              {s.city} • {formatDateTime(s.stopTime)}
            </Text>
          </View>
        ))}

        {/* PRICE */}
        <Text style={styles.capacity}>
          {trip.availableCapacityKg} kg • €{trip.pricePerKg}/kg
        </Text>
      </TouchableOpacity>
    );
  })}
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: { backgroundColor: "#2563EB", padding: 16 },

  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },

  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },

  main: { flex: 1, padding: 20 },

  titleSection: { paddingVertical: 32 },

  title: { fontSize: 30, fontWeight: "bold" },

  subtitle: { color: "#6B7280" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },

  cardHeader: { padding: 20 },

  cardTitle: { fontSize: 18, fontWeight: "bold" },

  cardContent: { padding: 20 },

  inputGroup: { marginBottom: 16 },

  label: { marginBottom: 6 },

  inputWrapper: { flexDirection: "row", alignItems: "center" },

  inputIcon: { position: "absolute", left: 10 },

  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingLeft: 36,
  },

  dateText: {
    flex: 1,
    height: 48,
    lineHeight: 48,
    paddingLeft: 36,
  },

  searchButton: {
    backgroundColor: "#2563EB",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  searchButtonText: { color: "#FFF", fontWeight: "600" },

  resultCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  routeRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  marginBottom: 6,
},

routeText: {
  fontWeight: "bold",
  fontSize: 16,
},

row: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  marginTop: 2,
},

stopText: {
  color: "#6B7280",
},
  route: { fontWeight: "bold" },

  date: { color: "#6B7280" },

  capacity: { marginTop: 8, fontWeight: "600" },

  webDateWrapper: { position: "relative" },

  webCalendarIcon: { position: "absolute", left: 10, top: 16 },
});