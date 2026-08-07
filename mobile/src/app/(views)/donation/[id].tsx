import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DonationViewScreen() {
  const { id } = useLocalSearchParams();

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
        var map = L.map('map', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([37.78825, -122.4324], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        L.circleMarker([37.78825, -122.4324], {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.9,
          radius: 12,
          weight: 2
        }).addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=800' }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Bulk Donation #{id}</Text>
          <Text style={styles.badge}>FREE</Text>
        </View>
        <Text style={styles.vendor}>Warehouse Co. • 4.5 km away</Text>
        
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.description}>
          We have three 50lb bags of white rice available. Slightly damaged packaging on one bag but contents are perfectly safe. Must be picked up today.
        </Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estimated Value:</Text>
          <Text style={styles.infoValue}>$150.00</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Claim By:</Text>
          <Text style={styles.infoValueTime}>Today 5:00 PM</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Weight:</Text>
          <Text style={styles.infoValue}>150 lbs</Text>
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
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reserveButton} onPress={() => router.push(`/(views)/claim/${id}` as any)}>
          <Text style={styles.reserveButtonText}>Claim for NGO</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  image: { width: '100%', height: 250 },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  badge: { backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, fontSize: 16 },
  vendor: { fontSize: 16, color: '#64748b', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  description: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12 },
  infoLabel: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 15, color: '#0f172a', fontWeight: 'bold' },
  infoValueTime: { fontSize: 15, color: '#ef4444', fontWeight: 'bold' },
  footer: { flexDirection: 'row', padding: 20, paddingTop: 0, gap: 12 },
  backButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center' },
  backButtonText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  reserveButton: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center' },
  reserveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  mapContainer: { height: 180, borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#e2e8f0' },
  map: { flex: 1 }
});
