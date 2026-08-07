import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LocationBanner from '../../components/LocationBanner';

const DUMMY_RESCUE_FEED = [
  { id: '1', title: '50lb Rice Bags (x3)', donor: 'Warehouse Co.', distance: '4.5 km', expires: 'Today 5 PM' },
  { id: '2', title: 'Produce Box (Slightly bruised)', donor: 'Downtown Grocer', distance: '3.1 km', expires: 'Tomorrow 10 AM' },
];

export default function ShelterFeedScreen() {
  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(views)/donation/${item.id}` as any)}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.donor}>{item.donor} • {item.distance}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.time}>Claim by: {item.expires}</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Claim for NGO</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LocationBanner />
      <Text style={styles.header}>Priority Rescue Feed</Text>
      <Text style={styles.subtitle}>100% Free Bulk Donations</Text>
      <FlatList data={DUMMY_RESCUE_FEED} renderItem={renderItem} keyExtractor={item => item.id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#3b82f6', fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  donor: { fontSize: 14, color: '#64748b', marginBottom: 12, marginTop: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
  button: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' }
});