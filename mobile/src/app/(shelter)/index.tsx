import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, DeviceEventEmitter, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import api from '../../utils/api';
import { sharedLocation } from '../../utils/sharedState';
import EtaSelectionModal from '../../components/EtaSelectionModal';
import ShelterCard from '../../components/ShelterCard';
import AnimatedSearchBar from '../../components/AnimatedSearchBar';
import AnimatedSegmentControl from '../../components/AnimatedSegmentControl';

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

export default function ShelterFeedScreen() {
  const [activeTab, setActiveTab] = useState<'DONATION' | 'DISCOUNT'>('DONATION');
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortFilter, setSortFilter] = useState<'LATEST' | 'OLDEST' | 'EXPENSIVE' | 'CHEAP'>('LATEST');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [etaModalListing, setEtaModalListing] = useState<any | null>(null);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  const getSortLabel = () => {
    switch (sortFilter) {
      case 'LATEST': return 'Latest';
      case 'OLDEST': return 'Oldest';
      case 'EXPENSIVE': return 'Expensive';
      case 'CHEAP': return 'Cheap';
    }
  };

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('onLocationSelected', (data) => {
      if (data.lat && data.lng) {
        setLocation({ lat: data.lat, lng: data.lng });
        sharedLocation.lat = data.lat;
        sharedLocation.lng = data.lng;
        sharedLocation.address = data.address;
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchFeed();
      return () => {
        setIsScreenFocused(false);
      };
    }, [activeTab])
  );

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const [listingsRes, profileRes] = await Promise.all([
        api.get(`/listings/?listing_type=${activeTab}`),
        api.get('/users/me/'),
      ]);
      const now = new Date().getTime();
      const activeListings = listingsRes.data.filter(
        (item: any) =>
          new Date(item.pickup_end).getTime() > now &&
          !item.is_claimed &&
          (item.quantity_remaining === undefined || item.quantity_remaining > 0)
      );
      setFeed(activeListings);

      const profile = profileRes.data;
      if (profile.latitude && profile.longitude) {
        setLocation({ lat: profile.latitude, lng: profile.longitude });
        sharedLocation.lat = profile.latitude;
        sharedLocation.lng = profile.longitude;
        sharedLocation.address = profile.address || '';
      }
      setIsLocationReady(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'Unknown distance';
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? '< 1 km' : `${d.toFixed(1)} km`;
  };

  const handleClaimPress = (item: any) => {
    setEtaModalListing(item);
  };

  const submitClaim = async (etaMins: number, quantity: number) => {
    if (!etaModalListing) return;

    const id = etaModalListing.id;
    setEtaModalListing(null);
    setClaimingId(id);

    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { listing: id, eta, quantity });
      Toast.show({
        type: 'success',
        text1: 'Claim Successful!',
        text2: 'You have reserved this surplus food for pickup.',
        position: 'top',
      });
      if (activeTab === 'DISCOUNT') {
        router.push(`/(views)/receipt/${response.data.id}` as any);
      } else {
        router.push(`/(views)/claim/${response.data.id}` as any);
      }
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      Toast.show({
        type: 'error',
        text1: 'Claim Failed',
        text2: 'Could not complete the pickup reservation. Please try again.',
        position: 'top',
      });
    } finally {
      setClaimingId(null);
    }
  };

  const removeListing = (id: number) => {
    setFeed((prev) => prev.filter((item) => item.id !== id));
  };

  const getItemPrice = (item: any) => {
    if (item.listing_type === 'DONATION') {
      return Number(item.estimated_fmv || item.original_price || 0);
    }
    return Number(item.discounted_price !== undefined ? item.discounted_price : item.original_price) || 0;
  };

  const filteredFeed = feed
    .filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const title = (item.title || '').toLowerCase();
      const donor = (item.donor_name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return title.includes(query) || donor.includes(query) || desc.includes(query);
    })
    .sort((a, b) => {
      if (sortFilter === 'EXPENSIVE') {
        return getItemPrice(b) - getItemPrice(a);
      } else if (sortFilter === 'CHEAP') {
        return getItemPrice(a) - getItemPrice(b);
      } else if (sortFilter === 'OLDEST') {
        return a.id - b.id;
      } else {
        return b.id - a.id;
      }
    });

  const renderItem = ({ item, index }: any) => {
    const targetLat = item.donor_latitude || item.latitude;
    const targetLng = item.donor_longitude || item.longitude;
    const distanceStr =
      location && targetLat && targetLng
        ? calculateDistance(location.lat, location.lng, targetLat, targetLng)
        : 'Distance unknown';

    const handlePressCard = (listing: any) => {
      if (listing.listing_type === 'DISCOUNT') {
        router.push(
          `/(views)/deal/${listing.id}?distance=${encodeURIComponent(distanceStr)}` as any
        );
      } else {
        router.push(
          `/(views)/donation/${listing.id}?distance=${encodeURIComponent(distanceStr)}` as any
        );
      }
    };

    return (
      <ShelterCard
        item={item}
        index={index}
        distanceStr={distanceStr}
        isClaiming={claimingId === item.id}
        onClaimPress={handleClaimPress}
        onExpire={removeListing}
        onPressCard={handlePressCard}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ParticlesBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroTitle}>Surplus Feed</Text>
            <Text style={styles.heroSubtitle}>Explore excess food & donations near you</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="fast-food" size={24} color="#0D9488" />
          </View>
        </View>

        {/* Tools Row: Search & Segmented Control */}
        <View style={styles.toolsContainer}>
          <View style={{ marginBottom: 14 }}>
            <AnimatedSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search surplus & donors..."
              variant="dark"
            />
          </View>
          <AnimatedSegmentControl
            tabs={['NGO Donations', 'Discounted']}
            activeTab={activeTab === 'DONATION' ? 'NGO Donations' : 'Discounted'}
            onChange={(tab) => {
              const newTab = tab === 'NGO Donations' ? 'DONATION' : 'DISCOUNT';
              if (newTab !== activeTab) {
                setFeed([]);
                setActiveTab(newTab);
              }
            }}
            variant="dark"
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, marginBottom: 4 }}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.dropdownButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSortMenu(true);
              }}
            >
              <Ionicons name="filter" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.dropdownButtonText}>
                {getSortLabel()}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        {!isLocationReady ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.loadingText}>Locating your shelter...</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color="#0D9488" style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={isScreenFocused ? filteredFeed : []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              isScreenFocused ? (
                <View style={styles.emptyState}>
                  <Ionicons name="fast-food-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.emptyStateTitle}>No surplus available</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    {activeTab === 'DONATION'
                      ? 'No active NGO donations currently in your area. Check back soon!'
                      : 'No discounted surplus items available right now.'}
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {etaModalListing && (
          <EtaSelectionModal
            visible={!!etaModalListing}
            onClose={() => setEtaModalListing(null)}
            onConfirm={submitClaim}
            pickupEnd={etaModalListing.pickup_end}
            showQuantity={activeTab === 'DISCOUNT'}
            maxQuantity={
              activeTab === 'DISCOUNT'
                ? etaModalListing.quantity_remaining !== undefined
                  ? etaModalListing.quantity_remaining
                  : etaModalListing.quantity_available
                : undefined
            }
          />
        )}

        {/* Glassmorphic Sort Modal */}
        <Modal visible={showSortMenu} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setShowSortMenu(false)}
            />
            <MotiView 
              from={{ translateY: 400, scale: 0.9, opacity: 0 }}
              animate={{ translateY: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              style={styles.menuWrapper}
            >
              <LinearGradient
                colors={['rgba(15, 23, 42, 0.95)', 'rgba(2, 6, 23, 0.95)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.menuInnerGlow} />

              <View style={styles.menuContainer}>
                <View style={styles.dragIndicator} />
                <Text style={styles.menuTitle}>Sort Surplus</Text>
                
                <View style={styles.optionsGrid}>
                  {[
                    { id: 'LATEST', label: 'Latest', sub: 'Newest first', icon: 'time' },
                    { id: 'OLDEST', label: 'Oldest', sub: 'Oldest first', icon: 'time-outline' },
                    { id: 'EXPENSIVE', label: 'Expensive', sub: 'Highest value first', icon: 'trending-up' },
                    { id: 'CHEAP', label: 'Cheap', sub: 'Lowest value first', icon: 'trending-down' }
                  ].map((option, index) => {
                    const isActive = sortFilter === option.id;
                    return (
                      <MotiView
                        key={option.id}
                        from={{ opacity: 0, translateY: 15 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', delay: index * 100 }}
                        style={{ width: '100%', marginBottom: 12 }}
                      >
                        <TouchableOpacity 
                          activeOpacity={0.8}
                          style={[styles.menuOptionBlock, isActive && styles.menuOptionBlockActive]} 
                          onPress={() => { 
                            Haptics.selectionAsync();
                            setSortFilter(option.id as any); 
                            setTimeout(() => setShowSortMenu(false), 200);
                          }}
                        >
                          {isActive && (
                            <LinearGradient
                              colors={['rgba(13, 148, 136, 0.8)', 'rgba(15, 118, 110, 0.9)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={StyleSheet.absoluteFill}
                            />
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                              <Ionicons name={option.icon as any} size={20} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                            </View>
                            <View>
                              <Text style={[styles.menuOptionTitle, isActive && styles.menuOptionTitleActive]}>{option.label}</Text>
                              <Text style={[styles.menuOptionSub, isActive && styles.menuOptionSubActive]}>{option.sub}</Text>
                            </View>
                          </View>
                          {isActive && (
                            <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                              <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                            </MotiView>
                          )}
                        </TouchableOpacity>
                      </MotiView>
                    );
                  })}
                </View>
              </View>
            </MotiView>
          </View>
        </Modal>
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
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#94A3B8',
    fontWeight: '600',
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
  dropdownButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dropdownButtonText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  menuWrapper: {
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    overflow: 'hidden',
    marginBottom: -100,
  },
  menuInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuContainer: { 
    padding: 24, 
    paddingBottom: (Platform.OS === 'ios' ? 40 : 24) + 100, 
    backgroundColor: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  menuTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFFFFF', 
    marginBottom: 24, 
  },
  optionsGrid: {
    marginTop: 8,
  },
  menuOptionBlock: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  menuOptionBlockActive: { 
    backgroundColor: 'transparent',
    borderColor: 'rgba(94, 234, 212, 0.3)',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuOptionTitle: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  menuOptionTitleActive: { 
    color: '#FFFFFF', 
    fontWeight: '800' 
  },
  menuOptionSub: {
    fontSize: 13,
    color: 'rgba(148, 163, 184, 0.6)',
    fontWeight: '500',
  },
  menuOptionSubActive: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
