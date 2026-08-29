import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';

export default function ReceiptViewScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [id])
  );

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}/`);
      setOrder(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "Keep Order", style: "cancel" },
        { 
          text: "Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/orders/${id}/cancel/`);
              Alert.alert("Cancelled", "The order was cancelled.");
              fetchOrder();
            } catch (error) {
              Alert.alert("Error", "Failed to cancel order.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{ color: '#ef4444' }}>Receipt not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isRedeemed = order.status === 'PICKED_UP' || order.status === 'CANCELLED' || order.status === 'EXPIRED';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Order Receipt</Text>
      
      <View style={[styles.card, isRedeemed && { opacity: 0.6 }]}>
        <View style={styles.qrWrapper}>
          <QRCode value={order.qr_code_id || order.id.toString()} size={150} color={isRedeemed ? '#cbd5e1' : '#0f172a'} />
        </View>
        <Text style={styles.scanText}>
          {isRedeemed ? `Order ${order.status.replace('_', ' ')}` : 'Show this QR code to the vendor at pickup'}
        </Text>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Item</Text>
          <Text style={styles.value}>{order.listing_details?.title}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Vendor</Text>
          <Text style={styles.value}>{order.listing_details?.donor_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.statusReady, isRedeemed && { color: '#94a3b8' }]}>{order.status.replace('_', ' ')}</Text>
        </View>
        
        {!isRedeemed && order.listing_details?.pickup_end && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Post Expires</Text>
            <Text style={{ fontSize: 15, color: '#ef4444', fontWeight: 'bold' }}>
              <CountdownTimer targetDate={order.listing_details.pickup_end} />
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value}>#ORD-{order.id}</Text>
        </View>
      </View>

      {!isRedeemed && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
          <Text style={styles.cancelBtnText}>Cancel Order</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, width: '100%', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, alignItems: 'center' },
  qrWrapper: { padding: 16, backgroundColor: '#f1f5f9', borderRadius: 16, marginBottom: 16 },
  scanText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  divider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginBottom: 24, borderStyle: 'dashed' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  label: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  value: { fontSize: 15, color: '#0f172a', fontWeight: 'bold' },
  statusReady: { fontSize: 15, color: '#10b981', fontWeight: '900' },
  backButton: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#e2e8f0', width: '100%', alignItems: 'center' },
  backButtonText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 32, padding: 16, borderRadius: 12, backgroundColor: '#fee2e2', width: '100%', alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 }
});
