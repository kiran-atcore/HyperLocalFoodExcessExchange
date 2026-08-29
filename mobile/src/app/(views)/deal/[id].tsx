import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';
import EtaSelectionModal from '../../../components/EtaSelectionModal';

export default function DealsViewScreen() {
  const { id, distance } = useLocalSearchParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isEtaModalVisible, setIsEtaModalVisible] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}/`);
      setListing(response.data);
      if (response.data.pickup_end) {
        setIsExpired(new Date(response.data.pickup_end).getTime() <= new Date().getTime());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPress = () => {
    setIsEtaModalVisible(true);
  };

  const submitBuyNow = async (etaMins: number, quantity: number) => {
    setIsEtaModalVisible(false);
    setIsClaiming(true);
    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { listing: id, eta, quantity });
      Alert.alert("Success", "Deal successfully claimed!");
      router.replace(`/(views)/receipt/${response.data.id}` as any);
    } catch (e: any) {
      Alert.alert("Claim Failed", e.response?.data?.error || "Unable to claim deal.");
      setIsClaiming(false);
    }
  };

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([${listing?.donor_latitude || listing?.latitude || 37.78825}, ${listing?.donor_longitude || listing?.longitude || -122.4324}], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        L.circleMarker([${listing?.donor_latitude || listing?.latitude || 37.78825}, ${listing?.donor_longitude || listing?.longitude || -122.4324}], {
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.9,
          radius: 12,
          weight: 2
        }).addTo(map);
      </script>
    </body>
    </html>
  `;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!listing) return null;

  let discountPercent = 0;
  if (listing) {
    const origPrice = Number(listing.original_price) || 0;
    const discPrice = Number(listing.discounted_price) || 0;
    if (origPrice > 0) {
      discountPercent = Math.round(((origPrice - discPrice) / origPrice) * 100);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: listing.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800' }} style={styles.image} />
          {discountPercent > 0 && (
            <View style={styles.discountBannerOverlay}>
              <Text style={styles.discountBannerText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.badge}>₹{listing.discounted_price}</Text>
        </View>
        <Text style={styles.vendor}>{listing.donor_name || 'Vendor'} • {distance || 'Distance unknown'}</Text>
        
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {listing.description || 'No description provided.'}
        </Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Original Price:</Text>
          <Text style={styles.infoValueStrike}>₹{listing.original_price}</Text>
        </View>
        <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 6 }]}>
          <Text style={styles.infoLabel}>Expiration Date:</Text>
          <Text style={styles.infoValueTime}>
            {listing.pickup_end ? new Date(listing.pickup_end).toLocaleString() : 'N/A'}
          </Text>
          {listing.pickup_end && (
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748b' }}>
              Time remaining: <CountdownTimer targetDate={listing.pickup_end} onExpire={() => setIsExpired(true)} />
            </Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Quantity Available:</Text>
          <Text style={styles.infoValue}>
            {listing.quantity_remaining !== undefined ? listing.quantity_remaining : listing.quantity_available} {listing.quantity_unit}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Pickup Location</Text>
        <View style={styles.mapContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html: leafletHtml }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.reserveButton, (listing.is_claimed || isExpired) && { backgroundColor: '#94a3b8' }]} 
          onPress={handleBuyPress} 
          disabled={isClaiming || listing.is_claimed || isExpired}
        >
          <Text style={styles.reserveButtonText}>
            {listing.is_claimed ? 'Already Sold' : (isExpired ? 'Expired' : (isClaiming ? 'Processing...' : `Buy Now (₹${listing.discounted_price})`))}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      {listing.pickup_end && (
        <EtaSelectionModal 
          visible={isEtaModalVisible} 
          onClose={() => setIsEtaModalVisible(false)} 
          onConfirm={submitBuyNow} 
          pickupEnd={listing.pickup_end}
          showQuantity={true}
          maxQuantity={listing.quantity_remaining !== undefined ? listing.quantity_remaining : listing.quantity_available}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  image: { width: '100%', height: 250 },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  badge: { backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, fontSize: 16 },
  vendor: { fontSize: 16, color: '#64748b', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  description: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12 },
  infoLabel: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 15, color: '#0f172a', fontWeight: 'bold' },
  infoValueStrike: { fontSize: 15, color: '#94a3b8', textDecorationLine: 'line-through' },
  infoValueTime: { fontSize: 15, color: '#ef4444', fontWeight: 'bold' },
  footer: { flexDirection: 'row', padding: 20, paddingTop: 0, gap: 12 },
  backButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center' },
  backButtonText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  reserveButton: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center' },
  reserveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  mapContainer: { height: 180, borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#e2e8f0' },
  map: { flex: 1 },
  discountBannerOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBannerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
