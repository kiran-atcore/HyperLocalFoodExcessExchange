import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TextInput, TouchableOpacity, Keyboard, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { sharedLocation } from '../../utils/sharedState';
import EtaSelectionModal from '../../components/EtaSelectionModal';

export default function ShelterMapScreen() {
  const [donations, setDonations] = useState<any[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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
        fetchDonations();
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

  const fetchDonations = async () => {
    try {
      const response = await api.get('/listings/');
      const now = new Date().getTime();
      const activeDonations = response.data.filter((item: any) => new Date(item.pickup_end).getTime() > now && !item.is_claimed);
      setDonations(activeDonations);
      setFilteredDonations(activeDonations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPress = (id: number) => {
    const listing = donations.find(d => d.id === id);
    if (listing) {
      setEtaModalListing(listing);
    }
  };

  const submitClaim = async (etaMins: number, quantity: number = 1) => {
    if (!etaModalListing) return;
    const id = etaModalListing.id;
    setEtaModalListing(null);

    try {
      const eta = new Date(Date.now() + etaMins * 60000).toISOString();
      const response = await api.post('/orders/', { 
        listing: id, 
        eta, 
        quantity: etaModalListing.listing_type === 'DISCOUNT' ? quantity : undefined 
      });
      Alert.alert("Success", "Successfully claimed!");
      fetchDonations(); // refresh map data
      if (etaModalListing.listing_type === 'DISCOUNT') {
        router.push(`/(views)/receipt/${response.data.id}` as any);
      } else {
        router.push(`/(views)/claim/${response.data.id}` as any);
      }
    } catch (e: any) {
      Alert.alert("Claim Failed", e.response?.data?.error || "Unable to claim donation.");
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'claim' && data.id) {
        handleClaimPress(data.id);
      } else if (data.type === 'view' && data.id) {
        router.push(`/(views)/deal/${data.id}` as any);
      }
    } catch (e) {
      console.error('Failed to parse webview message', e);
    }
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredDonations(donations);
      return;
    }
    const filtered = donations.filter(item => 
      item.title.toLowerCase().includes(query) || 
      (item.description && item.description.toLowerCase().includes(query))
    );
    setFilteredDonations(filtered);
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

  const markersJs = filteredDonations.map(item => {
    const color = item.listing_type === 'DONATION' ? '#3b82f6' : '#10b981';
    const targetLat = item.donor_latitude || item.latitude;
    const targetLng = item.donor_longitude || item.longitude;
    const distStr = userLocation && targetLat && targetLng ? calculateDistance(userLocation.lat, userLocation.lng, targetLat, targetLng) : 'Distance unknown';
    
    const badgeHtml = item.listing_type === 'DONATION' 
      ? '<span style="font-size: 10px; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; display: inline-block;">NGO Donation</span>'
      : '<span style="font-size: 10px; background: #dcfce7; color: #065f46; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; display: inline-block;">Discounted Surplus</span>';
    
    const buttonText = item.is_claimed ? 'Already Claimed' : (item.listing_type === 'DONATION' ? 'Claim for NGO' : 'Buy Now');
    const displayPrice = item.listing_type === 'DONATION' ? 'FREE' : `₹${item.discounted_price}`;
    
    return `
      var m_${item.id} = L.marker([${targetLat || 37.78825}, ${targetLng || -122.4324}]).addTo(map);
      mapMarkers[${item.id}] = m_${item.id};
      markerExpirations[${item.id}] = '${item.pickup_end || ''}';
      m_${item.id}.bindPopup('<div onclick="handleCardClick(${item.id})" style="font-family: sans-serif; text-align: center; cursor: pointer;"><b>${item.title.replace(/'/g, "\\'")}</b><br/>${badgeHtml}<br/><span style="color: #64748b;">${(item.donor_name || 'Donor').replace(/'/g, "\\'")}</span><br/><span style="color: ${color}; font-weight: bold; font-size: 14px;">${displayPrice}</span><br/><small style="color: ${color}; font-weight: bold;">${distStr}</small><br/><small class="countdown-timer" data-expires="${item.pickup_end || ''}" style="color: #f59e0b; font-weight: bold;">Calculating time...</small><br/><small style="color: #64748b;">Qty: ${item.quantity_available} ${item.quantity_unit}</small><br/><button ${item.is_claimed ? 'disabled' : ''} onclick="event.stopPropagation(); handleClaimClick(${item.id})" style="width: 100%; border: none; margin-top: 8px; padding: 8px; background: ${item.is_claimed ? '#94a3b8' : color}; color: white; border-radius: 4px; font-weight: bold; font-size: 13px; cursor: pointer;">${buttonText}</button></div>');
    `;
  }).join('\\n');

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

        function handleClaimClick(id) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'claim', id: id}));
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
            placeholder="Search food items (e.g. burgers)..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text === '') setFilteredDonations(donations);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <WebView
          key={filteredDonations.length}
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
          onConfirm={submitClaim} 
          pickupEnd={etaModalListing.pickup_end}
          showQuantity={etaModalListing.listing_type === 'DISCOUNT'}
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
