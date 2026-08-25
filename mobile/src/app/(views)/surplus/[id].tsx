import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../utils/api';
import CountdownTimer from '../../../components/CountdownTimer';

export default function SurplusDetailScreen() {
  const { id } = useLocalSearchParams();
  const [listing, setListing] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        fetchListing();
      }
    }, [id])
  );

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}/`);
      setListing(response.data);
      if (response.data.pickup_end) {
        setIsExpired(new Date(response.data.pickup_end).getTime() <= new Date().getTime());
      }
      
      const ordersRes = await api.get(`/orders/?listing=${id}`);
      setOrders(ordersRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (orderId: number) => {
    Alert.alert(
      "Cancel Claim",
      "Are you sure you want to cancel this claim (e.g. no-show)? The shelter will be notified.",
      [
        { text: "Go Back", style: "cancel" },
        { 
          text: "Cancel Claim", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/orders/${orderId}/cancel/`);
              Alert.alert("Claim Cancelled", "The listing is now active again.");
              fetchListing();
            } catch (error) {
              Alert.alert("Error", "Failed to cancel claim.");
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/listings/${id}/`);
              Alert.alert("Deleted", "Your listing has been removed.");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to delete listing.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Listing not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Surplus #{id}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {listing.listing_type === 'DONATION' ? 'FREE' : `₹${listing.discounted_price} (DISCOUNT)`}
            </Text>
          </View>
        </View>

        {listing.description ? (
          <>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={[styles.infoCard, { marginBottom: 24 }]}>
              <Text style={{ fontSize: 15, color: '#334155', lineHeight: 22 }}>{listing.description}</Text>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantity Available:</Text>
            <Text style={styles.infoValue}>{listing.quantity_available} {listing.quantity_unit || 'portions'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dietary Info:</Text>
            <Text style={styles.infoValue}>{listing.dietary_info || 'None'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Posted:</Text>
            <Text style={styles.infoValue}>{new Date(listing.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }]}>
            <Text style={styles.infoLabel}>Expires:</Text>
            <Text style={styles.infoValueTime}>{new Date(listing.pickup_end).toLocaleString()}</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748b' }}>
              Time remaining: <CountdownTimer targetDate={listing.pickup_end} onExpire={() => setIsExpired(true)} />
            </Text>
          </View>
        </View>

        {listing.listing_type === 'DONATION' && (
          <>
            <Text style={styles.sectionTitle}>Tax Valuation</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Your Claimed Value:</Text>
                <Text style={styles.infoValue}>₹{listing.estimated_fmv}</Text>
              </View>
              {listing.ai_suggested_value != null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>AI Suggested Value:</Text>
                  <Text style={styles.infoValue}>₹{listing.ai_suggested_value}</Text>
                </View>
              )}
              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.infoLabel}>Status:</Text>
                {listing.is_ai_flagged ? (
                  <View style={{ backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#fde68a' }}>
                    <Text style={{ color: '#d97706', fontWeight: 'bold', fontSize: 12 }}>Flagged for Review</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#a7f3d0' }}>
                    <Text style={{ color: '#059669', fontWeight: 'bold', fontSize: 12 }}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {listing.additional_details ? (
          <>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            <View style={[styles.infoCard, { marginBottom: 24 }]}>
              <Text style={{ fontSize: 14, color: '#334155', lineHeight: 20 }}>{listing.additional_details}</Text>
            </View>
          </>
        ) : null}

        {orders.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active Claims</Text>
            {orders.map((o: any) => (
              <View key={o.id} style={styles.orderCard}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1e293b', marginBottom: 4 }}>
                    {o.requester_details?.role === 'consumer' ? 'Consumer' : 'Shelter'}: {o.requester_details?.name || `ID ${o.requester}`}
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 14 }}>
                    Status: <Text style={{ fontWeight: 'bold', color: o.status === 'PICKED_UP' ? '#10b981' : ((o.status === 'CANCELLED' || o.status === 'EXPIRED') ? '#ef4444' : '#f59e0b') }}>{o.status}</Text>
                  </Text>
                  {o.status === 'CANCELLED' && o.cancelled_by_details && (
                    <Text style={{ color: '#ef4444', fontSize: 13, marginTop: 4 }}>
                      Cancelled by: {o.cancelled_by_details.role === 'donor' ? 'You' : (o.cancelled_by_details.role === 'consumer' ? 'Consumer' : 'Shelter')}
                    </Text>
                  )}
                </View>
                {o.status !== 'PICKED_UP' && o.status !== 'CANCELLED' && o.status !== 'EXPIRED' && (
                  <TouchableOpacity style={styles.cancelClaimBtn} onPress={() => handleCancelOrder(o.id)}>
                    <Text style={styles.cancelClaimBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.editBtn, isExpired && { backgroundColor: '#10b981' }]} 
            onPress={() => router.push(`/(forms)/edit-surplus/${id}` as any)}
          >
            <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.editBtnText}>{isExpired ? 'Reactivate' : 'Edit Listing'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>

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
  
  summaryCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#059669', fontWeight: 'bold', fontSize: 14 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  
  infoCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  infoLabel: { fontSize: 15, color: '#64748b' },
  infoValue: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  infoValueTime: { fontSize: 15, fontWeight: 'bold', color: '#ef4444' },

  actionButtons: { flexDirection: 'row', gap: 12 },
  editBtn: { flex: 2, flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#fee2e2', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },

  orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a', marginBottom: 12 },
  cancelClaimBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  cancelClaimBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 }
});
