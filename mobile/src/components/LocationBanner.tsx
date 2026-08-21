import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';

interface LocationBannerProps {
  address?: string;
  onLocationChange?: (address: string, lat?: number, lng?: number) => void;
  onMapPress?: () => void;
  autoFetch?: boolean;
}

export default function LocationBanner({ address, onLocationChange, onMapPress, autoFetch }: LocationBannerProps = {}) {
  const [isFetching, setIsFetching] = useState(false);

  React.useEffect(() => {
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
        // Try to get a cached/last known position first for instant speed
        location = await Location.getLastKnownPositionAsync({});
        
        if (!location) {
          // If no known position, fetch a fresh one but with Low accuracy for speed
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
        }
        
        if (!location) {
          throw new Error('GPS not available.');
        }
      } catch (e) {
        Alert.alert('Error', 'Emulator GPS not set. Please set a location in Extended Controls.');
        setIsFetching(false);
        return;
      }
      
      // Use free OpenStreetMap Nominatim API for reverse geocoding
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
    <View style={styles.bannerContainer}>
      <TouchableOpacity 
        style={styles.textContainer} 
        onPress={onMapPress}
      >
        <Ionicons name="location-outline" size={20} color="#10b981" />
        <View style={styles.textWrapper}>
          <Text style={styles.label}>Your Location</Text>
          <Text style={styles.address} numberOfLines={1}>{address || 'Select a location...'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={fetchGPSLocation}>
        {isFetching ? (
          <ActivityIndicator size="small" color="#10b981" />
        ) : (
          <Ionicons name="locate" size={20} color="#10b981" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrapper: {
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  address: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginLeft: 8,
  }
});
