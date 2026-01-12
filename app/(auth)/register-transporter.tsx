import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { registerUser } from '../services/auth';
import { saveAuthData } from '../utils/tokenStorage';

const VEHICLE_TYPES = [
    { label: 'Van', value: 'van' },
    { label: 'Truck', value: 'truck' },
    { label: 'Semi-Truck', value: 'semi-truck' },
    { label: 'Car', value: 'car' },
];

export default function RegisterTransporterScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        vehicleType: '',
        licensePlate: '',
        password: '',
        confirmPassword: '',
    });
    const [showVehiclePicker, setShowVehiclePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        // Validate required fields
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            Alert.alert('Error', 'Please fill in all fields!');
            return;
        }

        // Validate vehicle type selected
        if (!formData.vehicleType) {
            Alert.alert('Error', 'Please select a vehicle type!');
            return;
        }

        // Validate license plate
        if (!formData.licensePlate) {
            Alert.alert('Error', 'Please enter your license plate!');
            return;
        }

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match!');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters!');
            return;
        }

        setLoading(true);
        try {
            // Split name into firstName and lastName for backend
            const nameParts = formData.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last name if only one word

            const response = await registerUser({
                firstName,
                lastName,
                email: formData.email,
                password: formData.password,
                role: 'TRANSPORTER', // Backend expects uppercase
                phone: formData.phone, // Include phone even though backend doesn't use it yet
                vehicleType: formData.vehicleType, // TODO: May need separate endpoint for transporter details
                licensePlate: formData.licensePlate, // TODO: May need separate endpoint for transporter details
            });


            console.log('✅ [TRANSPORTER-REG] Registration successful:', response);

            // Save auth data (auto-login)
            await saveAuthData(
                response.token,
                response.userRole,
                response.userId
            );

            console.log('✅ [TRANSPORTER-REG] Auto-login complete');

            // Create default transporter profile
            try {
                const { createTransporterProfile } = require('../services/trip');
                await createTransporterProfile(response.userId, {
                    displayName: `${firstName} ${lastName}`,
                    bio: '',
                    pricingPerKg: 0,
                });
                console.log('✅ [TRANSPORTER-REG] Transporter profile created');
            } catch (profileError) {
                console.error('⚠️ [TRANSPORTER-REG] Failed to create transporter profile:', profileError);
                // Don't block login if profile creation fails
            }

            console.log('✅ [TRANSPORTER-REG] Navigating to dashboard...');

            // Navigate directly to transporter home screen
            router.replace('/(transporter)/dashboard' as any);
        } catch (error: any) {
            console.error('Registration failed:', error);
            Alert.alert('Registration Failed', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = () => {
        console.log('Google Sign Up pressed');
        // TODO: Implement Google OAuth
    };

    const selectVehicleType = (value: string) => {
        setFormData({ ...formData, vehicleType: value });
        setShowVehiclePicker(false);
    };

    const getVehicleTypeLabel = () => {
        const selected = VEHICLE_TYPES.find((v) => v.value === formData.vehicleType);
        return selected ? selected.label : 'Select vehicle type';
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    {/* Logo/Icon Section */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Feather name="truck" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.title}>Transporter Registration</Text>
                        <Text style={styles.description}>Create your transporter account</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.content}>
                        <View style={styles.form}>
                            {/* Full Name Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                />
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.email}
                                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>

                            {/* Phone Number Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+216 XX XXX XXX"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                    keyboardType="phone-pad"
                                    autoComplete="tel"
                                />
                            </View>

                            {/* Vehicle Type Picker */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Vehicle Type</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => setShowVehiclePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.pickerButtonText,
                                            !formData.vehicleType && styles.placeholderText,
                                        ]}
                                    >
                                        {getVehicleTypeLabel()}
                                    </Text>
                                    <Feather name="chevron-down" size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            {/* License Plate Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>License Plate</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="123 TUN 4567"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.licensePlate}
                                    onChangeText={(text) => setFormData({ ...formData, licensePlate: text })}
                                    autoCapitalize="characters"
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.password}
                                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password"
                                />
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password"
                                />
                            </View>

                            {/* Create Account Button */}
                            <TouchableOpacity
                                style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                                onPress={handleSignUp}
                                activeOpacity={0.8}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.signUpButtonText}>Create Account</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Sign In Link */}
                        <View style={styles.signInContainer}>
                            <Link href="/login" asChild>
                                <TouchableOpacity activeOpacity={0.7}>
                                    <Text style={styles.signInText}>
                                        Already have an account? <Text style={styles.signInLink}>Sign in</Text>
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Vehicle Type Picker Modal */}
            <Modal
                visible={showVehiclePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowVehiclePicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowVehiclePicker(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Vehicle Type</Text>
                            <TouchableOpacity onPress={() => setShowVehiclePicker(false)}>
                                <Feather name="x" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        {VEHICLE_TYPES.map((vehicle) => (
                            <TouchableOpacity
                                key={vehicle.value}
                                style={[
                                    styles.modalOption,
                                    formData.vehicleType === vehicle.value && styles.selectedOption,
                                ]}
                                onPress={() => selectVehicleType(vehicle.value)}
                            >
                                <Text
                                    style={[
                                        styles.modalOptionText,
                                        formData.vehicleType === vehicle.value && styles.selectedOptionText,
                                    ]}
                                >
                                    {vehicle.label}
                                </Text>
                                {formData.vehicleType === vehicle.value && (
                                    <Feather name="check" size={20} color="#2563EB" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        maxWidth: 448,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 8,
        alignItems: 'center',
    },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    content: {
        padding: 24,
    },
    form: {
        gap: 16,
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
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#111827',
    },
    pickerButton: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#111827',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    signUpButton: {
        backgroundColor: '#2563EB',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    signUpButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.7,
    },
    signUpButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        paddingHorizontal: 8,
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    googleIcon: {
        marginRight: 8,
    },
    googleButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '500',
    },
    signInContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    signInText: {
        fontSize: 14,
        color: '#6B7280',
    },
    signInLink: {
        color: '#2563EB',
        fontWeight: '500',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        width: '85%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedOption: {
        backgroundColor: '#EFF6FF',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#111827',
    },
    selectedOptionText: {
        color: '#2563EB',
        fontWeight: '600',
    },
});
