import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';

const DUMMY_LISTINGS = [
  { id: '1', title: 'Assorted Pastries', latitude: 37.78825, longitude: -122.4324, type: 'DISCOUNT', price: '4.50', distance_km: 1.2 },
  { id: '3', title: 'Produce Box', latitude: 37.79000, longitude: -122.4350, type: 'DONATION', price: '0.00', distance_km: 3.1 },
];

export default function ConsumerMapScreen() {
  const markersJs = DUMMY_LISTINGS.map(item => {
    const color = item.type === 'DONATION' ? '#10b981' : '#f59e0b';
    return `
      L.circleMarker([${item.latitude}, ${item.longitude}], {
        color: '${color}',
        fillColor: '${color}',
        fillOpacity: 0.9,
        radius: 14,
        weight: 2
      }).addTo(map)
        .bindPopup('<div style="font-family: sans-serif; text-align: center;"><b>${item.title}</b><br/><span style="color: ${color}; font-weight: bold;">${item.price === "0.00" ? "FREE" : "$" + item.price}</span><br/><small style="color: #64748b;">${item.distance_km} km away</small></div>');
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
        var map = L.map('map', { zoomControl: false }).setView([37.78825, -122.4324], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap © CARTO'
        }).addTo(map);

        ${markersJs}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  map: { flex: 1 },
});