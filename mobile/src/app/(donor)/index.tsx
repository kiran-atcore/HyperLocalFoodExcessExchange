import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const DUMMY_ACTIVE_SURPLUS = [
  { id: '1', title: 'Leftover Lasagna', portions: 5, postedAt: '2 hrs ago', expires: '8 PM', type: 'DISCOUNT', price: '$4.00' },
  { id: '2', title: 'Day-old Bagels', portions: 12, postedAt: '5 hrs ago', expires: '6 PM', type: 'DONATION', price: 'FREE' },
];

export default function DonorDashboardScreen() {
  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(views)/surplus/${item.id}` as any)}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>{item.price}</Text>
      </View>
      <Text style={styles.details}>{item.portions} portions available</Text>
      <View style={styles.footerRow}>
        <Text style={styles.time}>Expires: {item.expires}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push(`/(forms)/edit-surplus/${item.id}` as any)}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Active Surplus</Text>
      <FlatList data={DUMMY_ACTIVE_SURPLUS} renderItem={renderItem} keyExtractor={item => item.id} />
      
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(forms)/post-surplus/new' as any)}>
        <Text style={styles.fabText}>+ Post New Surplus</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#10b981' },
  details: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 14, color: '#ef4444' },
  button: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  buttonText: { color: '#475569', fontWeight: '600', fontSize: 12 },
  fab: { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});