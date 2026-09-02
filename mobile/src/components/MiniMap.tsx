import React from 'react';
import { TouchableOpacity, View, Linking, Platform, StyleSheet } from 'react-native';
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

  // Modern sleek teal map marker
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0D9488" width="40px" height="40px">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path filter="url(#glow)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  // Apply CSS filters to the map layer to turn light OSM tiles into dark, cinematic teal-tinted maps
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; background-color: #0F172A; }
        html, body, #map { height: 100%; width: 100vw; background-color: #0F172A; }
        
        /* Dark mode magic for OSM */
        .leaflet-layer,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(90%) contrast(90%) sepia(20%) hue-rotate(-20deg);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false }).setView([${latitude}, ${longitude}], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ''
        }).addTo(map);

        var customIcon = L.divIcon({
          html: '${svgIcon.replace(/\n/g, '')}',
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });
        L.marker([${latitude}, ${longitude}], {icon: customIcon}).addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.container}>
      <View pointerEvents="none" style={styles.container}>
        <RNWebView
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          backgroundColor="transparent"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    width: '100%', 
    height: '100%',
    backgroundColor: '#0F172A',
  },
  webview: {
    flex: 1, 
    width: '100%', 
    height: '100%',
    backgroundColor: 'transparent',
  }
});
