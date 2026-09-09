import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import { router, useFocusEffect } from 'expo-router';

import api from '../../utils/api';
import MiniMap from '../../components/MiniMap';
import ProfileCard from '../../components/ProfileCard';
import StatsCard from '../../components/StatsCard';
import ComboButton from '../../components/ComboButton';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';

export default function ShelterProfileScreen() {
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
      const completed = orders.filter((o: any) => o.status === 'PICKED_UP').length;
      setStats({ active, completed });
    } catch (e) {
      console.error('Failed to fetch shelter profile data', e);
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
      'Are you sure you want to delete your organization account? This action cannot be undone.',
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
        text2: 'Could not delete organization account.',
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
          <Text style={styles.heroTitle}>Organization Profile</Text>
          <Text style={styles.heroSubtitle}>Manage your shelter credentials & logistics</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isScreenFocused && (
            <>
              {/* Profile Card */}
              <ProfileCard
                profile={profile}
                editRoute="/(forms)/edit-shelter-profile/me"
                tagText="Verified Shelter"
                icon="business"
              />

              {/* Stats Bento Tiles */}
              <StatsCard completed={stats.completed} active={stats.active} />


              {/* Location Section */}
              {profile?.address && profile?.latitude && profile?.longitude && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', delay: 200 }}
                  style={styles.sectionContainer}
                >
                  <Text style={styles.sectionTitle}>DEFAULT LOCATION</Text>

                  <View style={styles.locationCard}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.01)']}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    <View style={styles.addressRow}>
                      <View style={styles.locationIconWrapper}>
                        <Ionicons name="location" size={20} color="#5EEAD4" />
                      </View>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {profile.address}
                      </Text>
                    </View>

                    <View style={styles.miniMapContainer}>
                      <MiniMap latitude={profile.latitude} longitude={profile.longitude} />
                    </View>
                  </View>
                </MotiView>
              )}

              {/* Logout & Delete Actions */}
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
  container: {
    flex: 1,
    backgroundColor: '#042F2E',
  },
  safeArea: {
    flex: 1,
  },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },


  // Section
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Location Card
  locationCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    overflow: 'hidden',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '500',
    lineHeight: 20,
  },
  miniMapContainer: {
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
