import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import * as SecureStore from 'expo-secure-store';

export default function ConsumerProfileScreen() {
  const { logout } = useContext(AuthContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ moneySaved: 0, foodRescued: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const fetchProfileData = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      setLoading(true);
      const [profileRes, ordersRes] = await Promise.all([
        api.get('/users/me/'),
        api.get('/orders/')
      ]);
      setProfile(profileRes.data);

      const orders = ordersRes.data;
      let moneySaved = 0;
      let foodRescued = 0;

      orders.forEach((order: any) => {
        if (order.status === 'PICKED_UP' && order.listing_details) {
          foodRescued += 1;
          const qty = order.quantity || 1;
          const original = parseFloat(order.listing_details.original_price || '0');
          const discounted = parseFloat(order.listing_details.discounted_price || '0');
          moneySaved += (original - discounted) * qty;
        }
      });

      setStats({ moneySaved, foodRescued });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
      "Are you sure you want to delete your account? This action cannot be undone.",
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>My Profile</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            {profile?.profile_picture ? (
              <Image source={{ uri: profile.profile_picture }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : (profile?.business_name ? profile.business_name.charAt(0).toUpperCase() : 'C')}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{
              (profile?.first_name || profile?.last_name)
                ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
                : (profile?.business_name || profile?.first_name || 'Consumer')
            }</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            {profile?.phone_number ? (
              <Text style={styles.phone}>{profile.phone_number}</Text>
            ) : null}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Consumer</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/(forms)/edit-consumer-profile/me' as any)}>
            <Ionicons name="create-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.foodRescued}</Text>
            <Text style={styles.statLabel}>Successful Pickups</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>${stats.moneySaved.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Money Saved</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.logoutButton, { marginTop: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ef4444' }]} onPress={confirmDeleteAccount} disabled={isDeleting}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>{isDeleting ? 'Deleting...' : 'Delete Account'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginVertical: 16 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, marginRight: 16, backgroundColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 36, fontWeight: 'bold', color: '#ffffff' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  phone: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  badge: { backgroundColor: '#e2e8f0', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  editProfileBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f1f5f9', alignSelf: 'flex-start' },

  statsContainer: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#10b981', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },

  bottomButtons: { marginTop: 'auto', paddingTop: 32 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 16, borderRadius: 12 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444', marginLeft: 8 }
});
