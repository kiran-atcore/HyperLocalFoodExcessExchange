import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import LocationBanner from '../../../components/LocationBanner';

export default function EditShelterProfileScreen() {
  const { id } = useLocalSearchParams();
  const [businessName, setBusinessName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();

    const subscription = DeviceEventEmitter.addListener('onLocationSelected', (data) => {
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

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me/');
      const data = response.data;
      setBusinessName(data.business_name || '');
      setUsername(data.username || '');
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
    setIsSubmitting(true);
    try {
      const payload = {
        business_name: businessName,
        username: username,
        phone_number: phoneNumber,
        address: address,
        latitude: lat,
        longitude: lng,
      };
      await api.patch('/users/me/', payload);
      Alert.alert("Updated", "Your organization profile has been updated.");
      router.back();
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMap = () => {
    if (lat && lng) {
      router.push(`/(views)/map/location?lat=${lat}&lng=${lng}` as any);
    } else {
      router.push('/(views)/map/location' as any);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Organization Profile</Text>
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
          <Text style={styles.headerTitle}>Edit Organization Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Organization Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Hope Shelter" value={businessName} onChangeText={setBusinessName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Manager Name (Internal)</Text>
              <TextInput style={styles.input} placeholder="e.g. Jane Doe" value={username} onChangeText={setUsername} />
            </View>
            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} placeholder="e.g. +1 555-123-4567" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Default Location</Text>
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
            <Text style={styles.publishBtnText}>{isSubmitting ? 'Saving...' : 'Save Profile'}</Text>
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
  
  publishBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  publishBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
