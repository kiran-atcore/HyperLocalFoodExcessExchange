import React, { useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import MiniMap from '../../components/MiniMap';
import ProfileCard from '../../components/ProfileCard';
import StatsCard from '../../components/StatsCard';
import ComboButton from '../../components/ComboButton';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import * as SecureStore from 'expo-secure-store';

export default function DonorProfileScreen() {
  const { logout } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [isDeleting, setIsDeleting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ active: 0, completed: 0 });
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchData();
      
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      const [userRes, ordersRes] = await Promise.all([
        api.get('/users/me/'),
        api.get('/orders/'),
      ]);
      setProfile(userRes.data);

      const orders = ordersRes.data || [];
      const active = orders.filter(
        (o: any) => o.status === 'PENDING' || o.status === 'APPROVED'
      ).length;
      const completed = orders.filter(
        (o: any) =>
          o.status === 'PICKED_UP' &&
          (o.listing_details?.listing_type === 'DONATION' || o.listing_type === 'DONATION')
      ).length;
      setStats({ active, completed });
    } catch (e) {
      console.error('Failed to fetch kitchen profile data', e);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Could not log out. Please try again.',
        position: 'top',
      });
    }
  };

  const confirmDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert(
      'Delete Account',
      'Are you sure you want to delete your business account? This action cannot be undone.',
      'error',
      handleDeleteAccount,
      'Delete',
      true,
      'Cancel'
    );
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/users/delete/');
      await logout(true);
      router.replace('/(auth)/login');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Deletion Failed',
        text2: 'Could not delete business account.',
        position: 'top',
      });
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Master Dark Teal Gradient Background */}
      <LinearGradient
        colors={['#042F2E', '#d9dfe9ff']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>Business Profile</Text>
          <Text style={styles.heroSubtitle}>Manage your account & location</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isScreenFocused && (
            <>
              <ProfileCard profile={profile} />

              <StatsCard
                completed={stats.completed}
                active={stats.active}
                completedLabel="Total Donated"
                activeLabel="Active Pickups"
              />

              {profile?.address && profile?.latitude && profile?.longitude && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', delay: 150 }}
                  style={styles.locationSection}
                >
                  <Text style={styles.sectionTitle}>BUSINESS LOCATION</Text>

                  <View style={styles.locationCard}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    <View style={styles.addressRow}>
                      <View style={styles.locationIconWrapper}>
                        <Ionicons name="location" size={20} color="#5EEAD4" />
                      </View>
                      <Text style={styles.addressText}>{profile.address}</Text>
                    </View>

                    <View style={styles.miniMapContainer}>
                      <MiniMap latitude={profile.latitude} longitude={profile.longitude} />
                    </View>
                  </View>
                </MotiView>
              )}

              <ComboButton 
                onLogout={handleLogout} 
                onDelete={confirmDeleteAccount} 
                isDeleting={isDeleting} 
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#c3cddbff', paddingBottom: 30 },
  safeArea: { flex: 1 },

  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Tab bar clearance
  },

  locationSection: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  locationCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  locationIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressText: {
    fontSize: 15,
    color: '#E2E8F0',
    flex: 1,
    fontWeight: '500',
    lineHeight: 22,
  },
  miniMapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  }
});
