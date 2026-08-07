import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationBanner from '../../components/LocationBanner';

const DUMMY_DEALS = [
  { id: '1', title: 'Assorted Pastries', vendor: 'Sunrise Bakery', distance: '1.2 km', originalPrice: 12.0, discountedPrice: 4.5, time: 'Pickup by 6 PM', type: 'DISCOUNT', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
  { id: '2', title: 'Veggie Pizza Slices', vendor: 'Luigi\'s Pizzeria', distance: '2.5 km', originalPrice: 15.0, discountedPrice: 5.0, time: 'Pickup by 9 PM', type: 'DISCOUNT', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
  { id: '3', title: 'Produce Box', vendor: 'Downtown Grocer', distance: '3.1 km', originalPrice: 20.0, discountedPrice: 0.0, time: 'Pickup by 8 PM', type: 'DONATION', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400' },
];

export default function ConsumerFeedScreen() {
  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => router.push(`/(views)/deal/${item.id}` as any)}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={item.type === 'DONATION' ? styles.badgeFree : styles.badgeDiscount}>
            {item.type === 'DONATION' ? 'FREE' : `$${item.discountedPrice.toFixed(2)}`}
          </Text>
        </View>
        <Text style={styles.vendor}>{item.vendor} • {item.distance}</Text>
        <Text style={styles.originalPrice}>Original: ${item.originalPrice.toFixed(2)}</Text>
        <View style={styles.footerRow}>
          <Text style={styles.time}>{item.time}</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>{item.type === 'DONATION' ? 'Reserve' : 'Buy Now'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LocationBanner />
      <Text style={styles.header}>Nearby Deals</Text>
      <FlatList data={DUMMY_DEALS} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  list: { paddingBottom: 40 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  image: { width: '100%', height: 160 },
  cardContent: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', flex: 1 },
  badgeDiscount: { backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  badgeFree: { backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  vendor: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  originalPrice: { fontSize: 12, color: '#94a3b8', textDecorationLine: 'line-through', marginBottom: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
  button: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' }
});