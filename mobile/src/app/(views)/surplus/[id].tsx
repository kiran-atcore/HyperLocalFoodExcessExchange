import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Animated, Platform } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';
import ButtonTwo from '../../../components/ButtonTwo';

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

export default function SurplusDetailScreen() {
  const { id } = useLocalSearchParams();
  const [listing, setListing] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actionType: 'delete' | 'cancel_order';
    orderId?: number;
  }>({
    visible: false,
    title: '',
    message: '',
    actionType: 'delete',
  });

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchListing();
      }
    }, [id])
  );

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}/`);
      setListing(response.data);
      if (response.data.pickup_end) {
        setIsExpired(new Date(response.data.pickup_end).getTime() <= new Date().getTime());
      }

      const ordersRes = await api.get(`/orders/?listing=${id}`);
      setOrders(ordersRes.data);
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load surplus details',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCancelOrderModal = (orderId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirmModal({
      visible: true,
      title: 'Cancel Claim?',
      message: 'The requester will be notified and this listing will become available for others.',
      actionType: 'cancel_order',
      orderId,
    });
  };

  const openDeleteModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfirmModal({
      visible: true,
      title: 'Delete Listing?',
      message: 'This will permanently delete this surplus item. This action cannot be undone.',
      actionType: 'delete',
    });
  };

  const handleModalConfirm = async () => {
    const { actionType, orderId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, visible: false }));

    if (actionType === 'cancel_order' && orderId) {
      try {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
        await api.patch(`/orders/${orderId}/cancel/`);
        Toast.show({
          type: 'success',
          text1: 'Claim Cancelled',
          text2: 'The listing is now active again.',
        });
        fetchListing();
      } catch (error) {
        fetchListing();
        Toast.show({
          type: 'error',
          text1: 'Cancellation Failed',
          text2: 'Could not cancel the claim. Try again.',
        });
      }
    } else if (actionType === 'delete') {
      try {
        await api.delete(`/listings/${id}/`);
        Toast.show({
          type: 'success',
          text1: 'Listing Deleted',
          text2: 'Your surplus listing has been removed.',
        });
        router.back();
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Delete Failed',
          text2: 'Could not delete listing.',
        });
      }
    }
  };

  // Check urgency (< 2 hours remaining)
  const isUrgent = Boolean(
    listing?.pickup_end &&
    !isExpired &&
    new Date(listing.pickup_end).getTime() - Date.now() > 0 &&
    new Date(listing.pickup_end).getTime() - Date.now() < 2 * 60 * 60 * 1000
  );

  // Parallax interpolations
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
              <Ionicons name="fast-food" size={36} color="#5EEAD4" />
            </MotiView>
            <Text style={styles.loadingText}>Fetching surplus info...</Text>
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
            <Text style={styles.notFoundTitle}>Listing Not Found</Text>
            <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
              <Text style={styles.backHomeBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isDonation = listing.listing_type === 'DONATION';
  const remainingCount = listing.quantity_remaining !== undefined ? listing.quantity_remaining : listing.quantity_available;
  const displayCount = isDonation ? listing.quantity_available : remainingCount;
  const imageUrl = listing.food_image || listing.image;
  const isPickedUp = listing.donor_status === 'Picked Up' || (orders.length > 0 && orders.some(o => o.status === 'PICKED_UP') && !orders.some(o => o.status === 'PENDING' || o.status === 'CONFIRMED'));
  const isSoldOut = !isDonation && (listing.quantity_remaining !== undefined ? listing.quantity_remaining <= 0 : listing.donor_status === 'Sold Out');
  const isClaimed = isDonation && (listing.is_claimed || listing.donor_status === 'Claimed' || (orders.length > 0 && orders.some(o => o.status === 'CONFIRMED' || o.status === 'PICKED_UP')));
  const isListingExpired =
    Boolean(isExpired) ||
    Boolean(listing.is_expired) ||
    listing.donor_status === 'Expired' ||
    listing.status === 'EXPIRED' ||
    listing.status === 'Expired' ||
    Boolean(listing.pickup_end && new Date(listing.pickup_end).getTime() <= Date.now());
  const isPartiallySold = !isDonation && !isSoldOut && !isListingExpired && !isPickedUp && (listing.donor_status === 'Partially Sold' || (remainingCount < listing.quantity_available && remainingCount > 0));

  const getStatusInfo = () => {
    if (isDonation) {
      if (isPickedUp) return { label: 'PICKED UP', color: '#10B981', border: 'rgba(16, 185, 129, 0.35)' };
      if (isClaimed) return { label: 'CLAIMED', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.35)' };
      if (isListingExpired) return { label: 'EXPIRED', color: '#F43F5E', border: 'rgba(244, 63, 94, 0.35)' };
      return { label: 'ACTIVE', color: '#10B981', border: 'rgba(16, 185, 129, 0.35)' };
    } else {
      if (isSoldOut) return { label: 'SOLD OUT', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.35)' };
      if (isListingExpired) return { label: 'EXPIRED', color: '#F43F5E', border: 'rgba(244, 63, 94, 0.35)' };
      if (isPartiallySold) return { label: 'PARTIALLY SOLD', color: '#38BDF8', border: 'rgba(56, 189, 248, 0.35)' };
      return { label: 'ACTIVE', color: '#10B981', border: 'rgba(16, 185, 129, 0.35)' };
    }
  };

  const statusInfo = getStatusInfo();

  // Pricing & Valuation ratios for Visualizer
  const originalP = Number(listing.original_price) || 0;
  const discountedP = Number(listing.discounted_price) || 0;
  const discountPercent = originalP > 0 ? Math.round(((originalP - discountedP) / originalP) * 100) : 0;
  const savingsAmount = Math.max(0, originalP - discountedP);

  const claimedFMV = Number(listing.estimated_fmv) || 0;
  const aiFMV = Number(listing.ai_suggested_value) || claimedFMV;
  const maxFMV = Math.max(claimedFMV, aiFMV, 1);
  const claimedRatio = Math.min(100, Math.round((claimedFMV / maxFMV) * 100));
  const aiRatio = Math.min(100, Math.round((aiFMV / maxFMV) * 100));

  return (
    <View style={styles.container}>
      <ParticlesBackground />

      {/* Floating Docking Top Navigation Bar */}
      <View style={styles.floatingNavContainer}>
        <Animated.View
          style={[
            styles.dockedNavBackground,
            { opacity: headerBgOpacity }
          ]}
        >
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
              {/* Collapsed State: ID and Status Dot */}
              <Animated.View style={[styles.headerPillWrapper, { opacity: headerBadgeOpacity }]}>
                <View style={[styles.headerPill, { borderColor: statusInfo.border }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                  <Text style={[styles.headerPillText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>
                <Text style={styles.headerSubtitle}>Surplus #{id}</Text>
              </Animated.View>

              {/* Docked State: Main Listing Title */}
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

      {/* Scrollable Body */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Full-Bleed Parallax Hero Banner */}
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
              <LinearGradient
                colors={['#0F766E', '#042F2E']}
                style={styles.heroPlaceholder}
              >
                <Ionicons name="restaurant" size={56} color="rgba(255,255,255,0.35)" />
              </LinearGradient>
            )}

            {/* Seamless Vignette Transition */}
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

          {/* Hero Floating Tags (Offer + Urgency Countdown) */}
          <View style={styles.heroOverlayContent}>
            <View style={styles.heroBadgesRow}>
              <View style={[styles.offerTag, isDonation ? styles.donationTag : styles.discountTag]}>
                <Ionicons
                  name={isDonation ? "gift" : "pricetag"}
                  size={12}
                  color="#FFFFFF"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.offerTagText}>
                  {isDonation ? '100% FREE DONATION' : `${discountPercent}% OFF`}
                </Text>
              </View>

              {listing.pickup_end && !isExpired && !isPickedUp && (
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

            {/* Title and Price Showcase */}
            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroTitle} numberOfLines={2}>{listing.title}</Text>
              {!isDonation && (
                <View style={styles.heroPriceRow}>
                  <Text style={styles.heroDiscountPrice}>₹{listing.discounted_price}</Text>
                  {!!listing.original_price && (
                    <Text style={styles.heroOriginalPrice}>₹{listing.original_price}</Text>
                  )}
                  <View style={styles.savePill}>
                    <Text style={styles.savePillText}>Save ₹{savingsAmount.toFixed(0)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.bodyContent}>
          {/* Micro-Interactive Spec Tiles */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 80 }}
            style={styles.specsGrid}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Haptics.selectionAsync()}
              style={styles.specBox}
            >
              <View style={[styles.specIconHalo, { borderColor: 'rgba(94, 234, 212, 0.35)' }]}>
                <Ionicons name="cube-outline" size={18} color="#5EEAD4" />
              </View>
              <Text style={styles.specLabel}>Available</Text>
              <Text style={styles.specValue}>
                {displayCount} {listing.quantity_unit || 'portions'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Haptics.selectionAsync()}
              style={styles.specBox}
            >
              <View style={[styles.specIconHalo, { borderColor: 'rgba(52, 211, 153, 0.35)' }]}>
                <Ionicons name="leaf-outline" size={18} color="#34D399" />
              </View>
              <Text style={styles.specLabel}>Dietary</Text>
              <Text style={styles.specValue}>{listing.dietary_info || 'Standard'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Haptics.selectionAsync()}
              style={styles.specBox}
            >
              <View style={[styles.specIconHalo, { borderColor: 'rgba(56, 189, 248, 0.35)' }]}>
                <Ionicons name="calendar-outline" size={18} color="#38BDF8" />
              </View>
              <Text style={styles.specLabel}>Posted</Text>
              <Text style={styles.specValue}>
                {new Date(listing.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>
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

          {/* AI Valuation & Benchmark Visualizer (For Donations) */}
          {isDonation && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 160 }}
              style={styles.glassCard}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
                <Text style={styles.cardSectionTitle}>TAX & VALUATION BENCHMARK</Text>
              </View>

              {/* Comparative Gauge Bar */}
              <View style={styles.visualizerContainer}>
                <View style={styles.gaugeLabelsRow}>
                  <View>
                    <Text style={styles.gaugeMicroLabel}>Claimed FMV</Text>
                    <Text style={styles.gaugeValueHighlight}>₹{claimedFMV}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.gaugeMicroLabel}>AI Benchmark</Text>
                    <Text style={[styles.gaugeValueHighlight, { color: '#38BDF8' }]}>₹{aiFMV}</Text>
                  </View>
                </View>

                {/* Progress Bar comparison */}
                <View style={styles.gaugeTrack}>
                  <LinearGradient
                    colors={['#0D9488', '#38BDF8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gaugeFill, { width: `${Math.max(15, claimedRatio)}%` }]}
                  />
                  {/* AI target marker */}
                  <View style={[styles.aiMarker, { left: `${Math.max(5, Math.min(95, aiRatio))}%` }]} />
                </View>

                <Text style={styles.visualizerCaption}>
                  {claimedFMV <= aiFMV
                    ? '✓ Valuation is within approved AI tax-deduction guidelines'
                    : '⚠ Claimed value exceeds standard automated estimation benchmark'}
                </Text>
              </View>

              {/* Verification Status with Pulsing Radar Dot */}
              <View style={styles.statusVerifiedRow}>
                <Text style={styles.infoLabel}>AI Compliance Status:</Text>
                {listing.is_ai_flagged ? (
                  <View style={styles.flaggedChip}>
                    <Ionicons name="alert-circle" size={13} color="#F59E0B" style={{ marginRight: 4 }} />
                    <Text style={styles.flaggedChipText}>Manual Review Required</Text>
                  </View>
                ) : (
                  <View style={styles.verifiedChip}>
                    <View style={styles.radarContainer}>
                      <MotiView
                        from={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ loop: true, type: 'timing', duration: 1800 }}
                        style={styles.radarRing}
                      />
                      <View style={styles.radarDot} />
                    </View>
                    <Text style={styles.verifiedChipText}>AI Verified</Text>
                  </View>
                )}
              </View>
            </MotiView>
          )}

          {/* Pricing Details & Savings Visualizer (For Discounts) */}
          {!isDonation && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 160 }}
              style={styles.glassCard}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons name="pricetags-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
                <Text style={styles.cardSectionTitle}>PRICING & CONSUMER SAVINGS</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Original Retail:</Text>
                <Text style={[styles.infoValue, { textDecorationLine: 'line-through', color: '#94A3B8' }]}>
                  ₹{originalP.toFixed(2)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Offer Price:</Text>
                <Text style={[styles.infoValue, { color: '#10B981', fontSize: 17 }]}>
                  ₹{discountedP.toFixed(2)}
                </Text>
              </View>

              {/* Visual Savings Bar */}
              <View style={styles.savingsTrackContainer}>
                <View style={styles.savingsHeaderRow}>
                  <Text style={styles.infoLabel}>Savings per unit:</Text>
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
          )}

          {/* Additional Notes */}
          {listing.additional_details ? (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 180 }}
              style={styles.glassCard}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons name="information-circle-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
                <Text style={styles.cardSectionTitle}>ADDITIONAL NOTES</Text>
              </View>
              <Text style={styles.descriptionText}>{listing.additional_details}</Text>
            </MotiView>
          ) : null}

          {/* Claims Flow Stepper Section */}
          {orders.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 200 }}
              style={styles.claimsSection}
            >
              <View style={styles.claimsHeader}>
                <Ionicons name="people-outline" size={18} color="#5EEAD4" style={{ marginRight: 8 }} />
                <Text style={styles.sectionHeaderTitle}>CLAIMS & PICKUPS ({orders.length})</Text>
              </View>

              {orders.map((o: any) => {
                const isClaimPickedUp = o.status === 'PICKED_UP';
                const isCancelled = o.status === 'CANCELLED';
                const isExpiredStatus = o.status === 'EXPIRED';
                const isClaimInactive = isCancelled || isExpiredStatus;

                // Determine who cancelled the claim
                let cancelledByLabel = 'Cancelled';
                if (isCancelled) {
                  const cancellerName = o.cancelled_by_details?.name || (o.cancelled_by === listing.donor ? (listing.donor_name || 'Donor') : (o.requester_details?.name || 'Receiver'));
                  const isCancelledByDonor = o.cancelled_by === listing.donor || (o.cancelled_by_details && o.cancelled_by_details.role === 'donor');
                  cancelledByLabel = `Cancelled by ${isCancelledByDonor ? `Donor (${cancellerName})` : `Receiver (${cancellerName})`}`;
                }

                return (
                  <View key={o.id} style={[styles.orderCard, isClaimInactive && styles.orderCardInactive]}>
                    {/* Header: Requester Info + Status Badge */}
                    <View style={styles.orderCardHeader}>
                      <View style={styles.orderAvatar}>
                        <Ionicons
                          name={o.requester_details?.role === 'shelter' ? 'business' : 'person'}
                          size={16}
                          color="#5EEAD4"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <Text style={styles.orderName} numberOfLines={1}>
                            {o.requester_details?.name || `Requester #${o.requester}`}
                          </Text>
                          {/* Claim Status Badge (Cancelled / Expired only) */}
                          {isCancelled && (
                            <View style={[styles.claimStatusBadge, styles.badgeCancelled]}>
                              <Ionicons name="close-circle" size={10} color="#F43F5E" style={{ marginRight: 3 }} />
                              <Text style={styles.badgeCancelledText}>CANCELLED</Text>
                            </View>
                          )}
                          {isExpiredStatus && (
                            <View style={[styles.claimStatusBadge, styles.badgeExpired]}>
                              <Ionicons name="time" size={10} color="#F59E0B" style={{ marginRight: 3 }} />
                              <Text style={styles.badgeExpiredText}>EXPIRED</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.orderRoleText}>
                          {o.requester_details?.role === 'shelter' ? 'Partner Shelter' : 'Verified Consumer'} • {o.quantity || 1} {listing.quantity_unit || 'portions'}
                        </Text>
                      </View>

                      {!isClaimPickedUp && !isClaimInactive && (
                        <TouchableOpacity
                          style={styles.cancelClaimBtn}
                          onPress={() => openCancelOrderModal(o.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.cancelClaimBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Timeline Flow Stepper or Inactive Info Box */}
                    {isCancelled ? (
                      <View style={styles.cancelledAlertBox}>
                        <Ionicons name="information-circle" size={15} color="#FDA4AF" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cancelledAlertTitle}>Claim Cancelled</Text>
                          <Text style={styles.cancelledAlertText}>{cancelledByLabel}</Text>
                        </View>
                      </View>
                    ) : isExpiredStatus ? (
                      <View style={styles.expiredAlertBox}>
                        <Ionicons name="hourglass-outline" size={15} color="#FCD34D" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.expiredAlertTitle}>Claim Expired</Text>
                          <Text style={styles.expiredAlertText}>Pickup window closed before completion</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.timelineStepper}>
                        {/* Step 1: Claimed */}
                        <View style={styles.stepItem}>
                          <View style={[styles.stepCircle, styles.stepCircleActive]}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                          <Text style={[styles.stepText, styles.stepTextActive]}>Claimed</Text>
                        </View>

                        {/* Connector 1 */}
                        <View style={[styles.stepLine, styles.stepLineActive]} />

                        {/* Step 2: Transit */}
                        <View style={styles.stepItem}>
                          <View style={[
                            styles.stepCircle,
                            isClaimPickedUp ? styles.stepCircleActive : styles.stepCirclePulsing
                          ]}>
                            <Ionicons
                              name={isClaimPickedUp ? "checkmark" : "time"}
                              size={12}
                              color="#FFFFFF"
                            />
                          </View>
                          <Text style={[
                            styles.stepText,
                            !isClaimPickedUp && styles.stepTextPulsing
                          ]}>
                            Awaiting Pickup
                          </Text>
                        </View>

                        {/* Connector 2 */}
                        <View style={[styles.stepLine, isClaimPickedUp && styles.stepLineActive]} />

                        {/* Step 3: Picked Up */}
                        <View style={styles.stepItem}>
                          <View style={[styles.stepCircle, isClaimPickedUp && styles.stepCircleActive]}>
                            <Ionicons
                              name={isClaimPickedUp ? "bag-check" : "radio-button-off"}
                              size={12}
                              color={isClaimPickedUp ? "#FFFFFF" : "#64748B"}
                            />
                          </View>
                          <Text style={[styles.stepText, isClaimPickedUp && styles.stepTextActive]}>
                            Completed
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </MotiView>
          )}

          {/* Action CTAs */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 220 }}
            style={styles.actionButtonsContainer}
          >
            {isPickedUp ? (
              <TouchableOpacity
                style={[styles.deleteButton, { flex: 1 }]}
                onPress={openDeleteModal}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(225, 29, 72, 0.25)', 'rgba(159, 18, 57, 0.4)']}
                  style={styles.deleteButtonGradient}
                >
                  <Ionicons name="trash-outline" size={18} color="#FDA4AF" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <ButtonTwo
                  title={isExpired ? 'Reactivate Surplus' : 'Edit Listing'}
                  icon={isExpired ? 'refresh-outline' : 'create-outline'}
                  colors={isExpired ? ['#042F2E', '#10B981'] : ['#042F2E', '#0D9488']}
                  style={{ flex: 2 }}
                  onPress={() => router.push(`/(forms)/edit-surplus/${id}` as any)}
                />

                {(isExpired || !orders.some(o => o.status !== 'PICKED_UP' && o.status !== 'CANCELLED' && o.status !== 'EXPIRED') || (listing.quantity_remaining !== undefined ? listing.quantity_remaining > 0 : listing.quantity_available > 0)) && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={openDeleteModal}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(225, 29, 72, 0.25)', 'rgba(159, 18, 57, 0.4)']}
                      style={styles.deleteButtonGradient}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FDA4AF" style={{ marginRight: 6 }} />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            )}
          </MotiView>
        </View>
      </Animated.ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalBackdrop}>
          <BlurView intensity={25} tint="dark" style={styles.absoluteFill} />

          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 180 }}
            style={styles.modalCard}
          >
            <LinearGradient
              colors={['#0F172A', '#020617']}
              style={styles.modalGradient}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons
                  name={confirmModal.actionType === 'delete' ? "trash" : "warning"}
                  size={28}
                  color={confirmModal.actionType === 'delete' ? "#F43F5E" : "#F59E0B"}
                />
              </View>

              <Text style={styles.modalTitle}>{confirmModal.title}</Text>
              <Text style={styles.modalMessage}>{confirmModal.message}</Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleModalConfirm}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={confirmModal.actionType === 'delete' ? ['#BE123C', '#881337'] : ['#D97706', '#92400E']}
                    style={styles.modalConfirmGradient}
                  >
                    <Text style={styles.modalConfirmBtnText}>
                      {confirmModal.actionType === 'delete' ? 'Delete' : 'Confirm Cancel'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </MotiView>
        </View>
      </Modal>
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
    paddingBottom: 50,
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
  donationTag: {
    backgroundColor: '#059669',
    borderColor: '#34D399',
    borderWidth: 1,
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
  visualizerContainer: {
    backgroundColor: 'rgba(4, 47, 46, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.12)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  gaugeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  gaugeMicroLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gaugeValueHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'visible',
    position: 'relative',
    marginVertical: 6,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  aiMarker: {
    position: 'absolute',
    top: -3,
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  visualizerCaption: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 16,
  },
  statusVerifiedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  radarContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  radarRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  radarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  verifiedChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  flaggedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  flaggedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
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
    marginBottom: 6,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
  },
  claimsSection: {
    marginBottom: 20,
  },
  claimsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 0.8,
  },
  orderCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  orderCardInactive: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(94, 234, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderRoleText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  claimStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeCancelled: {
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  badgeCancelledText: {
    color: '#FDA4AF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeExpired: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeExpiredText: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  badgeCompletedText: {
    color: '#6EE7B7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.4)',
  },
  badgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5EEAD4',
    marginRight: 4,
  },
  badgeActiveText: {
    color: '#5EEAD4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelClaimBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cancelClaimBtnText: {
    color: '#FDA4AF',
    fontWeight: '700',
    fontSize: 12,
  },
  cancelledAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelledAlertTitle: {
    color: '#FDA4AF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelledAlertText: {
    color: '#FECDD3',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  expiredAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  expiredAlertTitle: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '700',
  },
  expiredAlertText: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  timelineStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  stepCirclePulsing: {
    backgroundColor: '#F59E0B',
    borderColor: '#FCD34D',
  },
  stepText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  stepTextActive: {
    color: '#34D399',
    fontWeight: '700',
  },
  stepTextPulsing: {
    color: '#FCD34D',
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 6,
    marginBottom: 14,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  deleteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(253, 164, 175, 0.3)',
    borderRadius: 18,
  },
  deleteButtonText: {
    color: '#FDA4AF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 20,
  },
  backHomeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});


