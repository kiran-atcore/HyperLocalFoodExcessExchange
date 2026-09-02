import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import CountdownTimer from './CountdownTimer';

export default function SurplusCard({ item, index, onDelete, onExpire }: any) {
  const isExpired = item.forceExpired || (item.pickup_end && new Date(item.pickup_end).getTime() <= new Date().getTime());
  const remainingCount = item.quantity_remaining !== undefined ? item.quantity_remaining : item.quantity_available;
  const displayCount = item.listing_type === 'DONATION' ? item.quantity_available : remainingCount;
  const isSoldOut = item.donor_status === 'Claimed' || (item.quantity_remaining !== undefined && item.quantity_remaining <= 0);

  const getStatusColor = () => {
    if (item.donor_status === 'Claimed') return { bg: 'rgba(253, 230, 138, 0.9)', text: '#92400E', icon: 'checkmark-circle' };
    if (isExpired && item.donor_status === 'Active') return { bg: 'rgba(254, 202, 202, 0.9)', text: '#991B1B', icon: 'time' };
    if (item.donor_status === 'Picked Up') return { bg: 'rgba(203, 213, 225, 0.9)', text: '#334155', icon: 'bag-check' };
    return { bg: 'rgba(153, 246, 228, 0.9)', text: '#115E59', icon: 'radio-button-on' };
  };

  const statusConfig = getStatusColor();
  const statusLabel = isExpired && item.donor_status === 'Active' ? 'EXPIRED' : item.donor_status.toUpperCase();
  const imageUrl = item.food_image || item.image;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', delay: index * 80, damping: 16, stiffness: 120 }}
    >
      <TouchableOpacity 
        style={[styles.card, isSoldOut && { opacity: 0.65 }]} 
        onPress={() => router.push(`/(views)/surplus/${item.id}` as any)}
        activeOpacity={0.85}
      >
        {/* Full Bleed Background Image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['#0F766E', '#042F2E']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Cinematic Dark Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Header Section (Status & Offer Badge) */}
        <View style={styles.topSection}>
          {item.listing_type === 'DISCOUNT' ? (
            <View style={styles.offerBadge}>
              <Ionicons name="pricetag" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.offerText}>
                {item.original_price ? `${Math.round(((item.original_price - item.discounted_price) / item.original_price) * 100)}% OFF` : 'OFFER'}
              </Text>
            </View>
          ) : <View />}
          
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Bottom Info Section */}
        <View style={styles.bottomSection}>
          {item.listing_type === 'DISCOUNT' && (
            <View style={styles.priceRow}>
              <Text style={styles.discountedPrice}>₹{item.discounted_price}</Text>
              {!!item.original_price && (
                <Text style={styles.originalPrice}>₹{item.original_price}</Text>
              )}
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="cube" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.detailsText}>{displayCount} {item.quantity_unit || 'portions'} {item.listing_type === 'DONATION' ? '(Total)' : 'available'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color="#94A3B8" style={{ marginRight: 6, marginLeft: 12 }} />
              <Text style={styles.timeValue}>
                <CountdownTimer targetDate={item.pickup_end} onExpire={() => onExpire(item.id)} />
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionButtons}>
            {isExpired && item.donor_status === 'Active' ? (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]} 
                onPress={() => router.push(`/(forms)/edit-surplus/${item.id}` as any)}
              >
                <Text style={[styles.actionBtnText, { color: '#34D399' }]}>Reactivate</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => router.push(`/(forms)/edit-surplus/${item.id}` as any)}
              >
                <Ionicons name="pencil" size={14} color="#5EEAD4" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
            
            {(isExpired || item.donor_status === 'Picked Up' || item.donor_status !== 'Claimed') && (
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDelete(item.id);
                }}
              >
                <Ionicons name="trash" size={16} color="#FDA4AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 240,
    backgroundColor: '#000000',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
    justifyContent: 'space-between',
  },
  topSection: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bottomSection: {
    padding: 20,
    paddingTop: 0,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  offerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
    marginRight: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E1',
    letterSpacing: 0.25,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: 0.25,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5EEAD4',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
