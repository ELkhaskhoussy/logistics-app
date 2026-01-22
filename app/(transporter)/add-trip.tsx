import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createTrip } from '../services/trip';
import { getUserId } from '../utils/tokenStorage';

type StopItem = {
  address: string;
  dateTime?: string; // ISO LocalDateTime: YYYY-MM-DDTHH:mm:ss OR web input "YYYY-MM-DD HH:MM"
};

export default function AddTripScreen() {
  const router = useRouter();

  const TOTAL_STEPS = 2;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [tripData, setTripData] = useState<{
    startAddress: string;
    departureDateTime: string; // REQUIRED
    endAddress: string;
    arrivalDateTime: string; // REQUIRED
    stops: StopItem[]; // OPTIONAL
    availableWeight: string;
    pricePerKg: string;
  }>({
    startAddress: '',
    departureDateTime: '',
    endAddress: '',
    arrivalDateTime: '',
    stops: [],
    availableWeight: '',
    pricePerKg: '',
  });

  
  const [invalidDepartureDate, setInvalidDepartureDate] = useState(false);
  const [invalidArrivalDate, setInvalidArrivalDate] = useState(false);
  const [invalidStopDates, setInvalidStopDates] = useState<number[]>([]); // stop indexes

  // Mobile datetime picker (single shared)
  const [activePicker, setActivePicker] = useState<{
    type:
      | 'departureDate'
      | 'departureTime'
      | 'arrivalDate'
      | 'arrivalTime'
      | 'stopDate'
      | 'stopTime'
      | null;
    stopIndex?: number;
  }>({ type: null });

  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempTime, setTempTime] = useState<Date>(new Date());

  // -----------------------
  // Stops handlers
  // -----------------------
  const addStop = () => {
    setTripData((prev) => ({
      ...prev,
      stops: [...prev.stops, { address: '', dateTime: '' }],
    }));
  };

  const updateStopAddress = (index: number, value: string) => {
    setTripData((prev) => {
      const updated = [...prev.stops];
      updated[index] = { ...updated[index], address: value };
      return { ...prev, stops: updated };
    });
  };

  const updateStopDateTime = (index: number, value: string) => {
    setTripData((prev) => {
      const updated = [...prev.stops];
      updated[index] = { ...updated[index], dateTime: value };
      return { ...prev, stops: updated };
    });

    setInvalidStopDates((prev) => prev.filter((i) => i !== index));
  };

  const removeStop = (index: number) => {
    setTripData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
    setInvalidStopDates((prev) => prev.filter((i) => i !== index));
  };

  // -----------------------
  // Date/time formatting
  // -----------------------
  const formatDateTime = (date: Date, time: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = '00';
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const openDatePicker = (type: typeof activePicker.type, stopIndex?: number) => {
    setActivePicker({ type, stopIndex });
  };

  const closePicker = () => setActivePicker({ type: null });

  const updateDateTimeField = (target: 'departure' | 'arrival' | 'stop', stopIndex?: number) => {
    const dt = formatDateTime(tempDate, tempTime);

    if (target === 'departure') {
      setTripData((prev) => ({ ...prev, departureDateTime: dt }));
      setInvalidDepartureDate(false);
      return;
    }

    if (target === 'arrival') {
      setTripData((prev) => ({ ...prev, arrivalDateTime: dt }));
      setInvalidArrivalDate(false);
      return;
    }

    if (target === 'stop' && typeof stopIndex === 'number') {
      updateStopDateTime(stopIndex, dt);
    }
  };

  // -----------------------
  // Summary helpers
  // -----------------------
  const stopsSummary = useMemo(() => {
    const names = tripData.stops
      .map((s) => s.address?.trim())
      .filter((s) => !!s) as string[];

    return names.length ? names.join(', ') : 'No stops';
  }, [tripData.stops]);

  // -----------------------
  // Navigation (validation)
  // -----------------------
  const handleNext = () => {
    // reset errors each step try
    setInvalidDepartureDate(false);
    setInvalidArrivalDate(false);

    if (step === 1) {
      if (!tripData.startAddress.trim()) {
        Toast.show({ type: 'error', text1: 'Veuillez insérer une adresse de départ' });
        return;
      }

      if (!tripData.departureDateTime.trim()) {
        setInvalidDepartureDate(true);
        Toast.show({ type: 'error', text1: 'Veuillez saisir la date' });
        return;
      }

      if (!tripData.endAddress.trim()) {
        Toast.show({ type: 'error', text1: "Veuillez saisir l'adresse d'arrivée" });
        return;
      }

      if (!tripData.arrivalDateTime.trim()) {
        setInvalidArrivalDate(true);
        Toast.show({ type: 'error', text1: 'Veuillez saisir la date' });
        return;
      }

      //  validate stops: if address filled => date required
      const invalidIndexes = tripData.stops
        .map((s, i) => ({ ...s, i }))
        .filter((s) => s.address.trim() !== '' && (!s.dateTime || s.dateTime.trim() === ''))
        .map((s) => s.i);

      if (invalidIndexes.length > 0) {
        setInvalidStopDates(invalidIndexes);
        Toast.show({ type: 'error', text1: 'Veuillez saisir la date' });
        return;
      }

      setInvalidStopDates([]);
    }

    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const progress = (step / TOTAL_STEPS) * 100;

  // -----------------------
  // Submit
  // -----------------------
  const handleSubmit = async () => {
    console.log('🔴🔴🔴 [ADD-TRIP] handleSubmit CALLED');
    console.log('Trip data before submit:', tripData);

    try {
      // reset UI errors
      setInvalidDepartureDate(false);
      setInvalidArrivalDate(false);

      if (!tripData.startAddress.trim() || !tripData.endAddress.trim()) {
        Toast.show({ type: 'error', text1: 'Please set departure and arrival cities' });
        return;
      }

      if (!tripData.departureDateTime.trim()) {
        setInvalidDepartureDate(true);
        Toast.show({ type: 'error', text1: 'Veuillez saisir la date' });
        return;
      }

      if (!tripData.arrivalDateTime.trim()) {
        setInvalidArrivalDate(true);
        Toast.show({ type: 'error', text1: 'Veuillez saisir la date' });
        return;
      }

      //  Validate stops again (required stop date if address exists)
      const invalidIndexes = tripData.stops
        .map((s, i) => ({ ...s, i }))
        .filter((s) => s.address.trim() !== '' && (!s.dateTime || s.dateTime.trim() === ''))
        .map((s) => s.i);

      if (invalidIndexes.length > 0) {
        setInvalidStopDates(invalidIndexes);
        Toast.show({ type: 'error', text1: 'Veuillez saisir la date' });
        return;
      }

      if (!tripData.availableWeight || !tripData.pricePerKg) {
        Toast.show({ type: 'error', text1: 'Please set capacity and pricing' });
        return;
      }

      const weight = parseFloat(tripData.availableWeight);
      const price = parseFloat(tripData.pricePerKg);

      if (isNaN(weight) || weight <= 0) {
        Toast.show({ type: 'error', text1: 'Please enter a valid weight' });
        return;
      }

      if (isNaN(price) || price <= 0) {
        Toast.show({ type: 'error', text1: 'Please enter a valid price' });
        return;
      }

      setLoading(true);

      const transporterId = await getUserId();
      if (!transporterId) {
        throw new Error('Transporter ID not found. Please login again.');
      }

      const transporterIdNum =
        typeof transporterId === 'string' ? parseInt(transporterId, 10) : transporterId;

      const convertToISO = (dateTimeStr: string): string => {
        if (!dateTimeStr || dateTimeStr.trim() === '') return '';
        const trimmed = dateTimeStr.trim();

        // already perfect ISO localdatetime
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;

        //  "YYYY-MM-DD HH:MM"
        if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(trimmed)) {
          return trimmed.replace(' ', 'T') + ':00';
        }

        //  "YYYY-MM-DDTHH:MM"
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
          return trimmed + ':00';
        }

        //  "YYYY-MM-DD" (date only) -> default time 00:00:00
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return `${trimmed}T00:00:00`;
        }

        //  accept "YYYY-M-D" too
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
          const [y, m, d] = trimmed.split('-');
          const mm = m.padStart(2, '0');
          const dd = d.padStart(2, '0');
          return `${y}-${mm}-${dd}T00:00:00`;
        }

        throw new Error(`Invalid datetime format: ${trimmed}. Expected: YYYY-MM-DD HH:MM`);
      };

      const createTripRequest = {
        transporterId: transporterIdNum,
        totalCapacityKg: weight,
        departureCity: tripData.startAddress,
        arrivalCity: tripData.endAddress,
        departureTime: convertToISO(tripData.departureDateTime),
        arrivalTime: convertToISO(tripData.arrivalDateTime),
        pricePerKg: price,

        //  collection stops (stopTime REQUIRED if address exists)
        collectionStops: tripData.stops
          .filter((s) => s.address.trim() !== '')
          .map((s) => ({
            city: s.address,
            fullAddress: s.address,
            stopTime: convertToISO(s.dateTime || ''),
          })),

        deliveryStops: [],
      };

      console.log('[ADD-TRIP] Payload:', JSON.stringify(createTripRequest, null, 2));

      const createdTrip = await createTrip(createTripRequest);

      console.log('[ADD-TRIP]  Trip created successfully:', createdTrip);

      Toast.show({
        type: 'success',
        text1: 'Le trajet a été créé avec succès',
      });

      setTimeout(() => {
        router.replace('/(transporter)/dashboard' as any);
      }, 800);
    } catch (error: any) {
      console.error('[ADD-TRIP] ❌ Failed:', error);
      Alert.alert('Error', error.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Trip</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressContent}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressStep}>
              Step {step} of {TOTAL_STEPS}
            </Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}% Complete</Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
        {/* Step 1 */}
        {step === 1 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Route & Waypoints</Text>
              <Text style={styles.cardDescription}>
                Define your route and choose dates/times (required for start/end).
              </Text>
            </View>

            <View style={styles.cardContent}>
              {/* Start Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Starting Address (Collection)</Text>

                <View style={styles.row}>
                  <View style={[styles.inputWrapper, styles.flex1]}>
                    <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Tunis, Tunisia"
                      placeholderTextColor="#9CA3AF"
                      value={tripData.startAddress}
                      onChangeText={(text) => setTripData((prev) => ({ ...prev, startAddress: text }))}
                    />
                  </View>

                  {/* departure */}
                  {Platform.OS === 'web' ? (
                    <View
                      style={[
                        styles.inputWrapper,
                        styles.dateFieldWeb,
                        invalidDepartureDate && styles.inputErrorBorder,
                      ]}
                    >
                      <Feather name="calendar" size={16} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Departure: YYYY-MM-DD HH:MM"
                        placeholderTextColor="#9CA3AF"
                        value={tripData.departureDateTime}
                        onChangeText={(text) => {
                          setTripData((prev) => ({ ...prev, departureDateTime: text }));
                          if (text.trim()) setInvalidDepartureDate(false);
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.iconButton, invalidDepartureDate && styles.inputErrorBorder]}
                      onPress={() => {
                        setTempDate(new Date());
                        setTempTime(new Date());
                        openDatePicker('departureDate');
                      }}
                      activeOpacity={0.8}
                    >
                      <Feather name="calendar" size={18} color="#2563EB" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* ❌ removed red requiredHint line */}
                {tripData.departureDateTime ? (
                  <Text style={styles.smallInfo}>Departure: {tripData.departureDateTime}</Text>
                ) : null}
              </View>

              {/* Arrival Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Arrival Address (Delivery)</Text>

                <View style={styles.row}>
                  <View style={[styles.inputWrapper, styles.flex1]}>
                    <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Paris, France"
                      placeholderTextColor="#9CA3AF"
                      value={tripData.endAddress}
                      onChangeText={(text) => setTripData((prev) => ({ ...prev, endAddress: text }))}
                    />
                  </View>

                  {/* arrival */}
                  {Platform.OS === 'web' ? (
                    <View
                      style={[
                        styles.inputWrapper,
                        styles.dateFieldWeb,
                        invalidArrivalDate && styles.inputErrorBorder,
                      ]}
                    >
                      <Feather name="calendar" size={16} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Arrival: YYYY-MM-DD HH:MM"
                        placeholderTextColor="#9CA3AF"
                        value={tripData.arrivalDateTime}
                        onChangeText={(text) => {
                          setTripData((prev) => ({ ...prev, arrivalDateTime: text }));
                          if (text.trim()) setInvalidArrivalDate(false);
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.iconButton, invalidArrivalDate && styles.inputErrorBorder]}
                      onPress={() => {
                        setTempDate(new Date());
                        setTempTime(new Date());
                        openDatePicker('arrivalDate');
                      }}
                      activeOpacity={0.8}
                    >
                      <Feather name="calendar" size={18} color="#2563EB" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* ❌ removed red requiredHint line */}
                {tripData.arrivalDateTime ? (
                  <Text style={styles.smallInfo}>Arrival: {tripData.arrivalDateTime}</Text>
                ) : null}
              </View>

              {/* Stops */}
              <View style={styles.stopsSection}>
                <View style={styles.stopsHeader}>
                  <Text style={styles.label}>Middle Points / Stops</Text>
                  <TouchableOpacity style={styles.addStopButton} onPress={addStop}>
                    <Feather name="plus" size={16} color="#2563EB" style={styles.addIcon} />
                    <Text style={styles.addStopText}>Add Stop</Text>
                  </TouchableOpacity>
                </View>

                {tripData.stops.length === 0 && (
                  <Text style={styles.helperText}>No stops added (optional).</Text>
                )}

                {tripData.stops.map((stop, index) => (
                  <View key={index} style={styles.stopBlock}>
                    <View style={styles.stopRow}>
                      <View style={[styles.inputWrapper, styles.flex1]}>
                        <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder={`Stop ${index + 1}`}
                          placeholderTextColor="#9CA3AF"
                          value={stop.address}
                          onChangeText={(text) => updateStopAddress(index, text)}
                        />
                      </View>

                      {/* stop time */}
                      {Platform.OS === 'web' ? (
                        <View
                          style={[
                            styles.inputWrapper,
                            styles.dateFieldWebStop,
                            invalidStopDates.includes(index) && styles.inputErrorBorder,
                          ]}
                        >
                          <Feather name="calendar" size={16} color="#6B7280" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Stop time: YYYY-MM-DD HH:MM"
                            placeholderTextColor="#9CA3AF"
                            value={stop.dateTime || ''}
                            onChangeText={(text) => updateStopDateTime(index, text)}
                          />
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.iconButton, invalidStopDates.includes(index) && styles.inputErrorBorder]}
                          onPress={() => {
                            setTempDate(new Date());
                            setTempTime(new Date());
                            openDatePicker('stopDate', index);
                          }}
                          activeOpacity={0.8}
                        >
                          <Feather name="calendar" size={18} color="#2563EB" />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity onPress={() => removeStop(index)} activeOpacity={0.8}>
                        <Feather name="x" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Capacity & Pricing</Text>
              <Text style={styles.cardDescription}>Set your pricing and review trip details</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Available Weight (Kg)</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="package" size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 300"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={tripData.availableWeight}
                    onChangeText={(text) => setTripData((prev) => ({ ...prev, availableWeight: text }))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price per Kg (€)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 45"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={tripData.pricePerKg}
                  onChangeText={(text) => setTripData((prev) => ({ ...prev, pricePerKg: text }))}
                />
              </View>

              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Trip Summary</Text>

                <View style={styles.summaryContent}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Route</Text>
                    <Text style={styles.summaryValue}>
                      {tripData.startAddress || 'Not set'} → {tripData.endAddress || 'Not set'}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Stops</Text>
                    <Text style={styles.summaryValue}>{stopsSummary}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Departure</Text>
                    <Text style={styles.summaryValue}>{tripData.departureDateTime || 'Not set'}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Arrival</Text>
                    <Text style={styles.summaryValue}>{tripData.arrivalDateTime || 'Not set'}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Capacity</Text>
                    <Text style={styles.summaryValue}>{tripData.availableWeight || '0'} kg</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Price</Text>
                    <Text style={styles.summaryPrice}>€{tripData.pricePerKg || '0'}/kg</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          {step > 1 && (
            <TouchableOpacity style={styles.backNavButton} onPress={handleBack} activeOpacity={0.8}>
              <Feather name="arrow-left" size={16} color="#2563EB" style={styles.navIcon} />
              <Text style={styles.backNavText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              style={[styles.nextButton, step === 1 && styles.fullWidth]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" style={styles.navIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, styles.fullWidth, loading && styles.disabledButton]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.nextButtonText}>Publish Trip</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* MOBILE PICKER */}
      {Platform.OS !== 'web' && activePicker.type && (
        <>
          {(activePicker.type === 'departureDate' ||
            activePicker.type === 'arrivalDate' ||
            activePicker.type === 'stopDate') && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event: any, selected?: Date) => {
                if (selected) setTempDate(selected);

                if (activePicker.type === 'departureDate') openDatePicker('departureTime');
                if (activePicker.type === 'arrivalDate') openDatePicker('arrivalTime');
                if (activePicker.type === 'stopDate') openDatePicker('stopTime', activePicker.stopIndex);
              }}
            />
          )}

          {(activePicker.type === 'departureTime' ||
            activePicker.type === 'arrivalTime' ||
            activePicker.type === 'stopTime') && (
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="default"
              onChange={(event: any, selected?: Date) => {
                closePicker();
                if (selected) setTempTime(selected);

                if (activePicker.type === 'departureTime') updateDateTimeField('departure');
                if (activePicker.type === 'arrivalTime') updateDateTimeField('arrival');
                if (activePicker.type === 'stopTime') updateDateTimeField('stop', activePicker.stopIndex);
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

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
      android: { elevation: 4 },
    }),
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },

  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressContent: { padding: 16 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressStep: { fontSize: 14, fontWeight: '500', color: '#111827' },
  progressPercent: { fontSize: 14, color: '#6B7280' },
  progressBar: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563EB' },

  main: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { padding: 24, paddingBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#6B7280' },
  cardContent: { padding: 24, paddingTop: 12 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex1: { flex: 1 },

  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

  dateFieldWeb: { width: 310 },
  dateFieldWebStop: { width: 360 },

  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  //  red border style
  inputErrorBorder: {
    borderColor: '#DC2626',
    borderWidth: 1,
  },

  smallInfo: { fontSize: 12, marginTop: 6, color: '#6B7280' },

  stopsSection: { marginTop: 8 },
  stopsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
  },
  addIcon: { marginRight: 4 },
  addStopText: { fontSize: 14, color: '#2563EB', fontWeight: '500' },

  helperText: { fontSize: 13, color: '#6B7280' },

  stopBlock: { marginBottom: 12 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  summary: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16, marginTop: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  summaryContent: { gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  summaryPrice: { fontSize: 14, fontWeight: '500', color: '#2563EB' },

  navigation: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backNavButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2563EB',
    height: 48,
    borderRadius: 8,
  },
  backNavText: { color: '#2563EB', fontSize: 16, fontWeight: '600' },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 8,
  },
  fullWidth: { flex: 1 },
  disabledButton: { opacity: 0.6 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  navIcon: { marginHorizontal: 8 },
});
