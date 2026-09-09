import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import api from '../../../utils/api';

export default function AdminFlaggedDetailScreen() {
  const { id } = useLocalSearchParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load flagged receipt details',
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (value: number) => {
    if (isNaN(value) || value <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Value',
        text2: 'Please enter a valid approved valuation amount.',
      });
      return;
    }
    setActionLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/tax-receipts/${id}/approve/`, { approved_value: value });
      Toast.show({
        type: 'success',
        text1: 'Receipt Approved',
        text2: `Approved valuation finalized at ₹${value.toLocaleString('en-IN')}`,
      });
      router.back();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: 'Failed to approve receipt valuation.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await api.post(`/tax-receipts/${id}/reject/`);
      Toast.show({
        type: 'info',
        text1: 'Receipt Rejected',
        text2: 'Discrepancy flagged receipt has been rejected.',
      });
      router.back();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Rejection Failed',
        text2: 'Unable to reject receipt right now.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#042F2E', '#0B132B', '#021815']}
          style={styles.bgGradient}
        />
        <SafeAreaView style={styles.loadingContainer} edges={['top']}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Analyzing audit discrepancy...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!receipt) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#042F2E', '#0B132B', '#021815']}
        style={styles.bgGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#5EEAD4" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Audit Review</Text>
              <Text style={styles.headerSubtitle}>Receipt #{id} • Valuation Discrepancy</Text>
            </View>
            <View style={styles.flagPill}>
              <Ionicons name="warning" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.flagText}>Flagged</Text>
            </View>
          </View>

          <ScrollView 
            contentContainerStyle={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Valuation Comparison Card */}
            <View style={styles.valuationCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="analytics" size={18} color="#F59E0B" />
                <Text style={styles.cardHeaderTitle}>Valuation Differential</Text>
              </View>

              <View style={styles.comparisonContainer}>
                <View style={styles.valueBox}>
                  <Text style={styles.valueLabel}>Claimed by Donor</Text>
                  <Text style={styles.claimedValue}>₹{receipt.estimated_value}</Text>
                  <View style={styles.claimedBadge}>
                    <Text style={styles.claimedBadgeText}>Overstated</Text>
                  </View>
                </View>

                <View style={styles.vsContainer}>
                  <View style={styles.vsLine} />
                  <View style={styles.vsCircle}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <View style={styles.vsLine} />
                </View>

                <View style={styles.valueBox}>
                  <Text style={styles.valueLabel}>AI Recommended</Text>
                  <Text style={styles.aiValue}>₹{receipt.ai_suggested_value}</Text>
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={10} color="#5EEAD4" style={{ marginRight: 3 }} />
                    <Text style={styles.aiBadgeText}>Fair Value</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* AI Report Card */}
            {receipt.ai_valuation_report && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="hardware-chip-outline" size={18} color="#5EEAD4" />
                  <Text style={styles.cardHeaderTitle}>AI Valuation Breakdown</Text>
                </View>

                {receipt.ai_valuation_report.reasoning ? (
                  <View style={styles.reasoningBox}>
                    <Ionicons name="information-circle-outline" size={18} color="#5EEAD4" style={{ marginTop: 2, marginRight: 8 }} />
                    <Text style={styles.reasoningText}>{receipt.ai_valuation_report.reasoning}</Text>
                  </View>
                ) : null}

                <View style={styles.breakdownContainer}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Ingredients & Raw Cost</Text>
                    <Text style={styles.breakdownValue}>₹{receipt.ai_valuation_report.breakdown?.ingredients || 0}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Labor & Prep Factor</Text>
                    <Text style={styles.breakdownValue}>₹{receipt.ai_valuation_report.breakdown?.labour || 0}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Packaging & Service</Text>
                    <Text style={styles.breakdownValue}>₹{receipt.ai_valuation_report.breakdown?.service || 0}</Text>
                  </View>
                  <View style={[styles.breakdownRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.breakdownLabel}>Depreciation / Expiry Factor</Text>
                    <Text style={styles.breakdownValue}>₹{receipt.ai_valuation_report.breakdown?.misc || 0}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Donation Item Details */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="fast-food-outline" size={18} color="#5EEAD4" />
                <Text style={styles.cardHeaderTitle}>Donation Item Details</Text>
              </View>
              <Text style={styles.itemTitle}>{receipt.listing_title}</Text>
              <Text style={styles.itemDescription}>
                {receipt.listing_description || 'No additional listing notes provided.'}
              </Text>
            </View>

            {/* Stakeholder Parties Grid */}
            <View style={styles.partiesRow}>
              {/* Donor */}
              <View style={[styles.card, styles.partyCard]}>
                <Text style={styles.partyRoleLabel}>DONOR (CLAIMANT)</Text>
                <Text style={styles.partyName} numberOfLines={1}>{receipt.donor_details?.name || 'N/A'}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={12} color="#94A3B8" />
                  <Text style={styles.partyDetailText} numberOfLines={1}>{receipt.donor_details?.email || 'N/A'}</Text>
                </View>
                {receipt.donor_details?.phone ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={12} color="#94A3B8" />
                    <Text style={styles.partyDetailText}>{receipt.donor_details?.phone}</Text>
                  </View>
                ) : null}
              </View>

              {/* Recipient */}
              <View style={[styles.card, styles.partyCard]}>
                <Text style={styles.partyRoleLabel}>RECIPIENT (SHELTER)</Text>
                <Text style={styles.partyName} numberOfLines={1}>{receipt.ngo_details?.name || 'N/A'}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={12} color="#94A3B8" />
                  <Text style={styles.partyDetailText} numberOfLines={1}>{receipt.ngo_details?.email || 'N/A'}</Text>
                </View>
                {receipt.ngo_details?.phone ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={12} color="#94A3B8" />
                    <Text style={styles.partyDetailText}>{receipt.ngo_details?.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Admin Adjudication Decision */}
            <View style={styles.decisionSection}>
              <Text style={styles.decisionTitle}>Adjudication Actions</Text>

              <View style={styles.actionButtonsRow}>
                {/* Approve AI */}
                <TouchableOpacity 
                  style={[styles.decisionBtn, styles.approveAiBtn]} 
                  onPress={() => handleApprove(receipt.ai_suggested_value)}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={18} color="#042F2E" />
                  <Text style={styles.approveAiBtnText}>Approve AI Value</Text>
                  <Text style={styles.approveAiBtnSub}>₹{receipt.ai_suggested_value}</Text>
                </TouchableOpacity>

                {/* Approve Claimed */}
                <TouchableOpacity 
                  style={[styles.decisionBtn, styles.approveClaimedBtn]} 
                  onPress={() => handleApprove(receipt.estimated_value)}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#F59E0B" />
                  <Text style={styles.approveClaimedBtnText}>Allow Claimed</Text>
                  <Text style={styles.approveClaimedBtnSub}>₹{receipt.estimated_value}</Text>
                </TouchableOpacity>
              </View>

              {/* Custom Value Section */}
              <View style={styles.customValueCard}>
                <Text style={styles.customLabel}>Or enter customized approved amount:</Text>
                <View style={styles.customInputRow}>
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencyText}>₹</Text>
                  </View>
                  <TextInput
                    style={styles.customInput}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#64748B"
                    value={customValue}
                    onChangeText={setCustomValue}
                  />
                  <TouchableOpacity
                    style={[styles.customSubmitBtn, !customValue && { opacity: 0.5 }]}
                    disabled={!customValue || actionLoading}
                    onPress={() => handleApprove(parseFloat(customValue))}
                  >
                    <Text style={styles.customSubmitText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reject */}
              <TouchableOpacity 
                style={styles.rejectBtn} 
                onPress={handleReject}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={16} color="#FB7185" style={{ marginRight: 6 }} />
                <Text style={styles.rejectBtnText}>Reject Tax Receipt Entirely</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#021815' },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 14, color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.12)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9' },
  headerSubtitle: { fontSize: 11, color: '#F59E0B', marginTop: 1, fontWeight: '600' },
  flagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  flagText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.16)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginLeft: 8,
  },
  valuationCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(4, 47, 46, 0.45)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.12)',
  },
  valueBox: { flex: 1, alignItems: 'center' },
  valueLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 6, fontWeight: '500' },
  claimedValue: { fontSize: 22, fontWeight: '800', color: '#FB7185' },
  claimedBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  claimedBadgeText: { fontSize: 10, fontWeight: '700', color: '#FB7185' },
  aiValue: { fontSize: 22, fontWeight: '800', color: '#5EEAD4' },
  aiBadge: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: '#5EEAD4' },
  vsContainer: { alignItems: 'center', paddingHorizontal: 10 },
  vsLine: { width: 1, height: 12, backgroundColor: 'rgba(94, 234, 212, 0.2)' },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  vsText: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  reasoningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(94, 234, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  reasoningText: { flex: 1, fontSize: 12, color: '#E2E8F0', lineHeight: 18 },
  breakdownContainer: {
    backgroundColor: 'rgba(2, 24, 21, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  breakdownLabel: { fontSize: 12, color: '#94A3B8' },
  breakdownValue: { fontSize: 12, fontWeight: '700', color: '#F1F5F9' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  itemDescription: { fontSize: 13, color: '#94A3B8', lineHeight: 19 },
  partiesRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  partyCard: { flex: 1, padding: 12 },
  partyRoleLabel: { fontSize: 9, fontWeight: '800', color: '#5EEAD4', letterSpacing: 0.5, marginBottom: 4 },
  partyName: { fontSize: 13, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 },
  partyDetailText: { fontSize: 11, color: '#94A3B8', marginLeft: 6, flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  decisionSection: { marginTop: 10 },
  decisionTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  actionButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  decisionBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveAiBtn: {
    backgroundColor: '#5EEAD4',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  approveAiBtnText: { color: '#042F2E', fontSize: 13, fontWeight: '800', marginTop: 4 },
  approveAiBtnSub: { color: '#042F2E', fontSize: 11, fontWeight: '700', opacity: 0.8 },
  approveClaimedBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  approveClaimedBtnText: { color: '#F59E0B', fontSize: 13, fontWeight: '700', marginTop: 4 },
  approveClaimedBtnSub: { color: '#FCD34D', fontSize: 11, fontWeight: '600' },
  customValueCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.16)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  customLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 8 },
  customInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencyBadge: {
    width: 36,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyText: { fontSize: 16, fontWeight: '700', color: '#5EEAD4' },
  customInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(2, 24, 21, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  customSubmitBtn: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(94, 234, 212, 0.2)',
    borderWidth: 1,
    borderColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSubmitText: { color: '#5EEAD4', fontSize: 13, fontWeight: '700' },
  rejectBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { color: '#FB7185', fontSize: 13, fontWeight: '700' },
});

