import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, DeviceEventEmitter, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import { sharedLocation } from '../../utils/sharedState';
import CountdownTimer from '../../components/CountdownTimer';
import EtaSelectionModal from '../../components/EtaSelectionModal';

export default function ShelterFeedScreen() {
  const [activeTab, setActiveTab] = useState<'DONATION' | 'DISCOUNT'>('DONATION');
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [etaModalListing, setEtaModalListing] = useState<any | null>(null);

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
      fetchFeed();
    }, [activeTab])
  );

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const [listingsRes, profileRes] = await Promise.all([
        api.get(`/listings/?listing_type=${activeTab}`),
        api.get('/users/me/')
      ]);
      const now = new Date().getTime();
      const activeListings = listingsRes.data.filter((item: any) => 
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

  const handleClaimPress = (item: any) => {
    if (activeTab === 'DONATION') {
      setEtaModalListing(item);
    } else {
      router.push(`/(views)/surplus/${item.id}?distance=unknown` as any);
    }
  };

  const submitClaim = async (etaMins: number, quantity: number) => {
    if (!etaModalListing) return;
    
    const id = etaModalListing.id;
    setEtaModalListing(null);
    setClaimingId(id);
    
    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { listing: id, eta, quantity });
      alert("Success! You have claimed this item.");
      if (activeTab === 'DISCOUNT') {
        router.push(`/(views)/receipt/${response.data.id}` as any);
      } else {
        router.push(`/(views)/claim/${response.data.id}` as any);
      }
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      alert("Error: Could not claim this donation.");
    } finally {
      setClaimingId(null);
    }
  };

  const removeListing = (id: number) => {
    setFeed(prev => prev.filter(item => item.id !== id));
  };

  const renderItem = ({ item }: any) => {
    const targetLat = item.donor_latitude || item.latitude;
    const targetLng = item.donor_longitude || item.longitude;
    const distanceStr = location && targetLat && targetLng 
      ? calculateDistance(location.lat, location.lng, targetLat, targetLng)
      : 'Distance unknown';
      
    const isClaimed = item.is_claimed || (item.quantity_remaining !== undefined && item.quantity_remaining <= 0);
    const remainingCount = item.quantity_remaining !== undefined ? item.quantity_remaining : item.quantity_available;

    if (item.listing_type === 'DISCOUNT') {
      const origPrice = Number(item.original_price) || 0;
      const discPrice = Number(item.discounted_price) || 0;
      let discountPercent = 0;
      if (origPrice > 0 && discPrice < origPrice) {
        discountPercent = Math.round(((origPrice - discPrice) / origPrice) * 100);
      }

      return (
        <TouchableOpacity 
          style={[styles.discountCard, isClaimed && { opacity: 0.6 }]} 
          activeOpacity={0.9} 
          onPress={() => router.push(`/(views)/deal/${item.id}?distance=${encodeURIComponent(distanceStr)}` as any)}
          disabled={isClaimed}
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={[styles.image, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{color: '#94a3b8'}}>No Image</Text>
            </View>
          )}

          {discountPercent > 0 && (
             <View style={styles.discountBanner}>
               <Text style={styles.discountBannerText}>{discountPercent}% OFF</Text>
             </View>
          )}
          
          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.badgeDiscount}>
                ${Number(item.discounted_price).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.donor}>{item.donor_name || 'Vendor'} • {distanceStr}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
              <Text style={[styles.originalPrice, { marginBottom: 0 }]}>Original: ${Number(item.original_price).toFixed(2)}</Text>
              <Text style={{fontSize: 12, color: '#64748b', marginLeft: 6}}>• {remainingCount} left</Text>
            </View>
            
            <View style={styles.footerRow}>
              <Text style={styles.time}>
                Expires in: <CountdownTimer targetDate={item.pickup_end} onExpire={() => fetchFeed()} />
              </Text>
              <TouchableOpacity 
                style={[styles.button, isClaimed ? { backgroundColor: '#94a3b8' } : {backgroundColor: '#0f172a'}]} 
                onPress={() => !isClaimed && setEtaModalListing(item)}
                disabled={isClaimed}
              >
                <Text style={styles.buttonText}>{isClaimed ? 'Sold Out' : 'Buy Now'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // DONATION card
    return (
      <TouchableOpacity 
        style={[styles.card, isClaimed && { opacity: 0.6 }]} 
        onPress={() => router.push(`/(views)/donation/${item.id}?distance=${encodeURIComponent(distanceStr)}` as any)}
        disabled={isClaimed}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.donor}>{item.donor_name || 'Donor'} • {distanceStr}</Text>
        <Text style={[styles.time, { color: '#64748b', marginBottom: 12, fontSize: 13 }]}>
          Expires in: <CountdownTimer targetDate={item.pickup_end} onExpire={() => removeListing(item.id)} />
        </Text>
        <View style={styles.footerRow}>
          <Text style={styles.time}>{remainingCount} {item.quantity_unit || 'portions'}</Text>
          <TouchableOpacity 
            style={[styles.button, (claimingId === item.id || isClaimed) && { opacity: 0.7, backgroundColor: isClaimed ? '#94a3b8' : '#3b82f6' }]} 
            onPress={() => handleClaimPress(item)} 
            disabled={claimingId === item.id || isClaimed}
          >
            {claimingId === item.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{isClaimed ? 'Already Claimed' : 'Claim for NGO'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.header}>Shelter Feed</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'DONATION' && styles.tabButtonActive]}
            onPress={() => {
              if (activeTab !== 'DONATION') {
                setFeed([]);
                setActiveTab('DONATION');
              }
            }}
          >
            <Text style={[styles.tabText, activeTab === 'DONATION' && styles.tabTextActive]}>NGO Donations</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'DISCOUNT' && styles.tabButtonActive]}
            onPress={() => {
              if (activeTab !== 'DISCOUNT') {
                setFeed([]);
                setActiveTab('DISCOUNT');
              }
            }}
          >
            <Text style={[styles.tabText, activeTab === 'DISCOUNT' && styles.tabTextActive]}>Discounted Surplus</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {!isLocationReady ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={{ marginTop: 16, color: '#64748b', fontWeight: '500' }}>Locating your shelter...</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={feed} 
          renderItem={renderItem} 
          keyExtractor={item => item.id.toString()} 
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>No items available right now.</Text>}
        />
      )}

      {etaModalListing && (
        <EtaSelectionModal 
          visible={!!etaModalListing} 
          onClose={() => setEtaModalListing(null)} 
          onConfirm={submitClaim} 
          pickupEnd={etaModalListing.pickup_end}
          showQuantity={activeTab === 'DISCOUNT'}
          maxQuantity={activeTab === 'DISCOUNT' ? (etaModalListing.quantity_remaining !== undefined ? etaModalListing.quantity_remaining : etaModalListing.quantity_available) : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topSection: { paddingTop: 16, paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4, marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabButtonActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#0f172a' },
  
  card: { marginHorizontal: 16, backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderLeftWidth: 4, borderLeftColor: '#3b82f6', marginTop: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  donor: { fontSize: 14, color: '#64748b', marginBottom: 12, marginTop: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
  button: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },

  discountCard: { marginHorizontal: 16, backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginTop: 16 },
  image: { width: '100%', height: 160 },
  cardContent: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badgeDiscount: { backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  originalPrice: { fontSize: 12, color: '#94a3b8', textDecorationLine: 'line-through', marginBottom: 12 },
  discountBanner: { position: 'absolute', top: 12, left: 12, backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  discountBannerText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});
