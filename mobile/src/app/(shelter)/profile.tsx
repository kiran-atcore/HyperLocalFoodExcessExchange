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
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', delay: 100 }}
                style={styles.statsRow}
              >
                <View style={styles.statTile}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                  <View style={styles.statIconBadge}>
                    <Ionicons name="gift-outline" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.statValue}>{stats.completed}</Text>
                  <Text style={styles.statLabel}>Total Rescued</Text>
                </View>

                <View style={styles.statTile}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                  <View style={[styles.statIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Ionicons name="time-outline" size={20} color="#38BDF8" />
                  </View>
                  <Text style={[styles.statValue, { color: '#38BDF8' }]}>{stats.active}</Text>
                  <Text style={styles.statLabel}>Active Pickups</Text>
                </View>
              </MotiView>

              {/* Organization Section / Tax Docs */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', delay: 150 }}
                style={styles.sectionContainer}
              >
                <Text style={styles.sectionTitle}>ORGANIZATION</Text>

                <TouchableOpacity
                  style={styles.actionCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push('/(views)/tax-docs' as any);
                  }}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                  <View style={styles.actionCardLeft}>
                    <View style={styles.actionIconWrapper}>
                      <Ionicons name="document-text-outline" size={22} color="#5EEAD4" />
                    </View>
                    <View>
                      <Text style={styles.actionTitle}>Tax Exemption Docs</Text>
                      <Text style={styles.actionSubtitle}>View 80G & 501(c)(3) certifications</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </MotiView>

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

  // Stats Bento
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
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
  actionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
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
