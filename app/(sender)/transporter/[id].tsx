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
import { apiClient } from '../../services/backService';
import { getToken } from '../../utils/tokenStorage';

// Mock reviews data (to be replaced with real data from backend)
const mockReviews = [
    {
        id: 1,
        author: 'Sarah M.',
        rating: 5,
        date: '2 days ago',
        comment: 'Great service! Package arrived on time and in perfect condition.',
    },
    {
        id: 2,
        author: 'Jean L.',
        rating: 5,
        date: '1 week ago',
        comment: 'Very professional and reliable. Highly recommended!',
    },
    {
        id: 3,
        author: 'Maria K.',
        rating: 4,
        date: '2 weeks ago',
        comment: 'Good communication throughout the journey. On time delivery.',
    },
    {
        id: 4,
        author: 'Pierre D.',
        rating: 5,
        date: '3 weeks ago',
        comment: 'Excellent driver, will use again for sure!',
    },
];

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

            // Fetch user info
            const userResponse = await apiClient.get(`/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserInfo(userResponse.data);

            // Fetch transporter profile
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

    const renderStars = (rating: number) => {
        return Array.from({ length: rating }).map((_, i) => (
            <Feather key={i} name="star" size={16} color="#FACC15" style={{ marginRight: 2 }} />
        ));
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    const fullName = userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : 'Unknown';
    const initials = userInfo ? `${userInfo.firstName?.[0] || ''}${userInfo.lastName?.[0] || ''}` : '?';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Feather name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transporter Profile</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Profile Header Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {userInfo?.profileImageUrl ? (
                            <Image
                                source={{ uri: userInfo.profileImageUrl }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.profileName}>{fullName}</Text>
                    <Text style={styles.profileBio}>
                        {profile?.bio || 'Professional transporter with 5 years of experience on the Tunisia-France route. Specializing in secure and timely deliveries.'}
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Feather name="star" size={20} color="#FACC15" />
                            <Text style={styles.statValue}>4.8</Text>
                        </View>
                        <Text style={styles.statLabel}>Average Rating</Text>
                        <Text style={styles.statSubLabel}>127 reviews</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Feather name="shield" size={20} color="#10B981" />
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedText}>Verified</Text>
                            </View>
                        </View>
                        <Text style={styles.statLabel}>Vehicle</Text>
                        <Text style={styles.statSubLabel}>Van • 123 TUN 4567</Text>
                    </View>
                </View>

                {/* Reviews Section */}
                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {mockReviews.map((review) => (
                        <View key={review.id} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <View>
                                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                                    <Text style={styles.reviewDate}>{review.date}</Text>
                                </View>
                                <View style={styles.reviewStars}>
                                    {renderStars(review.rating)}
                                </View>
                            </View>
                            <Text style={styles.reviewComment}>{review.comment}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Sticky Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.callButton} activeOpacity={0.8}>
                    <Feather name="phone" size={20} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>Call Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.whatsappButton} activeOpacity={0.8}>
                    <Feather name="message-circle" size={20} color="#2563EB" />
                    <Text style={styles.whatsappButtonText}>WhatsApp</Text>
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
    scrollView: {
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
        marginBottom: 16,
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
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    avatarPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 32,
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
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    statSubLabel: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    verifiedBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    reviewsSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    reviewAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    reviewDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    reviewStars: {
        flexDirection: 'row',
    },
    reviewComment: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    callButton: {
        flex: 1,
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    callButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    whatsappButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2563EB',
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    whatsappButtonText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    },
});
