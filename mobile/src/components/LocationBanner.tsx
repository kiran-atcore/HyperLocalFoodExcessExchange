import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

interface LocationBannerProps {
  address?: string;
  onLocationChange?: (address: string, lat?: number, lng?: number) => void;
  onMapPress?: () => void;
  autoFetch?: boolean;
  variant?: 'light' | 'dark';
}

export default function LocationBanner({
  address,
  onLocationChange,
  onMapPress,
  autoFetch,
  variant = 'light',
}: LocationBannerProps = {}) {
  const [isFetching, setIsFetching] = useState(false);
  const isDark = variant === 'dark';

  // High-End Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Ambient breathing glow
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  // Radar spin during fetch
  useEffect(() => {
    if (isFetching) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isFetching]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
  };

  useEffect(() => {
    if (autoFetch) {
      fetchGPSLocation();
    }
  }, [autoFetch]);

  const fetchGPSLocation = async () => {
    setIsFetching(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Permission to access location was denied.',
        });
        setIsFetching(false);
        return;
      }

      let location;
      try {
        location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
        }
        if (!location) throw new Error('GPS not available.');
      } catch (e) {
        Toast.show({
          type: 'error',
          text1: 'GPS Error',
          text2: 'GPS fix unavailable. Please check location settings.',
        });
        setIsFetching(false);
        return;
      }
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.coords.latitude}&lon=${location.coords.longitude}&format=json`,
        { headers: { 'User-Agent': 'HyperLocalFoodExcessExchange/1.0' } }
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        onLocationChange?.(data.display_name, location.coords.latitude, location.coords.longitude);
      } else {
        onLocationChange?.(`GPS: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`, location.coords.latitude, location.coords.longitude);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: error.message || 'Unable to fetch current location.',
      });
      onLocationChange?.('Location Unavailable', undefined, undefined);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onMapPress}
      >
        <LinearGradient
          colors={isDark ? ['rgba(15, 23, 42, 0.88)', 'rgba(4, 47, 46, 0.72)'] : ['#FFFFFF', '#F8FAFC']}
          style={[styles.card, isDark && styles.cardDark]}
        >
          {/* Ambient Breathing Glow underneath content */}
          <Animated.View style={[
            styles.ambientGlow,
            isDark && styles.ambientGlowDark,
            { 
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.4] }) 
            }
          ]} />

          {/* Left Radar Icon Wrapper */}
          <View style={[styles.leftIconWrapper, isDark && styles.leftIconWrapperDark]}>
            <View style={[styles.iconCore, isDark && styles.iconCoreDark]}>
              <Ionicons name="map" size={20} color={isDark ? '#5EEAD4' : '#0D9488'} />
            </View>
          </View>
          
          <View style={styles.textWrapper}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Geo-Location Uplink</Text>
            <Text style={[styles.address, isDark && styles.addressDark]} numberOfLines={2}>
              {address || 'Awaiting Coordinates...'}
            </Text>
          </View>

          {/* GPS Auto-Locate Button */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation();
              fetchGPSLocation();
            }}
            style={styles.gpsButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={['#0D9488', '#14B8A6']}
              style={styles.gpsGradient}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons 
                  name={isFetching ? "sync" : "locate"} 
                  size={22} 
                  color="#FFFFFF" 
                />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  cardDark: {
    borderColor: 'rgba(94, 234, 212, 0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#CCFBF1',
    borderRadius: 24,
  },
  ambientGlowDark: {
    backgroundColor: 'rgba(94, 234, 212, 0.14)',
  },
  leftIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  leftIconWrapperDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    shadowColor: '#5EEAD4',
    shadowOpacity: 0.2,
  },
  iconCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  iconCoreDark: {
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  textWrapper: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  labelDark: {
    color: '#5EEAD4',
  },
  address: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  addressDark: {
    color: '#F8FAFC',
  },
  gpsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gpsGradient: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
