import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import api from '../../utils/api';
import RecentReceiptCard from '../../components/RecentReceiptCard';

export default function DonorTaxScreen() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchReceipts();
      return () => {
        setIsScreenFocused(false);
      };
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
    const sTime = new Date(startDate).setHours(0, 0, 0, 0);
    const eTime = new Date(endDate).setHours(23, 59, 59, 999);
    return rTime >= sTime && rTime <= eTime;
  });

  const totalValue = displayedReceipts
    .filter(r => r.status === 'APPROVED')
    .reduce((sum, r) => sum + parseFloat(r.estimated_value || '0'), 0)
    .toFixed(2);

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (displayedReceipts.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Receipts',
        text2: 'You have no tax receipts to download for this period.',
        position: 'top',
      });
      return;
    }

    try {
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

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Tax Receipt',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Download Successful',
          text2: `Your CSV has been downloaded to internal storage.`,
          position: 'top',
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Export Error',
        text2: 'Failed to generate tax receipt CSV.',
        position: 'top',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B'; // Amber
      case 'REJECTED': return '#EF4444'; // Red
      default: return '#10B981'; // Emerald
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#042F2E', '#d9dfe9ff']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>Tax Deductions</Text>
          <Text style={styles.heroSubtitle}>Track your donation impact</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isScreenFocused && (
            <>
              {/* Dashboard Summary Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20, scale: 0.95 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                style={styles.summaryCard}
              >
                <LinearGradient
                  colors={['#0F766E', '#042F2E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <LinearGradient
                  colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.4)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.summaryTopRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="leaf" size={20} color="#5EEAD4" />
                  </View>
                  <Text style={styles.summaryLabel}>APPROVED VALUE</Text>
                </View>

                <Text style={styles.summaryValue}>₹{totalValue}</Text>

                <View style={styles.dateFilterContainer}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.dateBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowStartPicker(true);
                    }}
                  >
                    <Ionicons name="calendar" size={14} color="#94A3B8" />
                    <Text style={styles.dateBtnText}>{startDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  </TouchableOpacity>

                  <Ionicons name="arrow-forward" size={14} color="#64748B" style={{ marginHorizontal: 8 }} />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.dateBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowEndPicker(true);
                    }}
                  >
                    <Ionicons name="calendar" size={14} color="#94A3B8" />
                    <Text style={styles.dateBtnText}>{endDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  </TouchableOpacity>
                </View>
              </MotiView>

              {/* Export Button */}
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 100 }}
                style={styles.exportWrapper}
              >
                <TouchableOpacity activeOpacity={0.8} style={styles.exportBtn} onPress={handleExport}>
                  <LinearGradient
                    colors={['#0D9488', '#0F766E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="cloud-download-outline" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                  <Text style={styles.exportBtnText}>Download CSV Statement</Text>
                </TouchableOpacity>
              </MotiView>

              <Text style={styles.sectionTitle}>Recent Receipts</Text>

              {loading ? (
                <ActivityIndicator size="large" color="#5EEAD4" style={{ marginTop: 40 }} />
              ) : displayedReceipts.length === 0 ? (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={styles.emptyContainer}
                >
                  <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyText}>No tax receipts in this period.</Text>
                </MotiView>
              ) : (
                displayedReceipts.map((receipt, index) => (
                  <RecentReceiptCard key={receipt.id} receipt={receipt} index={index} />
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Date Pickers */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c3cddbff',
  },
  safeArea: {
    flex: 1,
  },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Tab bar clearance
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(94, 234, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 24,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  dateBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Export Button
  exportWrapper: {
    marginBottom: 32,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 24,
  },

  // Receipt Card
  receiptCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccent: {
    width: 4,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700'
  },
  value: {
    fontSize: 18,
    fontWeight: '800'
  },
  item: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ngoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  ngoText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  }
});
