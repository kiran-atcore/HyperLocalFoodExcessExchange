import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import CountdownTimer from '../../components/CountdownTimer';

export default function DonorDashboardScreen() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [])
  );

  const fetchListings = async () => {
    try {
      const response = await api.get('/listings/?mine=true');
      const activeOnly = response.data.filter((item: any) => item.donor_status !== 'Picked Up');
      setListings(activeOnly);
    } catch (error) {
      console.error("Failed to fetch listings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/listings/${id}/`);
              fetchListings();
            } catch (error) {
              Alert.alert("Error", "Failed to delete listing.");
            }
          }
        }
      ]
    );
  };
  const renderItem = ({ item }: any) => {
    const isExpired = item.forceExpired || (item.pickup_end && new Date(item.pickup_end).getTime() <= new Date().getTime());
    
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/(views)/surplus/${item.id}` as any)}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { flex: 1 }]} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.price}>{item.listing_type === 'DONATION' ? 'FREE' : `₹${item.discounted_price}`}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={[
            styles.statusBadge, 
            item.donor_status === 'Active' && !isExpired ? styles.statusActive : 
            item.donor_status === 'Claimed' ? styles.statusClaimed : 
            isExpired && item.donor_status === 'Active' ? styles.statusExpired : styles.statusPickedUp
          ]}>
            <Text style={[
              styles.statusText,
              item.donor_status === 'Active' && !isExpired ? styles.textActive : 
              item.donor_status === 'Claimed' ? styles.textClaimed : 
              isExpired && item.donor_status === 'Active' ? styles.textExpired : styles.textPickedUp
            ]}>{isExpired && item.donor_status === 'Active' ? 'Expired' : item.donor_status}</Text>
          </View>
          <Text style={styles.details}>{item.quantity_available} {item.quantity_unit || 'portions'} available</Text>
        </View>
        <Text style={[styles.time, { color: '#64748b', marginBottom: 12, fontSize: 13 }]}>
          Expires in: <CountdownTimer 
            targetDate={item.pickup_end} 
            onExpire={() => setListings(prev => prev.map(l => l.id === item.id ? { ...l, forceExpired: true } : l))} 
          />
        </Text>
        <View style={styles.footerRow}>
          <Text style={styles.time}>Type: {item.listing_type}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {isExpired && item.donor_status === 'Active' ? (
              <TouchableOpacity style={[styles.button, { backgroundColor: '#10b981' }]} onPress={() => router.push(`/(forms)/edit-surplus/${item.id}` as any)}>
                <Text style={[styles.buttonText, { color: '#ffffff' }]}>Reactivate</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.button} onPress={() => router.push(`/(forms)/edit-surplus/${item.id}` as any)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Active Surplus</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={listings} 
          renderItem={renderItem} 
          keyExtractor={item => item.id.toString()} 
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>No active surplus found. Post one!</Text>}
        />
      )}
      
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
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  statusActive: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  textActive: { color: '#059669' },
  statusClaimed: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  textClaimed: { color: '#d97706' },
  statusExpired: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  textExpired: { color: '#dc2626' },
  statusPickedUp: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  textPickedUp: { color: '#475569' },
  button: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  buttonText: { color: '#475569', fontWeight: '600', fontSize: 12 },
  deleteButton: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});