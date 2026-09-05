import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Keyboard, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import api from '../../utils/api';
import { sharedLocation } from '../../utils/sharedState';
import { generateMapPinCardHtml } from '../../components/MapPinCard';
import EtaSelectionModal from '../../components/EtaSelectionModal';
import AnimatedSearchBar from '../../components/AnimatedSearchBar';

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
      const activeDonations = response.data.filter((item: any) => new Date(item.pickup_end).getTime() > now && !item.is_claimed && (item.quantity_remaining === undefined || item.quantity_remaining > 0));
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
      Toast.show({
        type: 'success',
        text1: 'Successfully Claimed!',
        text2: 'Your pickup reservation is confirmed.',
        position: 'top',
      });
      fetchDonations(); // refresh map data
      if (etaModalListing.listing_type === 'DISCOUNT') {
        router.push(`/(views)/receipt/${response.data.id}` as any);
      } else {
        router.push(`/(views)/claim/${response.data.id}` as any);
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Claim Failed',
        text2: e.response?.data?.error || 'Unable to claim donation.',
        position: 'top',
      });
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

  // Group listings by latitude and longitude to handle multiple items from the same location
  const groupedDonations = filteredDonations.reduce((acc, item) => {
    const lat = item.donor_latitude || item.latitude || 8.5241;
    const lng = item.donor_longitude || item.longitude || 76.9366;
    const key = `${lat}_${lng}`.replace(/\./g, '_');
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const markersJs = Object.values(groupedDonations).map((group: any) => {
    // Sort so latest is first
    const sortedGroup = [...group].sort((a: any, b: any) => b.id - a.id);
    const first = sortedGroup[0];
    const targetLat = first.donor_latitude || first.latitude || 8.5241;
    const targetLng = first.donor_longitude || first.longitude || 76.9366;
    const distStr = userLocation && targetLat && targetLng ? calculateDistance(userLocation.lat, userLocation.lng, targetLat, targetLng) : 'Distance unknown';
    const safeDonor = (first.donor_name || 'Donor').replace(/'/g, "\\'").replace(/\n|\r/g, ' ');
    const groupId = `${targetLat}_${targetLng}`.replace(/\./g, '_');

    const popupHtml = generateMapPinCardHtml(sortedGroup, distStr, safeDonor, groupId);

    return `
      var m_${first.id} = L.marker([${targetLat}, ${targetLng}]).addTo(map);
      mapMarkers[${first.id}] = m_${first.id};
      ${sortedGroup.map(item => `markerExpirations[${item.id}] = '${item.pickup_end || ''}';`).join(' ')}
      m_${first.id}.bindPopup(\`${popupHtml.replace(/`/g, '\\`')}\`);
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
        .leaflet-popup-content-wrapper {
          background: #0F172A;
          color: #F8FAFC;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
          padding: 2px;
        }
        .leaflet-popup-tip {
          background: #0F172A;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #94A3B8;
          top: 8px;
          right: 8px;
          font-size: 16px;
        }
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

        var initialLat = ${userLocation ? userLocation.lat : 8.5241};
        var initialLng = ${userLocation ? userLocation.lng : 76.9366};
        var map = L.map('map', { zoomControl: false }).setView([initialLat, initialLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

        function toggleAccordion(event, groupId, id) {
           event.stopPropagation();
           var allContents = document.querySelectorAll('.group_' + groupId);
           var targetContent = document.getElementById('content_' + id);
           var targetIcon = document.getElementById('icon_' + id);
           
           var isCurrentlyOpen = targetContent.style.display === 'block';
           
           // Close all
           allContents.forEach(function(el) {
              el.style.display = 'none';
              var iconId = el.id.replace('content_', 'icon_');
              var iconEl = document.getElementById(iconId);
              if (iconEl) iconEl.innerText = '+';
           });
           
           // Open the clicked one if it was closed
           if (!isCurrentlyOpen) {
              targetContent.style.display = 'block';
              if (targetIcon) targetIcon.innerText = '−';
           }
        }

        // Live Countdown Timer Logic for Popups
        setInterval(function() {
          var now = new Date().getTime();
          
          for (var id in markerExpirations) {
             var expires = markerExpirations[id];
             if (expires) {
                 var target = new Date(expires).getTime();
                 if (target - now <= 0) {
                     var itemContainer = document.getElementById('item_container_' + id);
                     if (itemContainer) {
                         itemContainer.style.display = 'none';
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header & Search Bar */}
        <View style={styles.topHeader}>
          <LinearGradient
            colors={['#042F2E', 'rgba(4, 47, 46, 0.95)', 'rgba(4, 47, 46, 0.8)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.heroTitle}>Radar Map</Text>
              <Text style={styles.heroSubtitle}>Live excess food pins around you</Text>
            </View>
            <View style={styles.radarBadge}>
              <Ionicons name="location" size={20} color="#5EEAD4" />
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <AnimatedSearchBar
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text === '') setFilteredDonations(donations);
              }}
              placeholder="Search surplus on radar..."
              variant="dark"
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.loadingText}>Scanning radar for surplus...</Text>
          </View>
        ) : (
          <WebView
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
            maxQuantity={
              etaModalListing.quantity_remaining !== undefined
                ? etaModalListing.quantity_remaining
                : etaModalListing.quantity_available
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
    backgroundColor: '#042F2E',
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  radarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(94, 234, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#042F2E',
  },
  loadingText: {
    marginTop: 14,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
