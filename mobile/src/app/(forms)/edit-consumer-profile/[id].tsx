import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import ProfileImagePicker from '../../../components/ProfileImagePicker';

export default function EditConsumerProfileScreen() {
  const params = useLocalSearchParams();
  const id = params.id;
  const { login } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      setName((params.business_name as string) || '');
      setRegEmail((params.email as string) || '');
      setRegPassword((params.password as string) || '');
      setLoading(false);
    } else {
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me/');
      const data = response.data;
      setName(data.first_name || data.business_name || '');
      setPhoneNumber(data.phone_number || '');
      setProfilePicture(data.profile_picture || null);
    } catch (e) {
      Alert.alert("Error", "Could not load profile");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    const cleanPhone = phoneNumber.replace(/\s+/g, '');

    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter your name.");
      return;
    }

    if (id === 'new') {
      if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
        Alert.alert("Invalid Phone Number", "Please provide a valid Indian phone number (e.g. +91 9876543210).");
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
          business_name: name.trim(),
          first_name: name.trim(),
          role: 'consumer',
          phone_number: phoneNumber.trim(),
          profile_picture: profilePicture,
        });

        const loginRes = await api.post('/users/login/', {
          email: regEmail || (params.email as string),
          password: regPassword || (params.password as string),
        });
        await login(loginRes.data.access, loginRes.data.refresh);
        router.replace('/');
      } else {
        const payload: any = {
          first_name: name.trim(),
          business_name: name.trim(),
          phone_number: phoneNumber.trim(),
          profile_picture: profilePicture,
        };
        await api.patch('/users/me/', payload);
        Alert.alert("Updated", "Your profile has been updated.");
        router.back();
      }
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      const errorMsg = e.response?.data?.email 
        ? "Email is already registered."
        : (e.response?.data?.detail || "Failed to save profile. Please try again.");
      Alert.alert("Error", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{id === 'new' ? 'Profile Setup' : 'Edit Profile'}</Text>
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
          <Text style={styles.headerTitle}>{id === 'new' ? 'Profile Setup' : 'Edit Profile'}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <ProfileImagePicker
            imageUri={profilePicture}
            defaultInitial={name ? name.charAt(0) : 'C'}
            onImageSelected={(img) => setProfilePicture(img)}
            onImageRemoved={() => setProfilePicture(null)}
          />

          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number {id === 'new' ? '*' : ''}</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleUpdate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>{id === 'new' ? 'Complete Profile' : 'Save Changes'}</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 32 },

  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginLeft: 4 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },

  submitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
