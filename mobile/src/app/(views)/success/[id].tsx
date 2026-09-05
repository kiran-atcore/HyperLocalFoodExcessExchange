import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import ButtonTwo from '../../../components/ButtonTwo';
import LoadingScreen from '../../../components/LoadingScreen';

const ParticlesBackground = () => {
  const particles = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 4 + 2;
    return (
      <MotiView
        key={i}
        from={{
          opacity: 0,
          translateY: 0,
          translateX: (Math.random() - 0.5) * 50,
        }}
        animate={{
          opacity: [0, 0.6, 0],
          translateY: -300 - Math.random() * 200,
          translateX: (Math.random() - 0.5) * 150,
        }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 5000 + Math.random() * 5000,
          delay: Math.random() * 4000,
        }}
        style={{
          position: 'absolute',
          bottom: -50,
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

export default function SuccessScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [itemExpanded, setItemExpanded] = useState(true);
  const [requesterExpanded, setRequesterExpanded] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}/`);
      setOrder(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemExpanded = () => {
    Haptics.selectionAsync();
    setItemExpanded(!itemExpanded);
  };

  const toggleRequesterExpanded = () => {
    Haptics.selectionAsync();
    setRequesterExpanded(!requesterExpanded);
  };

  if (loading) {
    return <LoadingScreen message="Verifying pickup..." />;
  }

  const isDonation = order?.listing_details?.listing_type === 'DONATION';

  return (
    <View style={styles.container}>
      <ParticlesBackground />
      <ConfettiCannon count={75} origin={{ x: -10, y: 0 }} fadeOut autoStart />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Glowing Hero Badge */}
          <MotiView
            from={{ opacity: 0, scale: 0.7, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 14 }}
            style={styles.heroSection}
          >
            <View style={styles.iconGlowWrapper}>
              <LinearGradient
                colors={['#0D9488', '#042F2E']}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark-circle" size={56} color="#5EEAD4" />
              </LinearGradient>
            </View>

            <View style={styles.badgeChip}>
              <Ionicons name="shield-checkmark" size={14} color="#5EEAD4" style={{ marginRight: 6 }} />
              <Text style={styles.badgeChipText}>CONSUMER VERIFIED</Text>
            </View>

            <Text style={styles.title}>Scan Successful!</Text>
            <Text style={styles.subtitle}>
              Order #{id} has been authenticated and marked as picked up.
            </Text>
          </MotiView>

          {/* Details Card */}
          {order && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 200 }}
              style={styles.card}
            >
              {/* Item Details Accordion */}
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={toggleItemExpanded}
                activeOpacity={0.7}
              >
                <View style={styles.headerInfo}>
                  <View style={styles.headerIconBox}>
                    <Ionicons name="fast-food-outline" size={20} color="#5EEAD4" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardLabel}>Item Summary</Text>
                    <Text style={styles.cardValue} numberOfLines={1}>
                      {order.listing_details?.title || 'Unknown Item'}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={itemExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {itemExpanded && (
                <View style={styles.dropdownContent}>
                  <View style={styles.rowDetail}>
                    <Text style={styles.detailKey}>Quantity</Text>
                    <Text style={styles.detailVal}>
                      {order.quantity || 1} {order.listing_details?.quantity_unit || 'portions'}
                    </Text>
                  </View>

                  <View style={styles.rowDetail}>
                    <Text style={styles.detailKey}>Type</Text>
                    <View style={[styles.pill, isDonation ? styles.pillDonation : styles.pillDiscount]}>
                      <Text style={[styles.pillText, isDonation ? styles.pillDonationText : styles.pillDiscountText]}>
                        {order.listing_details?.listing_type || 'DONATION'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rowDetail}>
                    <Text style={styles.detailKey}>Est. Market Value</Text>
                    <Text style={styles.detailVal}>
                      ₹{(parseFloat(order.listing_details?.estimated_fmv || '0') * (isDonation ? 1 : (order.quantity || 1))).toFixed(2)}
                    </Text>
                  </View>

                  {!isDonation && (
                    <View style={styles.rowDetail}>
                      <Text style={styles.detailKey}>Discounted Price</Text>
                      <Text style={[styles.detailVal, { color: '#5EEAD4', fontWeight: '700' }]}>
                        ₹{(parseFloat(order.listing_details?.discounted_price || '0') * (order.quantity || 1)).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.divider} />

              {/* Requester Details Accordion */}
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={toggleRequesterExpanded}
                activeOpacity={0.7}
              >
                <View style={styles.headerInfo}>
                  <View style={styles.headerIconBox}>
                    <Ionicons name="person-outline" size={20} color="#5EEAD4" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardLabel}>Claimed & Picked Up By</Text>
                    <Text style={styles.cardValue} numberOfLines={1}>
                      {order.requester_details?.name || 'Unknown Consumer'}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={requesterExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {requesterExpanded && (
                <View style={styles.dropdownContent}>
                  <View style={styles.rowDetail}>
                    <Text style={styles.detailKey}>Role</Text>
                    <Text style={styles.detailVal}>{order.requester_details?.role || 'Recipient'}</Text>
                  </View>

                  <View style={styles.rowDetail}>
                    <Text style={styles.detailKey}>Contact</Text>
                    <Text style={styles.detailVal}>{order.requester_details?.email || 'N/A'}</Text>
                  </View>
                </View>
              )}
            </MotiView>
          )}
        </ScrollView>

        {/* Footer Action */}
        <View style={styles.footer}>
          <ButtonTwo
            title="Done"
            icon="checkmark-done"
            onPress={() => router.replace('/(donor)')}
            colors={['#042F2E', '#0D9488']}
            sheen={true}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#042F2E',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconGlowWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    marginBottom: 12,
  },
  badgeChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  dropdownContent: {
    marginTop: 14,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
  },
  rowDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailKey: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pillDonation: {
    backgroundColor: 'rgba(13, 148, 136, 0.25)',
  },
  pillDonationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5EEAD4',
  },
  pillDiscount: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  pillDiscountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
  },
});
