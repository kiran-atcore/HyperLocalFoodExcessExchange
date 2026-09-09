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
import ButtonTwo from '../../../components/ButtonTwo';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';
import EtaSelectionModal from '../../../components/EtaSelectionModal';

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

export default function DonationViewScreen() {
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
        text2: 'Failed to load donation details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsEtaModalVisible(true);
  };

  const submitClaim = async (etaMins: number) => {
    setIsEtaModalVisible(false);
    setIsClaiming(true);
    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { listing: id, eta });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Donation successfully claimed!',
      });
      router.replace(`/(views)/claim/${response.data.id}` as any);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Claim Failed',
        text2: e.response?.data?.error || 'Unable to claim donation.',
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
              <Ionicons name="gift" size={36} color="#5EEAD4" />
            </MotiView>
            <Text style={styles.loadingText}>Fetching donation details...</Text>
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
            <Text style={styles.notFoundTitle}>Donation Not Found</Text>
            <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
              <Text style={styles.backHomeBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const imageUrl = listing.image || listing.food_image;
  const claimedFMV = Number(listing.estimated_fmv) || 0;
  const aiFMV = Number(listing.ai_suggested_value) || claimedFMV;
  const maxFMV = Math.max(claimedFMV, aiFMV, 1);
  const claimedRatio = Math.min(100, Math.round((claimedFMV / maxFMV) * 100));
  const aiRatio = Math.min(100, Math.round((aiFMV / maxFMV) * 100));

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
                    {listing.is_claimed ? 'CLAIMED' : (isExpired ? 'EXPIRED' : 'AVAILABLE')}
                  </Text>
                </View>
                <Text style={styles.headerSubtitle}>Donation ID-{id}</Text>
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
        {/* Parallax Hero */}
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
              <LinearGradient colors={['#0F766E', '#042F2E']} style={styles.heroPlaceholder}>
                <Ionicons name="gift" size={56} color="rgba(255,255,255,0.35)" />
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

          {/* Hero Floating Tags */}
          <View style={styles.heroOverlayContent}>
            <View style={styles.heroBadgesRow}>
              <View style={[styles.offerTag, styles.donationTag]}>
                <Ionicons name="gift" size={12} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.offerTagText}>100% FREE NGO DONATION</Text>
              </View>

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
              <View style={styles.vendorRow}>
                <Ionicons name="business" size={14} color="#5EEAD4" style={{ marginRight: 5 }} />
                <Text style={styles.vendorText}>
                  {listing.donor_name || 'Verified Kitchen'} {distance ? `• 📍 ${distance}` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body Content */}
        <View style={styles.bodyContent}>
          {/* Spec Grid */}
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
              <Text style={styles.specLabel}>Quantity</Text>
              <Text style={styles.specValue}>{listing.quantity_available} {listing.quantity_unit || 'portions'}</Text>
            </View>

            <View style={styles.specBox}>
              <View style={[styles.specIconHalo, { borderColor: 'rgba(52, 211, 153, 0.35)' }]}>
                <Ionicons name="leaf-outline" size={18} color="#34D399" />
              </View>
              <Text style={styles.specLabel}>Dietary</Text>
              <Text style={styles.specValue}>{listing.dietary_info || 'Prepared Meal'}</Text>
            </View>

            <View style={styles.specBox}>
              <View style={[styles.specIconHalo, { borderColor: 'rgba(56, 189, 248, 0.35)' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#38BDF8" />
              </View>
              <Text style={styles.specLabel}>Est. FMV</Text>
              <Text style={styles.specValue}>₹{claimedFMV}</Text>
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

          {/* Valuation & Benchmark Visualizer */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 160 }}
            style={styles.glassCard}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>TAX VALUATION BENCHMARK</Text>
            </View>

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

              <View style={styles.gaugeTrack}>
                <LinearGradient
                  colors={['#0D9488', '#38BDF8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.gaugeFill, { width: `${Math.max(15, claimedRatio)}%` }]}
                />
                <View style={[styles.aiMarker, { left: `${Math.max(5, Math.min(95, aiRatio))}%` }]} />
              </View>

              <Text style={styles.visualizerCaption}>
                {claimedFMV <= aiFMV
                  ? '✓ Valuation conforms with community tax-deduction guidelines.'
                  : '⚠ Claimed value exceeds standard automated estimation benchmark.'}
              </Text>
            </View>

            <View style={styles.statusVerifiedRow}>
              <Text style={styles.infoLabel}>AI Compliance Status:</Text>
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

          {/* Action Footer */}
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

            <ButtonTwo
              style={{ flex: 2 }}
              title={listing.is_claimed ? 'Already Claimed' : (isExpired ? 'Expired' : 'Claim for NGO')}
              icon={listing.is_claimed ? 'checkmark-done' : (isExpired ? 'close-circle' : 'gift')}
              onPress={handleClaimPress}
              disabled={isClaiming || listing.is_claimed || isExpired}
              isLoading={isClaiming}
              colors={
                listing.is_claimed || isExpired
                  ? ['#334155', '#1E293B']
                  : ['#0D9488', '#042F2E']
              }
            />
          </MotiView>
        </View>
      </Animated.ScrollView>

      {listing.pickup_end && (
        <EtaSelectionModal
          visible={isEtaModalVisible}
          onClose={() => setIsEtaModalVisible(false)}
          onConfirm={submitClaim}
          pickupEnd={listing.pickup_end}
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
    paddingBottom: 60,
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
  infoLabel: {
    fontSize: 14,
    color: '#94A3B8',
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
  mapContainer: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
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
  claimButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
