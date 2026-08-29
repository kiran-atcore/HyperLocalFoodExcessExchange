import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import api from '../../../utils/api';

export default function PostSurplusScreen() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState('portions');
  const [dietaryInfo, setDietaryInfo] = useState('None');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isDonation, setIsDonation] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [pickupEnd, setPickupEnd] = useState(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const handleOpenPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickupEnd,
        mode: 'date',
        onValueChange: (event, selectedDate) => {
          if (selectedDate) {
            // After selecting date, immediately show time picker
            DateTimePickerAndroid.open({
              value: selectedDate,
              mode: 'time',
              onValueChange: (timeEvent, selectedTime) => {
                if (selectedTime) setPickupEnd(selectedTime);
              },
            });
          }
        },
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    // Fetch kitchen's actual location to embed in the listing
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me/');
        if (response.data.latitude && response.data.longitude) {
          setUserLat(response.data.latitude);
          setUserLng(response.data.longitude);
          setUserAddress(response.data.address || 'Pickup at Kitchen');
        }
      } catch (e) {
        console.error("Failed to load kitchen profile location", e);
      }
    };
    fetchProfile();
  }, []);

  const handleGetEstimate = async () => {
    if (!title) {
      Alert.alert("Missing Info", "Please enter a title to get an AI estimate.");
      return;
    }
    setIsEstimating(true);
    try {
      const response = await api.post('/listings/estimate_value/', {
        title,
        description,
        quantity_available: parseInt(quantity) || 1,
        quantity_unit: quantityUnit
      });
      const suggestedVal = response.data.suggested_value_inr;
      setAiEstimate(suggestedVal.toString());
      if (!originalPrice || originalPrice === '0.00' || originalPrice === '0') {
        setOriginalPrice(suggestedVal.toString());
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to get AI estimate");
    } finally {
      setIsEstimating(false);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description,
        listing_type: isDonation ? 'DONATION' : 'DISCOUNT',
        original_price: originalPrice || '0.00',
        discounted_price: isDonation ? '0.00' : (discountPrice || '0.00'),
        estimated_fmv: originalPrice || '0.00',
        quantity_available: parseInt(quantity) || 1,
        quantity_unit: quantityUnit,
        dietary_info: dietaryInfo,
        additional_details: additionalDetails,
        latitude: userLat || 37.78825, // Fallback if kitchen profile has no location
        longitude: userLng || -122.4324,
        pickup_address: userAddress || "Kitchen Location",
        pickup_start: new Date().toISOString(),
        pickup_end: pickupEnd.toISOString(),
        is_active: true
      };
      
      await api.post('/listings/', payload);
      Alert.alert("Success", "Your food excess listing has been published!");
      router.replace('/(donor)');
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      Alert.alert("Error", "Failed to publish listing");
    } finally {
      setIsSubmitting(false);
    }
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
                <Text style={styles.label}>Quantity (portions)</Text>
                <TextInput style={styles.input} placeholder="e.g. 5" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: isDonation ? 8 : 0 }]}>
                <Text style={styles.label}>Pickup Deadline</Text>
                <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={handleOpenPicker}>
                  <Text style={{ color: '#0f172a' }}>{pickupEnd.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
                </TouchableOpacity>
                {Platform.OS === 'ios' && showDatePicker && (
                  <DateTimePicker
                    value={pickupEnd}
                    mode="datetime"
                    display="default"
                    onValueChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setPickupEnd(selectedDate);
                    }}
                    onDismiss={() => setShowDatePicker(false)}
                  />
                )}
              </View>
            </View>

            {isDonation && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unit</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {['portions', 'lbs', 'kgs', 'items', 'boxes'].map(u => (
                    <TouchableOpacity key={u} style={[styles.unitBadge, quantityUnit === u && styles.unitBadgeActive]} onPress={() => setQuantityUnit(u)}>
                      <Text style={[styles.unitBadgeText, quantityUnit === u && styles.unitBadgeTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dietary Info</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {['None', 'Veg', 'Non-Veg', 'Vegan', 'Halal', 'Kosher'].map(d => (
                  <TouchableOpacity key={d} style={[styles.unitBadge, dietaryInfo === d && styles.unitBadgeActive]} onPress={() => setDietaryInfo(d)}>
                    <Text style={[styles.unitBadgeText, dietaryInfo === d && styles.unitBadgeTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Details (Optional)</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Allergens, packaging info..." multiline value={additionalDetails} onChangeText={setAdditionalDetails} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: isDonation ? 0 : 8 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.label, { marginBottom: 0 }]}>Est. Value (₹) {isDonation && <Text style={{ color: '#10b981', fontSize: 11 }}>(For Tax Receipt)</Text>}</Text>
                  {isDonation && (
                    <TouchableOpacity onPress={handleGetEstimate} disabled={isEstimating}>
                      <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: 'bold' }}>{isEstimating ? 'Estimating...' : 'Get AI Estimate'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput style={styles.input} placeholder="0.00" keyboardType="decimal-pad" value={originalPrice} onChangeText={setOriginalPrice} />
                {isDonation && aiEstimate && <Text style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>AI Suggested Max: ₹{aiEstimate}</Text>}
                {isDonation && <Text style={{ color: '#f59e0b', fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>Note: Exaggerated values will be automatically flagged for admin review.</Text>}
              </View>
              {!isDonation && (
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Discount Price (₹)</Text>
                  <TextInput style={[styles.input, { borderColor: '#10b981', borderWidth: 2 }]} placeholder="0.00" keyboardType="decimal-pad" value={discountPrice} onChangeText={setDiscountPrice} />
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.certificationRow} onPress={() => setIsCertified(!isCertified)}>
            <Ionicons name={isCertified ? "checkbox" : "square-outline"} size={24} color={isCertified ? "#10b981" : "#94a3b8"} />
            <Text style={styles.certificationText}>I certify that this food is genuine, safe for consumption, and meets local safety guidelines.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.publishBtn, (isSubmitting || !isCertified) && { opacity: 0.7 }]} onPress={handlePublish} disabled={isSubmitting || !isCertified}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.publishBtnText}>{isSubmitting ? 'Publishing...' : 'Publish Listing'}</Text>
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
  unitBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  unitBadgeActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  unitBadgeText: { color: '#64748b', fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  unitBadgeTextActive: { color: '#3b82f6', fontWeight: 'bold' },
  certificationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, paddingRight: 16 },
  certificationText: { marginLeft: 12, fontSize: 13, color: '#475569', lineHeight: 18, flex: 1 },
  publishBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  publishBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
