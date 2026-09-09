import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

export interface ReceiptCardProps {
  item: any;
  index?: number;
  onPress?: (item: any) => void;
}

// Deterministic barcode pattern based on item ID
const BARCODE_WIDTHS = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2];

export default function ReceiptCard({
  item,
  index = 0,
  onPress,
}: ReceiptCardProps) {
  const isRedeemed = item.status === 'PICKED_UP';
  const isCancelled = item.status === 'CANCELLED';
  const isExpired = item.status === 'EXPIRED';
  const isActive = !isRedeemed && !isCancelled && !isExpired;

  const voucherCode = `#VCH-${String(item.id).padStart(5, '0')}`;
  const quantity = item.quantity || 1;
  const unitPrice = Number(item.listing_details?.discounted_price) || 0;
  const totalPrice = unitPrice > 0 ? (unitPrice * quantity).toFixed(0) : null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(item);
    }
  };

  const getStatusConfig = () => {
    if (isRedeemed) {
      return {
        label: 'REDEEMED',
        textColor: '#94A3B8',
        bgColor: 'rgba(148, 163, 184, 0.12)',
        borderColor: 'rgba(148, 163, 184, 0.25)',
        dotColor: '#94A3B8',
      };
    }
    if (isCancelled) {
      return {
        label: 'CANCELLED',
        textColor: '#FB7185',
        bgColor: 'rgba(244, 63, 94, 0.12)',
        borderColor: 'rgba(244, 63, 94, 0.3)',
        dotColor: '#FB7185',
      };
    }
    if (isExpired) {
      return {
        label: 'EXPIRED',
        textColor: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        dotColor: '#F59E0B',
      };
    }
    return {
      label: 'READY FOR PICKUP',
      textColor: '#34D399',
      bgColor: 'rgba(52, 211, 153, 0.12)',
      borderColor: 'rgba(52, 211, 153, 0.35)',
      dotColor: '#34D399',
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: Math.min(index * 60, 300) }}
    >
      <TouchableOpacity
        style={[styles.card, (isRedeemed || isCancelled || isExpired) && styles.cardDimmed]}
        activeOpacity={0.88}
        onPress={handlePress}
      >
        {/* Holographic Top Glow Edge */}
        <LinearGradient
          colors={['rgba(94, 234, 212, 0.2)', 'transparent']}
          style={styles.topGlowRim}
        />

        {/* Security Badge Header */}
        <View style={styles.badgeHeader}>
          <View style={styles.chipRow}>
            <View style={styles.chipIconBox}>
              <Ionicons name="hardware-chip-outline" size={16} color="#5EEAD4" />
            </View>
            <View>
              <Text style={styles.passLabel}>DIGITAL VOUCHER</Text>
              <Text style={styles.passCode}>{voucherCode}</Text>
            </View>
          </View>

          {/* Glowing Status Pill */}
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Main Credential Body */}
        <View style={styles.badgeBody}>
          <Text style={styles.title} numberOfLines={1}>
            {item.listing_details?.title || 'Surplus Portion'}
          </Text>

          <View style={styles.vendorRow}>
            <Ionicons name="storefront-outline" size={13} color="#94A3B8" style={{ marginRight: 5 }} />
            <Text style={styles.vendorName} numberOfLines={1}>
              {item.listing_details?.donor_name || 'Verified Kitchen'}
            </Text>
            <Ionicons name="checkmark-circle" size={12} color="#5EEAD4" style={{ marginLeft: 4 }} />
          </View>

          {/* Telemetry Chips */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="restaurant-outline" size={12} color="#5EEAD4" style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>{quantity} portions</Text>
            </View>

            {totalPrice ? (
              <View style={styles.metaBadge}>
                <Ionicons name="wallet-outline" size={12} color="#34D399" style={{ marginRight: 4 }} />
                <Text style={styles.priceBadgeText}>₹{totalPrice}</Text>
              </View>
            ) : null}

            {item.eta ? (
              <View style={styles.etaBadge}>
                <Ionicons name="time-outline" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.etaText}>
                  ETA: {new Date(item.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Footer: Micro-Barcode Strip */}
        <View style={styles.badgeFooter}>
          {/* Simulated Authentic Barcode Strip */}
          <View style={styles.barcodeWrapper}>
            <View style={styles.barcodeStrip}>
              {BARCODE_WIDTHS.map((width, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.barcodeBar,
                    {
                      width,
                      opacity: idx % 2 === 0 ? 0.9 : 0.45,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.barcodeSerial}>{String(item.id).padStart(8, '0')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardDimmed: {
    opacity: 0.6,
  },
  topGlowRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  passLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  passCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 0.4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badgeBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5EEAD4',
  },
  priceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  etaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  badgeFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 47, 46, 0.4)',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(94, 234, 212, 0.12)',
  },
  barcodeWrapper: {
    justifyContent: 'center',
  },
  barcodeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
    gap: 2,
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#5EEAD4',
    borderRadius: 0.5,
  },
  barcodeSerial: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: 'monospace',
    marginTop: 2,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
