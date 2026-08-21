import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { WebView } from 'react-native-webview';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';

export default function ShelterProfileScreen() {
  const { logout } = useContext(AuthContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ active: 0, completed: 0 });

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const [userRes, ordersRes] = await Promise.all([
        api.get('/users/me/'),
        api.get('/orders/')
      ]);
      setProfile(userRes.data);
      
      const orders = ordersRes.data;
      const active = orders.filter((o: any) => o.status === 'PENDING' || o.status === 'APPROVED').length;
      const completed = orders.filter((o: any) => o.status === 'PICKED_UP').length;
      setStats({ active, completed });
    } catch (e) {
      console.error(e);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Organization Profile</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="business" size={40} color="#3b82f6" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile?.business_name || profile?.username || 'Loading...'}</Text>
            <Text style={styles.email}>{profile?.email || 'Loading...'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Verified Shelter</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/(forms)/edit-shelter-profile/me' as any)}>
            <Ionicons name="create-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Total Rescued</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active Claims</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Organization</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(views)/tax-docs' as any)}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={22} color="#64748b" />
              <Text style={styles.menuItemText}>Tax Exemption Docs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>


        </View>

        {profile?.address && profile?.latitude && profile?.longitude && (
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Default Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.addressRow}>
                <Ionicons name="location-sharp" size={20} color="#3b82f6" style={styles.locationIcon} />
                <Text style={styles.addressText}>{profile.address}</Text>
              </View>
              <View style={styles.miniMapContainer}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                      <style>
                        body { padding: 0; margin: 0; }
                        html, body, #map { height: 100%; width: 100vw; }
                      </style>
                    </head>
                    <body>
                      <div id="map"></div>
                      <script>
                        var map = L.map('map', { 
                          zoomControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false 
                        }).setView([${profile.latitude}, ${profile.longitude}], 14);
                        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
                        L.marker([${profile.latitude}, ${profile.longitude}]).addTo(map);
                      </script>
                    </body>
                    </html>
                  ` }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                />
              </View>
            </View>
          </View>
        )}

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
  
  profileHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, position: 'relative' },
  editProfileBtn: { position: 'absolute', top: 12, right: 12, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20, zIndex: 10, elevation: 3 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', marginRight: 16, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  badge: { backgroundColor: '#dbeafe', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#1e40af' },

  statsContainer: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#3b82f6', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },

  menuSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginLeft: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 15, color: '#334155', marginLeft: 12, fontWeight: '500' },

  locationSection: { marginBottom: 32 },
  locationCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, overflow: 'hidden' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationIcon: { marginRight: 8 },
  addressText: { fontSize: 15, color: '#334155', flex: 1, fontWeight: '500' },
  miniMapContainer: { height: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e2e8f0' },

  bottomButtons: { marginTop: 'auto', paddingTop: 24 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 16, borderRadius: 12 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444', marginLeft: 8 }
});
