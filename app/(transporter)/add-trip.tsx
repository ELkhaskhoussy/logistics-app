import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import Toast from "react-native-toast-message";

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

export default function AddTripScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [tripData, setTripData] = useState({
        startAddress: '',
        endAddress: '',
        stops: [''],
        departureDateTime: '',
        arrivalDateTime: '',
        availableWeight: '',
        pricePerKg: '',
    });

    // Date picker states
    const [showDepartureDatePicker, setShowDepartureDatePicker] = useState(false);
    const [showDepartureTimePicker, setShowDepartureTimePicker] = useState(false);
    const [showArrivalDatePicker, setShowArrivalDatePicker] = useState(false);
    const [showArrivalTimePicker, setShowArrivalTimePicker] = useState(false);
    const [departureDate, setDepartureDate] = useState(new Date());
    const [departureTime, setDepartureTime] = useState(new Date());
    const [arrivalDate, setArrivalDate] = useState(new Date());
    const [arrivalTime, setArrivalTime] = useState(new Date());

    const addStop = () => {
        setTripData({ ...tripData, stops: [...tripData.stops, ''] });
    };

    const updateStop = (index: number, value: string) => {
        const newStops = [...tripData.stops];
        newStops[index] = value;
        setTripData({ ...tripData, stops: newStops });
    };

    const removeStop = (index: number) => {
        const newStops = tripData.stops.filter((_, i) => i !== index);
        setTripData({ ...tripData, stops: newStops });
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    // Date picker handlers
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTime = (date: Date): string => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const formatDateTime = (date: Date, time: Date): string => {
        // ISO 8601 format: YYYY-MM-DDTHH:MM:SS (required by java.time.LocalDateTime)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(time.getHours()).padStart(2, '0');
        const minutes = String(time.getMinutes()).padStart(2, '0');
        const seconds = '00'; // Default to 00 seconds
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const onDepartureDateChange = (event: any, selectedDate?: Date) => {
        setShowDepartureDatePicker(false);
        if (selectedDate) {
            setDepartureDate(selectedDate);
            setTripData({
                ...tripData,
                departureDateTime: formatDateTime(selectedDate, departureTime)
            });
        }
    };

    const onDepartureTimeChange = (event: any, selectedTime?: Date) => {
        setShowDepartureTimePicker(false);
        if (selectedTime) {
            setDepartureTime(selectedTime);
            setTripData({
                ...tripData,
                departureDateTime: formatDateTime(departureDate, selectedTime)
            });
        }
    };

    const onArrivalDateChange = (event: any, selectedDate?: Date) => {
        setShowArrivalDatePicker(false);
        if (selectedDate) {
            setArrivalDate(selectedDate);
            setTripData({
                ...tripData,
                arrivalDateTime: formatDateTime(selectedDate, arrivalTime)
            });
        }
    };

    const onArrivalTimeChange = (event: any, selectedTime?: Date) => {
        setShowArrivalTimePicker(false);
        if (selectedTime) {
            setArrivalTime(selectedTime);
            setTripData({
                ...tripData,
                arrivalDateTime: formatDateTime(arrivalDate, selectedTime)
            });
        }
    };

    const handleSubmit = async () => {
        console.log('🔴🔴🔴 [ADD-TRIP] ========================================');
        console.log('🔴🔴🔴 [ADD-TRIP] PUBLISH TRIP BUTTON CLICKED!');
        console.log('🔴🔴🔴 [ADD-TRIP] handleSubmit function CALLED');
        console.log('🔴🔴🔴 [ADD-TRIP] ========================================');
        console.log('Trip data before submit:', tripData);

        try {
            console.log('✅ [ADD-TRIP] Step 1: Starting validation...');

            // Validation
            if (!tripData.startAddress || !tripData.endAddress) {
                console.log('❌ [ADD-TRIP] Validation failed: Missing addresses');
                Alert.alert('Error', 'Please fill in departure and arrival cities');
                return;
            }
            console.log('✅ [ADD-TRIP] Addresses validated');

            if (!tripData.departureDateTime || !tripData.arrivalDateTime) {
                console.log('❌ [ADD-TRIP] Validation failed: Missing dates');
                Alert.alert('Error', 'Please set departure and arrival times');
                return;
            }
            console.log('✅ [ADD-TRIP] Dates validated');

            if (!tripData.availableWeight || !tripData.pricePerKg) {
                console.log('❌ [ADD-TRIP] Validation failed: Missing weight/price');
                Alert.alert('Error', 'Please set capacity and pricing');
                return;
            }
            console.log('✅ [ADD-TRIP] Weight/price validated');

            // Validate numeric fields
            const weight = parseFloat(tripData.availableWeight);
            const price = parseFloat(tripData.pricePerKg);
            console.log('✅ [ADD-TRIP] Parsed weight:', weight, 'price:', price);

            if (isNaN(weight) || weight <= 0) {
                console.log('❌ [ADD-TRIP] Invalid weight:', weight);
                Alert.alert('Error', 'Please enter a valid weight');
                return;
            }

            if (isNaN(price) || price <= 0) {
                console.log('❌ [ADD-TRIP] Invalid price:', price);
                Alert.alert('Error', 'Please enter a valid price');
                return;
            }
            console.log('✅ [ADD-TRIP] All validation passed!');

            setLoading(true);
            console.log('✅ [ADD-TRIP] Step 2: Getting transporter ID...');

            // Get transporter ID
            const transporterId = await getUserId();
            console.log('[ADD-TRIP] Retrieved transporterId:', transporterId, 'Type:', typeof transporterId);

            if (!transporterId) {
                console.log('❌ [ADD-TRIP] No transporterId found!');
                throw new Error('Transporter ID not found. Please login again.');
            }

            // Ensure it's a number
            const transporterIdNum = typeof transporterId === 'string'
                ? parseInt(transporterId, 10)
                : transporterId;

            console.log('[ADD-TRIP] Converted transporterId:', transporterIdNum, 'Type:', typeof transporterIdNum);
            console.log('✅ [ADD-TRIP] Step 3: Preparing request...');

            // Convert datetime strings to ISO format with robust validation
            const convertToISO = (dateTimeStr: string): string => {
                console.log('[ADD-TRIP] Converting datetime:', dateTimeStr);

                if (!dateTimeStr || dateTimeStr.trim() === '') {
                    console.error('[ADD-TRIP] Empty datetime string!');
                    return '';
                }

                const trimmed = dateTimeStr.trim();

                // ✅ Already in perfect ISO format (YYYY-MM-DDTHH:MM:SS)
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
                    console.log('[ADD-TRIP] Already in ISO format:', trimmed);
                    return trimmed;
                }

                // ✅ "YYYY-MM-DD HH:MM"
                if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(trimmed)) {
                    const result = trimmed.replace(' ', 'T') + ':00';
                    console.log('[ADD-TRIP] Converted space-separated to ISO:', result);
                    return result;
                }

                // ✅ "YYYY-MM-DDTHH:MM"
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
                    const result = trimmed + ':00';
                    console.log('[ADD-TRIP] Added seconds:', result);
                    return result;
                }

                // ✅ VERY IMPORTANT: accept "YYYY-M-D" or "YYYY-MM-DD"
                // Example: "2026-1-20" => "2026-01-20T00:00:00"
                if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
                    const [y, m, d] = trimmed.split('-');
                    const mm = m.padStart(2, '0');
                    const dd = d.padStart(2, '0');
                    const result = `${y}-${mm}-${dd}T00:00:00`;
                    console.log('[ADD-TRIP] Date only detected, converted to ISO:', result);
                    return result;
                }

                console.error('[ADD-TRIP] Invalid datetime format:', trimmed);
                throw new Error(
                    `Invalid datetime format: ${trimmed}. Expected: YYYY-MM-DD HH:MM`
                );
            };

            console.log('[ADD-TRIP] Raw departure:', tripData.departureDateTime);
            console.log('[ADD-TRIP] Raw arrival:', tripData.arrivalDateTime);

            const departureDateTimeISO = convertToISO(tripData.departureDateTime);
            const arrivalDateTimeISO = convertToISO(tripData.arrivalDateTime);

            console.log('[ADD-TRIP] Converted departure:', departureDateTimeISO);
            console.log('[ADD-TRIP] Converted arrival:', arrivalDateTimeISO);

            // Map form data to backend DTO
            const createTripRequest = {
                transporterId: transporterIdNum,
                totalCapacityKg: weight,
                departureCity: tripData.startAddress,
                arrivalCity: tripData.endAddress,
                departureTime: departureDateTimeISO,  // Use converted ISO string
                arrivalTime: arrivalDateTimeISO,      // Use converted ISO string
                pricePerKg: price,
                collectionStops: [],
                deliveryStops: tripData.stops
                    .filter(stop => stop.trim() !== '')
                    .map(stop => ({
                        city: stop,
                        fullAddress: stop,
                    })),

            };

            console.log('[ADD-TRIP] ========== REQUEST DETAILS ==========');
            console.log('[ADD-TRIP] Transporter ID:', transporterId);
            console.log('[ADD-TRIP] Request payload:', JSON.stringify(createTripRequest, null, 2));
            console.log('[ADD-TRIP] =====================================');

            // Call backend API
            const createdTrip = await createTrip(createTripRequest);

            console.log('[ADD-TRIP] ✅ Trip created successfully:', createdTrip);

            // Show success message
            Toast.show({
                type: "success",
                text1: "Le trajet a été créé avec succès",
            });

            setTimeout(() => {
                router.replace("/(transporter)/dashboard" as any);
            }, 800);


        } catch (error: any) {
            console.error('[ADD-TRIP] ❌ Failed to create trip:', error);
            Alert.alert('Error', error.message || 'Failed to create trip');
        } finally {
            setLoading(false);
        }
    };

    const progress = (step / 3) * 100;

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
                    <Text style={styles.headerTitle}>Add New Trip</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressContent}>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressStep}>Step {step} of 3</Text>
                        <Text style={styles.progressPercent}>{Math.round(progress)}% Complete</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                </View>
            </View>

            <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
                {/* Step 1: Route & Waypoints */}
                {step === 1 && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Route & Waypoints</Text>
                            <Text style={styles.cardDescription}>
                                Define your trip route and any stops along the way
                            </Text>
                        </View>
                        <View style={styles.cardContent}>
                            {/* Start Address */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Starting Address (Collection)</Text>
                                <View style={styles.inputWrapper}>
                                    <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., Tunis, Tunisia"
                                        placeholderTextColor="#9CA3AF"
                                        value={tripData.startAddress}
                                        onChangeText={(text) => setTripData({ ...tripData, startAddress: text })}
                                    />
                                </View>
                            </View>

                            {/* End Address */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Arrival Address (Delivery)</Text>
                                <View style={styles.inputWrapper}>
                                    <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., Paris, France"
                                        placeholderTextColor="#9CA3AF"
                                        value={tripData.endAddress}
                                        onChangeText={(text) => setTripData({ ...tripData, endAddress: text })}
                                    />
                                </View>
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
                                {tripData.stops.map((stop, index) => (
                                    <View key={index} style={styles.stopRow}>
                                        <View style={[styles.inputWrapper, styles.stopInput]}>
                                            <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder={`Stop ${index + 1}`}
                                                placeholderTextColor="#9CA3AF"
                                                value={stop}
                                                onChangeText={(text) => updateStop(index, text)}
                                            />
                                        </View>
                                        <TouchableOpacity onPress={() => removeStop(index)}>
                                            <Feather name="x" size={20} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Step 2: Dates & Timing */}
                {step === 2 && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Dates & Timing</Text>
                            <Text style={styles.cardDescription}>Set your departure and arrival schedule</Text>
                        </View>
                        <View style={styles.cardContent}>
                            {/* Departure Date & Time */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Departure Date & Time</Text>
                                {Platform.OS === 'web' ? (
                                    <View style={styles.inputWrapper}>
                                        <Feather name="calendar" size={16} color="#6B7280" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="YYYY-MM-DD HH:MM"
                                            placeholderTextColor="#9CA3AF"
                                            value={tripData.departureDateTime}
                                            onChangeText={(text) => setTripData({ ...tripData, departureDateTime: text })}
                                        />
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.dateTimeRow}>
                                            <TouchableOpacity
                                                style={styles.dateTimeButton}
                                                onPress={() => setShowDepartureDatePicker(true)}
                                            >
                                                <Feather name="calendar" size={18} color="#2563EB" />
                                                <Text style={styles.dateTimeText}>
                                                    {formatDate(departureDate)}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.dateTimeButton}
                                                onPress={() => setShowDepartureTimePicker(true)}
                                            >
                                                <Feather name="clock" size={18} color="#2563EB" />
                                                <Text style={styles.dateTimeText}>
                                                    {formatTime(departureTime)}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                        {showDepartureDatePicker && (
                                            <DateTimePicker
                                                value={departureDate}
                                                mode="date"
                                                display="default"
                                                onChange={onDepartureDateChange}
                                                minimumDate={new Date()}
                                            />
                                        )}
                                        {showDepartureTimePicker && (
                                            <DateTimePicker
                                                value={departureTime}
                                                mode="time"
                                                display="default"
                                                onChange={onDepartureTimeChange}
                                            />
                                        )}
                                    </>
                                )}
                            </View>

                            {/* Arrival Date & Time */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Arrival Date & Time</Text>
                                {Platform.OS === 'web' ? (
                                    <View style={styles.inputWrapper}>
                                        <Feather name="calendar" size={16} color="#6B7280" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="YYYY-MM-DD HH:MM"
                                            placeholderTextColor="#9CA3AF"
                                            value={tripData.arrivalDateTime}
                                            onChangeText={(text) => setTripData({ ...tripData, arrivalDateTime: text })}
                                        />
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.dateTimeRow}>
                                            <TouchableOpacity
                                                style={styles.dateTimeButton}
                                                onPress={() => setShowArrivalDatePicker(true)}
                                            >
                                                <Feather name="calendar" size={18} color="#2563EB" />
                                                <Text style={styles.dateTimeText}>
                                                    {formatDate(arrivalDate)}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.dateTimeButton}
                                                onPress={() => setShowArrivalTimePicker(true)}
                                            >
                                                <Feather name="clock" size={18} color="#2563EB" />
                                                <Text style={styles.dateTimeText}>
                                                    {formatTime(arrivalTime)}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                        {showArrivalDatePicker && (
                                            <DateTimePicker
                                                value={arrivalDate}
                                                mode="date"
                                                display="default"
                                                onChange={onArrivalDateChange}
                                                minimumDate={new Date()}
                                            />
                                        )}
                                        {showArrivalTimePicker && (
                                            <DateTimePicker
                                                value={arrivalTime}
                                                mode="time"
                                                display="default"
                                                onChange={onArrivalTimeChange}
                                            />
                                        )}
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Step 3: Capacity & Pricing */}
                {step === 3 && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Capacity & Pricing</Text>
                            <Text style={styles.cardDescription}>Set your pricing and review trip details</Text>
                        </View>
                        <View style={styles.cardContent}>
                            {/* Available Weight */}
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
                                        onChangeText={(text) => setTripData({ ...tripData, availableWeight: text })}
                                    />
                                </View>
                            </View>

                            {/* Price per Kg */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Price per Kg (€)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., 45"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={tripData.pricePerKg}
                                    onChangeText={(text) => setTripData({ ...tripData, pricePerKg: text })}
                                />
                            </View>

                            {/* Trip Summary */}
                            <View style={styles.summary}>
                                <Text style={styles.summaryTitle}>Trip Summary</Text>
                                <View style={styles.summaryContent}>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Route</Text>
                                        <Text style={styles.summaryValue}>
                                            {tripData.startAddress || 'Not set'} → {tripData.endAddress || 'Not set'}
                                        </Text>
                                    </View>
                                    {tripData.stops.length > 0 && (
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>Stops</Text>
                                            <Text style={styles.summaryValue}>{tripData.stops.length}</Text>
                                        </View>
                                    )}
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Departure</Text>
                                        <Text style={styles.summaryValue}>
                                            {tripData.departureDateTime || 'Not set'}
                                        </Text>
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

                {/* Navigation Buttons */}
                <View style={styles.navigation}>
                    {step > 1 && (
                        <TouchableOpacity
                            style={styles.backNavButton}
                            onPress={handleBack}
                            activeOpacity={0.8}
                        >
                            <Feather name="arrow-left" size={16} color="#2563EB" style={styles.navIcon} />
                            <Text style={styles.backNavText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    {step < 3 ? (
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
    },
    // Progress Bar
    progressContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    progressContent: {
        padding: 16,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressStep: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    progressPercent: {
        fontSize: 14,
        color: '#6B7280',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#2563EB',
    },
    main: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
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
    cardHeader: {
        padding: 24,
        paddingBottom: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    cardContent: {
        padding: 24,
        paddingTop: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    inputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
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
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    dateTimeText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
        flex: 1,
    },
    stopsSection: {
        marginTop: 8,
    },
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
    addIcon: {
        marginRight: 4,
    },
    addStopText: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '500',
    },
    stopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    stopInput: {
        flex: 1,
    },
    // Summary
    summary: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 16,
        marginTop: 8,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    summaryContent: {
        gap: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    summaryPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2563EB',
    },
    // Navigation
    navigation: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
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
    backNavText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563EB',
        height: 48,
        borderRadius: 8,
    },
    fullWidth: {
        flex: 1,
    },
    disabledButton: {
        opacity: 0.6,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    navIcon: {
        marginHorizontal: 8,
    },
});
