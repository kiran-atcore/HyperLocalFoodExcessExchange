import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </Svg>
);

export type UserRole = 'consumer' | 'donor' | 'shelter';

interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  accentColor: string;
  badge?: string;
  badgeBg: string;
  badgeTextColor: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'consumer',
    title: 'Consumer',
    subtitle: 'Browse discounted surplus meals & daily food deals nearby.',
    icon: 'bag-handle',
    gradient: ['#042F2E', '#0D9488'],
    accentColor: '#0D9488',
    badge: 'Popular',
    badgeBg: '#CCFBF1',
    badgeTextColor: '#0F766E',
  },
  {
    id: 'donor',
    title: 'Kitchen / Donor',
    subtitle: 'List surplus food from your kitchen or store and claim tax docs.',
    icon: 'restaurant',
    gradient: ['#D97706', '#F59E0B'],
    accentColor: '#D97706',
    badge: 'Business',
    badgeBg: '#FEF3C7',
    badgeTextColor: '#B45309',
  },
  {
    id: 'shelter',
    title: 'Shelter / NGO',
    subtitle: 'Claim verified bulk food donations to feed community members.',
    icon: 'home',
    gradient: ['#6D28D9', '#8B5CF6'],
    accentColor: '#7C3AED',
    badge: 'Community',
    badgeBg: '#EDE9FE',
    badgeTextColor: '#6D28D9',
  },
];

interface GoogleModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRole: (role: UserRole) => void;
}

export default function GoogleModal({ visible, onClose, onSelectRole }: GoogleModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const translateYAnim = useRef(new Animated.Value(40)).current;
  const cardScales = useRef(ROLES.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 7,
          tension: 60,
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
          toValue: 40,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleCardPressIn = (index: number) => {
    Animated.spring(cardScales[index], {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPressOut = (index: number) => {
    Animated.spring(cardScales[index], {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleSelect = (role: UserRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectRole(role);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    { scale: scaleAnim },
                    { translateY: translateYAnim },
                  ],
                },
              ]}
            >
              {/* Teal Hero Header Banner */}
              <LinearGradient
                colors={['#042F2E', '#0D9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerBanner}
              >
                {/* Top Bar with Google Pill and Close */}
                <View style={styles.topBar}>
                  <View style={styles.googlePill}>
                    <View style={styles.googleLogoContainer}>
                      <GoogleLogo size={18} />
                    </View>
                    <Text style={styles.googlePillText}>Google Sign In</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onClose();
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Select Your Role</Text>
                  <Text style={styles.subtitle}>Choose how you would like to participate in ResQ</Text>
                </View>
              </LinearGradient>

              {/* Roles Body */}
              <View style={styles.body}>
                <View style={styles.rolesContainer}>
                  {ROLES.map((item, index) => (
                    <Animated.View
                      key={item.id}
                      style={{ transform: [{ scale: cardScales[index] }] }}
                    >
                      <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleSelect(item.id)}
                        onPressIn={() => handleCardPressIn(index)}
                        onPressOut={() => handleCardPressOut(index)}
                        activeOpacity={0.92}
                      >
                        <LinearGradient
                          colors={item.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.iconBox}
                        >
                          <Ionicons name={item.icon} size={22} color="#FFFFFF" />
                        </LinearGradient>

                        <View style={styles.roleContent}>
                          <View style={styles.roleTitleRow}>
                            <Text style={styles.roleTitle}>{item.title}</Text>
                            {item.badge && (
                              <View style={[styles.badge, { backgroundColor: item.badgeBg }]}>
                                <Text style={[styles.badgeText, { color: item.badgeTextColor }]}>{item.badge}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.roleSubtitle}>{item.subtitle}</Text>
                        </View>

                        <View style={styles.arrowCircle}>
                          <Ionicons name="chevron-forward" size={18} color="#0D9488" />
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>

                {/* Footer Note */}
                <View style={styles.footerNote}>
                  <View style={styles.shieldIconContainer}>
                    <Ionicons name="shield-checkmark" size={15} color="#0D9488" />
                  </View>
                  <Text style={styles.footerNoteText}>
                    Your account role can be updated anytime in settings.
                  </Text>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 47, 46, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: Math.min(width - 32, 420),
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#042F2E',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.35,
        shadowRadius: 30,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  headerBanner: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  googlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  googleLogoContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googlePillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '400',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  rolesContainer: {
    gap: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  roleContent: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  roleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16.5,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 18,
    gap: 8,
  },
  shieldIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNoteText: {
    fontSize: 11.5,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
});
