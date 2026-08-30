import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../utils/api';

export default function DonorTaxScreen() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

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

  const displayedReceipts = receipts.filter(r => {
    const rTime = new Date(r.created_at).getTime();
    const sTime = new Date(startDate).setHours(0,0,0,0);
    const eTime = new Date(endDate).setHours(23,59,59,999);
    return rTime >= sTime && rTime <= eTime;
  });
  const totalValue = displayedReceipts.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + parseFloat(r.estimated_value || '0'), 0).toFixed(2);

  const handleExport = async () => {
    if (displayedReceipts.length === 0) {
      Alert.alert('No Receipts', 'You have no tax receipts to download for this period.');
      return;
    }

    try {
      const year = new Date().getFullYear();
      let csvContent = `Date,Item,NGO,Status,Estimated Value (INR)\n`;
      
      displayedReceipts.forEach(r => {
        const date = new Date(r.created_at).toLocaleDateString();
        const title = `"${(r.listing_title || '').replace(/"/g, '""')}"`;
        const ngo = `"${(r.ngo_name || '').replace(/"/g, '""')}"`;
        csvContent += `${date},${title},${ngo},${r.status},${r.estimated_value}\n`;
      });
      csvContent += `\nTotal Approved Value,,,,₹${totalValue}\n`;

      const filename = `Tax_Receipt_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      
      Alert.alert(
        'Download Successful', 
        `Your CSV has been downloaded to:\n${fileUri}`
      );
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate tax receipt CSV.');
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tax Deductions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Estimated Value</Text>
          <Text style={styles.summaryValue}>₹{totalValue}</Text>
          
          <View style={styles.dateFilterContainer}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
              <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
              <Text style={styles.dateBtnText}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <Text style={{ color: '#64748b', marginHorizontal: 8 }}>to</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
              <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
              <Text style={styles.dateBtnText}>{endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.exportBtnText}>Download Statement</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent Bulk Donations</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 20 }} />
        ) : displayedReceipts.length === 0 ? (
          <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 20 }}>No tax receipts yet. When a shelter picks up a donation, receipts appear here.</Text>
        ) : (
          displayedReceipts.map((receipt) => (
            <View key={receipt.id} style={[styles.card, receipt.status === 'PENDING' && { borderLeftColor: '#f59e0b' }, receipt.status === 'REJECTED' && { borderLeftColor: '#ef4444' }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(receipt.created_at).toLocaleDateString()}</Text>
                <Text style={[styles.value, receipt.status === 'PENDING' && { color: '#d97706' }, receipt.status === 'REJECTED' && { color: '#ef4444', textDecorationLine: 'line-through' }]}>₹{receipt.estimated_value}</Text>
              </View>
              <Text style={styles.item}>{receipt.listing_title}</Text>
              <Text style={styles.ngo}>To: {receipt.ngo_name}</Text>
              {receipt.status === 'PENDING' && (
                <View style={{ marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fffbeb', borderRadius: 4, alignSelf: 'flex-start' }}>
                  <Text style={{ color: '#d97706', fontSize: 12, fontWeight: 'bold' }}>Pending for admin approval</Text>
                </View>
              )}
              {receipt.status === 'REJECTED' && (
                <View style={{ marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fef2f2', borderRadius: 4, alignSelf: 'flex-start' }}>
                  <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>Rejected</Text>
                </View>
              )}
            </View>
          ))
        )}

      </ScrollView>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          maximumDate={endDate}
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          minimumDate={startDate}
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}
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
  dateFilterContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  dateBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },

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
