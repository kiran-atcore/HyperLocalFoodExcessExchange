import React, { useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { AuthContext } from '../../context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';

export default function DonorProfileScreen() {
  const { logout } = useContext(AuthContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me/');
      setProfile(response.data);
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
            <Text style={styles.name}>{profile?.business_name || profile?.username || 'Loading...'}</Text>
            <Text style={styles.email}>{profile?.email || 'Loading...'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Verified Donor</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/(forms)/edit-kitchen-profile/me' as any)}>
            <Ionicons name="create-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {profile?.address && profile?.latitude && profile?.longitude && (
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Business Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.addressRow}>
                <Ionicons name="location-sharp" size={20} color="#ef4444" style={styles.locationIcon} />
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
        <View style={{ marginTop: 'auto', paddingTop: 24 }}>
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
  badge: { backgroundColor: '#d1fae5', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#065f46' },

  locationSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginLeft: 4 },
  locationCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, overflow: 'hidden' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationIcon: { marginRight: 8 },
  addressText: { fontSize: 15, color: '#334155', flex: 1, fontWeight: '500' },
  miniMapContainer: { height: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e2e8f0' },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 16, borderRadius: 12 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444', marginLeft: 8 }
});
