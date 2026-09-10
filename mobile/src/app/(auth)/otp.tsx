import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import api from '../../utils/api';
import ButtonOne from '../../components/ButtonOne';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;
const OTP_VALIDITY_SECONDS = 240; // 4 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 1 minute

export default function OTPScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';
  const purpose = (params.purpose as string) || 'registration';
  const password = (params.password as string) || '';
  const role = (params.role as string) || 'consumer';

  const [otp, setOtp] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  // Timers
  const [expiryTimer, setExpiryTimer] = useState(OTP_VALIDITY_SECONDS);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SECONDS);

  // Input ref
  const hiddenInputRef = useRef<TextInput | null>(null);


  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-focus hidden input
    const focusTimeout = setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 400);

    return () => clearTimeout(focusTimeout);
  }, []);

  // Expiry Countdown (4 mins)
  useEffect(() => {
    if (expiryTimer <= 0) return;
    const interval = setInterval(() => {
      setExpiryTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryTimer]);

  // Resend Cooldown (1 min)
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Route back to register if maximum attempts reached
  useEffect(() => {
    if (attemptsRemaining <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Maximum Attempts Reached',
        text2: 'Too many incorrect attempts. Redirecting to registration...',
        visibilityTime: 3000,
      });
      const redirectTimer = setTimeout(() => {
        router.replace('/(auth)/register');
      }, 1500);
      return () => clearTimeout(redirectTimer);
    }
  }, [attemptsRemaining]);


  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleOtpChange = (value: string) => {
    const cleanDigits = value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtp(cleanDigits);
    setErrorMsg('');
  };


  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsResending(true);
    setErrorMsg('');

    try {
      await api.post('/users/send-otp/', {
        email: email.trim().toLowerCase(),
        purpose: purpose,
      });

      // Reset state on successful resend
      setOtp('');
      setExpiryTimer(OTP_VALIDITY_SECONDS);
      setResendTimer(RESEND_COOLDOWN_SECONDS);
      setAttemptsRemaining(3);
      hiddenInputRef.current?.focus();


      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Code Resent',
        text2: 'A new 6-digit code has been sent to your email.',
        visibilityTime: 4000,
      });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const detail = err.response?.data?.detail;
      setErrorMsg(detail || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp;


    if (enteredOtp.length !== OTP_LENGTH) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (expiryTimer <= 0) {
      setErrorMsg('This code has expired. Please tap "Resend Code".');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (attemptsRemaining <= 0) {
      setErrorMsg('Maximum attempts exceeded. Please request a new code.');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await api.post('/users/verify-otp/', {
        email: email.trim().toLowerCase(),
        otp: enteredOtp,
        purpose: purpose,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (purpose === 'registration') {
        Toast.show({
          type: 'success',
          text1: 'Email Verified!',
          text2: 'Complete your profile to finish setup.',
          visibilityTime: 4000,
        });

        const profileParams = {
          email: email.trim().toLowerCase(),
          password: password,
          role: role,
          id: 'new',
        };

        if (role === 'donor') {
          router.replace({
            pathname: '/(forms)/edit-kitchen-profile/[id]',
            params: profileParams,
          });
        } else if (role === 'shelter') {
          router.replace({
            pathname: '/(forms)/edit-shelter-profile/[id]',
            params: profileParams,
          });
        } else {
          router.replace({
            pathname: '/(forms)/edit-consumer-profile/[id]',
            params: profileParams,
          });
        }
      } else {
        // Password Reset flow
        Toast.show({
          type: 'success',
          text1: 'Code Verified!',
          text2: 'Now create your new password.',
          visibilityTime: 3000,
        });

        router.replace({
          pathname: '/(auth)/new-password',
          params: {
            email: email.trim().toLowerCase(),
            reset_token: response.data.reset_token,
          },
        });
      }
    } catch (err: any) {
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const remaining = err.response?.data?.attempts_remaining;
      if (typeof remaining === 'number') {
        setAttemptsRemaining(remaining);
      } else {
        setAttemptsRemaining((prev) => Math.max(0, prev - 1));
      }
      const detail = err.response?.data?.detail;
      setErrorMsg(detail || 'Invalid verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#042F2E', '#0B4D47', '#042F2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            {/* Top Navigation */}
            <View style={styles.headerNav}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                style={[
                  styles.card,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Header Icon */}
                <View style={styles.iconCircle}>
                  <LinearGradient
                    colors={['#14B8A6', '#0D9488']}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="mail-open-outline" size={32} color="#FFFFFF" />
                  </LinearGradient>
                </View>

                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit verification code to
                </Text>
                <Text style={styles.emailHighlight}>{email || 'your email'}</Text>

                {/* Status Badges Row */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, expiryTimer <= 60 && styles.badgeWarning]}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={expiryTimer <= 60 ? '#F59E0B' : '#14B8A6'}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        expiryTimer <= 60 && styles.badgeTextWarning,
                      ]}
                    >
                      {expiryTimer > 0 ? `Expires in ${formatTimer(expiryTimer)}` : 'Expired'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      attemptsRemaining <= 1 && styles.badgeDanger,
                    ]}
                  >
                    <Ionicons
                      name="shield-outline"
                      size={14}
                      color={attemptsRemaining <= 1 ? '#F43F5E' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        attemptsRemaining <= 1 && styles.badgeTextDanger,
                      ]}
                    >
                      {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} left
                    </Text>
                  </View>
                </View>

                {/* Error Banner Slot - Pre-allocated space prevents card alignment jitter */}
                <View style={styles.errorSlot}>
                  {errorMsg ? (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={16} color="#F43F5E" />
                      <Text style={styles.errorText} numberOfLines={2}>{errorMsg}</Text>
                    </View>
                  ) : null}
                </View>


                {/* 6 Digit OTP Inputs */}
                <Animated.View
                  style={[
                    styles.otpContainer,
                    { transform: [{ translateX: shakeAnim }] },
                  ]}
                >
                  <TextInput
                    ref={hiddenInputRef}
                    value={otp}
                    onChangeText={handleOtpChange}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    maxLength={OTP_LENGTH}
                    style={styles.hiddenInput}
                    caretHidden
                    editable={!isLoading && attemptsRemaining > 0 && expiryTimer > 0}
                  />

                  {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                    const digit = otp[index] || '';
                    const isFocused =
                      isInputFocused &&
                      (index === otp.length || (index === OTP_LENGTH - 1 && otp.length === OTP_LENGTH));
                    const isFilled = !!digit;
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.8}
                        onPress={() => hiddenInputRef.current?.focus()}
                        style={[
                          styles.otpBox,
                          isFocused && styles.otpBoxFocused,
                          isFilled && styles.otpBoxFilled,
                          attemptsRemaining <= 0 && styles.otpBoxDisabled,
                        ]}
                      >
                        <Text style={styles.otpDigitText}>{digit}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>

                {/* Verify Button */}
                <View style={styles.buttonWrapper}>
                  <ButtonOne
                    title={purpose === 'registration' ? 'Verify & Continue' : 'Verify Code'}
                    onPress={handleVerify}
                    isLoading={isLoading}
                    disabled={attemptsRemaining <= 0 || expiryTimer <= 0}
                    showArrow={true}
                  />
                </View>

                {/* Resend OTP Section */}
                <View style={styles.resendContainer}>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendCooldownText}>
                      Resend code in <Text style={styles.resendCooldownSec}>{resendTimer}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={isResending}
                      activeOpacity={0.7}
                      style={styles.resendButton}
                    >
                      {isResending ? (
                        <ActivityIndicator size="small" color="#14B8A6" />
                      ) : (
                        <Text style={styles.resendActiveText}>
                          Didn't get code? <Text style={styles.resendActiveBold}>Resend OTP</Text>
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
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
  keyboardAvoid: {
    flex: 1,
  },
  headerNav: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(4, 47, 46, 0.85)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emailHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14B8A6',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.25)',
    gap: 6,
  },
  badgeWarning: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  badgeDanger: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  badgeTextWarning: {
    color: '#F59E0B',
  },
  badgeTextDanger: {
    color: '#F43F5E',
  },
  errorSlot: {
    width: '100%',
    minHeight: 46,
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 28,
  },
  otpBox: {
    width: (width - 120) / 6,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: 'rgba(20, 184, 166, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigitText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpBoxFocused: {
    borderColor: '#14B8A6',
    backgroundColor: '#0F2624',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  otpBoxFilled: {
    borderColor: '#0D9488',
    backgroundColor: '#0E2827',
  },
  otpBoxDisabled: {
    opacity: 0.5,
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  resendCooldownText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  resendCooldownSec: {
    color: '#14B8A6',
    fontWeight: '700',
  },
  resendButton: {
    paddingVertical: 4,
  },
  resendActiveText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  resendActiveBold: {
    color: '#14B8A6',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
