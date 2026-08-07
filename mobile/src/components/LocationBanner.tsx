import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';

export default function LocationBanner() {
  const [locationName, setLocationName] = useState('123 Main St (Dummy)');
  const [isFetching, setIsFetching] = useState(false);

  const fetchGPSLocation = async () => {
    setIsFetching(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setIsFetching(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      // Use free OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.coords.latitude}&lon=${location.coords.longitude}&format=json`);
      const data = await response.json();
      
      if (data && data.address) {
        const placeName = data.address.road || data.address.suburb || data.address.city || "Current Location";
        setLocationName(placeName);
      } else {
        setLocationName(`GPS: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
      }

    } catch (error) {
      Alert.alert('Error fetching location');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <View style={styles.bannerContainer}>
      <TouchableOpacity 
        style={styles.textContainer} 
        onPress={() => router.push('/(views)/map/location' as any)}
      >
        <Ionicons name="location-outline" size={20} color="#10b981" />
        <View style={styles.textWrapper}>
          <Text style={styles.label}>Your Location</Text>
          <Text style={styles.address} numberOfLines={1}>{locationName}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
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
