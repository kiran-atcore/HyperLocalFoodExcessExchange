import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../../context/AuthContext';

export default function ApprovalPendingScreen() {
  const { logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
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
  logoutBtn: { flexDirection: 'row', backgroundColor: '#e2e8f0', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#475569', fontSize: 16, fontWeight: '600' }
});
