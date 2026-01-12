import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const mockTrips = {
    upcoming: [
        {
            id: 1,
            route: 'Tunis → Lyon → Paris',
            date: '2025-01-15',
            capacity: '250 kg',
            price: '€45/kg',
            status: 'upcoming',
        },
        {
            id: 2,
            route: 'Sfax → Marseille',
            date: '2025-01-20',
            capacity: '180 kg',
            price: '€42/kg',
            status: 'upcoming',
        },
    ],
    past: [
        {
            id: 3,
            route: 'Tunis → Paris',
            date: '2024-12-10',
            capacity: '300 kg',
            price: '€45/kg',
            status: 'completed',
        },
        {
            id: 4,
            route: 'Sousse → Lyon',
            date: '2024-12-05',
            capacity: '200 kg',
            price: '€43/kg',
            status: 'completed',
        },
    ],
};

export default function DashboardScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'trips' | 'profile'>('trips');

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Transporter Dashboard</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'trips' && styles.activeTab]}
                    onPress={() => setActiveTab('trips')}
                >
                    <Text style={[styles.tabText, activeTab === 'trips' && styles.activeTabText]}>
                        My Trips
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
                    onPress={() => setActiveTab('profile')}
                >
                    <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
                        Profile
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
                {activeTab === 'trips' ? (
                    <View style={styles.tabContent}>
                        {/* Upcoming Trips */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Upcoming Trips</Text>
                            <View style={styles.tripsList}>
                                {mockTrips.upcoming.map((trip) => (
                                    <View key={trip.id} style={styles.tripCard}>
                                        <View style={styles.tripCardContent}>
                                            <View style={styles.tripHeader}>
                                                <View style={styles.tripInfo}>
                                                    <View style={styles.routeRow}>
                                                        <Feather name="map-pin" size={16} color="#6B7280" />
                                                        <Text style={styles.routeText}>{trip.route}</Text>
                                                    </View>
                                                    <View style={styles.dateRow}>
                                                        <Feather name="calendar" size={16} color="#6B7280" />
                                                        <Text style={styles.dateText}>
                                                            {new Date(trip.date).toLocaleDateString()}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.activeBadge}>
                                                    <Text style={styles.activeBadgeText}>Active</Text>
                                                </View>
                                            </View>
                                            <View style={styles.tripFooter}>
                                                <View style={styles.capacityRow}>
                                                    <Feather name="package" size={16} color="#6B7280" />
                                                    <Text style={styles.capacityText}>{trip.capacity}</Text>
                                                </View>
                                                <Text style={styles.priceText}>{trip.price}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Past Trips */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Past Trips</Text>
                            <View style={styles.tripsList}>
                                {mockTrips.past.map((trip) => (
                                    <View key={trip.id} style={[styles.tripCard, styles.pastTripCard]}>
                                        <View style={styles.tripCardContent}>
                                            <View style={styles.tripHeader}>
                                                <View style={styles.tripInfo}>
                                                    <View style={styles.routeRow}>
                                                        <Feather name="map-pin" size={16} color="#6B7280" />
                                                        <Text style={styles.routeText}>{trip.route}</Text>
                                                    </View>
                                                    <View style={styles.dateRow}>
                                                        <Feather name="calendar" size={16} color="#6B7280" />
                                                        <Text style={styles.dateText}>
                                                            {new Date(trip.date).toLocaleDateString()}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.completedBadge}>
                                                    <Text style={styles.completedBadgeText}>Completed</Text>
                                                </View>
                                            </View>
                                            <View style={styles.tripFooter}>
                                                <View style={styles.capacityRow}>
                                                    <Feather name="package" size={16} color="#6B7280" />
                                                    <Text style={styles.capacityText}>{trip.capacity}</Text>
                                                </View>
                                                <Text style={styles.priceTextGray}>{trip.price}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.tabContent}>
                        {/* Profile Tab */}
                        <View style={styles.profileCard}>
                            <View style={styles.profileContent}>
                                <View style={styles.profileHeader}>
                                    <View style={styles.profileAvatar}>
                                        <Feather name="user" size={32} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.profileText}>
                                        <Text style={styles.profileName}>Ahmed Ben Salem</Text>
                                        <Text style={styles.profileEmail}>ahmed@example.com</Text>
                                    </View>
                                </View>
                                <View style={styles.profileDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Phone</Text>
                                        <Text style={styles.detailValue}>+216 XX XXX XXX</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Vehicle Type</Text>
                                        <Text style={styles.detailValue}>Van</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>License Plate</Text>
                                        <Text style={styles.detailValue}>123 TUN 4567</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Member Since</Text>
                                        <Text style={styles.detailValue}>Jan 2020</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(transporter)/add-trip' as any)}
                activeOpacity={0.8}
            >
                <Feather name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
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
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    // Tabs (Line 64-67)
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#2563EB',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#2563EB',
    },
    main: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    tabContent: {
        gap: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    tripsList: {
        gap: 12,
    },
    tripCard: {
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
    pastTripCard: {
        opacity: 0.6,
    },
    tripCardContent: {
        padding: 16,
    },
    tripHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    tripInfo: {
        flex: 1,
        gap: 4,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#6B7280',
    },
    activeBadge: {
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    activeBadgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#2563EB',
    },
    completedBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    completedBadgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
    },
    tripFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    capacityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    capacityText: {
        fontSize: 14,
        color: '#111827',
    },
    priceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB',
    },
    priceTextGray: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    // Profile Tab
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
    profileContent: {
        padding: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    profileAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileText: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    profileDetails: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    bottomPadding: {
        height: 80,
    },
    // FAB (Line 172-178)
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
