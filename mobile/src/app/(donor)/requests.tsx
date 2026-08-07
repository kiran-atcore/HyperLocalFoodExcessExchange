import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const DUMMY_REQUESTS = [
  { id: '1', name: 'John Doe', item: 'Assorted Pastries (x2)', time: 'ETA: 5:15 PM', type: 'CONSUMER' },
  { id: '2', name: 'Hope Shelter Inc.', item: '50lb Rice Bags (x3)', time: 'ETA: 5:45 PM', type: 'SHELTER' },
];

export default function DonorRequestsScreen() {
  const renderItem = ({ item }: any) => {
    const isShelter = item.type === 'SHELTER';
    return (
      <TouchableOpacity style={[styles.card, { borderLeftColor: isShelter ? '#3b82f6' : '#10b981' }]} onPress={() => router.push(`/(views)/request/${item.id}` as any)}>
        <View style={styles.headerRow}>
          <View style={styles.userCol}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={[styles.badge, { backgroundColor: isShelter ? '#eff6ff' : '#ecfdf5' }]}>
              <Text style={[styles.badgeText, { color: isShelter ? '#2563eb' : '#059669' }]}>{item.type}</Text>
            </View>
          </View>
          <Ionicons name="time-outline" size={20} color="#f59e0b" />
        </View>
        <Text style={styles.itemText}>{item.item}</Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Incoming Pickups</Text>
      <FlatList 
        data={DUMMY_REQUESTS} 
        renderItem={renderItem} 
        keyExtractor={item => item.id} 
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16, marginTop: 16 },
  list: { paddingBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderLeftWidth: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userCol: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  itemText: { fontSize: 16, color: '#475569', marginBottom: 8 },
  timeText: { fontSize: 14, fontWeight: 'bold', color: '#f59e0b' }
});
