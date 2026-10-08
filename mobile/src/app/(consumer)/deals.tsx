import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, DeviceEventEmitter, Modal, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import LocationBanner from '../../components/LocationBanner';
import api from '../../utils/api';
import { sharedLocation } from '../../utils/sharedState';
import CountdownTimer from '../../components/CountdownTimer';
import EtaSelectionModal from '../../components/EtaSelectionModal';
import DealCard from '../../components/DealCard';
import AnimatedSearchBar from '../../components/AnimatedSearchBar';

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
        colors={['#042F2E', '#0B132B', '#021815']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {particles}
    </View>
  );
};

export default function ConsumerFeedScreen() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [displayAddress, setDisplayAddress] = useState(sharedLocation.address || '');
  const [etaModalListing, setEtaModalListing] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortFilter, setSortFilter] = useState<'LATEST' | 'OLDEST' | 'EXPENSIVE' | 'CHEAP' | 'CLOSEST'>('LATEST');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const getSortLabel = () => {
    switch (sortFilter) {
      case 'CLOSEST': return 'Closest';
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
        setDisplayAddress(data.address || '');
        sharedLocation.lat = data.lat;
        sharedLocation.lng = data.lng;
        sharedLocation.address = data.address;
        if (!isLocationReady) {
          setIsLocationReady(true);
          fetchFeed();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isLocationReady]);

  useFocusEffect(
    useCallback(() => {
      const initFeed = async () => {
        if (sharedLocation.lat && sharedLocation.lng) {
          setLocation({ lat: sharedLocation.lat, lng: sharedLocation.lng });
          setDisplayAddress(sharedLocation.address || '');
          setIsLocationReady(true);
        } else {
          await fetchUserLocation();
        }
        fetchFeed();
      };
      initFeed();
    }, [])
  );

  const fetchUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocationReady(true);
        return;
      }
      let loc;
      try {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch (e) {
        loc = await Location.getLastKnownPositionAsync({});
      }
      
      if (loc) {
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setLocation({ lat, lng });
        sharedLocation.lat = lat;
        sharedLocation.lng = lng;
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'User-Agent': 'HyperLocalFoodExcessExchange/1.0' } });
          const data = await response.json();
          const address = data?.display_name || `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setDisplayAddress(address);
          sharedLocation.address = address;
        } catch (e) {
          setDisplayAddress(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      }
    } catch (e) {}
    setIsLocationReady(true);
  };

  const fetchFeed = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      setLoading(true);
      const [listingsRes] = await Promise.all([
        api.get('/listings/?listing_type=DISCOUNT'),
      ]);
      const now = new Date().getTime();
      const activeDeals = listingsRes.data.filter((item: any) => 
        new Date(item.pickup_end).getTime() > now && 
        !item.is_claimed && 
        (item.quantity_remaining === undefined || item.quantity_remaining > 0)
      );
      setFeed(activeDeals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'Nearby';
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; 
    return d < 1 ? '< 1 km' : `${d.toFixed(1)} km`;
  };

  const submitBuyNow = async (etaMins: number, quantity: number) => {
    if (!etaModalListing) return;
    const id = etaModalListing.id;
    setEtaModalListing(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { listing: id, eta, quantity });
      Toast.show({
        type: 'success',
        text1: 'Deal Claimed!',
        text2: 'Voucher generated successfully.',
      });
      fetchFeed();
      router.push(`/(views)/receipt/${response.data.id}` as any);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Claim Failed',
        text2: e.response?.data?.error || 'Unable to claim deal right now.',
      });
    }
  };

  const getDistanceNumber = (lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  const getDealPrice = (item: any) => Number(item.discounted_price !== undefined ? item.discounted_price : item.original_price) || 0;

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
      if (sortFilter === 'CLOSEST') {
        const userLat = location?.lat || sharedLocation.lat;
        const userLng = location?.lng || sharedLocation.lng;
        const distA = getDistanceNumber(userLat, userLng, a.donor_latitude || a.latitude, a.donor_longitude || a.longitude);
        const distB = getDistanceNumber(userLat, userLng, b.donor_latitude || b.latitude, b.donor_longitude || b.longitude);
        if (distA !== distB) return distA - distB;
        return b.id - a.id;
      } else if (sortFilter === 'EXPENSIVE') {
        return getDealPrice(b) - getDealPrice(a);
      } else if (sortFilter === 'CHEAP') {
        return getDealPrice(a) - getDealPrice(b);
      } else if (sortFilter === 'OLDEST') {
        return a.id - b.id;
      } else {
        return b.id - a.id;
      }
    });

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const targetLat = item.donor_latitude || item.latitude;
    const targetLng = item.donor_longitude || item.longitude;
    const distanceStr = location && targetLat && targetLng 
      ? calculateDistance(location.lat, location.lng, targetLat, targetLng)
      : 'Nearby';

    return (
      <DealCard
        item={item}
        distance={distanceStr}
        index={index}
        onPress={(dealItem) => {
          router.push(`/(views)/deal/${dealItem.id}?distance=${encodeURIComponent(distanceStr)}` as any);
        }}
        onClaim={(dealItem) => {
          setEtaModalListing(dealItem);
        }}
        onExpire={() => fetchFeed()}
      />
    );
  };

  const handleLocationChange = (address: string, lat?: number, lng?: number) => {
    setDisplayAddress(address);
    if (lat && lng) {
      setLocation({lat, lng});
      sharedLocation.lat = lat;
      sharedLocation.lng = lng;
      sharedLocation.address = address;
    }
    setIsLocationReady(true);
    fetchFeed();
  };

  return (
    <View style={styles.container}>
      <ParticlesBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroTitle}>Flash Food Deals</Text>
            <Text style={styles.heroSubtitle}>Rescue excess kitchen meals with huge discounts</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="flame" size={24} color="#5EEAD4" />
          </View>
        </View>

        {/* Location Banner */}
        <View style={styles.bannerContainer}>
          <LocationBanner 
            address={!isLocationReady ? 'Acquiring GPS fix...' : displayAddress} 
            autoFetch={false} 
            onLocationChange={handleLocationChange} 
            onMapPress={() => {
              const lat = location?.lat || sharedLocation.lat || 8.5241;
              const lng = location?.lng || sharedLocation.lng || 76.9366;
              router.push(`/(views)/map/picker?lat=${lat}&lng=${lng}` as any);
            }}
            variant="dark"
          />
        </View>

        {/* Tools Row: Search & Sort Button */}
        <View style={styles.toolsContainer}>
          <View style={{ marginBottom: 12 }}>
            <AnimatedSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search deals & kitchens..."
              variant="dark"
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 }}>
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
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#5EEAD4" />
            <Text style={styles.centerText}>Locating nearby kitchens...</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color="#5EEAD4" style={{ marginTop: 40 }} />
        ) : (
          <FlatList 
            data={filteredFeed} 
            renderItem={renderItem} 
            keyExtractor={item => item.id.toString()} 
            contentContainerStyle={styles.list} 
            showsVerticalScrollIndicator={false} 
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={54} color="#64748B" />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No Matching Deals' : 'No Live Deals Right Now'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Try searching with a different keyword or clearing the filter.' 
                    : 'All surplus portions in your area have been claimed. Check back shortly!'}
                </Text>
              </View>
            }
          />
        )}

        {etaModalListing && (
          <EtaSelectionModal
            visible={!!etaModalListing}
            onClose={() => setEtaModalListing(null)}
            onConfirm={submitBuyNow}
            pickupEnd={etaModalListing.pickup_end}
            showQuantity={true}
            maxQuantity={etaModalListing.quantity_remaining !== undefined ? etaModalListing.quantity_remaining : etaModalListing.quantity_available}
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
                <Text style={styles.menuTitle}>Sort Deals</Text>
                
                <View style={styles.optionsGrid}>
                  {[
                    { id: 'CLOSEST', label: 'Closest', sub: 'Nearest first', icon: 'location' },
                    { id: 'LATEST', label: 'Latest', sub: 'Newest first', icon: 'time' },
                    { id: 'OLDEST', label: 'Oldest', sub: 'Oldest first', icon: 'time-outline' },
                    { id: 'EXPENSIVE', label: 'Expensive', sub: 'Highest price first', icon: 'trending-up' },
                    { id: 'CHEAP', label: 'Cheap', sub: 'Lowest price first', icon: 'trending-down' }
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
  container: { flex: 1, backgroundColor: '#021815' },
  safeArea: { flex: 1 },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  toolsContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
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
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  centerText: { marginTop: 14, color: '#94A3B8', fontWeight: '600', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#F8FAFC', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
