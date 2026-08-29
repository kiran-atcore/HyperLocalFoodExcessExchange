import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';

export default function AdminFlaggedScreen() {
  const { logout } = React.useContext(AuthContext);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchReceipts();
    }, [])
  );

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tax-receipts/');
      const pending = response.data.filter((r: any) => r.status === 'PENDING');
      setReceipts(pending);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flagged Donations</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout(false)}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {receipts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#10b981" />
            <Text style={styles.emptyText}>No flagged receipts to review!</Text>
          </View>
        ) : (
          receipts.map(receipt => (
            <TouchableOpacity 
              key={receipt.id} 
              style={styles.card}
              onPress={() => router.push(`/(views)/flagged/${receipt.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{receipt.listing_title}</Text>
                  <Text style={styles.ngoName} numberOfLines={1}>NGO: {receipt.ngo_name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
              
              <View style={styles.comparisonContainer}>
                <Text style={styles.claimedValue}>Claimed: ₹{receipt.estimated_value}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Review Required</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 4, fontSize: 13 },
  content: { padding: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#64748b' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#fef3c7', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  ngoName: { fontSize: 13, color: '#64748b', marginTop: 2 },
  comparisonContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimedValue: { fontSize: 15, fontWeight: 'bold', color: '#ef4444' },
  badge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#d97706', fontSize: 11, fontWeight: 'bold' }
});
