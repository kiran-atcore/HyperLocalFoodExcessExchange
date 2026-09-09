import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

interface RejectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

const QUICK_REASONS = [
  'Invalid Certificate',
  'Unverified Address',
  'Incomplete Registration',
];

export default function RejectionModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
}: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const translateYAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (visible) {
      setReason('');
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 18,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!reason.trim() || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleSelectQuickReason = (text: string) => {
    Haptics.selectionAsync();
    setReason((prev) => {
      if (!prev.trim()) return text;
      if (prev.includes(text)) return prev;
      return `${prev.trim()}; ${text}`;
    });
  };

  const isSubmitDisabled = loading || reason.trim().length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <BlurView
            intensity={25}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            tint="dark"
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
            <Animated.View
              style={[
                styles.modalCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['#0F172A', '#020617']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cardGradient}
              >
                {/* Red danger accent line */}
                <View style={styles.topAccentBar} />

                <View style={styles.content}>
                  {/* Header Row with Danger Icon */}
                  <View style={styles.headerRow}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="alert-circle" size={24} color="#F43F5E" />
                    </View>
                    <View style={styles.headerTextCol}>
                      <Text style={styles.title}>Reject Account Request</Text>
                      <Text style={styles.subtitle}>
                        State the rejection reason so the applicant can take corrective action.
                      </Text>
                    </View>
                  </View>

                  {/* Quick Suggestions */}
                  <View style={styles.quickChipsRow}>
                    {QUICK_REASONS.map((chip, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.chip}
                        onPress={() => handleSelectQuickReason(chip)}
                        activeOpacity={0.7}
                        disabled={loading}
                      >
                        <Ionicons name="add" size={12} color="#FB7185" style={{ marginRight: 2 }} />
                        <Text style={styles.chipText}>{chip}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Reason Input */}
                  <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Please upload a clear FSSAI license with valid dates."
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={4}
                      value={reason}
                      onChangeText={setReason}
                      editable={!loading}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleClose}
                      disabled={loading}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.confirmButton, isSubmitDisabled && styles.confirmButtonDisabled]}
                      onPress={handleConfirm}
                      disabled={isSubmitDisabled}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <LinearGradient
                          colors={isSubmitDisabled ? ['#334155', '#1E293B'] : ['#F43F5E', '#BE123C']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.confirmGradient}
                        >
                          <Ionicons name="close-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.confirmText}>Reject Account</Text>
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.28)',
    overflow: 'hidden',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  cardGradient: {
    paddingBottom: 20,
  },
  topAccentBar: {
    height: 4,
    width: '100%',
    backgroundColor: '#F43F5E',
  },
  content: {
    padding: 20,
    paddingTop: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FDA4AF',
  },
  inputWrapper: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    marginBottom: 20,
  },
  inputWrapperFocused: {
    borderColor: '#F43F5E',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  input: {
    fontSize: 14,
    color: '#F8FAFC',
    height: 90,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1.3,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.55,
  },
  confirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

