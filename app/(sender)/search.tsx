import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { apiClient } from "../services/backService";

type MonthOption = { value: string; label: string };

// "YYYY-MM" -> first & last day of that month
const monthToRange = (value: string) => {
  const [y, m] = value.split("-").map(Number);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
};

export default function SearchScreen() {
  const router = useRouter();

  const [collectionCity, setCollectionCity] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<MonthOption | null>(null);

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ route: string; month?: string } | null>(null);

  // Next 6 months as dropdown options
  const monthOptions: MonthOption[] = useMemo(() => {
    const opts: MonthOption[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const raw = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      opts.push({ value, label: raw.charAt(0).toUpperCase() + raw.slice(1) });
    }
    return opts;
  }, []);

  // Default feed: all available upcoming trips
  const loadAvailableTrips = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/catalog/trips/available");
      setTrips(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableTrips();
  }, []);

  const runSearch = async (dep: string, arr: string, month: MonthOption | null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("departureCity", dep.trim());
      params.append("arrivalCity", arr.trim());
      if (month) {
        const { from, to } = monthToRange(month.value);
        params.append("dateFrom", from);
        params.append("dateTo", to);
      }
      const response = await apiClient.get(`/catalog/trips/search?${params.toString()}`);
      setTrips(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!collectionCity.trim()) {
      Toast.show({ type: "error", text1: "Ville de collecte requise" });
      return;
    }
    if (!deliveryCity.trim()) {
      Toast.show({ type: "error", text1: "Ville de livraison requise" });
      return;
    }

    await runSearch(collectionCity, deliveryCity, selectedMonth);

    setActiveFilters({
      route: `${collectionCity.trim()} → ${deliveryCity.trim()}`,
      month: selectedMonth?.label,
    });
    setSearchOpen(false);
    setMonthOpen(false);
  };

  // Remove all filters -> back to the full feed
  const clearAll = () => {
    setCollectionCity("");
    setDeliveryCity("");
    setSelectedMonth(null);
    setActiveFilters(null);
    setSearchOpen(false);
    setMonthOpen(false);
    loadAvailableTrips();
  };

  // Remove just the month -> re-search the same route without a month
  const clearMonth = async () => {
    setSelectedMonth(null);
    setActiveFilters((prev) => (prev ? { route: prev.route } : null));
    await runSearch(collectionCity, deliveryCity, null);
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
          <Feather name="package" size={22} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Tunisia-France Link</Text>
        </View>
      </View>

      <ScrollView style={styles.main} contentContainerStyle={{ padding: 16 }}>
        {/* Collapsed search pill */}
        {!searchOpen && (
          <TouchableOpacity style={styles.pill} activeOpacity={0.8} onPress={() => setSearchOpen(true)}>
            <Feather name="search" size={18} color="#6B7280" />
            <Text style={styles.pillText}>Rechercher un trajet</Text>
            <Feather name="sliders" size={18} color="#2563EB" />
          </TouchableOpacity>
        )}

        {/* Active filter chips */}
        {!searchOpen && activeFilters && (
          <View style={styles.chipsRow}>
            <TouchableOpacity style={styles.chip} onPress={clearAll} activeOpacity={0.8}>
              <Text style={styles.chipText}>{activeFilters.route}</Text>
              <Feather name="x" size={14} color="#1D4ED8" />
            </TouchableOpacity>
            {activeFilters.month ? (
              <TouchableOpacity style={styles.chip} onPress={clearMonth} activeOpacity={0.8}>
                <Text style={styles.chipText}>{activeFilters.month}</Text>
                <Feather name="x" size={14} color="#1D4ED8" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Expanded search panel */}
        {searchOpen && (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Rechercher un trajet</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchOpen(false);
                  setMonthOpen(false);
                }}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Feather name="map-pin" size={16} color="#6B7280" style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Ville de collecte"
                placeholderTextColor="#9CA3AF"
                value={collectionCity}
                onChangeText={setCollectionCity}
              />
            </View>

            <View style={styles.field}>
              <Feather name="map-pin" size={16} color="#6B7280" style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Ville de livraison"
                placeholderTextColor="#9CA3AF"
                value={deliveryCity}
                onChangeText={setDeliveryCity}
              />
            </View>

            {/* Month dropdown */}
            <TouchableOpacity style={styles.field} activeOpacity={0.8} onPress={() => setMonthOpen(!monthOpen)}>
              <Feather name="calendar" size={16} color="#6B7280" style={styles.fieldIcon} />
              <Text style={[styles.monthText, { color: selectedMonth ? "#111827" : "#9CA3AF" }]}>
                {selectedMonth ? selectedMonth.label : "Mois (optionnel)"}
              </Text>
              <Feather name="chevron-down" size={16} color="#6B7280" style={styles.chevron} />
            </TouchableOpacity>

            {monthOpen && (
              <View style={styles.dropdown}>
                {monthOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedMonth(opt);
                      setMonthOpen(false);
                    }}
                  >
                    <Text style={{ color: "#111827", fontSize: 14 }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Rechercher</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={clearAll} style={styles.clearLink}>
              <Text style={styles.clearLinkText}>Effacer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results header */}
        <Text style={styles.resultsTitle}>
          {activeFilters ? "Résultats" : "Trajets disponibles"}
          {!loading ? ` · ${trips.length}` : ""}
        </Text>

        {loading && <Text style={styles.stateText}>Chargement…</Text>}
        {!loading && trips.length === 0 && (
          <Text style={styles.stateText}>Aucun trajet trouvé</Text>
        )}

        {!loading &&
          trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.resultCard}
              onPress={() => {
                if (!trip.transporterId) return;
                router.push({
                  pathname: "/transporter-details/[id]",
                  params: { id: String(trip.transporterId), tripId: String(trip.id) },
                });
              }}
            >
              <View style={styles.routeRow}>
                <Feather name="map-pin" size={16} color="#6B7280" />
                <Text style={styles.routeText}>
                  {trip.departureCity} → {trip.arrivalCity}
                </Text>
              </View>

              {/* Full route with stops (shown when the trip has intermediate stops) */}
              {Array.isArray(trip.collectionStops) && trip.collectionStops.length > 2 && (
                <View style={styles.row}>
                  <Feather name="git-commit" size={14} color="#9CA3AF" />
                  <Text style={styles.date}>
                    {[...trip.collectionStops]
                      .sort((a: any, b: any) => (a.ordre ?? 0) - (b.ordre ?? 0))
                      .map((s: any) => s.city)
                      .join(" → ")}
                  </Text>
                </View>
              )}

              <View style={styles.row}>
                <Feather name="calendar" size={14} color="#9CA3AF" />
                <Text style={styles.date}>{formatDateTime(trip.departureTime)}</Text>
              </View>

              <Text style={styles.capacity}>
                {trip.availableCapacityKg} kg · €{trip.pricePerKg}/kg
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: { backgroundColor: "#2563EB", padding: 16 },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },

  main: { flex: 1 },

  // Collapsed pill
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillText: { flex: 1, color: "#9CA3AF", fontSize: 14 },

  // Filter chips
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: { color: "#1D4ED8", fontSize: 13, fontWeight: "500" },

  // Expanded panel
  panel: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  panelTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },

  field: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 12,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  fieldIcon: { position: "absolute", left: 12 },
  fieldInput: { flex: 1, height: 46, fontSize: 14, color: "#111827" },
  monthText: { flex: 1, fontSize: 14 },
  chevron: { position: "absolute", right: 12 },

  dropdown: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginTop: -4,
    marginBottom: 10,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  searchButton: {
    backgroundColor: "#2563EB",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  searchButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  clearLink: { marginTop: 10, alignItems: "center" },
  clearLinkText: { color: "#2563EB", fontWeight: "600" },

  // Results
  resultsTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 20, marginBottom: 10 },
  stateText: { textAlign: "center", marginTop: 20, color: "#6B7280" },

  resultCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  routeText: { fontWeight: "700", fontSize: 15, color: "#111827" },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  date: { color: "#6B7280", fontSize: 13 },
  capacity: { marginTop: 8, fontWeight: "600", color: "#111827" },
});
