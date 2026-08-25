import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { DeviceEventEmitter } from 'react-native';

export default function MapSelectionScreen() {
  const params = useLocalSearchParams();
  const initialLat = params.lat ? parseFloat(params.lat as string) : 37.78825;
  const initialLng = params.lng ? parseFloat(params.lng as string) : -122.4324;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat: initialLat, lng: initialLng });
  const [addressName, setAddressName] = useState('Fetching address...');
  const webViewRef = useRef<WebView>(null);

  React.useEffect(() => {
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location') {
        setSelectedCoords({ lat: data.lat, lng: data.lng });
      }
    } catch (err) {}
  };

  const confirmLocation = () => {
    DeviceEventEmitter.emit('onLocationSelected', { lat: selectedCoords.lat, lng: selectedCoords.lng, address: addressName });
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
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${selectedCoords.lat}, ${selectedCoords.lng}], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search address or zip code..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#10b981" style={{ marginLeft: 8 }} />
            ) : (
              <TouchableOpacity onPress={handleSearch} disabled={isSearching} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

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

        <View style={styles.footer}>
          <Text style={styles.addressText} numberOfLines={2}>
            {addressName}
          </Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={confirmLocation}>
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
            marginLeft: 8,
          },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  addressText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmBtn: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
