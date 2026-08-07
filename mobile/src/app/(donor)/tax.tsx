import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const DUMMY_DONATIONS = [
  { id: '1', date: 'Oct 12, 2023', item: 'Produce Box', value: '$85.00', ngo: 'Hope Shelter Inc.' },
  { id: '2', date: 'Nov 04, 2023', item: '50lb Rice Bags (x3)', value: '$150.00', ngo: 'Downtown Food Bank' },
  { id: '3', date: 'Dec 18, 2023', item: 'Canned Goods Pallet', value: '$220.00', ngo: 'Community Kitchen' },
];

export default function DonorTaxScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tax Deductions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Estimated Value</Text>
          <Text style={styles.summaryValue}>$455.00</Text>
          <Text style={styles.summaryYear}>2023 Tax Year</Text>
        </View>

        <TouchableOpacity style={styles.exportBtn}>
          <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.exportBtnText}>Export Annual Receipt</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent Bulk Donations</Text>
        
        {DUMMY_DONATIONS.map((donation) => (
          <View key={donation.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{donation.date}</Text>
              <Text style={styles.value}>{donation.value}</Text>
            </View>
            <Text style={styles.item}>{donation.item}</Text>
            <Text style={styles.ngo}>To: {donation.ngo}</Text>
          </View>
        ))}

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