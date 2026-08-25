import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import CountdownTimer from '../../components/CountdownTimer';

export default function DonorRequestsScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SHELTER' | 'CONSUMER'>('SHELTER');

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/');
      // Filter out picked up or cancelled/expired orders
      const activeOrders = response.data.filter((o: any) => o.status === 'PENDING' || o.status === 'APPROVED');
      setOrders(activeOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const handleAutoExpire = async (orderId: number) => {
    setOrders(prev => prev.filter(c => c.id !== orderId));
    try {
      await api.patch(`/orders/${orderId}/expire/`);
    } catch (e) {
      console.error("Auto cancel failed", e);
    }
  };

  const renderItem = ({ item }: any) => {
    const isShelter = item.requester_details?.role === 'shelter';
    return (
      <TouchableOpacity style={[styles.card, { borderLeftColor: isShelter ? '#3b82f6' : '#10b981' }]} onPress={() => router.push(`/(views)/request/${item.id}` as any)}>
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
        <View style={styles.footerRow}>
          <Text style={styles.timeText}>{item.eta ? `ETA: ${new Date(item.eta).toLocaleTimeString()}` : 'No ETA Provided'}</Text>
          {item.listing_details?.pickup_end && (
            <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: 'bold' }}>
              Expires in: <CountdownTimer targetDate={item.listing_details.pickup_end} onExpire={() => handleAutoExpire(item.id)} />
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const displayedOrders = orders.filter(o => 
    o.requester_details?.role === (activeTab === 'SHELTER' ? 'shelter' : 'consumer')
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Incoming Pickups</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'SHELTER' && styles.activeTab]} 
          onPress={() => setActiveTab('SHELTER')}
        >
          <Text style={[styles.tabText, activeTab === 'SHELTER' && styles.activeTabText]}>NGOs / Shelters</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CONSUMER' && styles.activeTab]} 
          onPress={() => setActiveTab('CONSUMER')}
        >
          <Text style={[styles.tabText, activeTab === 'CONSUMER' && styles.activeTabText]}>Consumers</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
      ) : displayedOrders.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 40, color: '#64748b' }}>
          No incoming pickups from {activeTab === 'SHELTER' ? 'shelters' : 'consumers'}.
        </Text>
      ) : (
        <FlatList 
          data={displayedOrders} 
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
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 8, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  activeTabText: { color: '#0f172a' },
  list: { paddingBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderLeftWidth: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userCol: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  itemText: { fontSize: 16, color: '#475569', marginBottom: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 14, fontWeight: 'bold', color: '#f59e0b' }
});
