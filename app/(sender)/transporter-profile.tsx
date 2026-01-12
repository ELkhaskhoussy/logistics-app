import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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
    const params = useLocalSearchParams();

    const handleCall = () => {
        console.log('Call button pressed');
    };

    const handleWhatsApp = () => {
        console.log('WhatsApp button pressed');
    };

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
                    <Text style={styles.headerTitle}>Transporter Profile</Text>
                </View>
            </View>

            <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
                {/* Profile Header */}
                <View style={styles.profileCard}>
                    <View style={styles.profileContent}>
                        <View style={styles.profileHeader}>
                            {/* Avatar */}
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>AB</Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>Ahmed Ben Salem</Text>
                                <Text style={styles.profileDescription}>
                                    Professional transporter with 5 years of experience on the Tunisia-France route.
                                    Specializing in secure and timely deliveries.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Rating Card */}
                    <View style={styles.statCard}>
                        <View style={styles.statContent}>
                            <View style={styles.ratingHeader}>
                                <Feather name="star" size={20} color="#FBBF24" />
                                <Text style={styles.statValue}>4.8</Text>
                            </View>
                            <Text style={styles.statLabel}>Average Rating</Text>
                            <Text style={styles.statSubtext}>127 reviews</Text>
                        </View>
                    </View>

                    {/* Vehicle Card */}
                    <View style={styles.statCard}>
                        <View style={styles.statContent}>
                            <View style={styles.verifiedHeader}>
                                <Feather name="shield" size={20} color="#10B981" />
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Verified</Text>
                                </View>
                            </View>
                            <Text style={styles.statLabel}>Vehicle</Text>
                            <Text style={styles.statSubtext}>Van • 123 TUN 4567</Text>
                        </View>
                    </View>
                </View>

                {/* Reviews Section */}
                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    <View style={styles.reviewsList}>
                        {mockReviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewContent}>
                                    <View style={styles.reviewHeader}>
                                        <View>
                                            <Text style={styles.reviewAuthor}>{review.author}</Text>
                                            <Text style={styles.reviewDate}>{review.date}</Text>
                                        </View>
                                        <View style={styles.stars}>
                                            {Array.from({ length: review.rating }).map((_, i) => (
                                                <Feather key={i} name="star" size={16} color="#FBBF24" />
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Bottom padding for sticky footer */}
                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Sticky Footer Actions */}
            <View style={styles.footer}>
                <View style={styles.footerContent}>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={handleCall}
                        activeOpacity={0.8}
                    >
                        <Feather name="phone" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                        <Text style={styles.callButtonText}>Call Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={handleWhatsApp}
                        activeOpacity={0.8}
                    >
                        <Feather name="message-circle" size={16} color="#2563EB" style={styles.buttonIcon} />
                        <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Line 45: min-h-screen bg-background pb-24
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    // Line 46: bg-primary text-primary-foreground p-4 sticky top-0 z-10
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
        flex: 1,
    },
    // Line 60: container mx-auto p-4 max-w-2xl space-y-6
    main: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 24,
        paddingBottom: 100, // Space for sticky footer
    },
    // Line 62: Card (Profile)
    profileCard: {
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
    // Line 63: p-6
    profileContent: {
        padding: 24,
    },
    // Line 64: flex flex-col items-center text-center space-y-4
    profileHeader: {
        alignItems: 'center',
        gap: 16,
    },
    // Line 65: h-24 w-24
    avatar: {
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
    profileInfo: {
        alignItems: 'center',
    },
    // Line 70: text-2xl font-bold
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    // Line 71: text-muted-foreground
    profileDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    // Line 81: grid grid-cols-2 gap-4
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
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
    // Line 83: p-4 text-center
    statContent: {
        padding: 16,
        alignItems: 'center',
    },
    // Line 84: flex items-center justify-center gap-1
    ratingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    verifiedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    badge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#10B981',
    },
    // Line 86: text-2xl font-bold
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    // Line 88: text-sm text-muted-foreground
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    // Line 89: text-xs text-muted-foreground
    statSubtext: {
        fontSize: 12,
        color: '#6B7280',
    },
    // Line 107: space-y-4
    reviewsSection: {
        gap: 16,
    },
    // Line 108: text-xl font-bold
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    reviewsList: {
        gap: 12,
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    // Line 112: p-4
    reviewContent: {
        padding: 16,
    },
    // Line 113: flex items-start justify-between mb-2
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    // Line 115: font-semibold
    reviewAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    // Line 116: text-xs text-muted-foreground
    reviewDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
    },
    // Line 124: text-sm text-muted-foreground
    reviewComment: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    bottomPadding: {
        height: 20,
    },
    // Line 133: fixed bottom-0 left-0 right-0 bg-card border-t p-4
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 16,
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
    // Line 134: grid grid-cols-2 gap-3
    footerContent: {
        flexDirection: 'row',
        gap: 12,
    },
    // Line 135: Call Button (success color)
    callButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        height: 52,
        borderRadius: 8,
    },
    callButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Line 139: WhatsApp Button (outline)
    whatsappButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2563EB',
        height: 52,
        borderRadius: 8,
    },
    whatsappButtonText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonIcon: {
        marginRight: 8,
    },
});
