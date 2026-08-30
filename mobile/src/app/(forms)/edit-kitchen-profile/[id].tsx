import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import LocationBanner from '../../../components/LocationBanner';

import * as Location from 'expo-location';

import { AuthContext } from '../../../context/AuthContext';

export default function EditKitchenProfileScreen() {
  const params = useLocalSearchParams();
  const id = params.id;
  const { login } = React.useContext(AuthContext);
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasManualLocation = useRef(false);

  useEffect(() => {
    if (id === 'new') {
      setBusinessName((params.business_name as string) || '');
      setRegEmail((params.email as string) || '');
      setRegPassword((params.password as string) || '');
      setRegRole((params.role as string) || '');
      setAddress('Fetching location...');
      fetchCurrentLocation();
      setLoading(false);
    } else {
      fetchProfile();
    }

    const subscription = DeviceEventEmitter.addListener('onLocationSelected', (data) => {
      hasManualLocation.current = true;
      if (data.address) setAddress(data.address);
      if (data.lat && data.lng) {
        setLat(data.lat);
        setLng(data.lng);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress(''); // reset if denied
        return; 
      }
      let location;
      try {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch (e) {
        location = await Location.getLastKnownPositionAsync({});
      }
      
      if (!location) {
        setAddress('');
        return;
      }
      
      const { latitude, longitude } = location.coords;
      
      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (hasManualLocation.current) return;

      setLat(latitude);
      setLng(longitude);

      if (geocode.length > 0) {
        const addr = geocode[0];
        const addressString = [addr.name, addr.street, addr.city, addr.region, addr.country].filter(Boolean).join(', ');
        setAddress(addressString);
      } else {
        setAddress('Current Location');
      }
    } catch (error) {
      console.log('Error fetching location', error);
      setAddress('');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me/');
      const data = response.data;
      setBusinessName(data.business_name || '');
      setName(data.first_name || '');
      setPhoneNumber(data.phone_number || '');
      setAddress(data.address || '');
      setLat(data.latitude || null);
      setLng(data.longitude || null);
    } catch (e) {
      Alert.alert("Error", "Could not load profile");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    // Validate phone number (Indian standard: optional +91/91/0 followed by 10 digits starting with 6-9)
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    const cleanPhone = phoneNumber.replace(/\s+/g, '');

    if (id === 'new') {
      if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
        Alert.alert("Invalid Phone Number", "Please provide a valid Indian phone number (e.g. +91 9876543210).");
        return;
      }
      if (!address.trim() || !lat || !lng) {
        Alert.alert("Required Field", "Please select your location from the map.");
        return;
      }
    } else {
      if (cleanPhone && !phoneRegex.test(cleanPhone)) {
        Alert.alert("Invalid Phone Number", "Please provide a valid Indian phone number (e.g. +91 9876543210).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (id === 'new') {
        await api.post('/users/register/', {
          email: regEmail || (params.email as string),
          password: regPassword || (params.password as string),
          business_name: businessName,
          first_name: name,
          role: regRole || (params.role as string),
          phone_number: phoneNumber,
          address: address,
          latitude: lat,
          longitude: lng,
        });

        const loginRes = await api.post('/users/login/', {
          email: regEmail || (params.email as string),
          password: regPassword || (params.password as string),
        });
        await login(loginRes.data.access, loginRes.data.refresh);
        Alert.alert("Request Sent", "Your account is pending admin approval.");
        router.replace('/');
      } else {
        const payload = {
          business_name: businessName,
          first_name: name,
          phone_number: phoneNumber,
          address: address,
          latitude: lat,
          longitude: lng,
        };
        await api.patch('/users/me/', payload);
        Alert.alert("Updated", "Your profile has been updated.");
        router.back();
      }
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMap = () => {
    if (lat && lng) {
      router.push(`/(views)/map/location?lat=${lat}&lng=${lng}`);
    } else {
      router.push('/(views)/map/location');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Business Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Hope Shelter / Mario's Pizza" value={businessName} onChangeText={setBusinessName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner/Manager Name (Internal)</Text>
              <TextInput style={styles.input} placeholder="e.g. John Doe" value={name} onChangeText={setName} />
            </View>
            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} placeholder="e.g. +91 98765 43210" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Location Details</Text>
          <View style={styles.card}>
            <LocationBanner 
              address={address} 
              onLocationChange={(newAddress, newLat, newLng) => {
                setAddress(newAddress);
                if (newLat && newLng) {
                  setLat(newLat);
                  setLng(newLng);
                }
              }} 
              onMapPress={openMap}
            />
          </View>

          <TouchableOpacity style={[styles.publishBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleUpdate} disabled={isSubmitting}>
            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.publishBtnText}>
              {isSubmitting ? 'Saving...' : (id === 'new' ? 'Request Access' : 'Save Profile')}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 32 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  
  locationBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  bannerLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e40af', marginBottom: 2 },
  bannerSubtext: { fontSize: 13, color: '#3b82f6' },

  publishBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  publishBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
