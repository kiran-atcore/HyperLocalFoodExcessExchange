import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '../../utils/api';

export default function DonorTaxScreen() {
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
      setReceipts(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = receipts.reduce((sum, r) => sum + parseFloat(r.estimated_value || '0'), 0).toFixed(2);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tax Deductions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Estimated Value</Text>
          <Text style={styles.summaryValue}>${totalValue}</Text>
          <Text style={styles.summaryYear}>{new Date().getFullYear()} Tax Year</Text>
        </View>

        <TouchableOpacity style={styles.exportBtn}>
          <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.exportBtnText}>Export Annual Receipt</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent Bulk Donations</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 20 }} />
        ) : receipts.length === 0 ? (
          <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 20 }}>No tax receipts yet. When a shelter picks up a donation, receipts appear here.</Text>
        ) : (
          receipts.map((receipt) => (
            <View key={receipt.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(receipt.created_at).toLocaleDateString()}</Text>
                <Text style={styles.value}>${receipt.estimated_value}</Text>
              </View>
              <Text style={styles.item}>{receipt.listing_title}</Text>
              <Text style={styles.ngo}>To: {receipt.ngo_name}</Text>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  
  content: { padding: 16, paddingBottom: 40 },
  
  summaryCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3 },
  summaryLabel: { color: '#94a3b8', fontSize: 14, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 8 },
  summaryValue: { color: '#10b981', fontSize: 40, fontWeight: 'bold', marginBottom: 8 },
  summaryYear: { color: '#cbd5e1', fontSize: 15 },

  exportBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  exportBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, borderLeftWidth: 4, borderLeftColor: '#10b981' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  date: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  value: { fontSize: 16, color: '#10b981', fontWeight: 'bold' },
  item: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  ngo: { fontSize: 14, color: '#475569' }
});