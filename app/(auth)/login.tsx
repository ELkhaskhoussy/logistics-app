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
<<<<<<< HEAD
import { loginUser } from '../services/auth';
import { saveAuthData } from '../utils/tokenStorage';
=======
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { useAuth } from '../../scripts/context/AuthContext';
import { authenticateWithGoogle, loginUser } from '../services/auth';
>>>>>>> ddf968e (fixing last rebase)

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
<<<<<<< HEAD
        console.log('🔵 [LOGIN] handleLogin called');

        // Validation
=======

>>>>>>> ddf968e (fixing last rebase)
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
<<<<<<< HEAD
        try {
            const response = await loginUser(email, password);

            // Save token and user data
            await saveAuthData(
                response.token,
                response.userRole,
                response.userId
            );

            console.log(' [LOGIN] Login successful, navigating to:', response.userRole);
=======

        try {
            const response = await loginUser(email, password);

            // Save auth data in AuthContext
            login(response);

            if (response.userRole === 'SENDER') {
                router.replace('/search');
            }

            if (response.userRole === 'TRANSPORTER') {
                router.replace('/dashboard');
            }

        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };
>>>>>>> ddf968e (fixing last rebase)

            // Role-based navigation
            if (response.userRole === 'SENDER') {
                router.replace('/(sender)/search' as any);
            } else if (response.userRole === 'TRANSPORTER') {
                router.replace('/(transporter)/dashboard' as any);
            } else {
                // Fallback
                Alert.alert('Success', 'Login successful');
            }
        } catch (error: any) {
            console.error('❌ [LOGIN] Login failed:', error);
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = () => {
        router.push('/(role-selection)' as any);

    };

<<<<<<< HEAD
    const handleGoogleSignIn = () => {
        console.log('Google Sign In pressed');
    };
=======
    const handleGoogleLogin = async () => {
        try {
            console.log('[LOGIN] 🔐 Starting Google login...');

            const result = await promptAsync();
            console.log('[LOGIN] 🔐 Prompt result:', result?.type);
            console.log('[LOGIN] 🔐 Full result:', result);

            if (result?.type !== "success") {
                console.log('[LOGIN] ⚠️ Google login cancelled or failed');
                return;
            }

            const idToken = result.params?.id_token;
            console.log('[LOGIN] 🔑 ID Token exists:', !!idToken);

            if (!idToken) {
                Alert.alert("Google login failed", "No ID token received");
                return;
            }

            console.log('[LOGIN] 📞 Calling backend /users/auth/google...');

            // Use authenticateWithGoogle service function
            try {
                const data = await authenticateWithGoogle(idToken);
                console.log('[LOGIN] ✅ Backend response:', data);

                // Check if user needs to select role (new user)
                if (data.needsRoleSelection) {
                    console.log('[LOGIN] 👤 New user - redirecting to role selection');

                    localStorage.setItem(
                        "googleUser",
                        JSON.stringify({
                            email: data.email,
                            firstName: data.firstName,
                            lastName: data.lastName,
                            imageUrl: data.imageUrl,
                        })
                    );

                    router.replace("/role-selection" as any);
                    return;
                }

                // Existing user - login and redirect
                if (data.token) {
                    console.log('[LOGIN] ✅ Logging in existing user');
                    login(data);

                    if (data.userRole === "SENDER") {
                        router.replace("/(sender)/search" as any);
                    } else if (data.userRole === "TRANSPORTER") {
                        router.replace("/(transporter)/dashboard" as any);
                    }
                }
            } catch (backendError: any) {
                console.error('[LOGIN] ❌ Backend API call failed:', backendError);
                console.error('[LOGIN] ❌ Error response:', backendError.response?.data);
                console.error('[LOGIN] ❌ Error status:', backendError.response?.status);
                throw new Error(backendError.response?.data?.message || backendError.message || "Backend authentication failed");
            }

        } catch (err: any) {
            console.error('[LOGIN] ❌ Google login error:', err);
            console.error('[LOGIN] ❌ Error stack:', err.stack);
            Alert.alert(
                "Google Login Failed",
                err.message || "An error occurred during Google login"
            );
        }
    };




>>>>>>> ddf968e (fixing last rebase)

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
                        <Text style={styles.title}>Tunisia-France Link</Text>
                        <Text style={styles.description}>Sign in to your account</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.content}>
                        <View style={styles.form}>
                            {/* Email Input */}
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
                                    autoComplete="email"
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password"
                                />
                            </View>

                            {/* Sign In Button */}
                            <TouchableOpacity
                                style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.signInButtonText}>Sign In</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign In Button */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogleSignIn}
                            activeOpacity={0.8}
                        >
                            <Feather name="chrome" size={16} color="#374151" style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>Sign in with Google</Text>
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <View style={styles.signUpContainer}>
                            <Link href="/(role-selection)" asChild>
                                <TouchableOpacity activeOpacity={0.7}>
                                    <Text style={styles.signUpText}>
                                        Don't have an account? <Text style={styles.signUpLink}>Sign up</Text>
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
    signInButton: {
        backgroundColor: '#2563EB',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    signInButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    signInButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.7,
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
    signUpContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    signUpText: {
        fontSize: 14,
        color: '#6B7280',
    },
    signUpLink: {
        color: '#2563EB',
        fontWeight: '500',
    },
});
