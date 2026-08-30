import React from 'react';
import { TouchableOpacity, View, Linking, Platform } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

interface MiniMapProps {
  latitude: number;
  longitude: number;
}

export default function MiniMap({ latitude, longitude }: MiniMapProps) {
  const handlePress = () => {
    const url = Platform.select({
      ios: `maps:${latitude},${longitude}?q=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    });
    
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="36px" height="36px">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

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
        var map = L.map('map', { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false }).setView([${latitude}, ${longitude}], 15);
        
        // Use OpenStreetMap to avoid API Key watermarks
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ''
        }).addTo(map);

        var customIcon = L.divIcon({
          html: '${svgIcon.replace(/\n/g, '')}',
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36]
        });
        L.marker([${latitude}, ${longitude}], {icon: customIcon}).addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={{ flex: 1, width: '100%', height: '100%' }}>
      <View pointerEvents="none" style={{ flex: 1, width: '100%', height: '100%' }}>
        <RNWebView
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={{ flex: 1, width: '100%', height: '100%' }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </TouchableOpacity>
  );
}
