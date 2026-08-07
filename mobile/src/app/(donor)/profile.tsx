import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { router } from 'expo-router';
import api from '../../utils/api';

export default function DonorProfileScreen() {
  const { logout } = useContext(AuthContext);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      Alert.alert("Logout failed");
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your business account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDeleteAccount }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/users/delete/');
      await logout(true);
      router.replace('/(auth)/login');
    } catch (e) {
      Alert.alert("Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Business Profile</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="storefront" size={40} color="#3b82f6" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Warehouse Co.</Text>
            <Text style={styles.email}>manager@warehouse.co</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Verified Donor</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(views)/kitchen-settings' as any)}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={22} color="#64748b" />
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutButton, { marginTop: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ef4444' }]} onPress={confirmDeleteAccount} disabled={isDeleting}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>{isDeleting ? 'Deleting...' : 'Delete Account'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginVertical: 16 },
  
  profileHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', marginRight: 16, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  badge: { backgroundColor: '#d1fae5', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#065f46' },

  menuSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginLeft: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 15, color: '#334155', marginLeft: 12, fontWeight: '500' },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 16, borderRadius: 12 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444', marginLeft: 8 }
});
