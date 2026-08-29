import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import api from '../../../utils/api';

export default function EditSurplusScreen() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [originalQuantity, setOriginalQuantity] = useState(1);
  const [remainingQuantity, setRemainingQuantity] = useState(1);
  const [quantityUnit, setQuantityUnit] = useState('portions');
  const [dietaryInfo, setDietaryInfo] = useState('None');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isDonation, setIsDonation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
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

  React.useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}/`);
      const data = response.data;
      setTitle(data.title);
      setDescription(data.description);
      setOriginalPrice(data.original_price);
      setDiscountPrice(data.discounted_price);
      setQuantity(data.quantity_available.toString());
      setOriginalQuantity(data.quantity_available);
      setRemainingQuantity(data.quantity_remaining !== undefined ? data.quantity_remaining : data.quantity_available);
      setQuantityUnit(data.quantity_unit || 'portions');
      setDietaryInfo(data.dietary_info || 'None');
      setAdditionalDetails(data.additional_details || '');
      setIsDonation(data.listing_type === 'DONATION');
      if (data.pickup_end) {
        const fetchedDate = new Date(data.pickup_end);
        if (fetchedDate.getTime() < new Date().getTime()) {
          // If expired, suggest 24 hours from now for reactivation
          setPickupEnd(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
        } else {
          setPickupEnd(fetchedDate);
        }
      }
      setIsCertified(true); // Pre-certify if editing an existing active one
    } catch (e) {
      Alert.alert("Error", "Could not load listing details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdate = async () => {
    setIsSubmitting(true);
    
    const parsedQuantity = parseInt(quantity) || 1;
    const minQuantity = Math.max(1, originalQuantity - remainingQuantity);
    
    if (!isDonation && parsedQuantity < minQuantity) {
      Alert.alert("Invalid Quantity", `You cannot decrease the total quantity below ${minQuantity} because those portions have already been claimed.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        title,
        description,
        listing_type: isDonation ? 'DONATION' : 'DISCOUNT',
        original_price: originalPrice || '0.00',
        discounted_price: isDonation ? '0.00' : (discountPrice || '0.00'),
        estimated_fmv: originalPrice || '0.00',
        quantity_available: parsedQuantity,
        quantity_unit: quantityUnit,
        dietary_info: dietaryInfo,
        additional_details: additionalDetails,
        pickup_end: pickupEnd.toISOString(),
      };
      await api.patch(`/listings/${id}/`, payload);
      Alert.alert("Updated", "Your surplus listing has been updated.");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", "Failed to update listing");
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
                <Text style={styles.label}>Quantity (portions)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 5" 
                  keyboardType="numeric" 
                  value={quantity} 
                  onChangeText={setQuantity} 
                />
                {!isDonation && (
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    Min: {Math.max(1, originalQuantity - remainingQuantity)} (due to active claims)
                  </Text>
                )}
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

          <TouchableOpacity style={[styles.publishBtn, (isSubmitting || !isCertified) && { opacity: 0.7 }]} onPress={handleUpdate} disabled={isSubmitting || loading || !isCertified}>
            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.publishBtnText}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Text>
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
  unitBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  unitBadgeActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  unitBadgeText: { color: '#64748b', fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  unitBadgeTextActive: { color: '#3b82f6', fontWeight: 'bold' },
  certificationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, paddingRight: 16 },
  certificationText: { marginLeft: 12, fontSize: 13, color: '#475569', lineHeight: 18, flex: 1 },
  publishBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  publishBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
