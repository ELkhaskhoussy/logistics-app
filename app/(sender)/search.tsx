import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * ✅ Formats a JS Date into yyyy-MM-dd WITHOUT timezone shifting
 */
const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function SearchScreen() {
  const router = useRouter();

  const [searchData, setSearchData] = useState({
    collectionCity: "",
    deliveryCity: "",
    date: "",
  });

  const dateInputRef = useRef<TextInput>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const todayExample = formatLocalDate(new Date());

  const handleSearch = () => {
    console.log("Search submitted:", searchData);

    // ✅ validation rule: either date OR both cities
    if (!searchData.date && (!searchData.collectionCity || !searchData.deliveryCity)) {
      alert("Please choose a date OR fill both cities.");
      return;
    }

    router.push({
      pathname: "/(sender)/results",
      params: {
        collectionCity: searchData.collectionCity,
        deliveryCity: searchData.deliveryCity,
        date: searchData.date,
      },
    } as any);
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
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Find Your Transporter</Text>
          <Text style={styles.subtitle}>Search for available transporters on your route</Text>
        </View>

        {/* Search Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Search Transporters</Text>
          </View>

          <View style={styles.cardContent}>
            {/* Collection City */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Collection City</Text>
              <View style={styles.inputWrapper}>
                <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Tunis"
                  placeholderTextColor="#9CA3AF"
                  value={searchData.collectionCity}
                  onChangeText={(text) => setSearchData({ ...searchData, collectionCity: text })}
                />
              </View>
            </View>

            {/* Delivery City */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Delivery City</Text>
              <View style={styles.inputWrapper}>
                <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Paris"
                  placeholderTextColor="#9CA3AF"
                  value={searchData.deliveryCity}
                  onChangeText={(text) => setSearchData({ ...searchData, deliveryCity: text })}
                />
              </View>
            </View>

            {/* Preferred Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preferred Date</Text>

              {Platform.OS === "web" ? (
                <View style={styles.webDateWrapper}>
                  <Feather name="calendar" size={16} color="#6B7280" style={styles.webCalendarIcon} />

                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => {
                      if (!date) return;

                      // ✅ keep actual Date for UI
                      setSelectedDate(date);

                      // ✅ store string for API (NO timezone shifting!)
                      const formattedDate = formatLocalDate(date);
                      setSearchData({ ...searchData, date: formattedDate });
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText={`e.g. ${todayExample}`}
                    // ✅ IMPORTANT to avoid ugly UI
                    customInput={
                      <input
                        style={{
                          width: "100%",
                          height: 48,
                          paddingLeft: 36,
                          paddingRight: 12,
                          fontSize: 16,
                          borderRadius: 8,
                          border: "1px solid #D1D5DB",
                          backgroundColor: "#FFFFFF",
                          color: "#111827",
                        }}
                      />
                    }
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.inputWrapper}
                  activeOpacity={0.8}
                  onPress={() => setShowCalendar(true)}
                >
                  <Feather name="calendar" size={16} color="#6B7280" style={styles.inputIcon} />
                  <Text style={styles.dateText}>
                    {searchData.date ? searchData.date : `e.g. ${todayExample}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Mobile calendar */}
            {Platform.OS !== "web" && showCalendar && (
              <DateTimePicker
                value={selectedDate ?? new Date()}
                mode="date"
                display="default"
                onChange={(event, dateValue?: Date) => {
                  setShowCalendar(false);

                  if (dateValue) {
                    setSelectedDate(dateValue);
                    const formattedDate = formatLocalDate(dateValue);
                    setSearchData({ ...searchData, date: formattedDate });
                  }
                }}
              />
            )}

            {/* Search Button */}
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
              <Feather name="search" size={16} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.searchButtonText}>Find Transporters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    backgroundColor: "#2563EB",
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  main: {
    flex: 1,
    padding: 16,
  },

  titleSection: {
    paddingVertical: 32,
    gap: 8,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#111827",
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },

  cardHeader: {
    padding: 24,
    paddingBottom: 16,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },

  cardContent: {
    padding: 24,
    paddingTop: 0,
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },

  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },

  inputIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },

  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },

  dateText: {
    flex: 1,
    height: 48,
    lineHeight: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },

  webDateWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },

  webCalendarIcon: {
    position: "absolute",
    left: 12,
    zIndex: 2,
  },

  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    height: 52,
    borderRadius: 8,
    marginTop: 8,
  },

  buttonIcon: {
    marginRight: 8,
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
