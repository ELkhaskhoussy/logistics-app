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

    const handleSignUp = async () => {
        console.log('🔵 [SENDER-REG] handleSignUp called! FormData:', formData);

        // Validate required fields
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            console.log('❌ [SENDER-REG] Validation failed: missing fields');
            Alert.alert('Error', 'Please fill in all fields!');
            return;
        }

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            console.log('❌ [SENDER-REG] Validation failed: passwords do not match');
            Alert.alert('Error', 'Passwords do not match!');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            console.log('❌ [SENDER-REG] Validation failed: password too short');
            Alert.alert('Error', 'Password must be at least 6 characters!');
            return;
        }

        setLoading(true);
        try {
            // Split name into firstName and lastName for backend
            const nameParts = formData.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last name if only one word

            console.log('✅ [SENDER-REG] Validation passed, calling registerUser...');
            console.log('📝 [SENDER-REG] Data to send:', { firstName, lastName, email: formData.email, role: 'SENDER' });

            const response = await registerUser({
                firstName,
                lastName,
                email: formData.email,
                password: formData.password,
                role: 'SENDER', // Backend expects uppercase
                phone: formData.phone, // Include phone even though backend doesn't use it yet
            });


            console.log('✅ [SENDER-REG] Registration successful:', response);

            // Save auth data (auto-login)
            await saveAuthData(
                response.token,
                response.userRole,
                response.userId
            );

            console.log('✅ [SENDER-REG] Auto-login complete, navigating to search...');

            // Navigate directly to sender home screen
            router.replace('/(sender)/search' as any);
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
                            <Feather name="package" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.title}>Sender Registration</Text>
                        <Text style={styles.description}>Create your sender account</Text>
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

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign Up Button */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogleSignUp}
                            activeOpacity={0.8}
                        >
                            <Feather name="chrome" size={16} color="#374151" style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>Sign up with Google</Text>
                        </TouchableOpacity>

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
});
