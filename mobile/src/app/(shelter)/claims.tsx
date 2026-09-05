import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import ClaimCard from '../../components/ClaimCard';
import AnimatedSearchBar from '../../components/AnimatedSearchBar';
import AnimatedSegmentControl from '../../components/AnimatedSegmentControl';
import { useAlert } from '../../context/AlertContext';

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
          opacity: [0, 0.55, 0],
          translateY: -280 - Math.random() * 180,
          translateX: (Math.random() - 0.5) * 120,
        }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 5000 + Math.random() * 4000,
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
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <LinearGradient
        colors={['#042F2E', '#ffffffff']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {particles}
    </View>
  );
};

export default function ShelterClaimsScreen() {
  const { showAlert } = useAlert();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DONATION' | 'DISCOUNT'>('DONATION');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchClaims();
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/');
      setClaims(response.data);
    } catch (e) {
      console.error('Failed to fetch claims', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClaim = (orderId: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert(
      'Cancel Claim',
      'Are you sure you want to cancel this reservation? The donor will be notified.',
      'error',
      async () => {
        try {
          await api.patch(`/orders/${orderId}/cancel/`);
          Toast.show({
            type: 'success',
            text1: 'Claim Cancelled',
            text2: 'The food item has been returned to donor availability.',
            position: 'top',
          });
          fetchClaims();
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Cancellation Failed',
            text2: 'Could not cancel this claim. Please try again.',
            position: 'top',
          });
        }
      },
      'Cancel Claim',
      true,
      'Go Back'
    );
  };

  const handleAutoExpire = async (orderId: number) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === orderId ? { ...c, status: 'EXPIRED' } : c))
    );
    try {
      await api.patch(`/orders/${orderId}/expire/`);
    } catch (e) {
      console.error('Auto expire failed', e);
    }
  };

  const displayedClaims = claims.filter((c) => {
    const isDonationTab = activeTab === 'DONATION';
    const matchesTab = isDonationTab
      ? c.listing_details?.listing_type === 'DONATION'
      : c.listing_details?.listing_type === 'DISCOUNT';
    const query = searchQuery.toLowerCase().trim();
    const title = (c.listing_details?.title || '').toLowerCase();
    const donor = (c.listing_details?.donor_name || '').toLowerCase();
    const matchesSearch = query === '' || title.includes(query) || donor.includes(query);
    return matchesTab && matchesSearch;
  });

  const renderItem = ({ item, index }: any) => (
    <ClaimCard
      item={item}
      index={index}
      onCancelClaim={handleCancelClaim}
      onExpire={handleAutoExpire}
    />
  );

  return (
    <View style={styles.container}>
      <ParticlesBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroTitle}>My Claims</Text>
            <Text style={styles.heroSubtitle}>Track and redeem your reserved pickups</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="receipt" size={24} color="#0D9488" />
          </View>
        </View>

        {/* Search & Tabs Row */}
        <View style={styles.toolsContainer}>
          <View style={{ marginBottom: 14 }}>
            <AnimatedSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search claims & donors..."
              variant="dark"
            />
          </View>
          <AnimatedSegmentControl
            tabs={['NGO Donations', 'Discounted']}
            activeTab={activeTab === 'DONATION' ? 'NGO Donations' : 'Discounted'}
            onChange={(tab) => setActiveTab(tab === 'NGO Donations' ? 'DONATION' : 'DISCOUNT')}
            variant="dark"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0D9488" style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={isScreenFocused ? displayedClaims : []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              isScreenFocused ? (
                <View style={styles.emptyState}>
                  <Ionicons name="bag-check-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.emptyStateTitle}>No claims found</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    {activeTab === 'DONATION'
                      ? 'You have no active NGO donation claims. Explore the feed to reserve food!'
                      : 'You have no discounted surplus receipts.'}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c3cddbff',
  },
  safeArea: {
    flex: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 148, 136, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
