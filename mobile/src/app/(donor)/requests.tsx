import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';

export default function DonorRequestsScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/');
      // Filter out picked up or cancelled orders
      const activeOrders = response.data.filter((o: any) => o.status === 'PENDING' || o.status === 'APPROVED');
      setOrders(activeOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const renderItem = ({ item }: any) => {
    const isShelter = item.requester_details?.role === 'shelter';
    return (
      <TouchableOpacity style={[styles.card, { borderLeftColor: isShelter ? '#3b82f6' : '#10b981' }]} onPress={() => router.push({ pathname: '/(donor)/scan', params: { order_id: item.id } })}>
        <View style={styles.headerRow}>
          <View style={styles.userCol}>
            <Text style={styles.name}>{item.requester_details?.name}</Text>
            <View style={[styles.badge, { backgroundColor: isShelter ? '#eff6ff' : '#ecfdf5' }]}>
              <Text style={[styles.badgeText, { color: isShelter ? '#2563eb' : '#059669' }]}>
                {item.requester_details?.role?.toUpperCase()}
              </Text>
            </View>
          </View>
          <Ionicons name="time-outline" size={20} color="#f59e0b" />
        </View>
        <Text style={styles.itemText}>{item.listing_details?.title}</Text>
        <Text style={styles.timeText}>{item.eta ? `ETA: ${new Date(item.eta).toLocaleTimeString()}` : 'No ETA Provided'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Incoming Pickups</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 40, color: '#64748b' }}>No incoming pickups at the moment.</Text>
      ) : (
        <FlatList 
          data={orders} 
          renderItem={renderItem} 
          keyExtractor={item => item.id.toString()} 
          contentContainerStyle={styles.list}
        />
      )}
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
