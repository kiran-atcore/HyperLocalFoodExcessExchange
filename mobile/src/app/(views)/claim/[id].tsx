import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Modal, Platform, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';

import MiniMap from '../../../components/MiniMap';
import ButtonOne from '../../../components/ButtonOne';
import ButtonTwo from '../../../components/ButtonTwo';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';
import { useAlert } from '../../../context/AlertContext';

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

export default function ClaimDetailScreen() {
  const { id } = useLocalSearchParams();
  const { showAlert } = useAlert();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}/`);
      setOrder(response.data);
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load claim details',
      });
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = order?.status === 'PICKED_UP';
  const isApproved = order?.status === 'APPROVED';
  const isCancelled = order?.status === 'CANCELLED';
  const isExpired = order?.status === 'EXPIRED';

  const handleAutoExpire = async () => {
    if (order && order.status !== 'PICKED_UP' && order.status !== 'CANCELLED' && order.status !== 'EXPIRED') {
      try {
        await api.patch(`/orders/${id}/expire/`);
      } catch (e) {
        console.error("Auto expire failed", e);
      }
      setOrder({ ...order, status: 'EXPIRED' });
      Toast.show({
        type: 'error',
        text1: 'Claim Expired',
        text2: 'The pickup time window has ended.',
      });
    }
  };

  const confirmCancelClaim = async () => {
    setCancelModalVisible(false);
    setIsCancelling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await api.patch(`/orders/${id}/cancel/`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Claim Released',
        text2: 'You have cancelled your claim.',
      });
      router.replace('/(shelter)' as any);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel claim. Please try again.',
      });
      setIsCancelling(false);
    }
  };

  const saveQRCode = async () => {
    if (!qrRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
    if (status !== 'granted') {
      showAlert(
        'Permission Required',
        'Permission is required to save the QR code to your photo gallery.',
        'warning'
      );
      return;
    }

    try {
      qrRef.current.toDataURL(async (data: string) => {
        const tempFilePath = FileSystem.cacheDirectory + `QR_Claim_${id}.png`;
        await FileSystem.writeAsStringAsync(tempFilePath, data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await MediaLibrary.saveToLibraryAsync(tempFilePath);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert(
          'Saved to Gallery',
          'Your claim QR code has been successfully saved to your photo gallery.',
          'success',
          undefined,
          'Done'
        );
      });
    } catch (error) {
      showAlert(
        'Save Failed',
        'Could not save the QR code to your photo gallery. Please try again.',
        'error'
      );
    }
  };

  const handleContactDonor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const donorPhone =
      order?.listing_details?.donor_phone ||
      order?.donor_phone ||
      order?.listing_details?.phone_number ||
      order?.phone_number;
    if (donorPhone) {
      const cleanPhone = String(donorPhone).replace(/[^0-9+]/g, '');
      Linking.openURL(`tel:${cleanPhone}`).catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Cannot Open Dialer',
          text2: `Phone: ${donorPhone}`,
        });
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Phone Number Unavailable',
        text2: `No contact number listed for ${order?.listing_details?.donor_name || 'this donor'}.`,
      });
    }
  };

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
              <Ionicons name="receipt" size={36} color="#5EEAD4" />
            </MotiView>
            <Text style={styles.loadingText}>Fetching claim details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <ParticlesBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.notFoundContainer}>
            <Ionicons name="alert-circle-outline" size={56} color="#FDA4AF" />
            <Text style={styles.notFoundTitle}>Claim Not Found</Text>
            <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
              <Text style={styles.backHomeBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const statusColor = isCompleted
    ? '#10B981'
    : isApproved
      ? '#38BDF8'
      : isCancelled || isExpired
        ? '#F43F5E'
        : '#F59E0B';

  const statusLabel = isCompleted
    ? 'PICKED UP'
    : isApproved
      ? 'CONFIRMED'
      : isCancelled
        ? 'CANCELLED'
        : isExpired
          ? 'EXPIRED'
          : 'AWAITING PICKUP';

  return (
    <View style={styles.container}>
      <ParticlesBackground />

      {/* Floating Top Header */}
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
            <View style={styles.headerPill}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.headerPillText}>{statusLabel}</Text>
            </View>
            <Text style={styles.headerSubtitle}>Claim #{id}</Text>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Hero Card */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120 }}
          style={styles.statusHeroCard}
        >
          <View style={[styles.statusIconHalo, { borderColor: `${statusColor}50`, backgroundColor: `${statusColor}18` }]}>
            <Ionicons
              name={
                isCompleted
                  ? 'checkmark-circle'
                  : isApproved
                    ? 'checkmark-done-circle'
                    : isCancelled || isExpired
                      ? 'close-circle'
                      : 'time'
              }
              size={36}
              color={statusColor}
            />
          </View>

          <Text style={[styles.statusHeroTitle, { color: statusColor }]}>{statusLabel}</Text>

          <Text style={styles.statusHeroSubtitle}>
            {isCompleted
              ? 'You have successfully picked up this surplus rescue.'
              : isCancelled
                ? `This claim was cancelled by ${order.cancelled_by_details?.role === 'donor' ? 'the donor' : 'you'}.`
                : isExpired
                  ? 'The scheduled pickup window ended before confirmation.'
                  : 'Your claim has been secured. Show your QR code to the donor upon arrival.'}
          </Text>

          {/* Timeline Stepper */}
          {!isCancelled && !isExpired && (
            <View style={styles.timelineStepper}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepCircleActive]}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
                <Text style={[styles.stepText, styles.stepTextActive]}>Claimed</Text>
              </View>

              <View style={[styles.stepLine, styles.stepLineActive]} />

              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, isCompleted ? styles.stepCircleActive : styles.stepCirclePulsing]}>
                  <Ionicons name={isCompleted ? "checkmark" : "time"} size={12} color="#FFFFFF" />
                </View>
                <Text style={[styles.stepText, !isCompleted && styles.stepTextPulsing]}>Transit</Text>
              </View>

              <View style={[styles.stepLine, isCompleted && styles.stepLineActive]} />

              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, isCompleted && styles.stepCircleActive]}>
                  <Ionicons name={isCompleted ? "bag-check" : "radio-button-off"} size={12} color={isCompleted ? "#FFFFFF" : "#64748B"} />
                </View>
                <Text style={[styles.stepText, isCompleted && styles.stepTextActive]}>Complete</Text>
              </View>
            </View>
          )}
        </MotiView>

        {/* Verification QR Card */}
        {!isCompleted && !isCancelled && !isExpired && (
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 80 }}
            style={styles.glassCard}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="qr-code-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>DIGITAL PICKUP PASSPORT</Text>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={`claim:${order.qr_code_id}`}
                  size={160}
                  getRef={(c) => (qrRef.current = c)}
                  backgroundColor="#FFFFFF"
                  color="#0F172A"
                />
              </View>

              <Text style={styles.qrCaption}>
                Scan upon arrival at donor facility to verify organization credentials.
              </Text>

              <TouchableOpacity style={styles.saveQrBtn} onPress={saveQRCode} activeOpacity={0.8}>
                <LinearGradient
                  colors={['rgba(94, 234, 212, 0.2)', 'rgba(13, 148, 136, 0.25)']}
                  style={styles.saveQrGradient}
                >
                  <Ionicons name="download-outline" size={16} color="#5EEAD4" style={{ marginRight: 6 }} />
                  <Text style={styles.saveQrText}>Save to Photos</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </MotiView>
        )}

        {/* Pickup Logistics & Specs Card */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 120 }}
          style={styles.glassCard}
        >
          <View style={styles.cardHeaderRow}>
            <Ionicons name="document-text-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
            <Text style={styles.cardSectionTitle}>LOGISTICS SUMMARY</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Donor Facility:</Text>
            <Text style={styles.infoValue}>{order.listing_details?.donor_name || 'Verified Kitchen'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Listing Title:</Text>
            <Text style={styles.infoValue}>{order.listing_details?.title || 'Surplus Food'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Claim Quantity:</Text>
            <Text style={styles.infoValue}>
              {order.quantity || 1} {order.listing_details?.quantity_unit || 'portions'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requested At:</Text>
            <Text style={styles.infoValue}>
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {!isCompleted && !isCancelled && !isExpired && order.listing_details?.pickup_end && (
            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingTop: 12 }]}>
              <Text style={styles.infoLabel}>Remaining Window:</Text>
              <View style={styles.timerPill}>
                <Ionicons name="timer-outline" size={13} color="#F59E0B" style={{ marginRight: 5 }} />
                <CountdownTimer
                  targetDate={order.listing_details.pickup_end}
                  onExpire={handleAutoExpire}
                />
              </View>
            </View>
          )}
        </MotiView>

        {/* Pickup Location Map Card */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 160 }}
          style={styles.glassCard}
        >
          <View style={styles.cardHeaderRow}>
            <Ionicons name="location-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
            <Text style={styles.cardSectionTitle}>PICKUP LOCATION</Text>
          </View>
          <View style={styles.mapContainer}>
            <MiniMap
              latitude={order.listing_details?.donor_latitude || order.listing_details?.latitude || 8.5241}
              longitude={order.listing_details?.donor_longitude || order.listing_details?.longitude || 76.9366}
            />
          </View>
        </MotiView>

        {/* Action CTAs */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 200 }}
          style={styles.actionButtonsContainer}
        >
          <ButtonTwo
            title="Contact Donor"
            icon="call"
            onPress={handleContactDonor}
            colors={['#042F2E', '#0D9488']}
          />

          {!isCompleted && !isCancelled && !isExpired && (
            <ButtonOne
              title="Cancel Claim"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCancelModalVisible(true);
              }}
              disabled={isCancelling}
              isLoading={isCancelling}
              colors={['#FF8A8A', '#FA5252', '#E03131']}
              glowColor="#FF6B6B"
            />
          )}
        </MotiView>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <BlurView intensity={25} tint="dark" style={styles.absoluteFill} />

          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 180 }}
            style={styles.modalCard}
          >
            <LinearGradient colors={['#0F172A', '#020617']} style={styles.modalGradient}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="warning" size={28} color="#F43F5E" />
              </View>

              <Text style={styles.modalTitle}>Cancel This Claim?</Text>
              <Text style={styles.modalMessage}>
                Releasing this claim allows other verified organizations or individuals to rescue this surplus food.
              </Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setCancelModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelBtnText}>Keep Claim</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={confirmCancelClaim}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#BE123C', '#881337']} style={styles.modalConfirmGradient}>
                    <Text style={styles.modalConfirmBtnText}>Release</Text>
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
  navSafeArea: {
    zIndex: 10,
    backgroundColor: 'rgba(4, 47, 46, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.15)',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerRightSpacer: {
    width: 42,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },
  statusHeroCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconHalo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statusHeroSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  timelineStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  stepCirclePulsing: {
    backgroundColor: '#0D9488',
    borderColor: '#5EEAD4',
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stepTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepTextPulsing: {
    color: '#5EEAD4',
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
    marginBottom: 18,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
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
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  qrCaption: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  saveQrBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveQrGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    borderRadius: 12,
  },
  saveQrText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5EEAD4',
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
    maxWidth: '60%',
    textAlign: 'right',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  mapContainer: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
  },
  actionButtonsContainer: {
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  contactBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  contactBtnGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  cancelClaimBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  cancelClaimGradient: {
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelClaimText: {
    color: '#FDA4AF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  modalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 14,
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
