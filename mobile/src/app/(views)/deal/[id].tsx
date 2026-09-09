import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import MiniMap from '../../../components/MiniMap';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';
import EtaSelectionModal from '../../../components/EtaSelectionModal';
import ButtonOne from '../../../components/ButtonOne';

const ParticlesBackground = () => {
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const size = Math.random() * 4 + 2;
    return (
      <MotiView
        key={i}
        from={{
          opacity: 0,
          translateY: 0,
          translateX: (Math.random() - 0.5) * 40,
        }}
        animate={{
          opacity: [0, 0.5, 0],
          translateY: -260 - Math.random() * 150,
          translateX: (Math.random() - 0.5) * 120,
        }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 6000 + Math.random() * 4000,
          delay: Math.random() * 3000,
        }}
        style={{
          position: 'absolute',
          bottom: -40,
          left: `${Math.random() * 100}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#5EEAD4',
          shadowColor: '#5EEAD4',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: size,
        }}
      />
    );
  });

  return (
    <View style={styles.absoluteFill}>
      <LinearGradient
        colors={['#042F2E', '#0B132B', '#021815']}
        style={styles.absoluteFill}
      />
      {particles}
    </View>
  );
};

export default function DealsViewScreen() {
  const { id, distance } = useLocalSearchParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isEtaModalVisible, setIsEtaModalVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}/`);
      setListing(response.data);
      if (response.data.pickup_end) {
        setIsExpired(new Date(response.data.pickup_end).getTime() <= new Date().getTime());
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load deal details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsEtaModalVisible(true);
  };

  const submitBuyNow = async (etaMins: number, quantity: number) => {
    setIsEtaModalVisible(false);
    setIsClaiming(true);
    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { listing: id, eta, quantity });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Deal successfully claimed!',
      });
      router.replace(`/(views)/receipt/${response.data.id}` as any);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Claim Failed',
        text2: e.response?.data?.error || 'Unable to claim deal.',
      });
      setIsClaiming(false);
    }
  };

  const isUrgent = Boolean(
    listing?.pickup_end &&
    !isExpired &&
    new Date(listing.pickup_end).getTime() - Date.now() > 0 &&
    new Date(listing.pickup_end).getTime() - Date.now() < 2 * 60 * 60 * 1000
  );

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [40, 140],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [110, 170],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerBadgeOpacity = scrollY.interpolate({
    inputRange: [110, 170],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const heroTranslateY = scrollY.interpolate({
    inputRange: [-150, 0, 300],
    outputRange: [-30, 0, 90],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-150, 0],
    outputRange: [1.3, 1],
    extrapolateRight: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <ParticlesBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <MotiView
              from={{ opacity: 0.4, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1.05 }}
              transition={{ loop: true, type: 'timing', duration: 1000 }}
              style={styles.loadingPulse}
            >
              <Ionicons name="pricetag" size={36} color="#5EEAD4" />
            </MotiView>
            <Text style={styles.loadingText}>Fetching surplus deal...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.container}>
        <ParticlesBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.notFoundContainer}>
            <Ionicons name="alert-circle-outline" size={56} color="#FDA4AF" />
            <Text style={styles.notFoundTitle}>Deal Not Found</Text>
            <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
              <Text style={styles.backHomeBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const origPrice = Number(listing.original_price) || 0;
  const discPrice = Number(listing.discounted_price) || 0;
  const discountPercent = origPrice > 0 ? Math.round(((origPrice - discPrice) / origPrice) * 100) : 0;
  const savingsAmount = Math.max(0, origPrice - discPrice);
  const remainingCount = listing.quantity_remaining !== undefined ? listing.quantity_remaining : listing.quantity_available;
  const imageUrl = listing.image_url || listing.food_image || listing.image;

  return (
    <View style={styles.container}>
      <ParticlesBackground />

      {/* Floating Top Header */}
      <View style={styles.floatingNavContainer}>
        <Animated.View style={[styles.dockedNavBackground, { opacity: headerBgOpacity }]}>
          <BlurView intensity={35} tint="dark" style={styles.absoluteFill} />
          <View style={styles.dockedNavBorder} />
        </Animated.View>

        <SafeAreaView edges={['top']} style={styles.navSafeArea}>
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Animated.View style={[styles.headerPillWrapper, { opacity: headerBadgeOpacity }]}>
                <View style={styles.headerPill}>
                  <View style={[styles.statusDot, { backgroundColor: listing.is_claimed ? '#F59E0B' : (isExpired ? '#F43F5E' : '#10B981') }]} />
                  <Text style={styles.headerPillText}>
                    {listing.is_claimed ? 'SOLD OUT' : (isExpired ? 'EXPIRED' : 'AVAILABLE')}
                  </Text>
                </View>
                <Text style={styles.headerSubtitle}>Deal ID-{id}</Text>
              </Animated.View>

              <Animated.Text
                numberOfLines={1}
                style={[styles.dockedHeaderTitle, { opacity: headerTitleOpacity }]}
              >
                {listing.title}
              </Animated.Text>
            </View>

            <View style={styles.headerRightSpacer} />
          </View>
        </SafeAreaView>
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Parallax Hero Banner */}
        <View style={styles.parallaxHeroWrapper}>
          <Animated.View
            style={[
              styles.parallaxHeroInner,
              {
                transform: [
                  { translateY: heroTranslateY },
                  { scale: heroScale },
                ],
              },
            ]}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <LinearGradient colors={['#E11D48', '#042F2E']} style={styles.heroPlaceholder}>
                <Ionicons name="restaurant" size={56} color="rgba(255,255,255,0.35)" />
              </LinearGradient>
            )}

            <LinearGradient
              colors={[
                'rgba(4, 47, 46, 0.4)',
                'transparent',
                'rgba(4, 47, 46, 0.4)',
                'rgba(4, 47, 46, 0.85)',
                '#042F2E'
              ]}
              locations={[0, 0.25, 0.65, 0.88, 1]}
              style={styles.heroGradientOverlay}
            />
          </Animated.View>

          {/* Hero Floating Badges */}
          <View style={styles.heroOverlayContent}>
            <View style={styles.heroBadgesRow}>
              {discountPercent > 0 && (
                <View style={[styles.offerTag, styles.discountTag]}>
                  <Ionicons name="pricetag" size={12} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={styles.offerTagText}>{discountPercent}% OFF SURPLUS</Text>
                </View>
              )}

              {listing.pickup_end && !isExpired && !listing.is_claimed && (
                <View style={[styles.timerBadgeContainer, isUrgent && styles.timerBadgeUrgentContainer]}>
                  {isUrgent && (
                    <MotiView
                      from={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                      transition={{ loop: true, type: 'timing', duration: 1600 }}
                      style={styles.urgentHalo}
                    />
                  )}
                  <View style={[styles.timerBadge, isUrgent && styles.timerBadgeUrgent]}>
                    <Ionicons
                      name={isUrgent ? "flame" : "timer-outline"}
                      size={14}
                      color={isUrgent ? "#F43F5E" : "#5EEAD4"}
                      style={{ marginRight: 5 }}
                    />
                    <CountdownTimer
                      targetDate={listing.pickup_end}
                      onExpire={() => setIsExpired(true)}
                    />
                  </View>
                </View>
              )}
            </View>

            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroTitle} numberOfLines={2}>{listing.title}</Text>

              <View style={styles.heroPriceRow}>
                <Text style={styles.heroDiscountPrice}>₹{discPrice}</Text>
                {origPrice > discPrice && (
                  <Text style={styles.heroOriginalPrice}>₹{origPrice}</Text>
                )}
                {savingsAmount > 0 && (
                  <View style={styles.savePill}>
                    <Text style={styles.savePillText}>Save ₹{savingsAmount.toFixed(0)}</Text>
                  </View>
                )}
              </View>

              <View style={styles.vendorRow}>
                <Ionicons name="storefront" size={14} color="#5EEAD4" style={{ marginRight: 5 }} />
                <Text style={styles.vendorText}>
                  {listing.donor_name || 'Verified Vendor'} {distance ? `• 📍 ${distance}` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body Content */}
        <View style={styles.bodyContent}>
          {/* Specs Grid */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 80 }}
            style={styles.specsGrid}
          >
            <View style={styles.specBox}>
              <View style={[styles.specIconHalo, { borderColor: 'rgba(94, 234, 212, 0.35)' }]}>
                <Ionicons name="cube-outline" size={18} color="#5EEAD4" />
              </View>
              <Text style={styles.specLabel}>Available</Text>
              <Text style={styles.specValue}>{remainingCount} {listing.quantity_unit || 'portions'}</Text>
            </View>

            <View style={styles.specBox}>
              <View style={[styles.specIconHalo, { borderColor: 'rgba(52, 211, 153, 0.35)' }]}>
                <Ionicons name="leaf-outline" size={18} color="#34D399" />
              </View>
              <Text style={styles.specLabel}>Dietary</Text>
              <Text style={styles.specValue}>{listing.dietary_info || 'Standard'}</Text>
            </View>

            <View style={styles.specBox}>
              <View style={[styles.specIconHalo, { borderColor: 'rgba(56, 189, 248, 0.35)' }]}>
                <Ionicons name="calendar-outline" size={18} color="#38BDF8" />
              </View>
              <Text style={styles.specLabel}>Pickup By</Text>
              <Text style={styles.specValue}>
                {listing.pickup_end
                  ? new Date(listing.pickup_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Flexible'}
              </Text>
            </View>
          </MotiView>

          {/* Description Card */}
          {listing.description ? (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 120 }}
              style={styles.glassCard}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons name="document-text-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
                <Text style={styles.cardSectionTitle}>DESCRIPTION</Text>
              </View>
              <Text style={styles.descriptionText}>{listing.description}</Text>
            </MotiView>
          ) : null}

          {/* Pricing & Savings Card */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 160 }}
            style={styles.glassCard}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="pricetags-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>PRICING & SAVINGS BREAKDOWN</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Standard Menu Price:</Text>
              <Text style={[styles.infoValue, { textDecorationLine: 'line-through', color: '#94A3B8' }]}>
                ₹{origPrice.toFixed(2)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Excess Discount Price:</Text>
              <Text style={[styles.infoValue, { color: '#10B981', fontSize: 17 }]}>
                ₹{discPrice.toFixed(2)}
              </Text>
            </View>

            <View style={styles.savingsTrackContainer}>
              <View style={styles.savingsHeaderRow}>
                <Text style={styles.infoLabel}>Instant Discount:</Text>
                <Text style={styles.savingsText}>₹{savingsAmount.toFixed(2)} ({discountPercent}% OFF)</Text>
              </View>
              <View style={styles.gaugeTrack}>
                <LinearGradient
                  colors={['#059669', '#10B981', '#34D399']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.gaugeFill, { width: `${Math.min(100, discountPercent)}%` }]}
                />
              </View>
            </View>
          </MotiView>

          {/* Additional Details */}
          {listing.additional_details ? (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 180 }}
              style={styles.glassCard}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons name="information-circle-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
                <Text style={styles.cardSectionTitle}>ADDITIONAL DETAILS</Text>
              </View>
              <Text style={styles.descriptionText}>{listing.additional_details}</Text>
            </MotiView>
          ) : null}

          {/* Location Card */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 200 }}
            style={styles.glassCard}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="location-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>PICKUP LOCATION</Text>
            </View>
            <View style={styles.mapContainer}>
              <MiniMap
                latitude={listing?.donor_latitude || listing?.latitude || 8.5241}
                longitude={listing?.donor_longitude || listing?.longitude || 76.9366}
              />
            </View>
          </MotiView>

          {/* Action CTAs */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 220 }}
            style={styles.actionButtonsContainer}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <ButtonOne
              style={{ flex: 2, marginTop: 0 }}
              title={
                listing.is_claimed || remainingCount <= 0
                  ? 'Already Sold'
                  : (isExpired ? 'Expired' : (isClaiming ? 'Processing...' : `Buy Now • ₹${discPrice}`))
              }
              onPress={handleBuyPress}
              disabled={isClaiming || listing.is_claimed || isExpired || remainingCount <= 0}
              isLoading={isClaiming}
              colors={
                listing.is_claimed || isExpired || remainingCount <= 0
                  ? ['#334155', '#1E293B']
                  : ['#FF8A8A', '#FA5252', '#E03131']
              }
              glowColor={listing.is_claimed || isExpired || remainingCount <= 0 ? 'transparent' : '#FF6B6B'}
            />
          </MotiView>
        </View>
      </Animated.ScrollView>

      {listing.pickup_end && (
        <EtaSelectionModal
          visible={isEtaModalVisible}
          onClose={() => setIsEtaModalVisible(false)}
          onConfirm={submitBuyNow}
          pickupEnd={listing.pickup_end}
          showQuantity={true}
          maxQuantity={remainingCount}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#042F2E',
  },
  safeArea: {
    flex: 1,
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPulse: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 20,
  },
  backHomeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  floatingNavContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  dockedNavBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 47, 46, 0.88)',
  },
  dockedNavBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: 'rgba(94, 234, 212, 0.15)',
  },
  navSafeArea: {
    zIndex: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(94, 234, 212, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  headerPillWrapper: {
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dockedHeaderTitle: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    maxWidth: '80%',
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: 42,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  parallaxHeroWrapper: {
    height: 330,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'space-between',
    position: 'relative',
  },
  parallaxHeroInner: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    height: 380,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  discountTag: {
    backgroundColor: '#E11D48',
    borderColor: '#FDA4AF',
    borderWidth: 1,
  },
  offerTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  timerBadgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadgeUrgentContainer: {
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  urgentHalo: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.4)',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 47, 46, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
  },
  timerBadgeUrgent: {
    backgroundColor: 'rgba(159, 18, 57, 0.88)',
    borderColor: '#FDA4AF',
  },
  heroTitleContainer: {
    marginTop: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  heroDiscountPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10B981',
    marginRight: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroOriginalPrice: {
    fontSize: 16,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
    marginRight: 10,
  },
  savePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savePillText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  vendorText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  specsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  specBox: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },
  specIconHalo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  specLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.16)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  savingsTrackContainer: {
    marginTop: 12,
    paddingTop: 8,
  },
  savingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  mapContainer: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  backButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(94, 234, 212, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#5EEAD4',
    fontWeight: '700',
    fontSize: 15,
  },
});
