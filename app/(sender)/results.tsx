import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const mockTransporters = [
    {
        id: 1,
        name: 'Ahmed Ben Salem',
        rating: 4.8,
        reviews: 127,
        price: 45,
        avatar: null,
        route: 'Tunis → Paris',
    },
    {
        id: 2,
        name: 'Mohamed Gharbi',
        rating: 4.9,
        reviews: 203,
        price: 42,
        avatar: null,
        route: 'Tunis → Paris',
    },
    {
        id: 3,
        name: 'Karim Mansour',
        rating: 4.7,
        reviews: 89,
        price: 48,
        avatar: null,
        route: 'Tunis → Paris',
    },
];

export default function ResultsScreen() {
    const router = useRouter();

    const handleTransporterPress = (id: number) => {
        router.push(`/(sender)/transporter-profile?id=${id}` as any);
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
                    <Text style={styles.headerTitle}>Available Transporters</Text>
                </View>
            </View>

            <ScrollView style={styles.main}>
                {/* Route Info */}
                <View style={styles.routeInfo}>
                    <Feather name="map-pin" size={16} color="#6B7280" />
                    <Text style={styles.routeText}>
                        Tunis → Paris • {mockTransporters.length} transporters found
                    </Text>
                </View>

                {/* Transporters List */}
                {mockTransporters.map((transporter) => (
                    <TouchableOpacity
                        key={transporter.id}
                        style={styles.card}
                        onPress={() => handleTransporterPress(transporter.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardContent}>
                            <View style={styles.cardRow}>
                                {/* Avatar */}
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{transporter.name.charAt(0)}</Text>
                                </View>

                                {/* Info Section */}
                                <View style={styles.infoSection}>
                                    <Text style={styles.name}>{transporter.name}</Text>
                                    <View style={styles.ratingRow}>
                                        <Feather name="star" size={16} color="#FBBF24" style={styles.starIcon} />
                                        <Text style={styles.ratingValue}>{transporter.rating}</Text>
                                        <Text style={styles.reviewsText}>({transporter.reviews} reviews)</Text>
                                    </View>
                                    <Text style={styles.route}>{transporter.route}</Text>
                                </View>

                                {/* Price Section */}
                                <View style={styles.priceSection}>
                                    <Text style={styles.price}>€{transporter.price}</Text>
                                    <Text style={styles.priceUnit}>per kg</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Line 43: min-h-screen bg-background
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    // Line 44: bg-primary text-primary-foreground p-4 sticky top-0 z-10
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
    // Line 45: container mx-auto flex items-center gap-3
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    // Line 54: text-xl font-bold
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
    },
    // Line 58: container mx-auto p-4 max-w-2xl space-y-4
    main: {
        flex: 1,
        padding: 16,
    },
    // Line 59: flex items-center gap-2 text-sm text-muted-foreground py-2
    routeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        marginBottom: 8,
    },
    routeText: {
        fontSize: 14,
        color: '#6B7280',
    },
    // Line 65: Card cursor-pointer hover:border-primary
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    // Line 70: CardContent p-4
    cardContent: {
        padding: 16,
    },
    // Line 71: flex items-center gap-4
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    // Line 72: Avatar h-16 w-16
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    // Line 76: flex-1 min-w-0
    infoSection: {
        flex: 1,
        minWidth: 0,
    },
    // Line 77: font-semibold text-lg
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    // Line 78: flex items-center gap-1 text-sm
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    starIcon: {
        // Fill star effect
    },
    // Line 80: font-medium
    ratingValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    // Line 81: text-muted-foreground
    reviewsText: {
        fontSize: 14,
        color: '#6B7280',
    },
    // Line 83: text-sm text-muted-foreground
    route: {
        fontSize: 14,
        color: '#6B7280',
    },
    // Line 85: text-right
    priceSection: {
        alignItems: 'flex-end',
    },
    // Line 86: text-2xl font-bold text-primary
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    // Line 87: text-xs text-muted-foreground
    priceUnit: {
        fontSize: 12,
        color: '#6B7280',
    },
});
