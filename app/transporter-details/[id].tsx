import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiClient } from '../services/backService';
import { getToken } from '../utils/tokenStorage';

export default function TransporterProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [userInfo, setUserInfo] = useState<any>(null);

    useEffect(() => {
        loadTransporterData();
    }, [id]);

    const loadTransporterData = async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const userResponse = await apiClient.get(`/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserInfo(userResponse.data);

            const profileResponse = await apiClient.get(`/catalog/transporters/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProfile(profileResponse.data);
        } catch (error) {
            console.error('[TRANSPORTER-PROFILE] Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    const displayName = profile?.displayName || 'Unknown';
    const initials = displayName
        ? displayName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
        : '?';

    const imageUrl = userInfo?.imageUrl || null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transporter Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileCard}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                        )}
                    </View>

                    {/* Name */}
                    <Text style={styles.profileName}>{displayName}</Text>

                    {/* Bio */}
                    <Text style={styles.profileBio}>
                        {profile?.bio || 'No bio provided'}
                    </Text>

                    {/* License Plate */}
                    <View style={styles.licenseContainer}>
                        <Feather name="truck" size={16} color="#2563EB" />
                        <Text style={styles.licenseText}>
                            {profile?.licensePlate || 'No license plate'}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* 🔥 FIXED BOTTOM BUTTONS */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookText}>Book</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.whatsappButton}>
                    <Text style={styles.whatsappText}>WhatsApp</Text>
                </TouchableOpacity>
            </View>
        </View>
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
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    header: {
        backgroundColor: '#2563EB',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    avatarPlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    profileBio: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    licenseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    licenseText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },

    //  BOTTOM BAR
    bottomBar: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },

    bookButton: {
        flex: 1,
        backgroundColor: '#2563EB',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },

    bookText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    whatsappButton: {
        flex: 1,
        backgroundColor: '#25D366',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },

    whatsappText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});