import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../scripts/context/AuthContext';
import { getGoogleUser, clearGoogleUser } from '../../app/utils/tokenStorage';

export default function RoleSelection() {
    const router = useRouter();
    const { login } = useAuth();

    const handleSelectRole = async (role: "SENDER" | "TRANSPORTER") => {
        const googleUser = await getGoogleUser();

        // NORMAL FLOW
        if (!googleUser) {
            if (role === "SENDER") {
                router.replace("/(auth)/register-sender");
            } else {
                router.replace("/(auth)/register-transporter");
            }
            return;
        }

        // GOOGLE FLOW

        try {
            const response = await fetch(
                "http://localhost:8080/users/auth/google/register",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: googleUser.email,
                        firstName: googleUser.firstName,
                        lastName: googleUser.lastName,
                        imageUrl: googleUser.imageUrl,
                        role: role,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Google register failed");
            }

            login(data);
            await clearGoogleUser();

            if (role === "SENDER") {
                router.replace("/(sender)/search");
            } else {
                router.replace("/(transporter)/dashboard");
            }

        } catch (error) {
            console.error("Role selection error:", error);
        }
    };

    return (
        <View style={styles.minHScreen}>
            <View style={styles.container}>
                
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.h1}>How will you use the app?</Text>
                    <Text style={styles.subtitle}>
                        Choose your account type to continue
                    </Text>
                </View>

                {/* CARDS */}
                <View style={styles.grid}>
                    
                    {/* Sender */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => handleSelectRole("SENDER")}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <Feather name="package" size={40} color="#2563EB" />
                        </View>

                        <Text style={styles.cardTitle}>
                            I want to Send Packages
                        </Text>

                        <Text style={styles.cardDescription}>
                            Find reliable transporters for your shipments
                        </Text>
                    </TouchableOpacity>

                    {/* Transporter */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => handleSelectRole("TRANSPORTER")}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <Feather name="truck" size={40} color="#2563EB" />
                        </View>

                        <Text style={styles.cardTitle}>
                            I am a Transporter
                        </Text>

                        <Text style={styles.cardDescription}>
                            Offer your transport services and earn money
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    minHScreen: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "#F9FAFB",
    },
    container: {
        width: "100%",
        maxWidth: 600,
        gap: 24,
    },
    header: {
        alignItems: "center",
        gap: 8,
        marginBottom: 20,
    },
    h1: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#111827",
        textAlign: "center",
    },
    subtitle: {
        color: "#6B7280",
        textAlign: "center",
        fontSize: 16,
    },
    grid: {
        gap: 16,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 20,
        alignItems: "center",

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
        textAlign: "center",
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
    },
});