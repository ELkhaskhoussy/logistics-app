import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
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

export default function VerifyCodeScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = typeof params.email === "string" ? params.email : "";

    const [code, setCode] = useState(['', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    const [cooldown, setCooldown] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [resending, setResending] = useState(false);

    const [expiry, setExpiry] = useState(240);

   const inputs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        if (cooldown === 0) {
            setCanResend(true);
            return;
        }
        const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    useEffect(() => {
        if (expiry === 0) return;
        const timer = setTimeout(() => setExpiry(expiry - 1), 1000);
        return () => clearTimeout(timer);
    }, [expiry]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const handleChange = (text: string, index: number) => {
        if (!/^\d?$/.test(text)) return;

        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        if (text && index < 4) {
            inputs.current[index + 1]?.focus();
        }

        if (!text && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join('');

        if (fullCode.length !== 5) {
            Alert.alert("Error", "Enter full code");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:8080/users/auth/verify-code",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, code: fullCode }),
                }
            );

            if (!response.ok) throw new Error("Invalid code");

            router.push({
                pathname: "/(auth)/reset-password",
                params: { email }
            });

        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend || resending) return;

        try {
            setResending(true);

            const res = await fetch(
                "http://localhost:8080/users/auth/resend-code",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            );

            if (!res.ok) throw new Error();

            Alert.alert("New code sent");

            setCooldown(30);
            setCanResend(false);
            setExpiry(240);

        } catch {
            Alert.alert("Failed to resend");
        } finally {
            setResending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>

                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Feather name="package" size={28} color="#fff" />
                        </View>
                        <Text style={styles.title}>Verify Code</Text>
                        <Text style={styles.description}>
                            Code expires in {formatTime(expiry)}
                        </Text>
                    </View>

                    <View style={styles.content}>

                        <View style={styles.codeContainer}>
                            {code.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => {
                                    inputs.current[index] = ref;
                                    }}
                                    style={styles.codeBox}
                                    value={digit}
                                    onChangeText={(text) => handleChange(text, index)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleVerify}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.buttonText}>Verify</Text>}
                        </TouchableOpacity>

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>
                                Didn’t receive the code?
                            </Text>

                            <TouchableOpacity
                                onPress={handleResend}
                                disabled={!canResend || resending}
                            >
                                {resending ? (
                                    <ActivityIndicator style={{ marginTop: 6 }} />
                                ) : (
                                    <Text style={[
                                        styles.resendLink,
                                        { color: canResend ? '#2563EB' : '#9CA3AF' }
                                    ]}>
                                        {canResend
                                            ? "Resend Code"
                                            : `Resend in ${cooldown}s`}
                                    </Text>
                                )}
                            </TouchableOpacity>
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
        maxWidth: 360,
        width: '100%',
        alignSelf: 'center',
        padding: 20,
    },

    header: {
        alignItems: 'center',
        marginBottom: 16,
    },

    logoContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },

    description: {
        fontSize: 13,
        color: '#6B7280',
    },

    content: {
        width: '100%',
    },

    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },

    codeBox: {
        width: 45,
        height: 45,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 18,
        backgroundColor: '#FFFFFF',
    },

    button: {
        backgroundColor: '#2563EB',
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    resendContainer: {
        alignItems: 'center',
        marginTop: 16,
    },

    resendText: {
        color: '#6B7280',
        fontSize: 13,
    },

    resendLink: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: '500',
    },
});