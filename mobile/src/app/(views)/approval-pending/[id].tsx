import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../../context/AuthContext';
import { router } from 'expo-router';
import api from '../../../utils/api';

export default function ApprovalPendingScreen() {
  const { logout, approvalStatus, rejectionCount, rejectionReason, userRole, isAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleReRequest = async () => {
    setLoading(true);
    try {
      await api.post('/users/me/re_request/');
      Alert.alert(
        "Re-request Submitted",
        "Your account is back under review. Please log in again to refresh your session.",
        [{ text: "OK", onPress: () => logout() }]
      );
    } catch (e) {
      Alert.alert("Error", "Could not submit re-request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const navigateToEdit = () => {
    if (userRole === 'donor') {
      router.push('/(forms)/edit-kitchen-profile/new');
    } else {
      router.push('/(forms)/edit-shelter-profile/new');
    }
  };

  const renderContent = () => {
    if (approvalStatus === 'BANNED') {
      return (
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: '#fee2e2', shadowColor: '#dc2626' }]}>
            <Ionicons name="ban" size={80} color="#dc2626" />
          </View>
          <Text style={styles.title}>Account Permanently Banned</Text>
          <Text style={styles.description}>
            Your organization request has been rejected multiple times and your account is now permanently banned.
          </Text>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={20} color="#64748b" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (approvalStatus === 'REJECTED') {
      const attemptsLeft = 3 - rejectionCount;
      return (
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: '#fee2e2', shadowColor: '#dc2626' }]}>
            <Ionicons name="close-circle-outline" size={80} color="#dc2626" />
          </View>
          <Text style={styles.title}>Account Rejected</Text>
          <Text style={styles.description}>
            Unfortunately, your account request was rejected. Please review and update your organization details.
          </Text>
          
          {rejectionReason ? (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>Reason from Admin:</Text>
              <Text style={styles.reasonText}>{rejectionReason}</Text>
            </View>
          ) : null}

          <Text style={styles.subtext}>
            You have {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining to re-request approval.
          </Text>

          <TouchableOpacity style={styles.editBtn} onPress={navigateToEdit}>
            <Ionicons name="pencil-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.reRequestBtn, loading && { opacity: 0.7 }]} 
            onPress={handleReRequest} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#1e40af" /> : (
              <>
                <Ionicons name="refresh-outline" size={20} color="#1e40af" style={{ marginRight: 8 }} />
                <Text style={styles.reRequestText}>Re-request Approval</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.logoutBtn, { marginTop: 16 }]} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={20} color="#64748b" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Default PENDING state
    return (
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={80} color="#f59e0b" />
        </View>
        <Text style={styles.title}>Account Under Review</Text>
        <Text style={styles.description}>
          Thank you for signing up! To maintain the trust and safety of our platform, our team is currently reviewing your organization details.
        </Text>
        <Text style={styles.subtext}>
          This usually takes 1-2 business days. We will notify you once your account has been approved.
        </Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={20} color="#64748b" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out for Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isAuthenticated) return null;

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconContainer: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: '#fef3c7', 
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0f172a', marginBottom: 16, textAlign: 'center' },
  description: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  subtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  reasonBox: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#fca5a5' },
  reasonTitle: { color: '#b91c1c', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  reasonText: { color: '#991b1b', fontSize: 14, lineHeight: 20 },
  logoutBtn: { flexDirection: 'row', backgroundColor: '#e2e8f0', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', width: '100%', justifyContent: 'center' },
  logoutText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  editBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 12 },
  editBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  reRequestBtn: { flexDirection: 'row', backgroundColor: '#eff6ff', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', width: '100%', justifyContent: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  reRequestText: { color: '#1e40af', fontSize: 16, fontWeight: '600' }
});
