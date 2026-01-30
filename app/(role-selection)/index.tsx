import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoleSelection() {
    const router = useRouter();

    return (
        <View style={styles.minHScreen}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.h1}>How will you use the app?</Text>
                    <Text style={styles.subtitle}>Choose your account type to continue</Text>
                </View>

                <View style={styles.grid}>
                    {/* Sender Card */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push('/register-sender' as any)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.iconWrapper}>
                                <View style={styles.iconContainer}>
                                    <Feather name="package" size={40} color="#2563EB" />
                                </View>
                            </View>
                            <Text style={styles.cardTitle}>I want to Send Packages</Text>
                            <Text style={styles.cardDescription}>Find reliable transporters for your shipments</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.ul}>
                                <Text style={styles.li}>• Search available transporters</Text>
                                <Text style={styles.li}>• View reviews and ratings</Text>
                                <Text style={styles.li}>• Contact drivers directly</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Transporter Card */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push('/register-transporter' as any)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.iconWrapper}>
                                <View style={styles.iconContainer}>
                                    <Feather name="truck" size={40} color="#2563EB" />
                                </View>
                            </View>
                            <Text style={styles.cardTitle}>I am a Transporter</Text>
                            <Text style={styles.cardDescription}>Offer your transport services and earn money</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.ul}>
                                <Text style={styles.li}>• Publish your trips</Text>
                                <Text style={styles.li}>• Manage bookings</Text>
                                <Text style={styles.li}>• Build your reputation</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Line 11: min-h-screen flex items-center justify-center p-4 bg-background
    minHScreen: {
        minHeight: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#F9FAFB',
    },
    // Line 12: w-full max-w-2xl space-y-6
    container: {
        width: '100%',
        maxWidth: 672, // 2xl = 672px
        gap: 24, // space-y-6 = 24px
    },
    // Line 13: text-center space-y-2
    header: {
        alignItems: 'center',
        gap: 8, // space-y-2 = 8px
        marginBottom: 24,
    },
    // Line 14: text-3xl font-bold
    h1: {
        fontSize: 30, // text-3xl
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    // Line 15: text-muted-foreground
    subtitle: {
        color: '#6B7280',
        textAlign: 'center',
        fontSize: 16,
    },
    // Line 18: grid md:grid-cols-2 gap-4
    grid: {
        flexDirection: 'row',
        gap: 16, // gap-4 = 16px
        flexWrap: 'wrap',
    },
    // Line 19-21: Card with cursor-pointer hover:border-primary
    card: {
        flex: 1,
        minWidth: 300,
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
    // Line 23: CardHeader text-center
    cardHeader: {
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
    },
    // Line 24: flex justify-center mb-4
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16, // mb-4 = 16px
    },
    // Line 25: w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center
    iconContainer: {
        width: 80, // w-20 = 80px
        height: 80, // h-20 = 80px
        borderRadius: 40,
        backgroundColor: 'rgba(37, 99, 235, 0.1)', // bg-primary/10
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Line 29: CardTitle
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    // Line 30: CardDescription
    cardDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    // Line 32: CardContent
    cardContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    // Line 33: space-y-2 text-sm text-muted-foreground
    ul: {
        gap: 8, // space-y-2
    },
    // Line 34-36: list items
    li: {
        fontSize: 14, // text-sm
        color: '#6B7280', // text-muted-foreground
        marginBottom: 8,
    },
});
