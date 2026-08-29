import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';

export default function WalletScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/');
      setOrders(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const isRedeemed = item.status === 'PICKED_UP' || item.status === 'CANCELLED' || item.status === 'EXPIRED';
    
    return (
      <TouchableOpacity 
        style={[styles.card, isRedeemed && styles.cardFaded]} 
        activeOpacity={0.8} 
        onPress={() => router.push(`/(views)/receipt/${item.id}` as any)}
      >
        <View style={styles.qrContainer}>
          <QRCode value={item.qr_code_id || item.id.toString()} size={80} color={isRedeemed ? '#cbd5e1' : '#0f172a'} />
        </View>
        <View style={styles.details}>
          <Text style={styles.title}>{item.listing_details?.title || 'Unknown Item'}</Text>
          <Text style={styles.vendor}>{item.listing_details?.donor_name || 'Vendor'}</Text>
          <Text style={[styles.status, !isRedeemed ? styles.statusReady : styles.statusRedeemed]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Pickup Wallet</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={orders} 
          renderItem={renderItem} 
          keyExtractor={item => item.id.toString()} 
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>No pickup passes found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardFaded: { opacity: 0.6 },
  qrContainer: { marginRight: 16, backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8 },
  details: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  vendor: { fontSize: 14, color: '#64748b', marginTop: 4 },
  status: { marginTop: 8, fontSize: 12, fontWeight: 'bold' },
  statusReady: { color: '#10b981' },
  statusRedeemed: { color: '#94a3b8' }
});