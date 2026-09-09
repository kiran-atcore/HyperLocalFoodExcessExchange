import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { DeviceEventEmitter } from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function MapSelectionScreen() {
  const params = useLocalSearchParams();
  const initialLat = params.lat ? parseFloat(params.lat as string) : 8.5241;
  const initialLng = params.lng ? parseFloat(params.lng as string) : 76.9366;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat: initialLat, lng: initialLng });
  const [addressName, setAddressName] = useState('Fetching address...');
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    fetchAddress(selectedCoords.lat, selectedCoords.lng);
  }, [selectedCoords]);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'HyperLocalFoodExcessExchange/1.0' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddressName(data.display_name);
      } else {
        setAddressName(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      }
    } catch (e) {
      setAddressName(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'HyperLocalFoodExcessExchange/1.0' } }
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setSelectedCoords({ lat: newLat, lng: newLng });
        
        webViewRef.current?.injectJavaScript(`setMapLocation(${newLat}, ${newLng}); true;`);
      } else {
        Toast.show({
          type: 'info',
          text1: 'No Results',
          text2: 'Could not find the specified location.',
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Search Error',
        text2: 'Network error searching location.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location') {
        Haptics.selectionAsync();
        setSelectedCoords({ lat: data.lat, lng: data.lng });
      }
    } catch (err) {}
  };

  const confirmLocation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    DeviceEventEmitter.emit('onLocationSelected', { lat: selectedCoords.lat, lng: selectedCoords.lng, address: addressName });
    Toast.show({
      type: 'success',
      text1: 'Location Selected',
      text2: 'Pinpoint confirmed for listing.',
    });
    router.back();
  };

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; background-color: #f8fafc; }
        html, body, #map { height: 100%; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${selectedCoords.lat}, ${selectedCoords.lng}], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ''
        }).addTo(map);

        var marker = L.marker([${selectedCoords.lat}, ${selectedCoords.lng}], {
          draggable: true
        }).addTo(map);

        marker.on('dragend', function (e) {
          var latlng = marker.getLatLng();
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location', lat: latlng.lat, lng: latlng.lng }));
          }
        });

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location', lat: e.latlng.lat, lng: e.latlng.lng }));
          }
        });

        function setMapLocation(lat, lng) {
          var newLatLng = new L.LatLng(lat, lng);
          map.setView(newLatLng, 15);
          marker.setLatLng(newLatLng);
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleMessage}
        />
      </View>

      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#5EEAD4" />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <TouchableOpacity 
              onPress={handleSearch} 
              activeOpacity={0.7} 
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={isSearching}
            >
              <Ionicons name="search" size={18} color="#5EEAD4" style={styles.searchIcon} />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search address, landmark or zip..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#5EEAD4" style={{ marginRight: 6 }} />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 6 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        style={styles.bottomOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.bottomCard}>
          <View style={styles.sheetHandle} />
          
          <View style={styles.addressHeaderRow}>
            <View style={styles.markerIconCircle}>
              <Ionicons name="location" size={20} color="#5EEAD4" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.locationTitle}>Selected Coordinate</Text>
              <Text style={styles.coordsText}>
                {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
              </Text>
            </View>
            <View style={styles.dragHintBadge}>
              <Text style={styles.dragHintText}>Drag pin to adjust</Text>
            </View>
          </View>

          <Text style={styles.addressText} numberOfLines={2}>
            {addressName}
          </Text>

          <TouchableOpacity 
            style={styles.confirmBtn} 
            onPress={confirmLocation}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="#042F2E" style={{ marginRight: 8 }} />
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#021815' },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(11, 19, 43, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 43, 0.92)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    paddingHorizontal: 14,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  bottomCard: {
    backgroundColor: 'rgba(11, 19, 43, 0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(94, 234, 212, 0.3)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  markerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(94, 234, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  locationTitle: { fontSize: 13, fontWeight: '700', color: '#F8FAFC' },
  coordsText: { fontSize: 11, color: '#5EEAD4', fontWeight: '600', marginTop: 1 },
  dragHintBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dragHintText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  addressText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 14,
  },
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: '#5EEAD4',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#042F2E',
    fontSize: 15,
    fontWeight: '700',
  },
});
