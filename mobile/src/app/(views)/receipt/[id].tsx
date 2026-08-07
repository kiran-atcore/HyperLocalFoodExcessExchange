import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReceiptViewScreen() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Order Receipt</Text>
      
      <View style={styles.card}>
        <View style={styles.qrWrapper}>
          <QRCode value={`qr-hash-${id}`} size={150} color="#0f172a" />
        </View>
        <Text style={styles.scanText}>Show this QR code to the vendor at pickup</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Item</Text>
          <Text style={styles.value}>Assorted Pastries</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Vendor</Text>
          <Text style={styles.value}>Sunrise Bakery</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.statusReady}>READY FOR PICKUP</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value}>#ORD-{id}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, width: '100%', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, alignItems: 'center' },
  qrWrapper: { padding: 16, backgroundColor: '#f1f5f9', borderRadius: 16, marginBottom: 16 },
  scanText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  divider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginBottom: 24, borderStyle: 'dashed' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  label: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  value: { fontSize: 15, color: '#0f172a', fontWeight: 'bold' },
  statusReady: { fontSize: 15, color: '#10b981', fontWeight: '900' },
  backButton: { marginTop: 32, padding: 16, borderRadius: 12, backgroundColor: '#e2e8f0', width: '100%', alignItems: 'center' },
  backButtonText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
});
