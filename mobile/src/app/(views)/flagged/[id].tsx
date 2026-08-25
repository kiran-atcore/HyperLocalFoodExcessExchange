import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';

export default function AdminFlaggedDetailScreen() {
  const { id } = useLocalSearchParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    fetchReceipt();
  }, [id]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tax-receipts/${id}/`);
      setReceipt(response.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load receipt details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (value: number) => {
    try {
      await api.post(`/tax-receipts/${id}/approve/`, { approved_value: value });
      Alert.alert('Success', 'Receipt approved successfully');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to approve receipt');
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/tax-receipts/${id}/reject/`);
      Alert.alert('Success', 'Receipt rejected');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to reject receipt');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </SafeAreaView>
    );
  }

  if (!receipt) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Flagged Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Donation Details</Text>
          <Text style={styles.itemTitle}>{receipt.listing_title}</Text>
          <Text style={styles.itemDescription}>{receipt.listing_description || 'No description provided.'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Donor Details (Claimant)</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>{receipt.donor_details?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>{receipt.donor_details?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>{receipt.donor_details?.phone}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>NGO Details (Recipient)</Text>
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>{receipt.ngo_details?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>{receipt.ngo_details?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>{receipt.ngo_details?.phone}</Text>
          </View>
        </View>

        <View style={styles.valuationCard}>
          <Text style={styles.sectionTitle}>Valuation Comparison</Text>
          <View style={styles.comparisonContainer}>
            <View style={styles.valueBox}>
              <Text style={styles.valueLabel}>Claimed Value</Text>
              <Text style={styles.claimedValue}>₹{receipt.estimated_value}</Text>
            </View>
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.valueBox}>
              <Text style={styles.valueLabel}>AI Suggested</Text>
              <Text style={styles.aiValue}>₹{receipt.ai_suggested_value}</Text>
            </View>
          </View>
        </View>

        {receipt.ai_valuation_report && (
          <View style={styles.reportCard}>
            <Text style={styles.sectionTitle}>AI Valuation Report</Text>
            
            <View style={styles.reasoningBox}>
              <Ionicons name="information-circle-outline" size={20} color="#3b82f6" style={{ marginTop: 2, marginRight: 8 }} />
              <Text style={styles.reasoningText}>{receipt.ai_valuation_report.reasoning}</Text>
            </View>

            <Text style={styles.breakdownTitle}>Cost Breakdown</Text>
            <View style={styles.breakdownContainer}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Ingredients</Text>
                <Text style={styles.breakdownValue}>₹{receipt.ai_valuation_report.breakdown?.ingredients || 0}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Labour</Text>
                <Text style={styles.breakdownValue}>₹{receipt.ai_valuation_report.breakdown?.labour || 0}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Service</Text>
                <Text style={styles.breakdownValue}>₹{receipt.ai_valuation_report.breakdown?.service || 0}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Miscellaneous</Text>
                <Text style={styles.breakdownValue}>₹{receipt.ai_valuation_report.breakdown?.misc || 0}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.actionHeader}>Admin Decision</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(receipt.estimated_value)}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#ef4444" style={{ marginBottom: 4 }} />
            <Text style={styles.approveBtnText}>Approve Claimed</Text>
            <Text style={{ fontSize: 11, color: '#fca5a5', marginTop: 2 }}>Allow ₹{receipt.estimated_value}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveAiBtn} onPress={() => handleApprove(receipt.ai_suggested_value)}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" style={{ marginBottom: 4 }} />
            <Text style={styles.approveAiBtnText}>Approve AI Value</Text>
            <Text style={{ fontSize: 11, color: '#6ee7b7', marginTop: 2 }}>Cap at ₹{receipt.ai_suggested_value}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
          <Text style={styles.rejectBtnText}>Reject Receipt Entirely</Text>
        </TouchableOpacity>

        <View style={styles.customValueCard}>
          <Text style={styles.sectionTitle}>Custom Valuation</Text>
          <View style={styles.customRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput 
              style={styles.customInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={customValue}
              onChangeText={setCustomValue}
            />
          </View>
          <TouchableOpacity 
            style={[styles.approveCustomBtn, !customValue && { opacity: 0.5 }]} 
            disabled={!customValue}
            onPress={() => handleApprove(parseFloat(customValue))}
          >
            <Text style={styles.approveCustomBtnText}>Approve Custom Value</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 32 },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  itemTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  itemDescription: { fontSize: 14, color: '#475569', lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#334155', marginLeft: 8 },
  
  valuationCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#fef3c7', elevation: 1 },
  comparisonContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 8 },
  valueBox: { flex: 1, alignItems: 'center' },
  valueLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  claimedValue: { fontSize: 18, fontWeight: 'bold', color: '#ef4444' },
  aiValue: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
  vsContainer: { paddingHorizontal: 16 },
  vsText: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8' },
  
  actionHeader: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginLeft: 4 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  approveBtn: { flex: 1, backgroundColor: '#fef2f2', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginRight: 6, borderWidth: 1, borderColor: '#fca5a5' },
  approveBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  approveAiBtn: { flex: 1, backgroundColor: '#ecfdf5', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginLeft: 6, borderWidth: 1, borderColor: '#6ee7b7' },
  approveAiBtnText: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
  rejectBtn: { backgroundColor: '#ffffff', paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  rejectBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
  
  customValueCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginTop: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, borderWidth: 1, borderColor: '#e2e8f0' },
  customRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  currencyPrefix: { fontSize: 18, color: '#64748b', fontWeight: 'bold', marginRight: 8 },
  customInput: { flex: 1, height: 48, fontSize: 18, color: '#0f172a' },
  approveCustomBtn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  approveCustomBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  
  reportCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e0e7ff', elevation: 1 },
  reasoningBox: { flexDirection: 'row', backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 16 },
  reasoningText: { flex: 1, fontSize: 14, color: '#1e3a8a', lineHeight: 20 },
  breakdownTitle: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  breakdownContainer: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  breakdownLabel: { fontSize: 14, color: '#64748b' },
  breakdownValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' }
});
