import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  onClose: () => void;
  confirmText?: string;
  showCancel?: boolean;
  cancelText?: string;
  onConfirm?: () => void;
}

export default function AlertModal({ 
  visible, 
  title, 
  message, 
  type = 'info', 
  onClose, 
  confirmText = 'OK',
  showCancel = false,
  cancelText = 'Cancel',
  onConfirm
}: AlertModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  if (!visible && (fadeAnim as any)._value === 0) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: '#10B981', glow: 'rgba(16, 185, 129, 0.2)' };
      case 'error': return { name: 'warning', color: '#EF4444', glow: 'rgba(239, 68, 68, 0.2)' };
      case 'warning': return { name: 'alert-circle', color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.2)' };
      case 'info':
      default: return { name: 'information-circle', color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.2)' };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              opacity: fadeAnim, 
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] 
            }
          ]}
        >
          <LinearGradient
            colors={['#0F172A', '#020617']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Top decorative glow */}
            <View style={[styles.topGlow, { backgroundColor: iconConfig.color }]} />

            <View style={styles.content}>
              <View style={[styles.iconWrapper, { backgroundColor: iconConfig.glow, borderColor: iconConfig.color }]}>
                <Ionicons name={iconConfig.name as any} size={32} color={iconConfig.color} />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={showCancel ? styles.buttonsRow : styles.buttonWrapper}>
                {showCancel && (
                  <TouchableOpacity activeOpacity={0.8} style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity activeOpacity={0.8} style={[styles.button, showCancel && { flex: 1 }]} onPress={onConfirm || onClose}>
                  <LinearGradient
                    colors={[iconConfig.color, iconConfig.color + 'CC']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>{confirmText}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 3,
    opacity: 0.8,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonWrapper: {
    width: '100%',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
