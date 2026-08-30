import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import CountdownTimer from '../../components/CountdownTimer';

export default function DonorRequestsScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SHELTER' | 'CONSUMER'>('SHELTER');
  const [sortFilter, setSortFilter] = useState<'LATEST' | 'OLDEST' | 'SOONEST' | 'FURTHEST'>('LATEST');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
          </View>
          <Ionicons name="time-outline" size={20} color="#f59e0b" />
        </View>
        <Text style={styles.itemText}>{item.quantity || 1} {item.listing_details?.quantity_unit || 'portions'} claimed • {item.listing_details?.title}</Text>
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

  const displayedOrders = orders
    .filter(o => {
      const matchesTab = o.requester_details?.role === (activeTab === 'SHELTER' ? 'shelter' : 'consumer');
      const query = searchQuery.toLowerCase();
      const matchesSearch = query === '' || 
        (o.requester_details?.name && o.requester_details.name.toLowerCase().includes(query)) ||
        (o.listing_details?.title && o.listing_details.title.toLowerCase().includes(query));
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => {
      if (sortFilter === 'SOONEST') {
        const timeA = a.eta ? new Date(a.eta).getTime() : Infinity;
        const timeB = b.eta ? new Date(b.eta).getTime() : Infinity;
        return timeA - timeB;
      } else if (sortFilter === 'FURTHEST') {
        const timeA = a.eta ? new Date(a.eta).getTime() : 0;
        const timeB = b.eta ? new Date(b.eta).getTime() : 0;
        return timeB - timeA;
      } else if (sortFilter === 'OLDEST') {
        return a.id - b.id;
      } else {
        // LATEST
        return b.id - a.id;
      }
    });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Incoming Pickups</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by requester or item..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowSortMenu(true)}
        >
          <Text style={styles.dropdownButtonText}>
            Sort by: {sortFilter === 'LATEST' ? 'Latest' : sortFilter === 'OLDEST' ? 'Oldest' : sortFilter === 'SOONEST' ? 'Soonest' : 'Furthest'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#64748b" style={{ marginLeft: 4 }} />
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

      <Modal visible={showSortMenu} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortMenu(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Sort By</Text>
            
            <TouchableOpacity style={styles.menuOption} onPress={() => { setSortFilter('LATEST'); setShowSortMenu(false); }}>
              <Text style={[styles.menuOptionText, sortFilter === 'LATEST' && styles.menuOptionTextActive]}>Latest</Text>
              {sortFilter === 'LATEST' && <Ionicons name="checkmark" size={20} color="#10b981" />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuOption} onPress={() => { setSortFilter('OLDEST'); setShowSortMenu(false); }}>
              <Text style={[styles.menuOptionText, sortFilter === 'OLDEST' && styles.menuOptionTextActive]}>Oldest</Text>
              {sortFilter === 'OLDEST' && <Ionicons name="checkmark" size={20} color="#10b981" />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuOption} onPress={() => { setSortFilter('SOONEST'); setShowSortMenu(false); }}>
              <Text style={[styles.menuOptionText, sortFilter === 'SOONEST' && styles.menuOptionTextActive]}>Soonest</Text>
              {sortFilter === 'SOONEST' && <Ionicons name="checkmark" size={20} color="#10b981" />}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuOption, { borderBottomWidth: 0 }]} onPress={() => { setSortFilter('FURTHEST'); setShowSortMenu(false); }}>
              <Text style={[styles.menuOptionText, sortFilter === 'FURTHEST' && styles.menuOptionTextActive]}>Furthest</Text>
              {sortFilter === 'FURTHEST' && <Ionicons name="checkmark" size={20} color="#10b981" />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16, marginTop: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16, color: '#1e293b' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 8, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  activeTabText: { color: '#0f172a' },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  dropdownButtonText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuContainer: { backgroundColor: '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 40 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 16, textAlign: 'center' },
  menuOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuOptionText: { fontSize: 16, color: '#475569' },
  menuOptionTextActive: { color: '#10b981', fontWeight: 'bold' },
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
