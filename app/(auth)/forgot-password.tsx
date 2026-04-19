import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:8080/users/auth/forgot-password",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to send code");
            }

            Alert.alert("Success", "Verification code sent to your email");

          
            router.push({
                pathname: "/verify-code",
                params: { email }
            });

        } catch (error: any) {
            Alert.alert("Error", error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Feather name="package" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.description}>
                            Enter your email to receive a verification code
                        </Text>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSendCode}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Send Code</Text>
                            )}
                        </TouchableOpacity>

                        {/* Back to Login */}
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.backText}>
                                Back to login
                            </Text>
                        </TouchableOpacity>

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
        fontSize: 22,
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

    inputGroup: {
        marginBottom: 20,
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

    button: {
        backgroundColor: '#2563EB',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    buttonDisabled: {
        backgroundColor: '#9CA3AF',
    },

    backText: {
        textAlign: 'center',
        marginTop: 16,
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '500',
    },
});