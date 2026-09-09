import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import CountdownTimer from './CountdownTimer';
import { LinearGradient } from 'expo-linear-gradient';

export default function RequestCard({ item, index, onExpire }: any) {
  const isShelter = item.listing_details?.listing_type === 'DONATION'
    ? true
    : item.listing_details?.listing_type === 'DISCOUNT'
      ? false
      : (item.requester_details?.role || '').toLowerCase() === 'shelter';

  // Neon accents based on role
  const accentColor = isShelter ? '#38BDF8' : '#10B981'; // Light Blue vs Emerald
  const accentBg = isShelter ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', delay: index * 80, damping: 16, stiffness: 120 }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(views)/request/${item.id}` as any)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Glow Accent Line */}
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={styles.userCol}>
              <View style={[styles.roleBadge, { backgroundColor: accentBg }]}>
                <Ionicons
                  name={isShelter ? "business" : "person"}
                  size={12}
                  color={accentColor}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.roleText, { color: accentColor }]}>
                  {isShelter ? 'NGO' : 'CONSUMER'}
                </Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>{item.requester_details?.name || 'Unknown'}</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <Ionicons name="cube" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.itemText} numberOfLines={1}>
              {item.quantity || 1} {item.listing_details?.quantity_unit || 'portions'} • <Text style={{ color: '#FFFFFF' }}>{item.listing_details?.title}</Text>
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.etaContainer}>
              <Ionicons name="navigate-circle" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.etaText}>
                {item.eta ? `ETA ${new Date(item.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No ETA'}
              </Text>
            </View>

            {item.listing_details?.pickup_end && (
              <View style={styles.timerContainer}>
                <Ionicons name="time" size={12} color="#FDA4AF" style={{ marginRight: 4 }} />
                <CountdownTimer targetDate={item.listing_details.pickup_end} onExpire={() => onExpire(item.id)} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Dark glass base
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
  },
  accentLine: {
    width: 4,
    height: '100%',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E1',
    flex: 1,
    letterSpacing: 0.1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.25,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.2)',
  },
});
