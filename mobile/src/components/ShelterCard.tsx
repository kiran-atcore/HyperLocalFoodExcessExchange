import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import CountdownTimer from './CountdownTimer';
import ButtonTwo from './ButtonTwo';

export interface ShelterCardProps {
  item: any;
  distanceStr?: string;
  index?: number;
  onClaimPress: (item: any) => void;
  isClaiming?: boolean;
  onExpire?: (id: number) => void;
  onPressCard?: (item: any) => void;
}

export default function ShelterCard({
  item,
  distanceStr = 'Distance unknown',
  index = 0,
  onClaimPress,
  isClaiming = false,
  onExpire,
  onPressCard,
}: ShelterCardProps) {
  const isClaimed =
    item.is_claimed ||
    (item.quantity_remaining !== undefined && item.quantity_remaining <= 0);
  const remainingCount =
    item.quantity_remaining !== undefined
      ? item.quantity_remaining
      : item.quantity_available;
  const imageUrl = item.image_url || item.food_image || item.image;

  // Discount pricing computation
  const origPrice = Number(item.original_price) || 0;
  const discPrice = Number(item.discounted_price) || 0;
  let discountPercent = 0;
  if (origPrice > 0 && discPrice < origPrice) {
    discountPercent = Math.round(((origPrice - discPrice) / origPrice) * 100);
  }

  const dietaryType = (item.dietary_info || '').toUpperCase();
  const isVeg = dietaryType.includes('VEG') && !dietaryType.includes('NON');

  const handleCardPress = () => {
    if (onPressCard) {
      onPressCard(item);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 24, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', delay: index * 60, damping: 18, stiffness: 120 }}
      style={styles.wrapper}
    >
      <TouchableOpacity
        style={[styles.ticketContainer, isClaimed && styles.ticketClaimed]}
        activeOpacity={0.92}
        onPress={handleCardPress}
        disabled={isClaimed && !onPressCard}
      >
        {/* Top Ticket Stub: Hero Banner with Image & Overlays */}
        <View style={styles.heroBanner}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#0D9488', '#042F2E']}
              style={styles.heroImage}
            >
              <View style={styles.imageFallback}>
                <Ionicons
                  name="restaurant-outline"
                  size={42}
                  color="rgba(94, 234, 212, 0.4)"
                />
              </View>
            </LinearGradient>
          )}

          {/* Gradient Scrim for Text Legibility */}
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.2)', 'rgba(15, 23, 42, 0.85)', '#0F172A']}
            style={styles.heroScrim}
          />

          {/* Top Floating Chips */}
          <View style={styles.topChipsRow}>
            {item.listing_type === 'DISCOUNT' && discountPercent > 0 ? (
              <View style={styles.discountBadge}>
                <Ionicons name="pricetag" size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
              </View>
            ) : (
              <View style={styles.donationBadge}>
                <Ionicons name="heart" size={10} color="#5EEAD4" style={{ marginRight: 4 }} />
                <Text style={styles.donationBadgeText}>NGO DONATION</Text>
              </View>
            )}

            {dietaryType ? (
              <View style={styles.dietaryPill}>
                <View
                  style={[
                    styles.dietaryDot,
                    { backgroundColor: isVeg ? '#10B981' : '#F43F5E' },
                  ]}
                />
                <Text style={styles.dietaryText}>
                  {isVeg ? 'VEG' : 'NON-VEG'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Claimed Watermark Overlay */}
          {isClaimed && (
            <View style={styles.claimedWatermark}>
              <Text style={styles.claimedWatermarkText}>CLAIMED</Text>
            </View>
          )}

          {/* Hero Bottom Info (Title, Donor, Price) */}
          <View style={styles.heroBottomRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.donorRow}>
                <Ionicons
                  name="storefront-outline"
                  size={12}
                  color="#94A3B8"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.donorName} numberOfLines={1}>
                  {item.donor_name || 'Community Partner'}
                </Text>
              </View>
            </View>

            {/* Price or Free Pill */}
            {item.listing_type === 'DISCOUNT' ? (
              <View style={styles.priceContainer}>
                <Text style={styles.discountPrice}>₹{discPrice}</Text>
                {origPrice > discPrice && (
                  <Text style={styles.originalPrice}>₹{origPrice}</Text>
                )}
              </View>
            ) : (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>100% FREE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Perforated Boarding Pass Divider */}
        <View style={styles.perforationWrapper}>
          {/* Left Notch */}
          <View style={styles.notchLeft} />

          {/* Dashed Line */}
          <View style={styles.dashedDivider} />

          {/* Right Notch */}
          <View style={styles.notchRight} />
        </View>

        {/* Middle Telemetry Hub */}
        <View style={styles.telemetryRow}>
          <View style={styles.telemetryPill}>
            <Ionicons
              name="location-sharp"
              size={12}
              color="#5EEAD4"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.telemetryText} numberOfLines={1}>
              {distanceStr}
            </Text>
          </View>

          <View style={styles.telemetryPill}>
            <Ionicons
              name="cube-outline"
              size={12}
              color="#38BDF8"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.telemetryHighlight} numberOfLines={1}>
              {remainingCount} {item.quantity_unit || 'portions'} left
            </Text>
          </View>

          <View style={styles.telemetryPillUrgent}>
            <Ionicons
              name="time-outline"
              size={12}
              color="#F59E0B"
              style={{ marginRight: 4 }}
            />
            <CountdownTimer
              targetDate={item.pickup_end}
              onExpire={() => onExpire && onExpire(item.id)}
              hideExpired
            />
          </View>
        </View>

        {/* Description snippet if available */}
        {item.description ? (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Bottom Ticket Stub: Full-Width Action Button */}
        <View style={styles.ctaWrapper}>
          <ButtonTwo
            title={
              isClaimed
                ? 'Already Claimed'
                : item.listing_type === 'DONATION'
                ? 'Claim for NGO'
                : 'Buy at Discount'
            }
            icon={
              item.listing_type === 'DONATION'
                ? 'hand-right-outline'
                : 'cart-outline'
            }
            onPress={() => onClaimPress(item)}
            isLoading={isClaiming}
            disabled={isClaimed || isClaiming}
            colors={
              isClaimed
                ? ['#1E293B', '#0F172A']
                : item.listing_type === 'DONATION'
                ? ['#0D9488', '#042F2E']
                : ['#FF8A8A', '#FA5252', '#E03131']
            }
            sheen={!isClaimed}
            contentStyle={{ paddingVertical: 12 }}
            textStyle={styles.ctaText}
          />
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
    width: '100%',
  },
  ticketContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ticketClaimed: {
    opacity: 0.6,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Hero Banner
  heroBanner: {
    height: 145,
    width: '100%',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 12,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  donationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.4)',
  },
  donationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(254, 202, 202, 0.4)',
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dietaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dietaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dietaryText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '700',
  },
  claimedWatermark: {
    position: 'absolute',
    top: '35%',
    left: '20%',
    right: '20%',
    backgroundColor: 'rgba(239, 68, 68, 0.88)',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    zIndex: 5,
  },
  claimedWatermarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  donorName: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FA5252',
  },
  originalPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  freeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // Perforated Divider
  perforationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
    position: 'relative',
    marginVertical: 4,
  },
  notchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#042F2E',
    marginLeft: -8,
  },
  notchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#042F2E',
    marginRight: -8,
  },
  dashedDivider: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
    marginHorizontal: 6,
  },

  // Telemetry Row
  telemetryRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  telemetryText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  telemetryHighlight: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  telemetryPillUrgent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },

  // Description
  descriptionText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  // CTA
  ctaWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
