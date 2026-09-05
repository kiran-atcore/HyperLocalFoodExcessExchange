import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';
import MiniMap from '../../../components/MiniMap';

export default function ReceiptViewScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<any>(null);

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

  const saveQRCode = async () => {
    if (!qrRef.current) return;
    
    const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
    if (status !== 'granted') {
      Alert.alert("Permission Required", "We need permission to save images to your gallery.");
      return;
    }

    try {
      qrRef.current.toDataURL(async (data: string) => {
        const tempFilePath = FileSystem.cacheDirectory + `QR_Receipt_${id}.png`;
        await FileSystem.writeAsStringAsync(tempFilePath, data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await MediaLibrary.saveToLibraryAsync(tempFilePath);
        Alert.alert("Success", "QR code has been saved to your gallery!");
      });
    } catch (error) {
      Alert.alert("Error", "Failed to save the QR code.");
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
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Order Receipt</Text>
        
        <View style={[styles.card, isRedeemed && { opacity: 0.6 }]}>
          <View style={styles.qrWrapper}>
            <QRCode 
              value={order.qr_code_id || order.id.toString()} 
              size={150} 
              color={isRedeemed ? '#cbd5e1' : '#0f172a'} 
              getRef={(c) => (qrRef.current = c)}
            />
          </View>

          {!isRedeemed && (
            <TouchableOpacity style={styles.downloadBtn} onPress={saveQRCode}>
              <Ionicons name="download-outline" size={16} color="#3b82f6" style={{ marginRight: 6 }} />
              <Text style={styles.downloadBtnText}>Save to Gallery</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.scanText, !isRedeemed && { marginTop: 16 }]}>
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

          {/* Pickup Location Map */}
          <View style={styles.mapSection}>
            <Text style={styles.mapLabel}>Pickup Location</Text>
            <View style={styles.mapContainer}>
              <MiniMap
                latitude={order.listing_details?.donor_latitude || order.listing_details?.latitude || 8.5241}
                longitude={order.listing_details?.donor_longitude || order.listing_details?.longitude || 76.9366}
              />
            </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, width: '100%', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, alignItems: 'center' },
  qrWrapper: { padding: 16, backgroundColor: '#f1f5f9', borderRadius: 16, marginBottom: 12 },
  downloadBtn: { flexDirection: 'row', backgroundColor: '#eff6ff', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  downloadBtnText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 13 },
  scanText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  divider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginBottom: 24, borderStyle: 'dashed' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  label: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  value: { fontSize: 15, color: '#0f172a', fontWeight: 'bold' },
  statusReady: { fontSize: 15, color: '#10b981', fontWeight: '900' },
  backButton: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#e2e8f0', width: '100%', alignItems: 'center' },
  backButtonText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 32, padding: 16, borderRadius: 12, backgroundColor: '#fee2e2', width: '100%', alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  mapSection: { width: '100%', marginTop: 8 },
  mapLabel: { fontSize: 15, color: '#64748b', fontWeight: '600', marginBottom: 10 },
  mapContainer: { width: '100%', height: 180, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' }
});
