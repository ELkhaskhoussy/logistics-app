import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
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

export default function RegisterSenderScreen() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(false);

    /**
     * Handles user signup:
     * - Validates inputs
     * - Transforms full name
     * - Calls API
     * - Stores auth data
     * - Redirects user
     */
    const handleSignUp = async () => {
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            Alert.alert('Error', 'Please fill in all fields!');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match!');
            return;
        }

        if (formData.password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters!');
            return;
        }

        setLoading(true);

        try {
            /**
             * Split full name into firstName and lastName
             */
            const nameParts = formData.name.trim().split(' ').filter(Boolean);
            const firstName = nameParts[0] || 'User';
            const lastName = nameParts.length > 1
                ? nameParts.slice(1).join(' ')
                : firstName;

            const response = await registerUser({
                firstName,
                lastName,
                email: formData.email,
                password: formData.password,
                role: 'SENDER',
                phone: formData.phone,
            });

            await saveAuthData(
                response.token,
                response.userRole,
                response.userId
            );

            router.replace('/(sender)/search' as any);

        } catch (error: any) {
            Alert.alert('Registration Failed', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = () => {};

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>

                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Feather name="package" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.title}>Sender Registration</Text>
                        <Text style={styles.description}>Create your sender account</Text>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.form}>

                            {/* Full Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                />
                            </View>

                            {/* Email */}
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
                                />
                            </View>

                            {/* Phone */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+216 XX XXX XXX"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.password}
                                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                                    secureTextEntry
                                />
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                                    secureTextEntry
                                />
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                                onPress={handleSignUp}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#FFFFFF" />
                                    : <Text style={styles.signUpButtonText}>Create Account</Text>
                                }
                            </TouchableOpacity>

                        </View>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Button */}
                        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp}>
                            <Feather name="chrome" size={16} color="#374151" />
                            <Text style={styles.googleButtonText}>Sign up with Google</Text>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.signInContainer}>
                            <Link href="/login" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.signInText}>
                                        Already have an account? <Text style={styles.signInLink}>Sign in</Text>
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        elevation: 4,
        maxWidth: 448,
        width: '100%',
        alignSelf: 'center',
    },

    header: { alignItems: 'center', padding: 24 },

    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    description: { fontSize: 14, color: '#6B7280' },

    content: { padding: 24 },
    form: { gap: 16 },
    inputGroup: { marginBottom: 12 },
    label: { fontSize: 14, color: '#374151' },

    /**
     * Updated input style:
     * - Softer background
     * - Light placeholder color
     * - Cleaner modern look
     */
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#F9FAFB',
    },

    signUpButton: {
        backgroundColor: '#2563EB',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    signUpButtonDisabled: { backgroundColor: '#9CA3AF' },
    signUpButtonText: { color: '#FFFFFF', fontWeight: '600' },

    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    dividerText: { marginHorizontal: 8, color: '#6B7280' },

    googleButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
    },

    googleButtonText: { marginLeft: 8, color: '#374151' },

    signInContainer: { marginTop: 16, alignItems: 'center' },
    signInText: { color: '#6B7280' },
    signInLink: { color: '#2563EB' },
});