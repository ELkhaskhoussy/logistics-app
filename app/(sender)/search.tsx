import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SearchScreen() {
    const router = useRouter();
    const [searchData, setSearchData] = useState({
        collectionCity: '',
        deliveryCity: '',
        date: '',
    });

    const handleSearch = () => {
        console.log('Search submitted:', searchData);
        router.push({
  pathname: "/(sender)/results",
  params: {
    collectionCity: searchData.collectionCity,
    deliveryCity: searchData.deliveryCity,
    date: searchData.date,
  },} as any);

    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Feather name="package" size={24} color="#FFFFFF" />
                    <Text style={styles.headerTitle}>Tunisia-France Link</Text>
                </View>
            </View>

            <ScrollView style={styles.main}>
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Find Your Transporter</Text>
                    <Text style={styles.subtitle}>Search for available transporters on your route</Text>
                </View>

                {/* Search Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Search Transporters</Text>
                    </View>
                    <View style={styles.cardContent}>
                        {/* Collection City */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Collection City</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Tunis"
                                    placeholderTextColor="#9CA3AF"
                                    value={searchData.collectionCity}
                                    onChangeText={(text) => setSearchData({ ...searchData, collectionCity: text })}
                                />
                            </View>
                        </View>

                        {/* Delivery City */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Delivery City</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="map-pin" size={16} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Paris"
                                    placeholderTextColor="#9CA3AF"
                                    value={searchData.deliveryCity}
                                    onChangeText={(text) => setSearchData({ ...searchData, deliveryCity: text })}
                                />
                            </View>
                        </View>

                        {/* Preferred Date */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Preferred Date</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="calendar" size={16} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#9CA3AF"
                                    value={searchData.date}
                                    onChangeText={(text) => setSearchData({ ...searchData, date: text })}
                                />
                            </View>
                        </View>

                        {/* Search Button */}
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleSearch}
                            activeOpacity={0.8}
                        >
                            <Feather name="search" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.searchButtonText}>Find Transporters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Line 27: min-h-screen bg-background
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    // Line 28: bg-primary text-primary-foreground p-4 sticky top-0 z-10
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
    // Line 29: container mx-auto flex items-center gap-3
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    // Line 31: text-xl font-bold
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    // Line 35: container mx-auto p-4 max-w-2xl
    main: {
        flex: 1,
        padding: 16,
    },
    // Line 36: py-8 space-y-2
    titleSection: {
        paddingVertical: 32,
        gap: 8,
    },
    // Line 37: text-3xl font-bold text-balance
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#111827',
    },
    // Line 38: text-muted-foreground
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    // Line 41: Card
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
    // Line 42-43: CardHeader
    cardHeader: {
        padding: 24,
        paddingBottom: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    // Line 45: CardContent
    cardContent: {
        padding: 24,
        paddingTop: 0,
    },
    // Line 47: space-y-2
    inputGroup: {
        marginBottom: 16,
    },
    // Line 48: Label
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    // Line 49: relative
    inputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Line 50: absolute left-3 top-3 h-4 w-4 text-muted-foreground
    inputIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    // Line 51: Input with pl-9
    input: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingLeft: 36, // pl-9
        paddingRight: 12,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#111827',
    },
    // Line 92: Button size lg w-full
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563EB',
        height: 52, // lg size
        borderRadius: 8,
        marginTop: 8,
    },
    buttonIcon: {
        marginRight: 8,
    },
    searchButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
