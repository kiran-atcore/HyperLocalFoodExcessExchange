import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_PASSES = [
  { id: '101', title: 'Assorted Pastries', vendor: 'Sunrise Bakery', status: 'READY', hash: 'qr-hash-101' },
  { id: '102', title: 'Veggie Pizza Slices', vendor: 'Luigi\'s Pizzeria', status: 'REDEEMED', hash: 'qr-hash-102' }
];

export default function WalletScreen() {
  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={[styles.card, item.status === 'REDEEMED' && styles.cardFaded]} activeOpacity={0.8} onPress={() => router.push(`/(views)/receipt/${item.id}` as any)}>
      <View style={styles.qrContainer}>
        <QRCode value={item.hash} size={80} color={item.status === 'REDEEMED' ? '#cbd5e1' : '#0f172a'} />
      </View>
      <View style={styles.details}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.vendor}>{item.vendor}</Text>
        <Text style={[styles.status, item.status === 'READY' ? styles.statusReady : styles.statusRedeemed]}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Pickup Wallet</Text>
      <FlatList data={DUMMY_PASSES} renderItem={renderItem} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardFaded: { opacity: 0.6 },
  qrContainer: { marginRight: 16, backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8 },
  details: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  vendor: { fontSize: 14, color: '#64748b', marginTop: 4 },
  status: { marginTop: 8, fontSize: 12, fontWeight: 'bold' },
  statusReady: { color: '#10b981' },
  statusRedeemed: { color: '#94a3b8' }
});