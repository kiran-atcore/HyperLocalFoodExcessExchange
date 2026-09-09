import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Linking, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MiniMap from '../../../components/MiniMap';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import api from '../../../utils/api';
import RejectionModal from '../../../components/RejectionModal';

export default function ApprovalRequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/users/${id}/`);
      setUser(response.data);
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not load user details',
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const confirmApprove = async () => {
    setShowApproveConfirm(false);
    setActionLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/users/${id}/approve/`);
      Toast.show({
        type: 'success',
        text1: 'Approved',
        text2: 'User account has been granted platform access.',
      });
      router.back();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Approval Failed',
        text2: 'Unable to approve user right now.',
      });
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRejectionModal(true);
  };

  const onConfirmReject = async (reason: string) => {
    setActionLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await api.post(`/users/${id}/reject/`, { reason });
      Toast.show({
        type: 'success',
        text1: 'Account Rejected',
        text2: 'Rejection notice sent to user.',
      });
      setShowRejectionModal(false);
      router.back();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: 'Could not reject account.',
      });
      setActionLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#042F2E', '#0B132B', '#021815']}
          style={styles.bgGradient}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#5EEAD4" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Review Request</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5EEAD4" />
            <Text style={styles.loadingText}>Fetching verification dossier...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isDonor = user.role === 'donor';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#042F2E', '#0B132B', '#021815']}
        style={styles.bgGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
            <Text style={styles.headerTitle}>Dossier Review</Text>
            <Text style={styles.headerSubtitle}>ID #{id} • Pending Approval</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Pending</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Organization Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="business" size={18} color="#5EEAD4" />
              </View>
              <Text style={styles.sectionTitle}>Account Profile</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Role Classification</Text>
              <View style={[styles.roleBadge, isDonor ? styles.donorBadge : styles.shelterBadge]}>
                <Ionicons
                  name={isDonor ? 'restaurant' : 'home'}
                  size={12}
                  color={isDonor ? '#34D399' : '#818CF8'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.roleText, { color: isDonor ? '#34D399' : '#818CF8' }]}>
                  {user.role?.toUpperCase() || 'USER'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Organization Name</Text>
              <Text style={styles.detailValue}>{user.business_name || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Authorized Manager</Text>
              <Text style={styles.detailValue}>
                {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Contact Details Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="call" size={18} color="#5EEAD4" />
              </View>
              <Text style={styles.sectionTitle}>Contact & Verification</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Official Email</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${user.email}`)}
                style={styles.linkWrapper}
              >
                <Ionicons name="mail-outline" size={14} color="#5EEAD4" style={{ marginRight: 5 }} />
                <Text style={styles.linkValue}>{user.email}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone Line</Text>
              {user.phone_number ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${user.phone_number}`)}
                  style={styles.linkWrapper}
                >
                  <Ionicons name="call-outline" size={14} color="#5EEAD4" style={{ marginRight: 5 }} />
                  <Text style={styles.linkValue}>{user.phone_number}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.detailValueMuted}>Unverified / None</Text>
              )}
            </View>
          </View>

          {/* Location & Map Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={18} color="#5EEAD4" />
              </View>
              <Text style={styles.sectionTitle}>Registered Premise</Text>
            </View>

            <Text style={styles.addressText}>{user.address || 'No physical address provided'}</Text>

            {user?.latitude && user?.longitude ? (
              <View style={styles.mapContainer}>
                <MiniMap latitude={user.latitude} longitude={user.longitude} />
                <View style={styles.coordsBadge}>
                  <Text style={styles.coordsText}>
                    {Number(user.latitude).toFixed(4)}, {Number(user.longitude).toFixed(4)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Floating Action Dock */}
        <View style={styles.footerDock}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn, actionLoading && { opacity: 0.5 }]}
            onPress={handleReject}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={18} color="#FB7185" style={{ marginRight: 6 }} />
            <Text style={styles.rejectBtnText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn, actionLoading && { opacity: 0.5 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowApproveConfirm(true);
            }}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#042F2E" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={18} color="#042F2E" style={{ marginRight: 6 }} />
                <Text style={styles.approveBtnText}>Approve Entity</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Confirmation Modal */}
        <Modal
          visible={showApproveConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowApproveConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="shield-checkmark" size={32} color="#5EEAD4" />
              </View>
              <Text style={styles.modalTitle}>Approve Organization?</Text>
              <Text style={styles.modalSubtitle}>
                This will activate {user.business_name || 'this account'} and grant immediate access to surplus exchanges.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowApproveConfirm(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={confirmApprove}
                >
                  <Text style={styles.modalConfirmText}>Confirm Approval</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <RejectionModal
          visible={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          onConfirm={onConfirmReject}
          loading={actionLoading}
        />
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
  headerSubtitle: { fontSize: 11, color: '#5EEAD4', marginTop: 1, fontWeight: '600' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  content: { padding: 16, paddingBottom: 110 },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.16)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: { fontSize: 13, color: '#94A3B8' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#F1F5F9', textAlign: 'right', flex: 1, marginLeft: 12 },
  detailValueMuted: { fontSize: 13, color: '#64748B', textAlign: 'right' },
  linkWrapper: { flexDirection: 'row', alignItems: 'center' },
  linkValue: { fontSize: 13, fontWeight: '600', color: '#5EEAD4', textDecorationLine: 'underline' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  donorBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  shelterBadge: {
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  addressText: { fontSize: 13, color: '#CBD5E1', lineHeight: 20, marginBottom: 10 },
  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
  },
  coordsBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
  },
  coordsText: { fontSize: 10, color: '#5EEAD4', fontWeight: '600' },
  footerDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(4, 47, 46, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(94, 234, 212, 0.18)',
    gap: 12,
    paddingBottom: 40,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  rejectBtnText: { color: '#FB7185', fontSize: 14, fontWeight: '700' },
  approveBtn: {
    backgroundColor: '#5EEAD4',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  approveBtnText: { color: '#042F2E', fontSize: 14, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0B132B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    padding: 24,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  modalConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { color: '#042F2E', fontSize: 14, fontWeight: '700' },
});

