import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function EditSurplusScreen() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('Leftover Lasagna');
  const [description, setDescription] = useState('Large tray of fresh lasagna left over from dinner service.');
  const [originalPrice, setOriginalPrice] = useState('15.00');
  const [discountPrice, setDiscountPrice] = useState('4.00');
  const [quantity, setQuantity] = useState('5');
  const [isDonation, setIsDonation] = useState(false);

  const handleUpdate = () => {
    Alert.alert("Updated", "Your surplus listing has been updated.");
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Surplus #{id}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} value={description} onChangeText={setDescription} />
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
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
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={originalPrice} onChangeText={setOriginalPrice} />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Discount Price ($)</Text>
                    <TextInput style={[styles.input, { borderColor: '#10b981', borderWidth: 2 }]} keyboardType="decimal-pad" value={discountPrice} onChangeText={setDiscountPrice} />
                  </View>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.publishBtn} onPress={handleUpdate}>
            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.publishBtnText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>Delete Listing</Text>
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
  row: { flexDirection: 'row', marginBottom: 0 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { height: 100, textAlignVertical: 'top' },
  publishBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  publishBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  deleteBtnText: { color: '#ef4444', fontSize: 15, fontWeight: 'bold' }
});
