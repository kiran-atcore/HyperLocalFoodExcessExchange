import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { pickImageAsBase64 } from '../utils/imagePickerHelper';

interface ProfileImagePickerProps {
  imageUri: string | null;
  defaultInitial?: string;
  defaultIcon?: keyof typeof Ionicons.glyphMap;
  onImageSelected: (base64OrUri: string) => void;
  onImageRemoved: () => void;
  title?: string;
}

export default function ProfileImagePicker({
  imageUri,
  defaultInitial = 'U',
  defaultIcon,
  onImageSelected,
  onImageRemoved,
}: ProfileImagePickerProps) {

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const badgeBounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Ambient Floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // 2. Breathing Pulse Aura
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // 3. Periodic Badge Pop (Attention grabber)
    const popSequence = Animated.sequence([
      Animated.delay(3500),
      Animated.spring(badgeBounceAnim, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }),
      Animated.spring(badgeBounceAnim, { toValue: 0, friction: 4, tension: 40, useNativeDriver: true })
    ]);
    Animated.loop(popSequence).start();
  }, [floatAnim, pulseAnim, badgeBounceAnim]);

  const animatePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const animatePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 15,
      bounciness: 12,
    }).start();
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const base64Data = await pickImageAsBase64();
    if (base64Data) {
      onImageSelected(base64Data);
    }
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onImageRemoved();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.avatarContainer, { 
        transform: [
          { scale: scaleAnim },
          { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }
        ] 
      }]}>
        
        <View style={styles.touchableArea}>
          
          {/* Breathing Aura */}
          <Animated.View style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#0D9488',
              borderRadius: AVATAR_SIZE / 2,
              transform: [
                { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }
              ],
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] })
            }
          ]} />

          {/* Main Avatar Touchable */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={handlePickImage}
            onPressIn={animatePressIn}
            onPressOut={animatePressOut}
          >
            <View style={styles.imageRingShadow}>
              <View style={styles.imageRing}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient
                    colors={['#042F2E', '#0D9488']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarPlaceholder}
                  >
                    {defaultIcon ? (
                      <Ionicons name={defaultIcon} size={48} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.avatarInitial}>{defaultInitial.toUpperCase()}</Text>
                    )}
                  </LinearGradient>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Solid Camera Badge (Primary Action) */}
          <Animated.View style={[styles.editBadgeContainer, {
            transform: [
              { scale: badgeBounceAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }
            ]
          }]}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handlePickImage}
              style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Solid Remove Badge (Secondary Action) */}
          {imageUri && (
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleRemove} 
              style={styles.removeBadgeContainer}
            >
              <View style={styles.removeBadge}>
                <Ionicons name="trash" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}

        </View>

      </Animated.View>
    </View>
  );
}

const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 0,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  touchableArea: {
    position: 'relative',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  imageRingShadow: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#042F2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  imageRing: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#cbd5e1', // Fallback color
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  
  // Camera Badge (Bottom Right - Primary)
  editBadgeContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D9488', // Solid Teal
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Remove Badge (Bottom Left - Secondary)
  removeBadgeContainer: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E11D48', // Solid Coral
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  removeBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
