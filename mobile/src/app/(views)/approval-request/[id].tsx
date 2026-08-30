import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Linking } from 'react-native';
import MiniMap from '../../../components/MiniMap';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import RejectionModal from '../../../components/RejectionModal';

export default function ApprovalRequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/users/${id}/`);
      setUser(response.data);
    } catch (e) {
      Alert.alert("Error", "Could not load user details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    Alert.alert(
      "Approve User",
      "Are you sure you want to approve this account? They will gain full access to the platform.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Approve", 
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.post(`/users/${id}/approve/`);
              Alert.alert("Success", "User has been approved.");
              router.back();
            } catch (e) {
              Alert.alert("Error", "Failed to approve user.");
              setActionLoading(false);
            }
          } 
        }
      ]
    );
  };

  const handleReject = () => {
    setShowRejectionModal(true);
  };

  const onConfirmReject = async (reason: string) => {
    setActionLoading(true);
    try {
      await api.post(`/users/${id}/reject/`, { reason });
      Alert.alert("Success", "User has been rejected.");
      setShowRejectionModal(false);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to reject user.");
      setActionLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Request</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator size="large" color="#1e40af" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={20} color="#1e40af" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <View style={[styles.roleBadge, user.role === 'donor' ? styles.donorBadge : styles.shelterBadge]}>
              <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Organization Name</Text>
            <Text style={styles.detailValue}>{user.business_name || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Internal Manager Name</Text>
            <Text style={styles.detailValue}>{user.first_name || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={20} color="#1e40af" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Contact Details</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${user.email}`)} style={{ flex: 2, alignItems: 'flex-end' }}>
              <Text style={styles.linkValue}>{user.email}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            {user.phone_number ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${user.phone_number}`)} style={{ flex: 2, alignItems: 'flex-end' }}>
                <Text style={styles.linkValue}>{user.phone_number}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.detailValue}>N/A</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#1e40af" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          
          <Text style={styles.addressText}>{user.address || 'No address provided'}</Text>
          {(user?.latitude && user?.longitude) ? (
            <View style={styles.mapContainer}>
              <MiniMap latitude={user.latitude} longitude={user.longitude} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn, actionLoading && { opacity: 0.5 }]} 
          onPress={handleReject}
          disabled={actionLoading}
        >
          <Ionicons name="close-circle-outline" size={20} color="#dc2626" style={{ marginRight: 6 }} />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.approveBtn, actionLoading && { opacity: 0.5 }]} 
          onPress={handleApprove}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.approveBtnText}>Approve Account</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <RejectionModal 
        visible={showRejectionModal} 
        onClose={() => setShowRejectionModal(false)} 
        onConfirm={onConfirmReject} 
        loading={actionLoading} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: '#64748b', flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#0f172a', flex: 2, textAlign: 'right' },
  linkValue: { fontSize: 14, fontWeight: '600', color: '#3b82f6', textAlign: 'right', textDecorationLine: 'underline' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  donorBadge: { backgroundColor: '#dcfce7' },
  shelterBadge: { backgroundColor: '#e0e7ff' },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  addressText: { fontSize: 14, color: '#0f172a', lineHeight: 20 },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  actionBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { backgroundColor: '#fee2e2', marginRight: 8 },
  rejectBtnText: { color: '#dc2626', fontSize: 16, fontWeight: 'bold' },
  approveBtn: { backgroundColor: '#10b981', marginLeft: 8 },
  approveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  mapContainer: { height: 180, borderRadius: 16, overflow: 'hidden', marginTop: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#e2e8f0' },
  map: { flex: 1 }
});
