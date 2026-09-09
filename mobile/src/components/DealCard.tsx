import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import CountdownTimer from './CountdownTimer';
import ButtonTwo from './ButtonTwo';
import api from '../utils/api';

export interface DealCardProps {
  item: any;
  distance?: string;
  index?: number;
  onPress?: (item: any) => void;
  onClaim?: (item: any) => void;
  onExpire?: () => void;
}

export default function DealCard({
  item,
  distance = 'Nearby',
  index = 0,
  onPress,
  onClaim,
  onExpire,
}: DealCardProps) {
  const origPrice = Number(item.original_price) || 0;
  const discPrice = Number(item.discounted_price) || 0;
  const savings = Math.max(0, origPrice - discPrice);

  let discountPercent = 0;
  if (origPrice > 0 && discPrice < origPrice) {
    discountPercent = Math.round(((origPrice - discPrice) / origPrice) * 100);
  }

  const isExpired =
    Boolean(item.forceExpired) ||
    Boolean(item.is_expired) ||
    item.status === 'EXPIRED' ||
    (item.pickup_end && new Date(item.pickup_end).getTime() <= Date.now());

  const remainingCount =
    item.quantity_remaining !== undefined ? item.quantity_remaining : item.quantity_available;
  const isSoldOut = remainingCount !== undefined && remainingCount <= 0;
  const isClaimed = item.is_claimed || isSoldOut || isExpired;

  const rawImage = item.image_url || item.food_image || item.image;
  const imageUrl = rawImage
    ? (typeof rawImage === 'string' && (rawImage.startsWith('http') || rawImage.startsWith('data:'))
        ? rawImage
        : (api.defaults.baseURL ? `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${rawImage.startsWith('/') ? '' : '/'}${rawImage}` : rawImage))
    : null;

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(item);
    }
  };

  const handleClaimPress = () => {
    if (!isClaimed && onClaim) {
      onClaim(item);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: Math.min(index * 60, 300) }}
    >
      <TouchableOpacity
        style={[styles.card, isClaimed && styles.cardClaimed]}
        activeOpacity={0.88}
        onPress={handleCardPress}
      >
        {/* Holographic Top Glow Rim */}
        <LinearGradient
          colors={['rgba(94, 234, 212, 0.25)', 'transparent']}
          style={styles.topGlowRim}
        />

        {/* Full-Bleed Curved Media Header */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Ionicons name="fast-food-outline" size={36} color="#64748B" />
              <Text style={styles.noImageText}>Delicious Surplus</Text>
            </View>
          )}

          {/* Bottom Shadow Vignette */}
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.85)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Floating Glass Tags Overlay */}
          <View style={styles.floatingTopRow}>
            {discountPercent > 0 && !isExpired ? (
              <View style={styles.discountGlassPill}>
                <Ionicons name="flash" size={11} color="#042F2E" style={{ marginRight: 3 }} />
                <Text style={styles.discountGlassText}>{discountPercent}% OFF</Text>
              </View>
            ) : <View />}

            <View style={styles.distanceGlassPill}>
              <Ionicons name="location-sharp" size={11} color="#5EEAD4" style={{ marginRight: 3 }} />
              <Text style={styles.distanceGlassText}>{distance}</Text>
            </View>
          </View>

          {/* Portions Remaining Floating Tag */}
          <View style={styles.floatingBottomRow}>
            <View style={[styles.portionGlassPill, remainingCount <= 3 && styles.portionGlassPillLow]}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isSoldOut ? '#64748B' : remainingCount <= 3 ? '#FB7185' : '#34D399' },
                ]}
              />
              <Text style={[styles.portionGlassText, remainingCount <= 3 && styles.portionGlassTextLow]}>
                {isSoldOut ? 'Sold out' : `${remainingCount} left`}
              </Text>
            </View>
          </View>
        </View>

        {/* Capsule Body */}
        <View style={styles.bodyContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>

            <View style={styles.vendorRow}>
              <Ionicons name="storefront-outline" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
              <Text style={styles.vendorName} numberOfLines={1}>
                {item.donor_name || 'Verified Kitchen'}
              </Text>
              <Ionicons name="checkmark-circle" size={12} color="#5EEAD4" style={{ marginLeft: 3 }} />
            </View>
          </View>

          {item.description ? (
            <Text style={styles.descriptionText} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>

        {/* Floating Action Dock */}
        <View style={styles.actionDock}>
          {/* Countdown timer / Status */}
          <View style={styles.timerWrapper}>
            <Ionicons
              name={isExpired ? 'alert-circle-outline' : 'time-outline'}
              size={13}
              color={isExpired ? '#FB7185' : '#F59E0B'}
              style={{ marginRight: 4 }}
            />
            {isExpired ? (
              <Text style={styles.expiredLabel}>Offer Ended</Text>
            ) : (
              <CountdownTimer targetDate={item.pickup_end} onExpire={onExpire} />
            )}
          </View>

          {/* Price & Buy Now Pill CTA */}
          <View style={styles.rightDock}>
            <View style={styles.priceContainer}>
              <Text style={styles.discPrice}>₹{discPrice.toFixed(0)}</Text>
              {origPrice > discPrice && (
                <Text style={styles.origPrice}>₹{origPrice.toFixed(0)}</Text>
              )}
            </View>

            <ButtonTwo
              title={isExpired ? 'Ended' : isSoldOut ? 'Sold Out' : 'Buy Now'}
              onPress={handleClaimPress}
              disabled={isClaimed}
              colors={isClaimed ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.08)'] : ['#0D9488', '#042F2E']}
              sheen={!isClaimed}
              style={styles.buyNowBtn}
              contentStyle={styles.buyNowContent}
              textStyle={styles.buyNowText}
            />
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardClaimed: {
    opacity: 0.6,
  },
  topGlowRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  imageContainer: {
    width: '100%',
    height: 145,
    position: 'relative',
    backgroundColor: '#042F2E',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  floatingTopRow: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  discountGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5EEAD4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  discountGlassText: {
    color: '#042F2E',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  distanceGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  distanceGlassText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
  },
  floatingBottomRow: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    zIndex: 5,
  },
  portionGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
  },
  portionGlassPillLow: {
    borderColor: 'rgba(244, 63, 94, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  portionGlassText: {
    color: '#5EEAD4',
    fontSize: 10,
    fontWeight: '700',
  },
  portionGlassTextLow: {
    color: '#FB7185',
  },
  bodyContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '45%',
  },
  vendorName: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    flexShrink: 1,
  },
  descriptionText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginTop: 2,
  },
  actionDock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 47, 46, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(94, 234, 212, 0.12)',
  },
  timerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiredLabel: {
    fontSize: 11,
    color: '#FB7185',
    fontWeight: '700',
  },
  rightDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  discPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#5EEAD4',
  },
  origPrice: {
    fontSize: 12,
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  buyNowBtn: {
    borderRadius: 12,
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  buyNowContent: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
  },
  buyNowText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
