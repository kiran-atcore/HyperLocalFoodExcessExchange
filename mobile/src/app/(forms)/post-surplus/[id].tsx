import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function PostSurplusScreen() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isDonation, setIsDonation] = useState(false);

  const handlePublish = () => {
    Alert.alert("Success", "Your food excess listing has been published!");
    router.replace('/(donor)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post New Surplus</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.donationToggleCard}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Bulk NGO Donation</Text>
              <Text style={styles.toggleDesc}>Mark this as a 100% free bulk donation for Verified Shelters only.</Text>
            </View>
            <Switch 
              value={isDonation} 
              onValueChange={setIsDonation} 
              trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
              thumbColor={isDonation ? '#3b82f6' : '#f8fafc'}
            />
          </View>

          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} placeholder="e.g. 50lb Rice Bags (x3)" value={title} onChangeText={setTitle} />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the items..." multiline numberOfLines={4} value={description} onChangeText={setDescription} />
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput style={styles.input} placeholder="e.g. 5" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Pickup Deadline</Text>
                <TextInput style={styles.input} placeholder="e.g. 5:00 PM" />
              </View>
            </View>
          </View>

          {!isDonation && (
            <>
              <Text style={styles.sectionTitle}>Pricing</Text>
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Original Value ($)</Text>
                    <TextInput style={styles.input} placeholder="0.00" keyboardType="decimal-pad" value={originalPrice} onChangeText={setOriginalPrice} />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Discount Price ($)</Text>
                    <TextInput style={[styles.input, { borderColor: '#10b981', borderWidth: 2 }]} placeholder="0.00" keyboardType="decimal-pad" value={discountPrice} onChangeText={setDiscountPrice} />
                  </View>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.publishBtnText}>Publish Listing</Text>
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
  donationToggleCard: { flexDirection: 'row', backgroundColor: '#eff6ff', borderRadius: 16, padding: 16, marginBottom: 24, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#bfdbfe' },
  toggleTextCol: { flex: 1, marginRight: 16 },
  toggleTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e40af', marginBottom: 4 },
  toggleDesc: { fontSize: 13, color: '#3b82f6', lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 0 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { height: 100, textAlignVertical: 'top' },
  publishBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  publishBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
