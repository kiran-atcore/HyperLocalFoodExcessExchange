import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MiniMap from '../../../components/MiniMap';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';

export default function ClaimDetailScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<any>(null);

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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const isCompleted = order.status === 'PICKED_UP';
  const isApproved = order.status === 'APPROVED';
  const isCancelled = order.status === 'CANCELLED';
  const isExpired = order.status === 'EXPIRED';

  const handleAutoExpire = async () => {
    if (order.status !== 'PICKED_UP' && order.status !== 'CANCELLED' && order.status !== 'EXPIRED') {
      try {
        await api.patch(`/orders/${id}/expire/`);
      } catch (e) {
        console.error("Auto expire failed", e);
      }
      setOrder({ ...order, status: 'EXPIRED' });
      Alert.alert("Claim Expired", "The pickup time has passed and this claim has automatically expired.");
    }
  };

  const handleCancelClaim = () => {
    Alert.alert(
      "Cancel Claim",
      "Are you sure you want to release this claim back to the community?",
      [
        { text: "Keep Claim", style: "cancel" },
        { 
          text: "Release", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/orders/${id}/cancel/`);
              Alert.alert("Claim Released", "You have successfully cancelled your claim.");
              router.replace('/(shelter)' as any);
            } catch (error) {
              Alert.alert("Error", "Failed to cancel claim.");
            }
          }
        }
      ]
    );
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
        const tempFilePath = FileSystem.cacheDirectory + `QR_Claim_${id}.png`;
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claim #{id}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={[styles.statusCard, isCompleted && { backgroundColor: '#d1fae5', borderColor: '#34d399' }, (isCancelled || isExpired) && { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
          <Ionicons 
            name={isCompleted ? "checkmark-circle" : (isApproved ? "checkmark-done-circle" : ((isCancelled || isExpired) ? "close-circle" : "time"))} 
            size={48} 
            color={isCompleted ? "#10b981" : (isApproved ? "#3b82f6" : ((isCancelled || isExpired) ? "#ef4444" : "#f59e0b"))} 
            style={{ marginBottom: 12 }} 
          />
          <Text style={[styles.statusTitle, isCompleted && { color: '#065f46' }, (isCancelled || isExpired) && { color: '#991b1b' }]}>{order.status}</Text>
          <Text style={[styles.statusDesc, isCompleted && { color: '#047857' }, (isCancelled || isExpired) && { color: '#b91c1c' }]}>
            {isCompleted ? "You have successfully picked up this donation!" : (isCancelled ? `This claim was cancelled by ${order.cancelled_by_details?.role === 'donor' ? 'the donor' : 'you'}.` : (isExpired ? "This claim has expired because the pickup window ended." : "Your claim has been secured. Please pick up the items."))}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Pickup Instructions</Text>
        <View style={styles.infoCard}>
          <Text style={styles.detailText}><Text style={styles.boldText}>Donor:</Text> {order.listing_details?.donor_name || 'Donor'}</Text>
          <Text style={styles.detailText}><Text style={styles.boldText}>Donation:</Text> {order.listing_details?.title}</Text>
          <Text style={styles.detailText}><Text style={styles.boldText}>Requested On:</Text> {new Date(order.created_at).toLocaleString()}</Text>
          
          {!isCompleted && !isCancelled && !isExpired && order.listing_details?.pickup_end && (
            <Text style={[styles.detailText, { marginTop: 8 }]}>
              <Text style={styles.boldText}>Time remaining:</Text> <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>
                <CountdownTimer targetDate={order.listing_details.pickup_end} onExpire={handleAutoExpire} />
              </Text>
            </Text>
          )}
        </View>

        {!isCompleted && (
          <>
            <Text style={styles.sectionTitle}>Verification</Text>
            <View style={styles.qrCard}>
              <View style={styles.qrPlaceholder}>
                <QRCode
                  value={`claim:${order.qr_code_id}`}
                  size={160}
                  getRef={(c) => (qrRef.current = c)}
                  backgroundColor="#ffffff"
                  color="#0f172a"
                />
              </View>
              <Text style={styles.qrText}>Show this code to the donor upon arrival to verify your identity.</Text>
              
              <TouchableOpacity style={styles.downloadBtn} onPress={saveQRCode}>
                <Ionicons name="download-outline" size={18} color="#3b82f6" style={{ marginRight: 6 }} />
                <Text style={styles.downloadBtnText}>Save to Gallery</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Pickup Location</Text>
            <View style={styles.mapContainer}>
              <MiniMap 
                latitude={order.listing_details?.donor_latitude || order.listing_details?.latitude || 8.5241} 
                longitude={order.listing_details?.donor_longitude || order.listing_details?.longitude || 76.9366} 
              />
            </View>
          </>
        )}

        <TouchableOpacity style={styles.contactBtn}>
          <Ionicons name="call-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.contactBtnText}>Contact Donor</Text>
        </TouchableOpacity>

        {!isCompleted && !isCancelled && !isExpired && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelClaim}>
            <Ionicons name="close-circle-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.cancelBtnText}>Cancel Claim</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 32 },
  
  content: { padding: 16, paddingBottom: 40 },
  
  statusCard: { backgroundColor: '#fffbeb', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#fde68a' },
  statusTitle: { fontSize: 22, fontWeight: 'bold', color: '#b45309', marginBottom: 8 },
  statusDesc: { fontSize: 15, color: '#d97706', textAlign: 'center', lineHeight: 22 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  
  infoCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  detailText: { fontSize: 15, color: '#475569', marginBottom: 8, lineHeight: 22 },
  boldText: { fontWeight: 'bold', color: '#1e293b' },

  qrCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  qrPlaceholder: { width: 180, height: 180, backgroundColor: '#ffffff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  qrText: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 16, marginBottom: 20 },

  downloadBtn: { flexDirection: 'row', backgroundColor: '#eff6ff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  downloadBtnText: { color: '#3b82f6', fontWeight: 'bold' },

  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  map: { flex: 1 },

  contactBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  cancelBtn: { flexDirection: 'row', backgroundColor: '#fee2e2', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  cancelBtnText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' }
});
