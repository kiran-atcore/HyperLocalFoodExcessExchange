import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import QRCode from 'react-native-qrcode-svg';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import CountdownTimer from './CountdownTimer';
import ButtonTwo from './ButtonTwo';

export interface ClaimCardProps {
  item: any;
  index?: number;
  onCancelClaim?: (id: number) => void;
  onExpire?: (id: number) => void;
}

export default function ClaimCard({
  item,
  index = 0,
  onCancelClaim,
  onExpire,
}: ClaimCardProps) {
  const isCompleted = item.status === 'PICKED_UP';
  const isApproved = item.status === 'APPROVED';
  const isExpired = item.status === 'EXPIRED';
  const isCancelled = item.status === 'CANCELLED';
  const isInactive = isCompleted || isExpired || isCancelled;

  const isDiscount = item.listing_details?.listing_type === 'DISCOUNT';
  const qrValue = item.qr_code_id || item.id?.toString() || 'CLAIM';
  const quantity = item.quantity || item.listing_details?.quantity_available || 1;
  const quantityUnit = item.listing_details?.quantity_unit || 'portions';
  const pickupEnd = item.listing_details?.pickup_end;

  const getStatusConfig = () => {
    if (isCompleted) {
      return {
        label: 'PICKED UP',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.16)',
        icon: 'checkmark-circle' as const,
      };
    }
    if (isApproved) {
      return {
        label: 'READY FOR PICKUP',
        color: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.16)',
        icon: 'checkmark-done-circle' as const,
      };
    }
    if (isExpired) {
      return {
        label: 'EXPIRED',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.16)',
        icon: 'time' as const,
      };
    }
    if (isCancelled) {
      return {
        label: 'CANCELLED',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.16)',
        icon: 'close-circle' as const,
      };
    }
    return {
      label: 'PENDING APPROVAL',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.16)',
      icon: 'time-outline' as const,
    };
  };

  const statusConfig = getStatusConfig();

  const handleOpenDetail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isDiscount) {
      router.push(`/(views)/receipt/${item.id}` as any);
    } else {
      router.push(`/(views)/claim/${item.id}` as any);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 22, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', delay: index * 60, damping: 18, stiffness: 120 }}
      style={styles.wrapper}
    >
      <TouchableOpacity
        style={[styles.card, isInactive && styles.cardInactive]}
        activeOpacity={0.9}
        onPress={handleOpenDetail}
      >
        {/* Top Bento Row: QR Hub (Left) + Logistics Hub (Right) */}
        <View style={styles.topBentoRow}>
          {/* Left Tile: QR Preview */}
          <View style={styles.qrTile}>
            <View style={[styles.qrCanvas, isInactive && { opacity: 0.35 }]}>
              <QRCode
                value={qrValue}
                size={82}
                color="#0F172A"
                backgroundColor="#FFFFFF"
              />
            </View>

            {/* Type badge on QR */}
            <View style={styles.qrBadge}>
              <Ionicons
                name={isDiscount ? 'pricetag' : 'heart'}
                size={9}
                color={isDiscount ? '#FA5252' : '#5EEAD4'}
                style={{ marginRight: 3 }}
              />
              <Text style={styles.qrBadgeText}>
                {isDiscount ? 'RECEIPT' : 'NGO PASS'}
              </Text>
            </View>

            {/* Inactive Overlay Watermark */}
            {isInactive && (
              <View style={styles.qrOverlay}>
                <Text style={styles.qrOverlayText}>
                  {isCompleted ? 'REDEEMED' : isExpired ? 'EXPIRED' : 'CANCELLED'}
                </Text>
              </View>
            )}
          </View>

          {/* Right Tile: Logistics Hub Stack */}
          <View style={styles.logisticsTileStack}>
            {/* Pill 1: Status badge */}
            <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
              <Ionicons
                name={statusConfig.icon}
                size={12}
                color={statusConfig.color}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[styles.statusPillText, { color: statusConfig.color }]}
                numberOfLines={1}
              >
                {statusConfig.label}
              </Text>
            </View>

            {/* Pill 2: Countdown or Expiry */}
            {!isInactive && pickupEnd ? (
              <View style={styles.bentoPillUrgent}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color="#F59E0B"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.bentoPillLabel}>Exp: </Text>
                <CountdownTimer
                  targetDate={pickupEnd}
                  onExpire={() => onExpire && onExpire(item.id)}
                  hideExpired
                />
              </View>
            ) : (
              <View style={styles.bentoPill}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color="#94A3B8"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.bentoPillText} numberOfLines={1}>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent'}
                </Text>
              </View>
            )}

            {/* Pill 3: Portions Reserved */}
            <View style={styles.bentoPill}>
              <Ionicons
                name="cube-outline"
                size={12}
                color="#38BDF8"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.bentoPillHighlight} numberOfLines={1}>
                {quantity} {quantityUnit}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Bento Tile: Info & Action Row */}
        <View style={styles.bottomBentoTile}>
          <View style={styles.headerInfoRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.title} numberOfLines={1}>
                {item.listing_details?.title || 'Food Claim'}
              </Text>
              <View style={styles.donorRow}>
                <Ionicons
                  name="storefront-outline"
                  size={12}
                  color="#94A3B8"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.donorName} numberOfLines={1}>
                  {item.listing_details?.donor_name || 'Community Partner'}
                </Text>
              </View>
            </View>

            {/* Price Tag if Discounted */}
            {isDiscount && (
              <View style={styles.priceContainer}>
                <Text style={styles.discountPrice}>
                  ₹{Number(item.listing_details?.discounted_price) || 0}
                </Text>
                {Number(item.listing_details?.original_price) >
                  Number(item.listing_details?.discounted_price) && (
                  <Text style={styles.originalPrice}>
                    ₹{Number(item.listing_details?.original_price)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Action Row */}
          <View style={styles.actionsRow}>
            <View style={{ flex: 1 }}>
              <ButtonTwo
                title={isDiscount ? 'View Receipt' : 'View Claim Pass'}
                icon={isDiscount ? 'receipt-outline' : 'qr-code-outline'}
                onPress={handleOpenDetail}
                colors={
                  isInactive
                    ? ['#1E293B', '#0F172A']
                    : isDiscount
                    ? ['#FF8A8A', '#FA5252', '#E03131']
                    : ['#0D9488', '#042F2E']
                }
                sheen={!isInactive}
                contentStyle={{ paddingVertical: 10 }}
                textStyle={styles.btnText}
              />
            </View>

            {/* Cancel Button if active */}
            {!isInactive && onCancelClaim && (
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.7}
                onPress={() => onCancelClaim(item.id)}
              >
                <Ionicons name="trash-outline" size={17} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cardInactive: {
    opacity: 0.65,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Top Bento Grid
  topBentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  qrTile: {
    width: 118,
    height: 118,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  qrCanvas: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrOverlayText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Logistics Hub Stack
  logisticsTileStack: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bentoPillUrgent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  bentoPillLabel: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  bentoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bentoPillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  bentoPillHighlight: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },

  // Bottom Bento Tile
  bottomBentoTile: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorName: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FA5252',
  },
  originalPrice: {
    fontSize: 11,
    color: '#64748B',
    textDecorationLine: 'line-through',
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
