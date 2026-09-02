import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

interface LocationBannerProps {
  address?: string;
  onLocationChange?: (address: string, lat?: number, lng?: number) => void;
  onMapPress?: () => void;
  autoFetch?: boolean;
}

export default function LocationBanner({ address, onLocationChange, onMapPress, autoFetch }: LocationBannerProps = {}) {
  const [isFetching, setIsFetching] = useState(false);

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
        Alert.alert('Permission to access location was denied');
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
        Alert.alert('Error', 'Emulator GPS not set. Please set a location in Extended Controls.');
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
      Alert.alert('Error fetching location', error.message || 'Please ensure your emulator has a location set in Extended Controls.');
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
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.card}
        >
          {/* Ambient Breathing Glow underneath content */}
          <Animated.View style={[styles.ambientGlow, { 
            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.4] }) 
          }]} />

          {/* Left Radar Icon Wrapper */}
          <View style={styles.leftIconWrapper}>
            <View style={styles.iconCore}>
              <Ionicons name="map" size={20} color="#0D9488" />
            </View>
          </View>
          
          <View style={styles.textWrapper}>
            <Text style={styles.label}>Geo-Location Uplink</Text>
            <Text style={styles.address} numberOfLines={2}>
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
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#CCFBF1',
    borderRadius: 24,
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
  address: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
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
