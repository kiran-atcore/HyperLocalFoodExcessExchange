import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Linking, Platform } from 'react-native';
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

export default function ReceiptViewScreen() {
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
        text2: 'Failed to load receipt details',
      });
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = order?.status === 'PICKED_UP';
  const isApproved = order?.status === 'APPROVED' || order?.status === 'CONFIRMED';
  const isCancelled = order?.status === 'CANCELLED';
  const isExpired = order?.status === 'EXPIRED';
  const isRedeemed = isCompleted || isCancelled || isExpired;

  const handleAutoExpire = async () => {
    if (order && !isRedeemed) {
      try {
        await api.patch(`/orders/${id}/expire/`);
      } catch (e) {
        console.error('Auto expire failed', e);
      }
      setOrder({ ...order, status: 'EXPIRED' });
      Toast.show({
        type: 'error',
        text1: 'Order Expired',
        text2: 'The pickup time window has ended.',
      });
    }
  };

  const confirmCancelOrder = async () => {
    setCancelModalVisible(false);
    setIsCancelling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await api.patch(`/orders/${id}/cancel/`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Order Cancelled',
        text2: 'Your order has been cancelled.',
      });
      fetchOrder();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel order. Please try again.',
      });
    } finally {
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
        const tempFilePath = FileSystem.cacheDirectory + `QR_Receipt_${id}.png`;
        await FileSystem.writeAsStringAsync(tempFilePath, data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await MediaLibrary.saveToLibraryAsync(tempFilePath);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert(
          'Saved to Gallery',
          'Your receipt QR code has been successfully saved to your photo gallery.',
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

  const handleContactVendor = () => {
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
        text2: `No contact number listed for ${order?.listing_details?.donor_name || 'this merchant'}.`,
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
            <Text style={styles.loadingText}>Generating voucher ticket...</Text>
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
            <Text style={styles.notFoundTitle}>Receipt Not Found</Text>
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
          : 'ACTIVE VOUCHER';

  const unitPrice = Number(order.listing_details?.discounted_price) || 0;
  const origUnitPrice = Number(order.listing_details?.original_price) || unitPrice;
  const quantity = Number(order.quantity) || 1;
  const totalPrice = unitPrice * quantity;
  const totalOrigPrice = origUnitPrice * quantity;
  const totalSavings = Math.max(0, totalOrigPrice - totalPrice);
  const savingsPercent = totalOrigPrice > 0 ? Math.round(((totalOrigPrice - totalPrice) / totalOrigPrice) * 100) : 0;

  const getCancelledByText = () => {
    if (order?.cancelled_by_details) {
      const role = order.cancelled_by_details.role;
      if (role === 'consumer') return 'you';
      if (role === 'donor') return order.listing_details?.donor_name || 'the merchant';
      if (role === 'shelter') return 'the shelter';
      if (role === 'admin') return 'an administrator';
      return order.cancelled_by_details.name || 'the merchant';
    }
    if (order?.cancelled_by && order?.requester && order.cancelled_by === order.requester) {
      return 'you';
    }
    return order?.listing_details?.donor_name || 'the merchant';
  };

  return (
    <View style={styles.container}>
      <ParticlesBackground />

      {/* Floating Docked Header */}
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
            <Text style={styles.headerSubtitle}>Voucher #{id}</Text>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>
      </SafeAreaView>

      {/* Scrollable Receipt Body */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Unified Skeuomorphic Perforated Voucher Stub */}
        <MotiView
          from={{ opacity: 0, translateY: 20, scale: 0.97 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 140 }}
          style={styles.voucherContainer}
        >
          {/* Top Stub (Merchant & Order Valuation) */}
          <LinearGradient
            colors={['#0F2027', '#0A1922', '#042F2E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.voucherTopStub}
          >
            <View style={styles.merchantHeaderRow}>
              <View style={styles.merchantInfoLeft}>
                <View style={styles.merchantIconHalo}>
                  <Ionicons name="storefront" size={18} color="#5EEAD4" />
                </View>
                <View>
                  <Text style={styles.merchantTitle} numberOfLines={1}>
                    {order.listing_details?.donor_name || 'Verified Merchant'}
                  </Text>
                  <Text style={styles.merchantSubtitle}>OFFICIAL FOOD EXCHANGE VOUCHER</Text>
                </View>
              </View>
            </View>

            {/* Deal Item Title */}
            <Text style={styles.itemTitle} numberOfLines={2}>
              {order.listing_details?.title || 'Excess Food Deal'}
            </Text>

            {/* Price & Savings Pill */}
            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>₹{totalPrice}</Text>
                {totalOrigPrice > totalPrice && (
                  <Text style={styles.origPriceAmount}>₹{totalOrigPrice}</Text>
                )}
              </View>

              {totalSavings > 0 && (
                <View style={styles.savingsPill}>
                  <Ionicons name="sparkles" size={12} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.savingsPillText}>Saved ₹{totalSavings} ({savingsPercent}% OFF)</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Perforated Tear Line with Lateral Notches */}
          <View style={styles.perforatedDivider}>
            <View style={styles.leftNotch} />
            <View style={styles.dashedTrack}>
              {Array.from({ length: 24 }).map((_, i) => (
                <View key={i} style={styles.dashSegment} />
              ))}
            </View>
            <View style={styles.perforationCenterIcon}>
              <Ionicons name="cut-outline" size={14} color="rgba(94, 234, 212, 0.45)" />
            </View>
            <View style={styles.rightNotch} />
          </View>

          {/* Bottom Stub (Digital QR Pickup Passport & Breakdown) */}
          <LinearGradient
            colors={['#042F2E', '#091E24', '#021815']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.voucherBottomStub}
          >
            {/* Scannable QR Core */}
            <View style={styles.qrSectionWrapper}>
              <View style={styles.qrWrapper}>
                <View style={[styles.qrPlate, (isCancelled || isExpired) && styles.qrPlateFaded]}>
                  <QRCode
                    value={order.qr_code_id || `voucher:${order.id}`}
                    size={155}
                    getRef={(c) => (qrRef.current = c)}
                    backgroundColor="#FFFFFF"
                    color="#0F172A"
                  />
                </View>

                {(isCancelled || isExpired) && (
                  <View style={styles.qrOverlay}>
                    <View style={[styles.qrStatusBadge, { backgroundColor: isCancelled ? '#BE123C' : '#B45309' }]}>
                      <Ionicons
                        name={isCancelled ? 'close-circle' : 'time'}
                        size={15}
                        color="#FFFFFF"
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.qrStatusBadgeText}>
                        {isCancelled ? 'CANCELLED' : 'EXPIRED'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Decorative Authentic Retail Barcode */}
              <View style={[styles.barcodeVisual, (isCancelled || isExpired) && { opacity: 0.25 }]}>
                {Array.from({ length: 32 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.barcodeBar,
                      {
                        width: (i % 3 === 0 ? 3 : (i % 2 === 0 ? 1.5 : 2)),
                        opacity: (i % 5 === 0 ? 0.35 : 0.8),
                      }
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.barcodeAuthText, (isCancelled || isExpired) && { opacity: 0.35 }]}>* ORD-{order.id}-{order.qr_code_id ? order.qr_code_id.slice(-6).toUpperCase() : 'AUTH'} *</Text>

              <Text style={styles.qrInstruction}>
                {isCompleted
                  ? 'Voucher was verified & claimed at merchant.'
                  : isCancelled
                    ? `This voucher was cancelled by ${getCancelledByText()} and can no longer be used.`
                    : isExpired
                      ? 'This voucher expired before pickup verification.'
                      : 'Scan this QR code at merchant pickup counter to verify authentication.'}
              </Text>

              {!isCompleted && !isCancelled && !isExpired && (
                <TouchableOpacity style={styles.saveTicketBtn} onPress={saveQRCode} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['rgba(94, 234, 212, 0.2)', 'rgba(13, 148, 136, 0.28)']}
                    style={styles.saveTicketGradient}
                  >
                    <Ionicons name="download-outline" size={15} color="#5EEAD4" style={{ marginRight: 6 }} />
                    <Text style={styles.saveTicketText}>Save Voucher to Photos</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Dotted Separation */}
            <View style={styles.stubInnerDivider} />

            {/* Cashier Register Itemized Breakdown */}
            <View style={styles.registerLedger}>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>PORTIONS ALLOCATED</Text>
                <Text style={styles.ledgerValue}>
                  {quantity} × {order.listing_details?.quantity_unit || 'portion'}
                </Text>
              </View>

              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>BASE RATE / UNIT</Text>
                <Text style={styles.ledgerValue}>₹{unitPrice}</Text>
              </View>

              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>TIMESTAMP</Text>
                <Text style={styles.ledgerValue}>
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              {!isRedeemed && order.listing_details?.pickup_end && (
                <View style={[styles.ledgerRow, { borderBottomWidth: 0, paddingTop: 10 }]}>
                  <Text style={styles.ledgerLabel}>PICKUP WINDOW</Text>
                  <View style={styles.windowCountdownBadge}>
                    <Ionicons name="timer-outline" size={13} color="#F59E0B" style={{ marginRight: 5 }} />
                    <CountdownTimer
                      targetDate={order.listing_details.pickup_end}
                      onExpire={handleAutoExpire}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Serrated Sawtooth Bottom Finish */}
            <View style={styles.serratedEdgeContainer}>
              {Array.from({ length: 18 }).map((_, i) => (
                <View key={i} style={styles.serratedTooth} />
              ))}
            </View>
          </LinearGradient>
        </MotiView>

        {/* Pickup Location Map Card */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 120 }}
          style={styles.glassCard}
        >
          <View style={styles.cardHeaderRow}>
            <Ionicons name="location-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
            <Text style={styles.cardSectionTitle}>MERCHANT PICKUP LOCATION</Text>
          </View>
          <View style={styles.mapContainer}>
            <MiniMap
              latitude={order.listing_details?.donor_latitude || order.listing_details?.latitude || 8.5241}
              longitude={order.listing_details?.donor_longitude || order.listing_details?.longitude || 76.9366}
            />
          </View>
        </MotiView>

        {/* Quick Actions Footer */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 180 }}
          style={styles.actionButtonsContainer}
        >
          <ButtonTwo
            title="Contact Merchant"
            icon="call"
            onPress={handleContactVendor}
            colors={['#042F2E', '#0D9488']}
          />

          {!isRedeemed && (
            <ButtonOne
              title="Cancel Order"
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

              <Text style={styles.modalTitle}>Cancel This Order?</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to cancel this order? The item portions will immediately be restored to active inventory.
              </Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setCancelModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelBtnText}>Keep Voucher</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={confirmCancelOrder}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#BE123C', '#881337']} style={styles.modalConfirmGradient}>
                    <Text style={styles.modalConfirmBtnText}>Cancel Order</Text>
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
    paddingBottom: 70,
  },
  voucherContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 18,
    backgroundColor: '#042F2E',
  },
  voucherTopStub: {
    padding: 22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  merchantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  merchantInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  merchantIconHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(94, 234, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  merchantTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  merchantSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5EEAD4',
    letterSpacing: 0.6,
  },
  itemTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    marginRight: 8,
  },
  origPriceAmount: {
    fontSize: 16,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  savingsPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  perforatedDivider: {
    height: 30,
    position: 'relative',
    backgroundColor: '#072426',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  leftNotch: {
    position: 'absolute',
    left: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#042F2E',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    zIndex: 5,
  },
  rightNotch: {
    position: 'absolute',
    right: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#042F2E',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    zIndex: 5,
  },
  dashedTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '84%',
  },
  dashSegment: {
    width: 6,
    height: 2,
    backgroundColor: 'rgba(94, 234, 212, 0.35)',
    borderRadius: 1,
  },
  perforationCenterIcon: {
    position: 'absolute',
    backgroundColor: '#072426',
    paddingHorizontal: 8,
    zIndex: 4,
  },
  voucherBottomStub: {
    padding: 22,
    paddingBottom: 26,
    position: 'relative',
  },
  qrSectionWrapper: {
    alignItems: 'center',
    paddingTop: 6,
  },
  qrWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  qrPlate: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  qrPlateFaded: {
    opacity: 0.2,
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  qrStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  barcodeVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 24,
    marginBottom: 4,
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#5EEAD4',
    borderRadius: 1,
  },
  barcodeAuthText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: 12,
  },
  qrInstruction: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  saveTicketBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveTicketGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    borderRadius: 12,
  },
  saveTicketText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5EEAD4',
  },
  stubInnerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 18,
  },
  registerLedger: {
    width: '100%',
    gap: 8,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  ledgerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  ledgerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  windowCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  serratedEdgeContainer: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    height: 8,
  },
  serratedTooth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#042F2E',
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
