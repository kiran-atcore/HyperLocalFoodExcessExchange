import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';

import { AuthContext } from '../../context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import ComboButton from '../../components/ComboButton';

const ParticlesBackground = () => {
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const size = Math.random() * 4 + 2;
    return (
      <MotiView
        key={i}
        from={{
          opacity: 0,
          translateY: 0,
          translateX: (Math.random() - 0.5) * 40,
        }}
        animate={{
          opacity: [0, 0.55, 0],
          translateY: -280 - Math.random() * 180,
          translateX: (Math.random() - 0.5) * 120,
        }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 5000 + Math.random() * 4000,
          delay: Math.random() * 3000,
        }}
        style={{
          position: 'absolute',
          bottom: -40,
          left: `${Math.random() * 100}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#5EEAD4',
          shadowColor: '#5EEAD4',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: size,
        }}
      />
    );
  });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <LinearGradient
        colors={['#042F2E', '#0B132B', '#021815']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {particles}
    </View>
  );
};

export default function ConsumerProfileScreen() {
  const { logout } = useContext(AuthContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ moneySaved: 0, foodRescued: 0 });
  const [loading, setLoading] = useState(true);

  const [isScreenFocused, setIsScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchProfileData();
      return () => {
        setIsScreenFocused(false);
      };
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await logout();
      Toast.show({
        type: 'success',
        text1: 'Signed Out',
        text2: 'You have been logged out.',
      });
      router.replace('/(auth)/login');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Logout failed. Please try again.',
      });
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await api.delete('/users/delete/');
      await logout(true);
      Toast.show({
        type: 'info',
        text1: 'Account Deleted',
        text2: 'Your account and data have been removed.',
      });
      router.replace('/(auth)/login');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete account.',
      });
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#042F2E', '#0B132B', '#021815']}
          style={styles.bgGradient}
        />
        <SafeAreaView style={styles.loadingBox} edges={['top']}>
          <ActivityIndicator size="large" color="#5EEAD4" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </SafeAreaView>
      </View>
    );
  }

  const displayName = (profile?.first_name || profile?.last_name)
    ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
    : (profile?.business_name || profile?.first_name || 'Consumer');

  return (
    <View style={styles.container}>
      <ParticlesBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isScreenFocused && (
            <>
              {/* Top Title */}
              <MotiView
                from={{ opacity: 0, translateY: -16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 350 }}
                style={styles.headerBar}
              >
                <Text style={styles.headerTitle}>Account & Profile</Text>
                <TouchableOpacity 
                  style={styles.editProfileBtn} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/(forms)/edit-consumer-profile/me' as any);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#5EEAD4" />
                </TouchableOpacity>
              </MotiView>

              {/* User Profile Card */}
              <MotiView
                from={{ opacity: 0, scale: 0.94, translateY: 16 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 80 }}
                style={styles.profileHeader}
              >
                <View style={styles.avatarGlow}>
                  {profile?.profile_picture ? (
                    <Image source={{ uri: profile.profile_picture }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarInitial}>
                      {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : 'C'}
                    </Text>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                  <Text style={styles.email} numberOfLines={1}>{profile?.email}</Text>
                  {profile?.phone_number ? (
                    <Text style={styles.phone}>{profile.phone_number}</Text>
                  ) : null}
                  <View style={styles.badge}>
                    <Ionicons name="shield-checkmark" size={11} color="#5EEAD4" style={{ marginRight: 4 }} />
                    <Text style={styles.badgeText}>Verified Consumer</Text>
                  </View>
                </View>
              </MotiView>

              {/* Impact Stats Bento */}
              <MotiView
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 300, delay: 160 }}
              >
                <Text style={styles.sectionTitle}>Your Impact & Savings</Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, scale: 0.94, translateY: 16 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 220 }}
                style={styles.statsContainer}
              >
                <View style={styles.statBox}>
                  <View style={styles.statIconCircle}>
                    <Ionicons name="restaurant" size={18} color="#5EEAD4" />
                  </View>
                  <Text style={styles.statValue}>{stats.foodRescued}</Text>
                  <Text style={styles.statLabel}>Portions Rescued</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <View style={styles.statIconCircle}>
                    <Ionicons name="wallet" size={18} color="#34D399" />
                  </View>
                  <Text style={styles.statValue}>₹{stats.moneySaved.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Money Saved</Text>
                </View>
              </MotiView>

              {/* Logout & Delete Combo Dock */}
              <View style={styles.comboButtonContainer}>
                <ComboButton
                  onLogout={handleLogout}
                  onDelete={() => setShowDeleteModal(true)}
                  isDeleting={isDeleting}
                />
              </View>
            </>
          )}
        </ScrollView>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="trash" size={28} color="#FB7185" />
              </View>
              <Text style={styles.modalTitle}>Delete Account?</Text>
              <Text style={styles.modalSubtitle}>
                This will permanently delete your account history, order vouchers, and personal profile data.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={handleDeleteAccount}
                >
                  <Text style={styles.modalDeleteText}>Confirm Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#021815' },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safeArea: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 12 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.3 },
  editProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 16,
    borderRadius: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
    backgroundColor: 'rgba(94, 234, 212, 0.15)',
    borderWidth: 1.5,
    borderColor: '#5EEAD4',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: '#5EEAD4' },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 2 },
  email: { fontSize: 13, color: '#94A3B8', marginBottom: 2 },
  phone: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#5EEAD4' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#CBD5E1', marginBottom: 12, marginLeft: 2 },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.16)',
    alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(94, 234, 212, 0.12)' },
  comboButtonContainer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
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
    borderColor: 'rgba(244, 63, 94, 0.35)',
    padding: 24,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
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
  modalDeleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
