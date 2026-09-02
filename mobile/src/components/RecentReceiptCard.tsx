import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

export default function RecentReceiptCard({ receipt, index }: any) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PENDING': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', text: 'Processing' };
            case 'REJECTED': return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', text: 'Void' };
            default: return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', text: 'Approved' };
        }
    };
    const config = getStatusConfig(receipt.status);

    return (
        <MotiView
            from={{ opacity: 0, translateY: 40, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', delay: index * 100 + 150, damping: 18, stiffness: 120 }}
            style={styles.cardContainer}
        >
            {/* Cinematic subtle glow behind the card */}
            <View style={[styles.glow, { shadowColor: config.color }]} />

            <View style={styles.card}>
                {/* Soft glass gradient background */}
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Neon Left Accent Line */}
                <View style={[styles.accentLine, { backgroundColor: config.color }]} />

                <View style={styles.cardContent}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <View style={styles.dateBadge}>
                            <Ionicons name="calendar" size={12} color="#94A3B8" style={{ marginRight: 6 }} />
                            <Text style={styles.date}>{new Date(receipt.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                        </View>

                        <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.color + '40' }]}>
                            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                            <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                        </View>
                    </View>

                    {/* Main Info */}
                    <View style={styles.mainInfo}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={styles.itemTitle} numberOfLines={1}>{receipt.listing_title}</Text>
                            <View style={styles.ngoRow}>
                                <Ionicons name="business" size={14} color="#5EEAD4" style={{ marginRight: 6 }} />
                                <Text style={styles.ngoText} numberOfLines={1}>{receipt.ngo_name}</Text>
                            </View>
                        </View>

                        <View style={styles.valueContainer}>
                            <Text style={[
                                styles.valueAmount,
                                { color: config.color },
                                receipt.status === 'REJECTED' && { textDecorationLine: 'line-through', opacity: 0.6 }
                            ]}>
                                ₹{receipt.estimated_value}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </MotiView>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 16,
    },
    glow: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        bottom: 0,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 8,
    },
    card: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        overflow: 'hidden',
    },
    accentLine: {
        width: 4,
        height: '100%',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 4,
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    date: {
        fontSize: 12,
        color: '#CBD5E1',
        fontWeight: '700'
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    mainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    ngoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ngoText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    valueContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    valueAmount: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    }
});
