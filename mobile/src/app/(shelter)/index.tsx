import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import { sharedLocation } from '../../utils/sharedState';
import CountdownTimer from '../../components/CountdownTimer';
import EtaSelectionModal from '../../components/EtaSelectionModal';

export default function ShelterFeedScreen() {
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
    }, [])
  );

  const fetchFeed = async () => {
    try {
      const [listingsRes, profileRes] = await Promise.all([
        api.get('/listings/?listing_type=DONATION'),
        api.get('/users/me/')
      ]);
      const now = new Date().getTime();
      const activeDonations = listingsRes.data.filter((item: any) => new Date(item.pickup_end).getTime() > now && !item.is_claimed);
      setFeed(activeDonations);

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
    setEtaModalListing(item);
  };

  const submitClaim = async (etaMins: number) => {
    if (!etaModalListing) return;
    
    const id = etaModalListing.id;
    setEtaModalListing(null);
    setClaimingId(id);
    
    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { listing: id, eta });
      alert("Success! You have claimed this donation.");
      router.push(`/(views)/claim/${response.data.id}` as any);
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
      
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/(views)/donation/${item.id}?distance=${encodeURIComponent(distanceStr)}` as any)}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.donor}>{item.donor_name || 'Donor'} • {distanceStr}</Text>
        <Text style={[styles.time, { color: '#64748b', marginBottom: 12, fontSize: 13 }]}>
          Expires in: <CountdownTimer targetDate={item.pickup_end} onExpire={() => removeListing(item.id)} />
        </Text>
        <View style={styles.footerRow}>
          <Text style={styles.time}>{item.quantity_available} {item.quantity_unit || 'portions'}</Text>
          <TouchableOpacity 
            style={[styles.button, (claimingId === item.id || item.is_claimed) && { opacity: 0.7, backgroundColor: item.is_claimed ? '#94a3b8' : '#3b82f6' }]} 
            onPress={() => handleClaimPress(item)} 
            disabled={claimingId === item.id || item.is_claimed}
          >
            {claimingId === item.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{item.is_claimed ? 'Already Claimed' : 'Claim for NGO'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingTop: 16 }}>
        <Text style={styles.header}>Priority Rescue Feed</Text>
        <Text style={styles.subtitle}>100% Free Bulk Donations</Text>
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
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>No priority donations available right now.</Text>}
        />
      )}

      {etaModalListing && (
        <EtaSelectionModal 
          visible={!!etaModalListing} 
          onClose={() => setEtaModalListing(null)} 
          onConfirm={submitClaim} 
          pickupEnd={etaModalListing.pickup_end}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#3b82f6', fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  donor: { fontSize: 14, color: '#64748b', marginBottom: 12, marginTop: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
  button: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' }
});