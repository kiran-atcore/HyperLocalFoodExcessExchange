import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import api from '../../utils/api';
import CountdownTimer from '../../components/CountdownTimer';

export default function ShelterClaimsScreen() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'NGO' | 'DISCOUNT'>('NGO');

  useFocusEffect(
    useCallback(() => {
      fetchClaims();
    }, [])
  );

  const fetchClaims = async () => {
    try {
      const response = await api.get('/orders/');
      setClaims(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClaim = (orderId: number) => {
    Alert.alert(
      "Cancel Claim",
      "Are you sure you want to cancel this claim? The donor will be notified.",
      [
        { text: "Go Back", style: "cancel" },
        { 
          text: "Cancel Claim", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/orders/${orderId}/cancel/`);
              fetchClaims();
            } catch (error) {
              Alert.alert("Error", "Failed to cancel claim.");
            }
          }
        }
      ]
    );
  };

  const handleAutoExpire = async (orderId: number) => {
    setClaims(prev => prev.map(c => c.id === orderId ? { ...c, status: 'EXPIRED' } : c));
    try {
      await api.patch(`/orders/${orderId}/expire/`);
    } catch (e) {
      console.error("Auto cancel failed", e);
    }
  };

  const renderItem = ({ item }: any) => {
    const isCompleted = item.status === 'PICKED_UP';
    const isApproved = item.status === 'APPROVED';
    const isExpired = item.status === 'EXPIRED';
    const isCancelled = item.status === 'CANCELLED';

    if (activeTab === 'DISCOUNT') {
      const isRedeemed = isCompleted || isCancelled || isExpired;
      return (
        <TouchableOpacity 
          style={[styles.receiptCard, isRedeemed && styles.receiptCardFaded]} 
          activeOpacity={0.8} 
          onPress={() => router.push(`/(views)/receipt/${item.id}` as any)}
        >
          <View style={styles.qrContainer}>
            <QRCode value={item.qr_code_id || item.id.toString()} size={80} color={isRedeemed ? '#cbd5e1' : '#0f172a'} />
          </View>
          <View style={styles.details}>
            <Text style={styles.receiptTitle}>{item.listing_details?.title || 'Unknown Item'}</Text>
            <Text style={styles.vendor}>{item.listing_details?.donor_name || 'Vendor'}</Text>
            <Text style={[styles.receiptStatus, !isRedeemed ? styles.statusReady : styles.statusRedeemed]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
          {!isRedeemed && (
            <TouchableOpacity style={{ padding: 8, marginLeft: 8 }} onPress={() => handleCancelClaim(item.id)}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={[styles.card, isCompleted && styles.cardCompleted]} onPress={() => router.push(`/(views)/claim/${item.id}` as any)}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.listing_details?.title}</Text>
          <Ionicons 
            name={isCompleted ? "checkmark-circle" : (isApproved ? "checkmark-done-circle" : (isExpired ? "time" : "time-outline"))} 
            size={24} 
            color={isCompleted ? "#10b981" : (isApproved ? "#3b82f6" : (isExpired ? "#ef4444" : "#f59e0b"))} 
          />
        </View>
        <Text style={styles.donor}>Requested: {new Date(item.created_at).toLocaleDateString()}</Text>
        <View style={styles.footerRow}>
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.time}>{item.listing_details?.quantity_available} {item.listing_details?.quantity_unit || 'portions'}</Text>
            {!isCompleted && !isCancelled && !isExpired && item.listing_details?.pickup_end && (
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Expires in: <CountdownTimer targetDate={item.listing_details.pickup_end} onExpire={() => handleAutoExpire(item.id)} />
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {!isCompleted && !isCancelled && !isExpired && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelClaim(item.id)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.status, { color: isCompleted ? "#10b981" : ((isCancelled || isExpired) ? "#ef4444" : (isApproved ? "#3b82f6" : "#f59e0b")) }]}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const displayedClaims = claims.filter(c => 
    c.listing_details?.listing_type === (activeTab === 'NGO' ? 'DONATION' : 'DISCOUNT')
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Claims</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'NGO' && styles.activeTab]} 
          onPress={() => setActiveTab('NGO')}
        >
          <Text style={[styles.tabText, activeTab === 'NGO' && styles.activeTabText]}>NGO Donations</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'DISCOUNT' && styles.activeTab]} 
          onPress={() => setActiveTab('DISCOUNT')}
        >
          <Text style={[styles.tabText, activeTab === 'DISCOUNT' && styles.activeTabText]}>Discounted</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={displayedClaims} 
          renderItem={renderItem} 
          keyExtractor={item => item.id.toString()} 
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>You have no active {activeTab === 'NGO' ? 'donation' : 'discount'} claims.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 8, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  activeTabText: { color: '#0f172a' },
  list: { paddingBottom: 24 },
  card: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    marginBottom: 16, 
    padding: 16, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  cardCompleted: {
    borderLeftColor: '#10b981',
    opacity: 0.8
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', flex: 1, marginRight: 8 },
  donor: { fontSize: 14, color: '#64748b', marginBottom: 12, marginTop: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 13, color: '#94a3b8' },
  status: { fontSize: 14, fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  cancelBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  receiptCard: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  receiptCardFaded: { opacity: 0.6 },
  qrContainer: { marginRight: 16, backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8 },
  details: { flex: 1 },
  receiptTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  vendor: { fontSize: 14, color: '#64748b', marginTop: 4 },
  receiptStatus: { marginTop: 8, fontSize: 12, fontWeight: 'bold' },
  statusReady: { color: '#10b981' },
  statusRedeemed: { color: '#94a3b8' }
});