import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../../../context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import ButtonTwo from '../../../components/ButtonTwo';

const ParticlesBackground = () => {
  const particles = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 4 + 2;
    return (
      <MotiView
        key={i}
        from={{
          opacity: 0,
          translateY: 0,
          translateX: (Math.random() - 0.5) * 50,
        }}
        animate={{
          opacity: [0, 0.6, 0],
          translateY: -300 - Math.random() * 200,
          translateX: (Math.random() - 0.5) * 150,
        }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 5000 + Math.random() * 5000,
          delay: Math.random() * 4000,
        }}
        style={{
          position: 'absolute',
          bottom: -50,
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
    <View style={styles.absoluteFill}>
      <LinearGradient
        colors={['#042F2E', '#0B132B', '#021815']}
        style={styles.absoluteFill}
      />
      {particles}
    </View>
  );
};

export default function ApprovalPendingScreen() {
  const { logout, updateApprovalState, approvalStatus, rejectionCount, rejectionReason, userRole, isAuthenticated } = useContext(AuthContext);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(false);
  const isShelter = userRole === 'shelter' || id === 'shelter';

  const handleReRequest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await api.post('/users/me/re_request/');
      updateApprovalState('PENDING');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Re-request Submitted',
        text2: 'Your account is back under review.',
        position: 'top',
        visibilityTime: 4000,
      });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Could not submit re-request. Please try again.',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isShelter) {
      router.push('/(forms)/edit-shelter-profile/me' as any);
    } else {
      router.push('/(forms)/edit-kitchen-profile/me' as any);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
  };

  if (!isAuthenticated) return null;

  const renderContent = () => {
    if (approvalStatus === 'BANNED') {
      return (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 350 }}
          style={styles.contentCard}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 16, delay: 60 }}
            style={[styles.iconGlowWrapper, styles.bannedGlow]}
          >
            <LinearGradient
              colors={['#7F1D1D', '#450A0A']}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="ban" size={52} color="#F87171" />
            </LinearGradient>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 120 }}
            style={[styles.badgeChip, styles.bannedChip]}
          >
            <Ionicons name="alert-circle" size={13} color="#F87171" style={{ marginRight: 6 }} />
            <Text style={[styles.badgeChipText, { color: '#F87171' }]}>PERMANENTLY RESTRICTED</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 180 }}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <Text style={styles.title}>Account Banned</Text>
            <Text style={styles.description}>
              Your organization request was rejected multiple times and this account has been permanently restricted from accessing the surplus exchange.
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 240 }}
            style={{ width: '100%' }}
          >
            <TouchableOpacity style={styles.glassLogoutBtn} onPress={handleLogout} activeOpacity={0.75}>
              <Ionicons name="log-out-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <Text style={styles.glassLogoutText}>Log Out</Text>
            </TouchableOpacity>
          </MotiView>
        </MotiView>
      );
    }

    if (approvalStatus === 'REJECTED') {
      const attemptsLeft = 3 - rejectionCount;
      return (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 350 }}
          style={styles.contentCard}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 16, delay: 60 }}
            style={[styles.iconGlowWrapper, styles.rejectedGlow]}
          >
            <LinearGradient
              colors={['#991B1B', '#450A0A']}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="close-circle-outline" size={52} color="#FCA5A5" />
            </LinearGradient>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 120 }}
            style={[styles.badgeChip, styles.rejectedChip]}
          >
            <Ionicons name="warning-outline" size={13} color="#FCA5A5" style={{ marginRight: 6 }} />
            <Text style={[styles.badgeChipText, { color: '#FCA5A5' }]}>
              {attemptsLeft} {attemptsLeft === 1 ? 'ATTEMPT' : 'ATTEMPTS'} REMAINING
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 180 }}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <Text style={styles.title}>Account Rejected</Text>
            <Text style={styles.description}>
              Unfortunately, your account submission could not be verified. Please review the admin remarks below and update your profile details.
            </Text>
          </MotiView>

          {rejectionReason ? (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, delay: 240 }}
              style={styles.reasonCard}
            >
              <View style={styles.reasonHeader}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FCA5A5" style={{ marginRight: 6 }} />
                <Text style={styles.reasonTitle}>Admin Feedback</Text>
              </View>
              <Text style={styles.reasonText}>{rejectionReason}</Text>
            </MotiView>
          ) : null}

          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: rejectionReason ? 300 : 240 }}
            style={styles.actionColumn}
          >
            <ButtonTwo
              title="Edit Profile"
              icon="pencil-outline"
              onPress={navigateToEdit}
              colors={['#0D9488', '#042F2E']}
              sheen={true}
              style={{ marginBottom: 12 }}
            />

            <ButtonTwo
              title="Re-request Approval"
              icon="refresh-outline"
              onPress={handleReRequest}
              isLoading={loading}
              colors={['#1E3A8A', '#1E40AF']}
              sheen={false}
              style={{ marginBottom: 16 }}
            />

            <TouchableOpacity style={styles.glassLogoutBtn} onPress={handleLogout} activeOpacity={0.75}>
              <Ionicons name="log-out-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <Text style={styles.glassLogoutText}>Log Out</Text>
            </TouchableOpacity>
          </MotiView>
        </MotiView>
      );
    }

    // Default PENDING state
    return (
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 350 }}
        style={styles.contentCard}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 16, delay: 60 }}
          style={[styles.iconGlowWrapper, styles.pendingGlow]}
        >
          <MotiView
            from={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ loop: true, type: 'timing', duration: 3000 }}
          >
            <LinearGradient
              colors={['#78350F', '#042F2E']}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="time-outline" size={52} color="#FCD34D" />
            </LinearGradient>
          </MotiView>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 120 }}
          style={styles.badgeChip}
        >
          <Ionicons name="shield-outline" size={13} color="#5EEAD4" style={{ marginRight: 6 }} />
          <Text style={styles.badgeChipText}>PENDING VERIFICATION</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 180 }}
          style={{ width: '100%', alignItems: 'center' }}
        >
          <Text style={styles.title}>Account Under Review</Text>
          <Text style={styles.description}>
            Thank you for joining the surplus food exchange network. Our safety team is verifying your {isShelter ? 'shelter credential' : 'kitchen credential'} to ensure compliant food handling.
          </Text>
        </MotiView>

        {/* Verification Progress Stepper */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 240 }}
          style={styles.stepperCard}
        >
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotDone]}>
              <Ionicons name="checkmark" size={12} color="#042F2E" />
            </View>
            <View style={styles.stepTextBox}>
              <Text style={styles.stepTitle}>Registration Submitted</Text>
              <Text style={styles.stepSubtitle}>Organization details recorded</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Ionicons name="sync" size={12} color="#FCD34D" />
            </View>
            <View style={styles.stepTextBox}>
              <Text style={styles.stepTitle}>Credential Verification</Text>
              <Text style={styles.stepSubtitle}>Currently under administrative audit</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.stepRow}>
            <View style={styles.stepDot}>
              <Ionicons name="lock-closed-outline" size={12} color="#64748B" />
            </View>
            <View style={styles.stepTextBox}>
              <Text style={[styles.stepTitle, { color: '#64748B' }]}>Network Access Granted</Text>
              <Text style={styles.stepSubtitle}>Post & claim excess inventory</Text>
            </View>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 300 }}
          style={{ width: '100%', alignItems: 'center' }}
        >
          <Text style={styles.estimateText}>
            Estimated review turnaround: <Text style={{ color: '#5EEAD4', fontWeight: '700' }}>1-2 business days</Text>
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 360 }}
          style={{ width: '100%' }}
        >
          <TouchableOpacity style={styles.glassLogoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <Text style={styles.glassLogoutText}>Log Out for Now</Text>
          </TouchableOpacity>
        </MotiView>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <ParticlesBackground />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderContent()}
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
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  iconGlowWrapper: {
    marginTop: 20,
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1.5,
  },
  pendingGlow: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(252, 211, 77, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  rejectedGlow: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(252, 165, 165, 0.35)',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  bannedGlow: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    marginBottom: 12,
  },
  badgeChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 1,
  },
  rejectedChip: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(252, 165, 165, 0.3)',
  },
  bannedChip: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  stepperCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepDotDone: {
    backgroundColor: '#5EEAD4',
  },
  stepDotActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  stepLine: {
    width: 2,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 11,
    marginVertical: 3,
  },
  stepTextBox: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  estimateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 20,
  },
  reasonCard: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderLeftWidth: 4,
    borderLeftColor: '#F87171',
    padding: 14,
    marginBottom: 20,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reasonTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCA5A5',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  reasonText: {
    fontSize: 13,
    color: '#FEE2E2',
    lineHeight: 18,
  },
  actionColumn: {
    width: '100%',
  },
  glassLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  glassLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
