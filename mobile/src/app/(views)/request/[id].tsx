import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);

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
        text2: 'Failed to load request details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await api.patch(`/orders/${id}/cancel/`);
      Toast.show({
        type: 'success',
        text1: 'Request Cancelled',
        text2: 'The pickup request was successfully cancelled.',
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel request. Please try again.',
      });
    }
  };

  const handleAutoExpire = async () => {
    if (order && order.status !== 'PICKED_UP' && order.status !== 'CANCELLED' && order.status !== 'EXPIRED') {
      try {
        await api.patch(`/orders/${id}/expire/`);
      } catch (e) {
        // silent fail on auto-expire sync
      }
      setOrder({ ...order, status: 'EXPIRED' });
      Toast.show({
        type: 'info',
        text1: 'Request Expired',
        text2: 'This claim window has expired.',
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
              <Ionicons name="receipt-outline" size={36} color="#5EEAD4" />
            </MotiView>
            <Text style={styles.loadingText}>Fetching pickup request...</Text>
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
            <Text style={styles.notFoundTitle}>Request Not Found</Text>
            <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
              <Text style={styles.backHomeBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isShelter = order.requester_details?.role === 'shelter';
  const isCompleted = order.status === 'PICKED_UP';
  const isTerminated = order.status === 'CANCELLED' || order.status === 'EXPIRED';
  const canAct = !isCompleted && !isTerminated;

  const rawPic = order.requester_details?.profile_picture;
  const profilePic = rawPic
    ? (rawPic.startsWith('http') || rawPic.startsWith('data:')
        ? rawPic
        : `${api.defaults.baseURL?.replace(/\/api\/?$/, '')}${rawPic.startsWith('/') ? '' : '/'}${rawPic}`)
    : null;

  return (
    <View style={styles.container}>
      <ParticlesBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header */}
        <MotiView
          from={{ opacity: 0, translateY: -15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 140 }}
          style={styles.topHeader}
        >
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
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isCompleted ? '#10B981' : (isTerminated ? '#F43F5E' : '#F59E0B') }
                ]}
              />
              <Text style={styles.headerPillText}>{order.status}</Text>
            </View>
            <Text style={styles.headerTitle}>Pickup Request #{id}</Text>
          </View>

          <View style={styles.headerRightSpacer} />
        </MotiView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Requester Hero Card */}
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 15 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 60 }}
            style={styles.requesterCard}
          >
            {/* Background Profile Picture */}
            {profilePic ? (
              <Image
                source={{ uri: profilePic }}
                style={styles.cardBackgroundImage}
                resizeMode="cover"
              />
            ) : null}

            {/* Gradient Dark Overlay to highlight elements on top with current color scheme */}
            <LinearGradient
              colors={profilePic
                ? ['rgba(4, 47, 46, 0.58)', 'rgba(15, 23, 42, 0.74)', 'rgba(2, 24, 21, 0.86)']
                : ['rgba(15, 23, 42, 0.85)', 'rgba(4, 47, 46, 0.75)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.requesterCardGradientOverlay}
            />

            <View style={styles.requesterCardContent}>
              {/* Glowing Avatar Ring */}
              <View style={styles.avatarGlowWrapper}>
                <LinearGradient
                  colors={isShelter ? ['#38BDF8', '#0284C7'] : ['#5EEAD4', '#0D9488']}
                  style={styles.avatarRing}
                >
                  <View style={styles.avatarInner}>
                    {profilePic ? (
                      <Image source={{ uri: profilePic }} style={styles.avatarImage} resizeMode="cover" />
                    ) : (
                      <Ionicons
                        name={isShelter ? "business" : "person"}
                        size={36}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </LinearGradient>
              </View>

              <Text style={styles.requesterName} numberOfLines={1}>
                {order.requester_details?.name || `Beneficiary ID: ${order.requester}`}
              </Text>

              <View style={[styles.roleBadge, isShelter ? styles.roleShelter : styles.roleConsumer]}>
                <Ionicons
                  name={isShelter ? "shield-checkmark" : "heart"}
                  size={12}
                  color="#FFFFFF"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.roleBadgeText}>
                  {order.requester_details?.role?.toUpperCase() || 'BENEFICIARY'}
                </Text>
              </View>

              <Text style={styles.requesterSubtitle}>
                {isShelter ? 'Certified Partner Shelter' : 'Verified Community Consumer'}
              </Text>
            </View>
          </MotiView>

          {/* Order Details Glass Card */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 120 }}
            style={styles.glassCard}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="receipt-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>CLAIM SPECIFICATIONS</Text>
            </View>

            {/* Item Title */}
            <View style={styles.infoRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="restaurant-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <Text style={styles.infoLabel}>Item:</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>
                {order.listing_details?.title || 'Surplus Item'}
              </Text>
            </View>

            {/* Quantity */}
            <View style={styles.infoRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="cube-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <Text style={styles.infoLabel}>Claimed Units:</Text>
              </View>
              <Text style={styles.infoValueHighlight}>
                {order.quantity || 1} {order.listing_details?.quantity_unit || 'portions'}
              </Text>
            </View>

            {/* Estimated Arrival */}
            <View style={styles.infoRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="time-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <Text style={styles.infoLabel}>Estimated Arrival:</Text>
              </View>
              <Text style={[styles.infoValue, { color: '#FCD34D' }]}>
                {order.eta ? new Date(order.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending ETA'}
              </Text>
            </View>

            {/* Current Status */}
            <View style={styles.infoRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="radio-button-on" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <Text style={styles.infoLabel}>Current Status:</Text>
              </View>
              <View style={[
                styles.statusTag,
                isCompleted ? styles.tagCompleted : (isTerminated ? styles.tagTerminated : styles.tagPending)
              ]}>
                <Text style={[
                  styles.statusTagText,
                  isCompleted ? { color: '#34D399' } : (isTerminated ? { color: '#FDA4AF' } : { color: '#FCD34D' })
                ]}>
                  {order.status}
                </Text>
              </View>
            </View>

            {/* Time Window Countdown */}
            {canAct && order.listing_details?.pickup_end && (
              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 4 }]}>
                <View style={styles.rowLabelGroup}>
                  <Ionicons name="hourglass-outline" size={16} color="#5EEAD4" style={{ marginRight: 8 }} />
                  <Text style={styles.infoLabel}>Pickup Window:</Text>
                </View>
                <View style={styles.timerBadge}>
                  <CountdownTimer
                    targetDate={order.listing_details.pickup_end}
                    onExpire={handleAutoExpire}
                  />
                </View>
              </View>
            )}
          </MotiView>

          {/* Action Buttons */}
          {canAct && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 180 }}
              style={styles.actionsContainer}
            >
              <ButtonTwo
                title="Open Scanner to Verify"
                icon="qr-code-outline"
                style={{ marginBottom: 14 }}
                onPress={() => {
                  router.push({
                    pathname: '/(donor)/scan',
                    params: {
                      order_id: order.id.toString(),
                      qr_code_id: order.qr_code_id ? order.qr_code_id.toString() : '',
                    },
                  });
                }}
              />

              <TouchableOpacity
                style={styles.cancelRequestBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsCancelModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelRequestBtnText}>Cancel Pickup Request</Text>
              </TouchableOpacity>
            </MotiView>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={isCancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCancelModalVisible(false)}
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
                <Ionicons name="warning" size={28} color="#F59E0B" />
              </View>

              <Text style={styles.modalTitle}>Cancel Request?</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to cancel this pickup claim? The requester will be notified and the food item will return to available inventory.
              </Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsCancelModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelBtnText}>Keep Request</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleConfirmCancel}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#BE123C', '#881337']}
                    style={styles.modalConfirmGradient}
                  >
                    <Text style={styles.modalConfirmBtnText}>Cancel Claim</Text>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerRightSpacer: {
    width: 42,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  requesterCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    shadowColor: '#042F2E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  cardBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  requesterCardGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  requesterCardContent: {
    padding: 24,
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarGlowWrapper: {
    marginBottom: 14,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requesterName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleShelter: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  roleConsumer: {
    backgroundColor: 'rgba(94, 234, 212, 0.25)',
    borderWidth: 1,
    borderColor: '#5EEAD4',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  requesterSubtitle: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  glassCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.15)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    maxWidth: '55%',
    textAlign: 'right',
  },
  infoValueHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5EEAD4',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  tagTerminated: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  tagPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerBadge: {
    backgroundColor: 'rgba(4, 47, 46, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  actionsContainer: {
    marginBottom: 40,
  },
  scanButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    overflow: 'hidden',
  },
  buttonSheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cancelRequestBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  cancelRequestBtnText: {
    color: '#FDA4AF',
    fontSize: 14,
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

