import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { fetchUserProfile } from '../services/user';
import { useAuth } from '../../scripts/context/AuthContext';

export default function SenderProfileScreen() {
    const router = useRouter();
    const { logout, userId, role } = useAuth();

    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
    });

    useEffect(() => {
        loadUserInfo();
    }, []);
    const loadUserInfo = async () => {
        if (!userId) {
            console.error('[PROFILE] No userId found');
            setLoading(false);
            return;
            }

        if (!userId) {
            console.error('[PROFILE] No userId found in storage');
            setLoading(false);
            return;
        }

        try {
            console.log('[PROFILE] Loading user data for ID:', userId);
            const userData = await fetchUserProfile(userId);

            setUserInfo({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone || '',
                role: role,
            });
        } catch (error) {
            console.error('[PROFILE] Failed to load user data:', error);
            Alert.alert('Error', 'Could not load profile data');
        } finally {
            setLoading(false);
        }
    };

   const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as any);
};


    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Feather name="user" size={48} color="#FFFFFF" />
                </View>
                <Text style={styles.title}>Sender Profile</Text>
                <Text style={styles.subtitle}>Manage your account</Text>
            </View>

            {/* Profile Info Card */}
            <View style={styles.card}>
                <View style={styles.infoRow}>
                    <Feather name="user" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>First Name</Text>
                        <Text style={styles.infoValue}>{userInfo.firstName || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Feather name="user" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Last Name</Text>
                        <Text style={styles.infoValue}>{userInfo.lastName || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Feather name="mail" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{userInfo.email || 'N/A'}</Text>
                    </View>
                </View>

                {userInfo.phone && (
                    <View style={styles.infoRow}>
                        <Feather name="phone" size={20} color="#6B7280" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>{userInfo.phone}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <Feather name="briefcase" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Role</Text>
                        <Text style={styles.infoValue}>{userInfo.role}</Text>
                    </View>
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Feather name="log-out" size={20} color="#FFFFFF" />
                <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>

            {/* App Info */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Tunisia-France Link</Text>
                <Text style={styles.footerText}>Version 1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    avatarContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: '#DC2626',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
    },
});
