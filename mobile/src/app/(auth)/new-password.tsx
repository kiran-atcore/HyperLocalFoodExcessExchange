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

export default function NewPasswordScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';
  const resetToken = (params.reset_token as string) || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Entrance Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

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
  }, []);

  const handleSavePassword = async () => {
    Keyboard.dismiss();
    setErrorMsg('');

    if (!newPassword) {
      setErrorMsg('Please enter your new password.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!confirmPassword) {
      setErrorMsg('Please confirm your new password.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await api.post('/users/reset-password/', {
        email: email.trim().toLowerCase(),
        reset_token: resetToken,
        new_password: newPassword,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Custom alert popup
      Toast.show({
        type: 'success',
        text1: 'Password Reset Successful!',
        text2: 'Your password has been updated. Please log in.',
        visibilityTime: 4000,
      });

      // Route back to login
      router.replace('/(auth)/login');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const detail = err.response?.data?.detail;
      setErrorMsg(detail || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isMinLength = newPassword.length >= 8;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

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
                  router.replace('/(auth)/login');
                }}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
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
                    <Ionicons name="lock-closed-outline" size={32} color="#FFFFFF" />
                  </LinearGradient>
                </View>

                <Text style={styles.title}>Create New Password</Text>
                <Text style={styles.subtitle}>
                  Choose a strong, secure password for
                </Text>
                <Text style={styles.emailHighlight}>{email || 'your account'}</Text>

                {/* Error Banner */}
                {errorMsg ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color="#F43F5E" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {/* New Password Input */}
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (errorMsg) setErrorMsg('');
                    }}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errorMsg) setErrorMsg('');
                    }}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Validation Checklist */}
                <View style={styles.checklist}>
                  <View style={styles.checkItem}>
                    <Ionicons
                      name={isMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={isMinLength ? '#14B8A6' : '#64748B'}
                    />
                    <Text style={[styles.checkText, isMinLength && styles.checkTextActive]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.checkItem}>
                    <Ionicons
                      name={isMatching ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={isMatching ? '#14B8A6' : '#64748B'}
                    />
                    <Text style={[styles.checkText, isMatching && styles.checkTextActive]}>
                      Passwords match
                    </Text>
                  </View>
                </View>

                {/* Submit Button */}
                <View style={styles.buttonWrapper}>
                  <ButtonOne
                    title="Save New Password"
                    onPress={handleSavePassword}
                    isLoading={isLoading}
                    disabled={!isMinLength || !isMatching}
                    showArrow={true}
                  />
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
    alignItems: 'flex-end',
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
    marginBottom: 20,
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
    marginBottom: 18,
    width: '100%',
    gap: 8,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(20, 184, 166, 0.25)',
    paddingHorizontal: 16,
    height: 56,
    width: '100%',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  eyeButton: {
    padding: 6,
  },
  checklist: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 4,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  checkTextActive: {
    color: '#14B8A6',
  },
  buttonWrapper: {
    width: '100%',
  },
});
