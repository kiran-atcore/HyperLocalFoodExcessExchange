import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}/`);
      setOrder(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this request?",
      [
        { text: "Keep Request", style: "cancel" },
        { 
          text: "Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/orders/${id}/cancel/`);
              Alert.alert("Cancelled", "The request was cancelled.");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to cancel request.");
            }
          }
        }
      ]
    );
  };

  const handleAutoExpire = async () => {
    if (order.status !== 'PICKED_UP' && order.status !== 'CANCELLED' && order.status !== 'EXPIRED') {
      try {
        await api.patch(`/orders/${id}/expire/`);
      } catch (e) {
        console.error("Auto expire failed", e);
      }
      setOrder({ ...order, status: 'EXPIRED' });
      Alert.alert("Expired", "This claim has expired.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const isShelter = order.requester_details?.role === 'shelter';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Request #{id}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: isShelter ? '#eff6ff' : '#ecfdf5' }]}>
            <Ionicons name={isShelter ? "business" : "person"} size={32} color={isShelter ? "#3b82f6" : "#10b981"} />
          </View>
          <Text style={styles.name}>{order.requester_details?.name || `ID: ${order.requester}`}</Text>
          <View style={[styles.badge, { backgroundColor: isShelter ? '#eff6ff' : '#ecfdf5' }]}>
            <Text style={[styles.badgeText, { color: isShelter ? '#2563eb' : '#059669' }]}>{order.requester_details?.role?.toUpperCase() || 'UNKNOWN'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Item:</Text>
            <Text style={styles.infoValue}>{order.listing_details?.title}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantity:</Text>
            <Text style={styles.infoValue}>{order.quantity || 1} {order.listing_details?.quantity_unit || 'portions'} claimed</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Arrival:</Text>
            <Text style={styles.infoValueTime}>{order.eta ? new Date(order.eta).toLocaleTimeString() : 'No ETA'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValuePending}>{order.status}</Text>
          </View>
          {order.status !== 'PICKED_UP' && order.status !== 'CANCELLED' && order.status !== 'EXPIRED' && order.listing_details?.pickup_end && (
            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={[styles.infoLabel, { marginBottom: 4 }]}>Expires In:</Text>
              <Text style={{ fontSize: 16, color: '#ef4444', fontWeight: 'bold' }}>
                <CountdownTimer targetDate={order.listing_details.pickup_end} onExpire={handleAutoExpire} />
              </Text>
            </View>
          )}
        </View>

        {order.status !== 'PICKED_UP' && order.status !== 'CANCELLED' && order.status !== 'EXPIRED' && (
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push({ pathname: '/(donor)/scan', params: { order_id: order.id } })}>
            <Ionicons name="qr-code-outline" size={24} color="#fff" style={{ marginRight: 12 }} />
            <Text style={styles.scanBtnText}>Open Scanner to Verify</Text>
          </TouchableOpacity>
        )}

        {order.status !== 'PICKED_UP' && order.status !== 'CANCELLED' && order.status !== 'EXPIRED' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 32 },
  
  content: { padding: 16, paddingBottom: 40 },
  
  profileCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  badge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  
  infoCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 32, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  infoLabel: { fontSize: 15, color: '#64748b' },
  infoValue: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  infoValueTime: { fontSize: 15, fontWeight: 'bold', color: '#f59e0b' },
  infoValuePending: { fontSize: 15, fontWeight: 'bold', color: '#3b82f6' },

  scanBtn: { flexDirection: 'row', backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  scanBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  cancelBtn: { paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontSize: 15, fontWeight: 'bold' }
});
