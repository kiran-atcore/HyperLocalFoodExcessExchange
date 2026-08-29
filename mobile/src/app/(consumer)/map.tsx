import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TextInput, TouchableOpacity, Keyboard, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { sharedLocation } from '../../utils/sharedState';
import EtaSelectionModal from '../../components/EtaSelectionModal';

export default function ConsumerMapScreen() {
  const [deals, setDeals] = useState<any[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [etaModalListing, setEtaModalListing] = useState<any | null>(null);
  const webViewRef = useRef<WebView>(null);

  useFocusEffect(
    useCallback(() => {
      const initMap = async () => {
        if (sharedLocation.lat && sharedLocation.lng) {
          setUserLocation({ lat: sharedLocation.lat, lng: sharedLocation.lng });
        } else {
          await fetchUserLocation();
        }
        fetchDeals();
      };
      initMap();
    }, [])
  );

  const fetchUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc;
      try {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch (e) {
        loc = await Location.getLastKnownPositionAsync({});
      }
      if (loc) {
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        sharedLocation.lat = loc.coords.latitude;
        sharedLocation.lng = loc.coords.longitude;
      }
    } catch (e) {}
  };

  const fetchDeals = async () => {
    try {
      const response = await api.get('/listings/?listing_type=DISCOUNT');
      const now = new Date().getTime();
      const activeDeals = response.data.filter((item: any) => new Date(item.pickup_end).getTime() > now && !item.is_claimed);
      setDeals(activeDeals);
      setFilteredDeals(activeDeals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'buy' && data.id) {
        const listing = deals.find(d => d.id === data.id);
        if (listing) {
          setEtaModalListing(listing);
        }
      } else if (data.type === 'view' && data.id) {
        router.push(`/(views)/deal/${data.id}` as any);
      }
    } catch (e) {
      console.error('Failed to parse webview message', e);
    }
  };

  const submitBuyNow = async (etaMins: number, quantity: number) => {
    if (!etaModalListing) return;
    const id = etaModalListing.id;
    setEtaModalListing(null);

    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { listing: id, eta, quantity });
      Alert.alert("Success", "Deal successfully claimed!");
      fetchDeals(); // refresh map
      if (response.data && response.data.id) {
        router.push(`/(views)/receipt/${response.data.id}` as any);
      } else {
        router.push('/(consumer)/receipts');
      }
    } catch (error: any) {
      Alert.alert("Claim Failed", error.response?.data?.error || "Unable to claim deal.");
    }
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredDeals(deals);
      return;
    }
    const filtered = deals.filter(item => 
      item.title.toLowerCase().includes(query) || 
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.donor_name && item.donor_name.toLowerCase().includes(query))
    );
    setFilteredDeals(filtered);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return '';
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; 
    return d < 1 ? '< 1 km away' : `${d.toFixed(1)} km away`;
  };

  const markersJs = filteredDeals.map(item => {
    const color = '#10b981'; // Discount deals color
    const targetLat = item.donor_latitude || item.latitude;
    const targetLng = item.donor_longitude || item.longitude;
    const distStr = userLocation && targetLat && targetLng ? calculateDistance(userLocation.lat, userLocation.lng, targetLat, targetLng) : 'Distance unknown';
    const displayPrice = item.discounted_price ? `$${Number(item.discounted_price).toFixed(2)}` : 'FREE';

    return `
      var m_${item.id} = L.marker([${targetLat || 37.78825}, ${targetLng || -122.4324}]).addTo(map);
      mapMarkers[${item.id}] = m_${item.id};
      markerExpirations[${item.id}] = '${item.pickup_end || ''}';
      m_${item.id}.bindPopup('<div onclick="handleCardClick(${item.id})" style="font-family: sans-serif; text-align: center; cursor: pointer;"><b>${item.title.replace(/'/g, "\\'")}</b><br/><span style="color: #64748b;">${(item.donor_name || 'Vendor').replace(/'/g, "\\'")}</span><br/><span style="color: ${color}; font-weight: bold;">${displayPrice}</span><br/><small style="color: #64748b; font-weight: bold;">${distStr}</small><br/><small class="countdown-timer" data-expires="${item.pickup_end || ''}" style="color: #f59e0b; font-weight: bold;">Calculating time...</small><br/><button onclick="event.stopPropagation(); handleBuyClick(${item.id})" style="width: 100%; border: none; margin-top: 8px; padding: 8px; background: #0f172a; color: white; border-radius: 4px; font-weight: bold; font-size: 13px; cursor: pointer;">Buy Now</button></div>');
    `;
  }).join('\n');

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
        .leaflet-popup-content-wrapper { border-radius: 12px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var DefaultIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = DefaultIcon;

        var initialLat = ${userLocation ? userLocation.lat : 37.78825};
        var initialLng = ${userLocation ? userLocation.lng : -122.4324};
        var map = L.map('map', { zoomControl: false }).setView([initialLat, initialLng], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap © CARTO'
        }).addTo(map);

        ${userLocation ? `
        L.circleMarker([${userLocation.lat}, ${userLocation.lng}], {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 1,
          radius: 8,
          weight: 3,
          color: '#ffffff'
        }).addTo(map).bindPopup('<b>You are here</b>');
        ` : ''}

        var mapMarkers = {};
        var markerExpirations = {};

        ${markersJs}

        function setMapLocation(lat, lng) {
          map.setView([lat, lng], 14);
        }

        function handleBuyClick(id) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'buy', id: id}));
        }

        function handleCardClick(id) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'view', id: id}));
        }

        // Live Countdown Timer Logic for Popups
        setInterval(function() {
          var now = new Date().getTime();
          
          for (var id in markerExpirations) {
             var expires = markerExpirations[id];
             if (expires) {
                 var target = new Date(expires).getTime();
                 if (target - now <= 0) {
                     if (mapMarkers[id]) {
                         map.removeLayer(mapMarkers[id]);
                         delete mapMarkers[id];
                     }
                 }
             }
          }

          var timers = document.querySelectorAll('.countdown-timer');
          timers.forEach(function(timer) {
            var expiresAttr = timer.getAttribute('data-expires');
            if (!expiresAttr) return;
            var target = new Date(expiresAttr).getTime();
            var diff = target - now;
            if (diff > 0) {
              var h = Math.floor(diff / (1000 * 60 * 60));
              var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              var s = Math.floor((diff % (1000 * 60)) / 1000);
              timer.innerHTML = 'Expires in: ' + h + 'h ' + m + 'm ' + s + 's';
              timer.style.color = '#f59e0b';
            } else {
              timer.innerHTML = 'Expired';
              timer.style.color = '#ef4444';
            }
          });
        }, 1000);
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deals (e.g. pizza)..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text === '') setFilteredDeals(deals);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <WebView
          key={filteredDeals.length}
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a' },
  map: { flex: 1 },
});