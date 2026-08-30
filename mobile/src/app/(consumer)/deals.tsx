import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, DeviceEventEmitter, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import LocationBanner from '../../components/LocationBanner';
import api from '../../utils/api';
import { sharedLocation } from '../../utils/sharedState';
import CountdownTimer from '../../components/CountdownTimer';
import EtaSelectionModal from '../../components/EtaSelectionModal';
import * as SecureStore from 'expo-secure-store';

export default function ConsumerFeedScreen() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Initially false, wait for location
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [displayAddress, setDisplayAddress] = useState(sharedLocation.address || '');
  const [etaModalListing, setEtaModalListing] = useState<any | null>(null);

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
      const [listingsRes, profileRes] = await Promise.all([
        api.get('/listings/?listing_type=DISCOUNT'),
        api.get('/users/me/').catch(() => null)
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
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'Unknown distance';
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

    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { listing: id, eta, quantity });
      Alert.alert("Success", "Deal successfully claimed!");
      fetchFeed();
      router.push(`/(views)/receipt/${response.data.id}` as any);
    } catch (e: any) {
      Alert.alert("Claim Failed", e.response?.data?.error || "Unable to claim deal.");
    }
  };

  const renderItem = ({ item }: any) => {
    const targetLat = item.donor_latitude || item.latitude;
    const targetLng = item.donor_longitude || item.longitude;
    const distanceStr = location && targetLat && targetLng 
      ? calculateDistance(location.lat, location.lng, targetLat, targetLng)
      : 'Distance unknown';

    const origPrice = Number(item.original_price) || 0;
    const discPrice = Number(item.discounted_price) || 0;
    let discountPercent = 0;
    if (origPrice > 0 && discPrice < origPrice) {
      discountPercent = Math.round(((origPrice - discPrice) / origPrice) * 100);
    }

    const isClaimed = item.is_claimed || (item.quantity_remaining !== undefined && item.quantity_remaining <= 0);
    const remainingCount = item.quantity_remaining !== undefined ? item.quantity_remaining : item.quantity_available;

    return (
      <TouchableOpacity 
        style={[styles.card, isClaimed && { opacity: 0.6 }]} 
        activeOpacity={0.9} 
        onPress={() => router.push(`/(views)/deal/${item.id}?distance=${encodeURIComponent(distanceStr)}` as any)}
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
          <Text style={styles.vendor}>{item.donor_name || 'Vendor'} • {distanceStr}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
            <Text style={[styles.originalPrice, { marginBottom: 0 }]}>Original: ${Number(item.original_price).toFixed(2)}</Text>
            <Text style={{fontSize: 12, color: '#64748b', marginLeft: 6}}>• {remainingCount} left</Text>
          </View>
          
          <View style={styles.footerRow}>
            <Text style={styles.time}>
              Expires in: <CountdownTimer targetDate={item.pickup_end} onExpire={() => fetchFeed()} />
            </Text>
            <TouchableOpacity 
              style={[styles.button, isClaimed && { backgroundColor: '#94a3b8' }]} 
              onPress={() => !isClaimed && setEtaModalListing(item)}
              disabled={isClaimed}
            >
              <Text style={styles.buttonText}>{isClaimed ? 'Sold Out' : 'Buy Now'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
    // Set location ready and fetch deals (even if location failed, we load deals anyway without distance)
    setIsLocationReady(true);
    fetchFeed();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LocationBanner 
        address={!isLocationReady ? 'Fetching location...' : displayAddress} 
        autoFetch={false} 
        onLocationChange={handleLocationChange} 
        onMapPress={() => {
          const lat = location?.lat || sharedLocation.lat || 8.5241;
          const lng = location?.lng || sharedLocation.lng || 76.9366;
          router.push(`/(views)/map/picker?lat=${lat}&lng=${lng}` as any);
        }}
      />
      <Text style={styles.header}>Nearby Deals</Text>
      
      {!isLocationReady ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={{ marginTop: 16, color: '#64748b', fontWeight: '500' }}>Locating you...</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={feed} 
          renderItem={renderItem} 
          keyExtractor={item => item.id.toString()} 
          contentContainerStyle={styles.list} 
          showsVerticalScrollIndicator={false} 
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>No deals available right now.</Text>}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  list: { paddingBottom: 40 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  image: { width: '100%', height: 160 },
  cardContent: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', flex: 1 },
  badgeDiscount: { backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  vendor: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  originalPrice: { fontSize: 12, color: '#94a3b8', textDecorationLine: 'line-through', marginBottom: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 13, color: '#ef4444', fontWeight: '500' },
  button: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  discountBanner: { position: 'absolute', top: 12, left: 12, backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  discountBannerText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});
