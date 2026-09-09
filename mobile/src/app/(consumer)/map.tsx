import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Keyboard, Platform } from 'react-native';
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
import * as SecureStore from 'expo-secure-store';
import { MotiView } from 'moti';

export default function ConsumerMapScreen() {
  const [deals, setDeals] = useState<any[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [etaModalListing, setEtaModalListing] = useState<any | null>(null);
  const webViewRef = useRef<WebView>(null);
  const isWebViewLoaded = useRef(false);

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
    } catch (e) { }
  };

  const fetchDeals = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      const response = await api.get('/listings/?listing_type=DISCOUNT');
      const now = new Date().getTime();
      const activeDeals = response.data.filter((item: any) => new Date(item.pickup_end).getTime() > now && !item.is_claimed && (item.quantity_remaining === undefined || item.quantity_remaining > 0));
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
      } else if (data.type === 'map_ready') {
        isWebViewLoaded.current = true;
        updateMapMarkers(filteredDeals);
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
      fetchDeals(); // refresh map
      if (response.data && response.data.id) {
        Toast.show({
          type: 'success',
          text1: 'Deal Claimed!',
          text2: 'Voucher generated successfully.',
        });
        router.push(`/(views)/receipt/${response.data.id}` as any);
      } else {
        router.push('/(consumer)/receipts');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Claim Failed',
        text2: error.response?.data?.error || 'Unable to claim deal.',
      });
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const query = text.trim().toLowerCase();
    if (!query) {
      setFilteredDeals(deals);
      return;
    }
    const filtered = deals.filter(item =>
      (item.title && item.title.toLowerCase().includes(query)) ||
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
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? '< 1 km away' : `${d.toFixed(1)} km away`;
  };

  const buildMarkersData = useCallback((items: any[]) => {
    const grouped = items.reduce((acc, item) => {
      const lat = item.donor_latitude || item.latitude || 8.5241;
      const lng = item.donor_longitude || item.longitude || 76.9366;
      const key = `${lat}_${lng}`.replace(/\./g, '_');
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.values(grouped).map((group: any) => {
      const sortedGroup = [...group].sort((a: any, b: any) => b.id - a.id);
      const first = sortedGroup[0];
      const targetLat = first.donor_latitude || first.latitude || 8.5241;
      const targetLng = first.donor_longitude || first.longitude || 76.9366;
      const distStr = userLocation && targetLat && targetLng ? calculateDistance(userLocation.lat, userLocation.lng, targetLat, targetLng) : 'Distance unknown';
      const safeDonor = (first.donor_name || 'Verified Kitchen').replace(/'/g, "\\'").replace(/\n|\r/g, ' ');
      const groupId = `${targetLat}_${targetLng}`.replace(/\./g, '_');

      const popupHtml = generateMapPinCardHtml(sortedGroup, distStr, safeDonor, groupId);

      const expirations: Record<string, string> = {};
      sortedGroup.forEach((item: any) => {
        if (item.pickup_end) {
          expirations[item.id] = item.pickup_end;
        }
      });

      return {
        lat: targetLat,
        lng: targetLng,
        popupHtml,
        expirations,
      };
    });
  }, [userLocation]);

  const updateMapMarkers = useCallback((items: any[]) => {
    if (!webViewRef.current || !isWebViewLoaded.current) return;
    const data = buildMarkersData(items);
    const script = `
      (function() {
        if (window.renderMarkers) {
          window.renderMarkers(${JSON.stringify(data)});
        }
      })();
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }, [buildMarkersData]);

  useEffect(() => {
    if (isWebViewLoaded.current) {
      updateMapMarkers(filteredDeals);
    }
  }, [filteredDeals, updateMapMarkers]);

  const leafletHtml = useMemo(() => {
    const initialLat = userLocation ? userLocation.lat : 8.5241;
    const initialLng = userLocation ? userLocation.lng : 76.9366;

    return `
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

        var map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        ${userLocation ? `
        L.circleMarker([${userLocation.lat}, ${userLocation.lng}], {
          color: '#ffffff',
          fillColor: '#10b981',
          fillOpacity: 1,
          radius: 8,
          weight: 3
        }).addTo(map).bindPopup('<b>You are here</b>');
        ` : ''}

        var markersLayer = L.layerGroup().addTo(map);
        var markerExpirations = {};

        window.renderMarkers = function(markersData) {
          markersLayer.clearLayers();
          markerExpirations = {};
          if (!markersData || !Array.isArray(markersData)) return;
          markersData.forEach(function(group) {
            var marker = L.marker([group.lat, group.lng]);
            marker.bindPopup(group.popupHtml);
            markersLayer.addLayer(marker);
            if (group.expirations) {
              for (var id in group.expirations) {
                markerExpirations[id] = group.expirations[id];
              }
            }
          });
        };

        function setMapLocation(lat, lng) {
          map.setView([lat, lng], 14);
        }

        function handleClaimClick(id) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'buy', id: id}));
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

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_ready' }));
        }
      </script>
    </body>
    </html>
  `;
  }, [userLocation?.lat, userLocation?.lng]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header & Search Bar Container */}
        <View style={styles.topHeader}>
          <LinearGradient
            colors={['#042F2E', 'rgba(4, 47, 46, 0.96)', 'rgba(4, 47, 46, 0.85)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.heroTitle}>Deals Radar</Text>
              <Text style={styles.heroSubtitle}>Live excess meals & discounts near you</Text>
            </View>
            <View style={styles.radarBadge}>
              <Ionicons name="location" size={20} color="#5EEAD4" />
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <AnimatedSearchBar
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search deals (e.g. bakery, pizza)..."
              variant="dark"
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#5EEAD4" />
            <Text style={styles.loadingText}>Initializing Radar...</Text>
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
            onLoadEnd={() => {
              isWebViewLoaded.current = true;
              updateMapMarkers(filteredDeals);
            }}
          />
        )}

        {searchQuery.trim().length > 0 && (
          <View pointerEvents="none" style={styles.resultsBadgeContainer}>
            <MotiView
              from={{ opacity: 0, translateY: 12, scale: 0.9 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 18 }}
              style={styles.resultsBadge}
            >
              <Ionicons name="search" size={13} color="#5EEAD4" style={{ marginRight: 6 }} />
              <Text style={styles.resultsBadgeText}>
                {filteredDeals.length === 1 ? '1 result found' : `${filteredDeals.length} results found`}
              </Text>
            </MotiView>
          </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#042F2E' },
  safeArea: { flex: 1 },
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
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  map: { flex: 1 },
  resultsBadgeContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 115 : 102,
    alignSelf: 'center',
    zIndex: 99,
  },
  resultsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resultsBadgeText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
